import type { Pool, PoolClient } from "pg";
import { accountRef, asPlan, billingAccess, effective, isTestAccount, paying, type Billing, type Subject } from "./policy";
import type { SyncRepository } from "./synchronizer";
import type { Snapshot } from "./provider";
import { connectWithTimeout } from "./bounded-pool";

const millis = (v: any) => v ? new Date(v).getTime() : null;
const date = (v: number | null) => v === null ? null : new Date(v);
export function subjectFromRow(b: any): Subject {
  return {
    id: b.id, plan: asPlan(b.plan), customerId: b.stripe_customer_id,
    subscriptionId: b.stripe_subscription_id,
    surveyTrialEnd: millis(b.survey_trial_end_date),
    giftedPlan: asPlan(b.gifted_plan), giftEnd: millis(b.gifted_plan_expires_at),
    administrativePlan: b.administrative_plan ? asPlan(b.administrative_plan) : null,
  };
}
function billingFromRow(s: any): Billing | null {
  if (!s?.last_success_at) return null;
  return {
    plan: asPlan(s.billing_plan), status: s.billing_status,
    subscriptionId: s.subscription_id, paidThrough: millis(s.paid_through),
    trialEnd: millis(s.trial_end), cancelAtPeriodEnd: s.cancel_at_period_end,
  };
}
async function save(client: PoolClient, id: string, snapshot: Snapshot, plan: string, source: string, now: number) {
  const b = snapshot.billing;
  await client.query(`
    INSERT INTO subscription_sync
      (baker_id,billing_plan,billing_status,subscription_id,paid_through,trial_end,
       cancel_at_period_end,entitlement_source,last_success_at,last_attempt_at,
       error_code,needs_reconcile,attempts,next_attempt_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,NULL,false,0,$10)
    ON CONFLICT (baker_id) DO UPDATE SET billing_plan=$2,billing_status=$3,
      subscription_id=$4,paid_through=$5,trial_end=$6,cancel_at_period_end=$7,
      entitlement_source=$8,last_success_at=$9,last_attempt_at=$9,error_code=NULL,
      needs_reconcile=false,attempts=0,next_attempt_at=$10`,
  [id,b.plan,b.status,b.subscriptionId,date(b.paidThrough),date(b.trialEnd),b.cancelAtPeriodEnd,
    source,new Date(now),new Date(Math.min(now + 15*60_000,
      ...[b.paidThrough,b.trialEnd].filter((x): x is number => !!x && x > now)))]);
  // Never write customers, quotes, products, completed fees, gifts or trials.
  // All current fee calculations derive from the plan/authorized overlays.
  await client.query(`UPDATE bakers SET plan=$2, stripe_subscription_id=$3
    WHERE id=$1 AND (plan IS DISTINCT FROM $2 OR stripe_subscription_id IS DISTINCT FROM $3)`,
  [id, plan, b.subscriptionId]);
  for (const a of snapshot.activities) {
    await client.query(`INSERT INTO subscription_award_candidates
      (invoice_id,baker_id,subscription_id,plan) VALUES ($1,$2,$3,$4)
      ON CONFLICT (invoice_id) DO NOTHING`, [a.invoiceId,id,a.subscriptionId,a.plan]);
  }
}
export function repository(pool: Pool, statementTimeoutMs?: number, signal?: AbortSignal): SyncRepository {
  return {
    async locked(id, work) {
      signal?.throwIfAborted();
      const client = statementTimeoutMs
        ? await connectWithTimeout(pool, statementTimeoutMs)
        : await pool.connect();
      let discard = false;
      try {
        await client.query("BEGIN");
        if (statementTimeoutMs) {
          await client.query("SELECT set_config('statement_timeout',$1,true)", [`${statementTimeoutMs}ms`]);
        }
        const lock = await client.query(
          "SELECT pg_try_advisory_xact_lock(hashtextextended($1,0)) AS acquired",
          [`bakeriq:subscription:${id}`]);
        if (!lock.rows[0].acquired) { await client.query("ROLLBACK"); return false; }
        const baker = await client.query("SELECT * FROM bakers WHERE id=$1 FOR UPDATE", [id]);
        if (!baker.rows.length) { await client.query("ROLLBACK"); return false; }
        const subject = subjectFromRow(baker.rows[0]);
        if (subject.customerId) {
          const duplicates = await client.query(
            "SELECT count(*)::int AS n FROM bakers WHERE stripe_customer_id=$1", [subject.customerId]);
          if (duplicates.rows[0].n !== 1) throw new Error("ambiguous association");
        }
        const state = await client.query("SELECT * FROM subscription_sync WHERE baker_id=$1", [id]);
        await work({ subject, previous: billingFromRow(state.rows[0]),
          save: (snapshot,plan,source,now) => save(client,id,snapshot,plan,source,now) });
        signal?.throwIfAborted();
        await client.query("COMMIT");
        return true;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => { discard = true; });
        throw error;
      } finally { client.release(discard); }
    },
    async failure(id, code, now) {
      if (!statementTimeoutMs) {
        await pool.query(`INSERT INTO subscription_sync
        (baker_id,error_code,last_attempt_at,attempts,next_attempt_at,needs_reconcile)
        SELECT id,$2,$3,1,$3::timestamptz+interval '1 minute',true FROM bakers WHERE id=$1
        ON CONFLICT (baker_id) DO UPDATE SET error_code=$2,last_attempt_at=$3,
          attempts=LEAST(subscription_sync.attempts+1,5),needs_reconcile=true,
          next_attempt_at=$3::timestamptz+
            (LEAST(900,60*power(2,subscription_sync.attempts)) * interval '1 second')`,
        [id, code, new Date(now)]);
        return;
      }
      const client = await connectWithTimeout(pool, statementTimeoutMs);
      let discard = false;
      try {
        await client.query("BEGIN");
        await client.query("SELECT set_config('statement_timeout',$1,true)", [`${statementTimeoutMs}ms`]);
        await client.query(`INSERT INTO subscription_sync
          (baker_id,error_code,last_attempt_at,attempts,next_attempt_at,needs_reconcile)
          SELECT id,$2,$3,1,$3::timestamptz+interval '1 minute',true FROM bakers WHERE id=$1
          ON CONFLICT (baker_id) DO UPDATE SET error_code=$2,last_attempt_at=$3,
            attempts=LEAST(subscription_sync.attempts+1,5),needs_reconcile=true,
            next_attempt_at=$3::timestamptz+
              (LEAST(900,60*power(2,subscription_sync.attempts)) * interval '1 second')`,
        [id, code, new Date(now)]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => { discard = true; });
        throw error;
      } finally {
        client.release(discard);
      }
    },
  };
}
export async function diagnostics(pool: Pool, enabled: boolean) {
  const result = await pool.query(`SELECT b.*,row_to_json(s) AS sync,
    (SELECT count(*)::int FROM subscription_award_candidates a
      WHERE a.baker_id=b.id AND a.status='policy_review') AS award_review_count
    FROM bakers b LEFT JOIN subscription_sync s ON s.baker_id=b.id ORDER BY b.created_at`);
  const now = Date.now();
  let basicPaid = 0, proPaid = 0;
  const accounts = result.rows.map(b => {
    const subject = subjectFromRow(b), s = b.sync, billing = billingFromRow(s);
    // A previously synchronized plan is only downgraded by fresh successful
    // reconciliation, never by reading diagnostics or by the wall clock alone.
    const entitlement = effective(subject, subject.plan, now);
    if (paying(subject,billing,now)) {
      if (billing!.plan === "pro") proPaid++; else basicPaid++;
    }
    const entitlementSource = isTestAccount(subject.id) ? "test" :
      entitlement.source === "subscription" && billing?.status === "trialing" &&
      !billing.paidThrough ? "stripe_trial" :
      s?.last_success_at ? entitlement.source :
      entitlement.source !== "subscription" ? entitlement.source : "unreconciled";
    return {
      accountRef: accountRef(subject.id), entitlementSource,
      localPlan: subject.plan, effectivePlan: entitlement.plan,
      billingPlan: billing?.plan ?? null,billingStatus: billing?.status ?? null,
      paidThrough: s?.paid_through ?? null,trialEnd: s?.trial_end ?? null,
      lastSuccessAt:s?.last_success_at ?? null,lastAttemptAt:s?.last_attempt_at ?? null,
      errorCode:s?.error_code ?? null,needsReconcile:s?.needs_reconcile ?? !!subject.customerId,
      attempts:s?.attempts ?? 0,hasCustomer:!!subject.customerId,
      hasSubscription:!!subject.subscriptionId,awardReviewCount:b.award_review_count,
    };
  });
  return { enabled,accounts,basicPaid,proPaid,paidSubscribers:basicPaid+proPaid,
    mrr:Math.round((basicPaid*4.99+proPaid*9.99)*100)/100 };
}
