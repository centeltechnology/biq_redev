// Owner-only tool. Never sets activation flags, retries, or starts a scheduler.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sendReconciliationTrigger } from "../cloudflare/subscription-reconciler/src/index";

export async function triggerOnce(
  args: string[],
  env: NodeJS.ProcessEnv,
  send = sendReconciliationTrigger,
) {
  const disabledCheck = args.length === 1 && args[0] === "--disabled-check";
  const approvedRun = args.length === 2 &&
    args.includes("--single-run") && args.includes("--confirm-entitlement-write");
  if (!disabledCheck && !approvedRun) {
    throw new Error("Choose --disabled-check OR --single-run --confirm-entitlement-write");
  }
  const secret = env.CLOUDFLARE_SUBSCRIPTION_TRIGGER_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("Signing secret is not configured");
  const response = await send({
    BAKERIQ_TRIGGER_URL: env.BAKERIQ_TRIGGER_URL ??
      "https://bakeriq.app/api/internal/subscription-reconcile",
    BAKERIQ_TRIGGER_SECRET: secret,
    SUBSCRIPTION_CRON_ENABLED: "false",
  }, undefined, undefined, undefined, disabledCheck);
  const result = await response.json() as { message?: string; ok?: boolean; processed?: number };
  if (disabledCheck) {
    if (response.status !== 503 || result.message !== "Subscription synchronization is disabled") {
      throw new Error("Disabled check failed: expected authenticated synchronization-disabled response");
    }
    console.info("Authenticated disabled check passed; no reconciliation started");
    return;
  }
  if (!response.ok || result.ok !== true || (result.processed !== 0 && result.processed !== 1)) {
    throw new Error(`Single run did not succeed (HTTP ${response.status}); inspect diagnostics; do not retry blindly`);
  }
  console.info(`Single run completed; processed=${result.processed}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  triggerOnce(process.argv.slice(2), process.env).catch(() => {
    console.error("Owner trigger failed; check mode, activation gate, connectivity and diagnostics. No automatic retry.");
    process.exitCode = 1;
  });
}
