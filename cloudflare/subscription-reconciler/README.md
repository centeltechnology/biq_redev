# BakerIQ subscription reconciliation trigger

This is an independent Cloudflare Worker. It does not contain a Stripe key or
database credential; it only signs a short server-to-server trigger for BakerIQ.
The existing Replit Autoscale deployment remains the web app and executes the
existing reconciliation service synchronously. There is no detached/background
task.

## Disabled-first configuration

`wrangler.toml` contains the UTC cron schedule (`*/15 * * * *`) but keeps
`SUBSCRIPTION_CRON_ENABLED = "false"`. The Worker skips every scheduled event
until that variable is deliberately changed and deployed. BakerIQ separately
requires `SUBSCRIPTION_SYNC_ENABLED=true`; its in-process timer remains controlled
by the separate `SUBSCRIPTION_SYNC_IN_PROCESS_ENABLED` flag and is not started by
this Worker.

Do not deploy or enable the Worker until the owner approves. Do not turn on either
BakerIQ synchronization setting during preparation.

## Owner setup after approval

1. Apply the additive migration
   `migrations/20261018_subscription_trigger_nonces.sql` to the intended
   development database, run its tests, then obtain separate production-migration
   approval before applying it to production.
2. Generate one high-entropy shared signing secret (at least 32 bytes). Store it
   only as Replit secret `CLOUDFLARE_SUBSCRIPTION_TRIGGER_SECRET` and Cloudflare
   Worker secret `BAKERIQ_TRIGGER_SECRET` (for example, enter it through
   `wrangler secret put BAKERIQ_TRIGGER_SECRET --config cloudflare/subscription-reconciler/wrangler.toml`).
   Never put it in `wrangler.toml`, logs, source control, or chat.
3. Confirm `BAKERIQ_TRIGGER_URL` is the BakerIQ production endpoint. It is pinned
   in the Worker code to HTTPS `bakeriq.app` and the exact private path.
4. Keep `SUBSCRIPTION_CRON_ENABLED=false` for the first Worker deployment. The
   Worker emits a safe disabled log and sends no request. Configure Cloudflare
   Worker invocation/error logs and an owner alert for thrown scheduled errors.
5. The Worker exposes no public manual-trigger route. Before the supervised first
   production run, choose and verify an owner-controlled one-shot invocation
   method that sends exactly one signed request. Keep the recurring Worker gate
   false during that preparation. A disabled BakerIQ master gate returns 503
   and performs no synchronization.
6. A successful first run requires separate approval to set BakerIQ
   `SUBSCRIPTION_SYNC_ENABLED=true`. Inspect its response, production logs, and
   Super Admin diagnostics before separately approving recurring execution.
   Keep `SUBSCRIPTION_SYNC_IN_PROCESS_ENABLED` unset/false throughout.

## Bounds, locking, retries, and alerts

Each signed HTTP request synchronously handles at most one due account. Provider
work is budgeted to 15 seconds per account, each Stripe request times out after
5 seconds, and Stripe network retries are disabled for this path. The Worker
waits at least 16 seconds between requests and stops after 30 account requests
or 12 minutes of work, whichever comes first; each HTTP request has a 60-second
caller timeout to leave headroom below Cloudflare's documented 15-minute
scheduled-invocation ceiling. Database checkout is limited to 2 seconds and SQL
statements in the trigger path use a 2-second statement timeout. The endpoint uses the existing whole-batch and
per-account PostgreSQL advisory locks.

HMAC-SHA256 authenticates method, path, timestamp, nonce, and body hash. The
server rejects timestamps outside five minutes, stores accepted nonces durably,
and rate-limits to four accepted requests per rolling minute. Exact replays are
rejected. Each request has a fresh UUID nonce. No automatic Cloudflare retry is
performed: if an invocation fails, Cloudflare records an error and the next
15-minute run resumes eligible work using the existing durable per-account
retry/backoff policy. Configure an owner alert against Worker invocation errors;
this code does not create or configure account-level alerts.

## Local checks

The BakerIQ Vitest suite covers invalid signatures, timestamp/body tampering,
replays, rate limiting, disabled gates, overlap/failure responses, and Worker
signing/disabled behavior. `npm run build` builds BakerIQ; it does not deploy
this Worker. Use Wrangler's local validation/build after installing Wrangler in
the separate Cloudflare project. No Worker has been deployed by this change.
