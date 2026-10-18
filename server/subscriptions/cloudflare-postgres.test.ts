import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import express from "express";
import pg from "pg";
import { claimCloudflareTriggerNonce, registerCloudflareSubscriptionTrigger } from "./cloudflare-trigger";
import { sendReconciliationTrigger } from "../../cloudflare/subscription-reconciler/src/index";

// Public writes are restricted to new security-metadata fixtures in DEVELOPMENT.
// No reconciliation engine or real Stripe client is called by this suite.
describe.runIf(process.env.TEST_SUBSCRIPTION_DB === "1")("Cloudflare PostgreSQL security", () => {
  let pool: pg.Pool;
  const fixtures = new Set<string>();
  const nonce = () => { const id = randomUUID(); fixtures.add(id); return id; };
  const secret = "synthetic-development-only-signing-secret";
  let server: Server | undefined;
  beforeAll(async () => {
    if (process.env.NODE_ENV === "production") throw new Error("Development tests only");
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 8 });
    const migration = await readFile("migrations/20261018_subscription_trigger_nonces.sql", "utf8");
    await pool.query(migration);
    await pool.query(migration); // Additive and idempotent.
  });
  afterEach(async () => {
    if (server) {
      await new Promise<void>(resolve => server!.close(() => resolve()));
      server = undefined;
    }
    await pool.query("DELETE FROM subscription_trigger_nonces WHERE nonce=ANY($1::text[])", [[...fixtures]]);
    fixtures.clear();
  });
  afterAll(async () => { await pool?.end(); });

  it("has the unique nonce key and indexed retention timestamp", async () => {
    const indexes = await pool.query(`SELECT indexdef FROM pg_indexes
      WHERE schemaname='public' AND tablename='subscription_trigger_nonces'`);
    expect(indexes.rows.some(r => /UNIQUE.*\(nonce\)/.test(r.indexdef))).toBe(true);
    expect(indexes.rows.some(r => /\(received_at\)/.test(r.indexdef))).toBe(true);
  });

  it("persists a nonce across connections and admits exactly one concurrent duplicate", async () => {
    const id = nonce();
    const results = await Promise.all(Array.from({ length: 4 }, () => claimCloudflareTriggerNonce(pool, id)));
    expect(results.filter(r => r === "accepted")).toHaveLength(1);
    expect(results.filter(r => r === "replay")).toHaveLength(3);
    expect(await claimCloudflareTriggerNonce(pool, id)).toBe("replay");
  });

  it("atomically accepts only four concurrent requests per rolling minute", async () => {
    const ids = Array.from({ length: 6 }, nonce);
    const results = await Promise.all(ids.map(id => claimCloudflareTriggerNonce(pool, id)));
    expect(results.filter(r => r === "accepted")).toHaveLength(4);
    expect(results.filter(r => r === "rate_limited")).toHaveLength(2);
    expect((await pool.query("SELECT count(*)::int n FROM subscription_trigger_nonces WHERE nonce=ANY($1::text[])", [ids])).rows[0].n).toBe(4);
  });

  it("expires only metadata older than ten minutes, keeping fresh replay protection", async () => {
    const old = nonce(), fresh = nonce(), next = nonce();
    await pool.query(`INSERT INTO subscription_trigger_nonces(nonce,received_at)
      VALUES($1,now()-interval '11 minutes'),($2,now()-interval '2 minutes')`, [old, fresh]);
    expect(await claimCloudflareTriggerNonce(pool, next)).toBe("accepted");
    const rows = await pool.query("SELECT nonce FROM subscription_trigger_nonces WHERE nonce=ANY($1::text[])", [[old, fresh, next]]);
    expect(rows.rows.map(r => r.nonce).sort()).toEqual([fresh, next].sort());
  });

  it("rolls back a real PostgreSQL error and admits a clean retry without leaked locks", async () => {
    const id = nonce();
    const broken = { connect: async () => {
      const client = await pool.connect();
      return {
        release: client.release.bind(client),
        query: (sql: string, values?: unknown[]) => client.query(
          sql.startsWith("INSERT INTO subscription_trigger_nonces") ? "SELECT 1/0" : sql,
          sql.startsWith("INSERT INTO subscription_trigger_nonces") ? undefined : values,
        ),
      };
    } } as unknown as Pick<pg.Pool, "connect">;
    await expect(claimCloudflareTriggerNonce(broken, id)).rejects.toMatchObject({ code: "22012" });
    expect(await claimCloudflareTriggerNonce(pool, id)).toBe("accepted");
  });

  it("bounds lock waits and recovers after a competing protection transaction", async () => {
    const client = await pool.connect();
    const id = nonce();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
        ["bakeriq:subscription:cloudflare-trigger-rate-limit"]);
      await expect(claimCloudflareTriggerNonce(pool, id)).rejects.toMatchObject({ code: "57014" });
      await client.query("ROLLBACK");
      expect(await claimCloudflareTriggerNonce(pool, id)).toBe("accepted");
    } finally { await client.query("ROLLBACK"); client.release(); }
  });

  it("uses the Worker signer against real persistent replay storage; rejects cannot run reconciliation", async () => {
    const run = vi.fn(async () => ({ failed: false, processed: 1, skipped: false }));
    const app = express();
    registerCloudflareSubscriptionTrigger(app, {
      secret: () => secret, enabled: () => true,
      claimNonce: id => claimCloudflareTriggerNonce(pool, id), run,
    });
    server = createServer(app);
    await new Promise<void>(resolve => server!.listen(0, "127.0.0.1", resolve));
    const local = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/internal/subscription-reconcile`;
    const env = { BAKERIQ_TRIGGER_URL: "https://bakeriq.app/api/internal/subscription-reconcile",
      BAKERIQ_TRIGGER_SECRET: secret, SUBSCRIPTION_CRON_ENABLED: "false" };
    const fetcher: typeof fetch = (_url, init) => fetch(local, init);
    const id = nonce();
    expect((await sendReconciliationTrigger(env, fetcher, Date.now() - 360_000, id)).status).toBe(401);
    expect((await sendReconciliationTrigger(env, fetcher, Date.now() + 360_000, id)).status).toBe(401);
    const tampered: typeof fetch = (_url, init) => {
      const headers = new Headers(init?.headers);
      headers.set("x-bakeriq-signature", "0".repeat(64));
      return fetch(local, { ...init, headers });
    };
    expect((await sendReconciliationTrigger(env, tampered, Date.now(), id)).status).toBe(401);
    expect(run).not.toHaveBeenCalled();
    expect((await pool.query("SELECT count(*)::int n FROM subscription_trigger_nonces WHERE nonce=$1", [id])).rows[0].n).toBe(0);
    expect((await sendReconciliationTrigger(env, fetcher, Date.now(), id)).status).toBe(200);
    expect((await sendReconciliationTrigger(env, fetcher, Date.now(), id)).status).toBe(409);
    expect(run).toHaveBeenCalledOnce();
  });
});
