import crypto from "node:crypto";
import express, { type Express, type RequestHandler } from "express";
import type { Pool } from "pg";
import { pool } from "../db";
import { reconciliationTick, syncEnabled } from "./service";
import { connectWithTimeout } from "./bounded-pool";

const PATH = "/api/internal/subscription-reconcile";
const BODY = Buffer.from('{"trigger":"scheduled"}');
const CHECK_BODY = Buffer.from('{"trigger":"verify"}');
const NONCE_TTL_MINUTES = 10;
const RATE_LIMIT_PER_MINUTE = 4;
const RATE_LIMIT_LOCK = "bakeriq:subscription:cloudflare-trigger-rate-limit";
const TIMESTAMP_WINDOW_MS = 5 * 60_000;
const SAFE_NONCE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ClaimResult = "accepted" | "replay" | "rate_limited";
type BatchResult = { failed: boolean; processed: number; skipped: boolean } | undefined;

export async function claimCloudflareTriggerNonce(
  dbPool: Pick<Pool, "connect">,
  nonce: string,
): Promise<ClaimResult> {
  const client = await connectWithTimeout(dbPool, 3_000);
  let discard = false;
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('statement_timeout','3000ms',true)");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
      [RATE_LIMIT_LOCK],
    );
    await client.query(
      `DELETE FROM subscription_trigger_nonces
       WHERE received_at < now() - interval '${NONCE_TTL_MINUTES} minutes'`,
    );
    const inserted = await client.query(
      `INSERT INTO subscription_trigger_nonces(nonce)
       VALUES ($1) ON CONFLICT DO NOTHING RETURNING nonce`,
      [nonce],
    );
    if (!inserted.rowCount) {
      await client.query("ROLLBACK");
      return "replay";
    }
    const count = await client.query(
      `SELECT count(*)::int AS requests
       FROM subscription_trigger_nonces
       WHERE received_at >= now() - interval '1 minute'`,
    );
    if (count.rows[0].requests > RATE_LIMIT_PER_MINUTE) {
      await client.query("ROLLBACK");
      return "rate_limited";
    }
    await client.query("COMMIT");
    return "accepted";
  } catch (error) {
    await client.query("ROLLBACK").catch(() => { discard = true; });
    throw error;
  } finally {
    client.release(discard);
  }
}

type TriggerDependencies = {
  secret: () => string | undefined;
  enabled: () => boolean;
  claimNonce: (nonce: string) => Promise<ClaimResult>;
  run: (signal: AbortSignal) => Promise<BatchResult>;
  now?: () => number;
};

function signatureFor(secret: string, timestamp: string, nonce: string, body: Buffer) {
  const digest = crypto.createHash("sha256").update(body).digest("hex");
  const canonical = `POST\n${PATH}\n${timestamp}\n${nonce}\n${digest}`;
  return crypto.createHmac("sha256", secret).update(canonical).digest("hex");
}

