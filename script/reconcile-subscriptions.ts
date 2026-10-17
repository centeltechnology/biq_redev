// Operator/scheduler entry point. Requires the approved migration and a trusted
// server environment; there is no public reconciliation authorization bypass.
import { reconciliationTick, syncEnabled } from "../server/subscriptions/service";
import { pool } from "../server/db";

async function main() {
  if (!syncEnabled()) throw new Error("SUBSCRIPTION_SYNC_ENABLED must be explicitly enabled");
  const start = Date.now();
  console.log("Scheduled subscription reconciliation batch starting");
  const result = await reconciliationTick();
  if (!result || result.skipped || result.failed) throw new Error("Subscription batch did not complete");
  console.log(`Scheduled subscription reconciliation completed: ${result.processed} accounts checked in ${Date.now()-start}ms`);
}
main().catch(() => {
  console.error("Subscription reconciliation command failed; consult admin diagnostics");
  process.exitCode = 1;
}).finally(() => pool.end());
