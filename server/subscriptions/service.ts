import type { Express, RequestHandler } from "express";
import { pool } from "../db";
import { getUncachableStripeClient } from "../stripeClient";
import { diagnostics, repository } from "./repository";
import { currentBilling } from "./provider";
import { synchronize } from "./synchronizer";
import { accountRef } from "./policy";

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
export async function reconciliationTick() {
  if (!syncEnabled() || running) return;
  running = true;
  let failed = false;
  try {
    // At most 20 candidates per minute per instance. Each account additionally
    // has a cross-instance PostgreSQL transaction lock and at most five retries.
    const due = await pool.query(`SELECT b.id FROM bakers b
      LEFT JOIN subscription_sync s ON s.baker_id=b.id
      WHERE b.stripe_customer_id IS NOT NULL AND COALESCE(s.attempts,0)<5
        AND (s.baker_id IS NULL OR s.next_attempt_at<=now())
      ORDER BY s.last_attempt_at NULLS FIRST,b.id LIMIT 20`);
    const stripe = await getUncachableStripeClient();
    const repo = repository(pool);
    for (const row of due.rows) {
      const outcome = await synchronize(row.id,repo,
        (s,p,now) => currentBilling(stripe,s,p,now));
      if (outcome === "failed") {
        failed = true;
        console.warn(`Subscription reconciliation failed for ${accountRef(row.id)}; see admin diagnostics`);
      }
    }
  } catch {
    failed = true;
    console.error("Subscription reconciliation unavailable; no entitlement fallback applied");
  } finally { running = false; }
  return { failed };
}
export function startSubscriptionReconciliation() {
  if (!syncEnabled()) {
    console.log("Subscription reconciliation disabled pending approved migration/rollout");
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