export function createCloudflareTriggerHandler(deps: TriggerDependencies): RequestHandler {
  return async (req, res) => {
    const controller = new AbortController();
    res.once("close", () => {
      if (!res.writableFinished) controller.abort();
    });
    res.set("Cache-Control", "no-store");
    const secret = deps.secret();
    if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
      console.error("Cloudflare reconciliation trigger unavailable: signing secret is not configured");
      return res.status(503).json({ message: "Trigger authentication is not configured" });
    }

    const timestamp = req.get("x-bakeriq-timestamp") ?? "";
    const nonce = req.get("x-bakeriq-nonce") ?? "";
    const signature = req.get("x-bakeriq-signature") ?? "";
    const body = Buffer.isBuffer(req.body) ? req.body as Buffer : undefined;
    const checkOnly = !!body?.equals(CHECK_BODY);
    const issuedAt = /^\d{10}$/.test(timestamp) ? Number(timestamp) * 1000 : 0;
    const now = deps.now?.() ?? Date.now();
    if (!body || (!body.equals(BODY) && !checkOnly) ||
        !SAFE_NONCE.test(nonce) || !/^[0-9a-f]{64}$/i.test(signature) ||
        !issuedAt || Math.abs(now - issuedAt) > TIMESTAMP_WINDOW_MS) {
      console.warn("Cloudflare reconciliation trigger rejected: malformed or expired authentication");
      return res.status(401).json({ message: "Invalid trigger authentication" });
    }

    const expected = Buffer.from(signatureFor(secret, timestamp, nonce, body), "hex");
    const received = Buffer.from(signature, "hex");
    if (!crypto.timingSafeEqual(expected, received)) {
      console.warn("Cloudflare reconciliation trigger rejected: signature mismatch");
      return res.status(401).json({ message: "Invalid trigger authentication" });
    }

    // Authentication is independent from the separate default-off entitlement gate.
    if (!deps.enabled()) {
      console.info("Cloudflare reconciliation trigger acknowledged as disabled; no work started");
      return res.status(503).json({ message: "Subscription synchronization is disabled" });
    }
    // A signed operator probe is non-mutating even if the master gate was
    // unexpectedly enabled. It never claims a nonce or calls reconciliation.
    if (checkOnly) return res.status(200).json({ ok: true, checkOnly: true, enabled: true });

    let claim: ClaimResult;
    try {
      claim = await deps.claimNonce(nonce);
    } catch {
      console.error("Cloudflare reconciliation trigger unavailable: replay/rate-limit storage failed");
      return res.status(503).json({ message: "Trigger protection storage is unavailable" });
    }
    if (claim === "replay") {
      console.warn("Cloudflare reconciliation trigger rejected: replay detected");
      return res.status(409).json({ message: "Trigger request was already used" });
    }
    if (claim === "rate_limited") {
      console.warn("Cloudflare reconciliation trigger rejected: rate limit exceeded");
      return res.status(429).json({ message: "Trigger rate limit exceeded" });
    }
    if (controller.signal.aborted) return;

    try {
      // One account per awaited request; 15s provider budget, 5s request timeout,
      // no network retries. Failed accounts retain the existing durable retry
      // policy; no untracked background work is launched.
      const result = await deps.run(controller.signal);
      if (controller.signal.aborted) return;
      if (!result) {
        console.warn("Cloudflare reconciliation trigger did not start: a local worker is already running");
        return res.status(409).json({ message: "A reconciliation batch is already running" });
      }
      if (result.skipped) {
        console.warn("Cloudflare reconciliation trigger skipped: another instance holds the batch lock");
        return res.status(409).json({ message: "Another reconciliation batch is running" });
      }
      if (result.failed) {
        console.error(`Cloudflare reconciliation batch failed; processed=${result.processed}`);
        return res.status(503).json({ message: "Reconciliation batch failed; see subscription diagnostics" });
      }
      console.info(`Cloudflare reconciliation batch completed; processed=${result.processed}`);
      return res.status(200).json({ ok: true, processed: result.processed });
    } catch {
      if (controller.signal.aborted) return;
      console.error("Cloudflare reconciliation batch failed unexpectedly");
      return res.status(503).json({ message: "Reconciliation batch failed" });
    }
  };
}

export function registerCloudflareSubscriptionTrigger(
  app: Express,
  overrides: Partial<TriggerDependencies> = {},
) {
  const dependencies: TriggerDependencies = {
    secret: () => process.env.CLOUDFLARE_SUBSCRIPTION_TRIGGER_SECRET,
    enabled: syncEnabled,
    claimNonce: nonce => claimCloudflareTriggerNonce(pool, nonce),
    run: signal => reconciliationTick({
      maxAccounts: 1,
      accountBudgetMs: 15_000,
      stripeRequestTimeoutMs: 5_000,
      stripeNetworkRetries: 0,
      statementTimeoutMs: 2_000,
      signal,
    }),
    ...overrides,
  };
  app.post(PATH, express.raw({ type: "application/json", limit: "512b" }),
    createCloudflareTriggerHandler(dependencies));
}
