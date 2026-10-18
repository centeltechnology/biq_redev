import type { Express, RequestHandler } from "express";
import type { PoolClient } from "pg";
import { pool } from "../db";
import { getUncachableStripeClient } from "../stripeClient";
import { diagnostics, repository } from "./repository";
import { currentBilling } from "./provider";
import { synchronize } from "./synchronizer";
import { accountRef } from "./policy";
import { connectWithTimeout } from "./bounded-pool";

export const syncEnabled = () => process.env.SUBSCRIPTION_SYNC_ENABLED === "true";
const relevant = (type: string) => type.startsWith("customer.subscription.") ||
  ["checkout.session.completed","checkout.session.async_payment_succeeded",
    "invoice.paid","invoice.payment_succeeded","invoice.payment_failed",
    "invoice.voided","invoice.marked_uncollectible"].includes(type);
const idOf = (v: any) => typeof v === "string" ? v : v?.id;

// Call ONLY after the existing managed integration has verified the raw bytes.
// A failure enqueuing must reach Stripe as a retryable delivery failure.
export async function enqueueVerifiedSubscriptionEvent(raw: Buffer) {
  if (!syncEnabled()) return;
  const event = JSON.parse(raw.toString("utf8"));
  if (event.account || !relevant(event.type)) return;
  const customer = idOf(event.data?.object?.customer);
  if (!customer || !event.id) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const claimed = await client.query(`INSERT INTO subscription_sync_events(event_id)
      VALUES ($1) ON CONFLICT DO NOTHING RETURNING event_id`, [event.id]);
    if (claimed.rowCount) {
      await client.query(`INSERT INTO subscription_sync(baker_id)
        SELECT id FROM bakers WHERE stripe_customer_id=$1
        ON CONFLICT (baker_id) DO UPDATE SET needs_reconcile=true,attempts=0,next_attempt_at=now()`,
      [customer]);
    }
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
export async function queueReconciliation() {
  // Missing/ambiguous associations stay visible; never populate customer IDs
  // or recover them from user-submitted input.
  await pool.query(`INSERT INTO subscription_sync(baker_id)
    SELECT id FROM bakers WHERE stripe_customer_id IS NOT NULL
    ON CONFLICT (baker_id) DO UPDATE SET needs_reconcile=true,attempts=0,next_attempt_at=now()`);
}
let running = false;
export const reconciliationBatchLock = "bakeriq:subscription:batch";
export interface ReconciliationOptions {
  maxAccounts?: number;
  accountBudgetMs?: number;
  stripeRequestTimeoutMs?: number;
  stripeNetworkRetries?: number;
  statementTimeoutMs?: number;
}
export async function reconciliationTick(options: ReconciliationOptions = {}) {
  if (!syncEnabled() || running) return;
  running = true;
  const maxAccounts = Math.max(1, Math.min(20, Math.trunc(options.maxAccounts ?? 20)));
  let failed = false;
  let processed = 0;
  let skipped = false;
  let client: PoolClient | undefined;
  let transaction = false;
  let discard = false;
  try {
    // A dedicated coordination transaction spans the batch, including with a
    // transaction-pooling database proxy. Account writes keep their existing,
    // separate per-account transactions; this transaction performs no writes.
    client = options.statementTimeoutMs
      ? await connectWithTimeout(pool, options.statementTimeoutMs)
      : await pool.connect();
    await client.query("BEGIN");
    transaction = true;
    if (options.statementTimeoutMs) {
      await client.query("SELECT set_config('statement_timeout',$1,true)", [`${options.statementTimeoutMs}ms`]);
    }
    const lock = await client.query(
      "SELECT pg_try_advisory_xact_lock(hashtextextended($1,0)) AS acquired", [reconciliationBatchLock]);
    if (!lock.rows[0].acquired) {
      skipped = true;
      console.warn("Subscription reconciliation skipped: another batch holds the worker lock");
    } else {
      // At most 20 candidates per batch; existing five-attempt policy unchanged.
      const due = await client.query(`SELECT b.id FROM bakers b
        LEFT JOIN subscription_sync s ON s.baker_id=b.id
        WHERE b.stripe_customer_id IS NOT NULL AND COALESCE(s.attempts,0)<5
          AND (s.baker_id IS NULL OR s.next_attempt_at<=now())
        ORDER BY s.last_attempt_at NULLS FIRST,b.id LIMIT $1`, [maxAccounts]);
      const stripe = await getUncachableStripeClient();
      const repo = repository(pool, options.statementTimeoutMs);
      for (const row of due.rows) {
        const outcome = await synchronize(row.id,repo,
          (s,p,now) => currentBilling(stripe,s,p,now, {
            budgetMs: options.accountBudgetMs,
            requestTimeoutMs: options.stripeRequestTimeoutMs,
            maxNetworkRetries: options.stripeNetworkRetries,
          }));
        processed++;
        if (outcome === "failed") {
          failed = true;
          console.warn(`Subscription reconciliation failed for ${accountRef(row.id)}; see admin diagnostics`);
        }
      }
    }
  } catch {
    failed = true;
    discard = true;
    console.error("Subscription reconciliation unavailable; no entitlement fallback applied");
  } finally {
    if (client) {
      if (transaction) {
        try {
          // Ends the read-only coordination transaction and releases its lock.
          await client.query("ROLLBACK");
        } catch {
          failed = true;
          discard = true;
          console.error("Subscription worker lock cleanup failed; discarding its connection");
        }
      }
      // Never return a connection with a possibly held transaction to the pool.
      client.release(discard);
    }
    running = false;
  }
  return { failed, processed, skipped };
}
export function startSubscriptionReconciliation() {
  if (!syncEnabled()) {
    console.log("Subscription reconciliation disabled pending approved migration/rollout");
    return;
  }
  // Scheduled execution is independent. Enabling the master gate must not
  // silently start a second worker inside every Autoscale web instance.
  if (process.env.SUBSCRIPTION_SYNC_IN_PROCESS_ENABLED !== "true") {
    console.log("Subscription reconciliation in-process timer disabled; scheduled execution only");
    return;
  }
  void reconciliationTick();
  const timer = setInterval(() => void reconciliationTick(),60_000);
  timer.unref();
}
export async function billingSummary() {
  const d = await diagnostics(pool,syncEnabled());
  return { basic: d.basicPaid,pro: d.proPaid,mrr: d.mrr,paidSubscribers: d.paidSubscribers };
}
export function registerSubscriptionDiagnostics(app: Express, requireSuperAdmin: RequestHandler) {
  app.get("/api/admin/subscription-sync",requireSuperAdmin,async (_req,res) => {
    res.set("Cache-Control","no-store");
    try { res.json(await diagnostics(pool,syncEnabled())); }
    catch { res.status(503).json({message:"Subscription diagnostics unavailable; check migration readiness"}); }
  });
  app.post("/api/admin/subscription-sync/reconcile",requireSuperAdmin,async (_req,res) => {
    if (!syncEnabled()) return res.status(503).json({message:"Subscription synchronization is disabled"});
    try {
      await queueReconciliation();
      res.status(202).json({message:"Reconciliation queued; provider verification is still required"});
    } catch { res.status(503).json({message:"Unable to queue subscription reconciliation"}); }
  });
}
