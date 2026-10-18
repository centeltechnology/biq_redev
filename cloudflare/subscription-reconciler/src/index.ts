export interface Env {
  BAKERIQ_TRIGGER_URL: string;
  BAKERIQ_TRIGGER_SECRET: string;
  SUBSCRIPTION_CRON_ENABLED: string;
}

const PATH = "/api/internal/subscription-reconcile";
const BODY = '{"trigger":"scheduled"}';
const ALLOWED_HOST = "bakeriq.app";
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_REQUESTS_PER_CRON = 30;
const MIN_REQUEST_INTERVAL_MS = 16_000;
const MAX_CRON_WORK_MS = 12 * 60_000;

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function sendReconciliationTrigger(
  env: Env,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
  nonce = crypto.randomUUID(),
  checkOnly = false,
) {
  const body = checkOnly ? '{"trigger":"verify"}' : BODY;
  const target = new URL(env.BAKERIQ_TRIGGER_URL);
  if (target.protocol !== "https:" || target.hostname !== ALLOWED_HOST ||
      target.pathname !== PATH || target.search || target.hash ||
      target.username || target.password || target.port) {
    throw new Error("BakerIQ trigger URL failed its safety check");
  }
  if (!env.BAKERIQ_TRIGGER_SECRET || new TextEncoder().encode(env.BAKERIQ_TRIGGER_SECRET).byteLength < 32) {
    throw new Error("BakerIQ trigger secret is missing or too short");
  }

  const timestamp = Math.floor(now / 1000).toString();
  const bodyHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const bodyHashHex = [...new Uint8Array(bodyHash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  const canonical = `POST\n${PATH}\n${timestamp}\n${nonce}\n${bodyHashHex}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(env.BAKERIQ_TRIGGER_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical));
  const signature = [...new Uint8Array(signatureBytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  return fetcher(target.toString(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-bakeriq-timestamp": timestamp,
      "x-bakeriq-nonce": nonce,
      "x-bakeriq-signature": signature,
    },
    body,
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

export async function runScheduled(env: Env, runtime: {
  now?: () => number;
  sleep?: (ms: number) => Promise<unknown>;
  send?: (env: Env) => Promise<Response>;
} = {}) {
    const now = runtime.now ?? Date.now;
    const sleep = runtime.sleep ?? pause;
    const send = runtime.send ?? sendReconciliationTrigger;
    if (env.SUBSCRIPTION_CRON_ENABLED !== "true") {
      console.info("BakerIQ subscription cron is disabled; no request sent");
      return;
    }
    try {
      let processed = 0;
      let requests = 0;
      const startedAt = now();
      while (requests < MAX_REQUESTS_PER_CRON) {
        // Leave enough headroom for the last bounded HTTP request under
        // Cloudflare's scheduled-invocation duration ceiling.
        if (now() - startedAt + REQUEST_TIMEOUT_MS > MAX_CRON_WORK_MS) break;
        requests++;
        const response = await send(env);
        if (!response.ok) {
          console.error(`BakerIQ subscription trigger failed with HTTP ${response.status}`);
          throw new Error(`BakerIQ subscription trigger returned HTTP ${response.status}`);
        }
        const result = await response.json() as { ok?: boolean; processed?: number };
        if (result.ok !== true || (result.processed !== 0 && result.processed !== 1)) {
          throw new Error("BakerIQ trigger returned invalid aggregate progress");
        }
        const count = result.processed;
        processed += count;
        if (count === 0) break;
        if (now() - startedAt + MIN_REQUEST_INTERVAL_MS + REQUEST_TIMEOUT_MS > MAX_CRON_WORK_MS) break;
        if (requests < MAX_REQUESTS_PER_CRON) await sleep(MIN_REQUEST_INTERVAL_MS);
      }
      console.info(`BakerIQ subscription cron completed; requests=${requests}, processed=${processed}`);
    } catch (error) {
      console.error("BakerIQ subscription cron invocation failed");
      throw error;
    }
}

const worker = {
  scheduled: (_event: unknown, env: Env) => runScheduled(env),
};

export default worker;
