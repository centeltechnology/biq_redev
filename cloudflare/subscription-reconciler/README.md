# BakerIQ Gate 1A — consolidated Cloudflare rollout

**Prepared, not activated.** Keep the existing Autoscale website. This is a
separate BakerIQ Worker, not TextBack's Worker. No database or Stripe credentials
belong in Cloudflare. The checked-in configuration has `crons = []`,
`SUBSCRIPTION_CRON_ENABLED = "false"`, no public Worker route, and logging enabled.

## Security and execution contract

- BakerIQ accepts only a fixed signed POST on
  `/api/internal/subscription-reconcile`. HMAC-SHA256 covers method, path,
  timestamp, UUID nonce and exact body hash. Constant-time signature comparison;
  timestamps must be within five minutes. Request body limit: 512 bytes.
- Execution requires the independent Replit `SUBSCRIPTION_SYNC_ENABLED=true`.
  Missing signing secret, invalid auth or unavailable protection storage fails
  closed. `SUBSCRIPTION_SYNC_IN_PROCESS_ENABLED` must remain unset/false.
- The signed `verify` body is always non-mutating, even if sync is unexpectedly
  enabled. It never claims a nonce or runs reconciliation. An authenticated
  disabled response is 503 with `Subscription synchronization is disabled`.
- Execution nonces persist in PostgreSQL. A transaction/advisory lock serializes
  replay claims and the four-per-rolling-minute limit across Autoscale instances.
  Replays return 409; rate limits return 429; storage/provider failures return 503.
- One awaited HTTP request processes at most one due account, retaining existing
  whole-batch/account locks, transaction rollback, paid-through policy, test/admin
  protections and invoice-candidate uniqueness. No commissions are paid.
- Provider reads have a 15-second budget, including the price lookup; each Stripe
  request is limited to five seconds or the remaining budget, with no retries.
  Late responses are discarded before entitlements can be saved. Database
  checkout/statements use two-second limits (three seconds for nonce protection).
  Limits are per operation, not a claim of a hard OS-level end-to-end deadline.
- Client disconnection propagates cancellation. Cancellation observed before
  commit rolls back staged entitlement/candidate writes. A disconnect racing
  with an already-started successful COMMIT can still leave **one authorized
  commit**. A network error is never proof that no work committed: inspect
  diagnostics before retrying. Replayed nonces and overlapping batches cannot
  bypass the locks; fresh authenticated requests can legitimately recheck an
  account, with idempotent entitlement/candidate storage—not exactly-once HTTP.
- Cron, once approved, awaits up to 30 separate requests, spaces them by at least
  16 seconds and reserves each request's 60-second timeout inside a 12-minute
  wall-clock allowance. It stops on empty work or any failure. It never launches
  detached background work or immediately retries a failed request. Eligible
  accounts resume on later runs using existing durable retry/backoff; the
  five-attempt cap leaves unresolved accounts visible for review.
- Normal short Stripe histories fit the 15-second allowance; unusually long or
  slow histories fail safely for review. Thirty checks per invocation is a
  capacity cap, **not** a promise that every account is checked every 15 minutes.
  Simulated timing tests verify bounds; actual live latency remains for the
  supervised run. Replit's docs do not specify a hard inbound Autoscale timeout.

## Migration review

`migrations/20261018_subscription_trigger_nonces.sql` is additive and transactional:
only the nonce table, unique primary key and `received_at` index. Five-second lock
and 30-second statement limits bound DDL waits. It has no business-table updates,
foreign keys, backfills, drops or startup/build-time DDL. Drizzle's
`shared/schema.ts` declares the same table so a future schema push preserves it.

Accepted execution requests prune **security metadata only** older than ten
minutes, longer than the authentication window (including allowed future clock
skew). The timestamp index supports pruning and rolling counts. At four accepted
requests/minute the active window is small. If execution stops, expired rows remain
until the next accepted trigger; no separate cleanup scheduler is needed.

## Production rollout checklist — owner approval required at each stage

Commands below are instructions only; none were executed against production.

### 1. Publish BakerIQ disabled, with the additive schema

- Confirm both production sync flags unset/false. Preserve Autoscale and all
  existing Stripe webhook handlers/settings.
- Review the Publish schema diff for the managed production database: expect
  only `subscription_trigger_nonces`, its primary key and timestamp index.
  If unrelated changes, renames, drops or data overwrite appear, **stop**.
  Do not select “overwrite production data”.
- Approve Publish only when ready. Replit's supported Publish flow applies the
  development-to-production schema diff. The SQL file is a review/reference
  artifact; do not run a custom production migration script, startup DDL,
  `db:push` against production, or a migration build hook.
- Confirm normal startup, sync-disabled log, existing app/Stripe endpoints healthy.

### 2. Configure signing secrets and deploy an inert independent Worker

- After separate configuration approval, generate a random secret with at least
  32 bytes of entropy in a trusted secret manager. Store the same value as Replit
  production secret `CLOUDFLARE_SUBSCRIPTION_TRIGGER_SECRET` and Worker secret
  `BAKERIQ_TRIGGER_SECRET`. Never put values in chat, command arguments, source
  control or logs. Do not reuse TextBack's or Stripe's secrets.
- From the approved Cloudflare account, with the default config unchanged:
  `npx wrangler deploy --config cloudflare/subscription-reconciler/wrangler.toml`
- Then enter the Worker secret using the secure prompt:
  `npx wrangler secret put BAKERIQ_TRIGGER_SECRET --config cloudflare/subscription-reconciler/wrangler.toml`
- Confirm **zero Cron Triggers**, runtime flag false, correct distinct Worker
  name, `workers_dev=false`, no routes, and the pinned HTTPS BakerIQ target.
  No reconciliation can start just by deploying this Worker.

### 3. Verify auth without executing reconciliation

- In a trusted owner/operator shell, securely inject
  `CLOUDFLARE_SUBSCRIPTION_TRIGGER_SECRET` from the secret manager. This operator
  tool needs no database or Stripe credentials. Do not copy the live key into a
  committed `.env` file or casually into the development app.
- Run once: `npx tsx script/trigger-subscription-sync-once.ts --disabled-check`
- Expected: authenticated disabled-check success. A missing secret, wrong key,
  unreachable endpoint or unexpectedly enabled gate fails the check. The signed
  probe cannot change entitlements even if a flag was enabled unexpectedly.
- The tool and scheduled Worker share the identical signer, pinned URL and endpoint.
  It does not validate Cloudflare-hosted network delivery; that is observed on
  the first approved Cron event.

### 4. Supervised first account run — separate execution approval

- Keep Cloudflare **without Cron** and runtime flag false. Keep the in-process
  Replit flag unset/false. Record aggregate account/plan and financial baselines.
- Explicitly approve and apply `SUBSCRIPTION_SYNC_ENABLED=true` in the production
  configuration, including any platform-required republish. This also enables
  existing verified-webhook queueing; it does not start the web timer.
- With the same trusted operator secret, run exactly once:
  `npx tsx script/trigger-subscription-sync-once.ts --single-run --confirm-entitlement-write`
- Expect 200 and `processed=0` or `1`. Zero means no due account and is not proof
  of a successful account synchronization. Inspect Super Admin diagnostics,
  production logs and aggregate baselines; verify test access and award holds.
- On timeout/error/409/429/503, do not blindly rerun. Check whether a prior
  authorized transaction committed and whether work is pending or locked.
- Return the master flag to unset/false until recurring execution is separately
  approved. Never enable the in-process flag.

### 5. Monitoring and later recurring activation

- During supervised work watch BakerIQ logs and `/api/admin/subscription-sync`.
  Worker logs: `npx wrangler tail --config cloudflare/subscription-reconciler/wrangler.toml --format json`.
  After Cron activation also inspect Cloudflare's Cron Past Events/observability.
- Before unattended activation, connect invocation-error logs to the owner's
  approved notification destination. No alert recipient/channel has been
  configured by this work; log retention alone does not guarantee notifications.
- Only after recurring-activation approval: enable Replit's master flag, edit
  the Worker config to `SUBSCRIPTION_CRON_ENABLED = "true"` and
  `crons = ["*/15 * * * *"]` (UTC), then deploy that same BakerIQ Worker.
  Observe the first actual Cloudflare event and its completed origin response.
- Alert/investigate 409/429/503/timeouts, repeated failures, attempts reaching
  five, or accounts whose last success stops advancing. Keep logs free of PII,
  signatures and secrets.

### Stop/rollback controls

Remove Cron entries and set the Worker runtime flag false, deploy that Worker
configuration, and disable Replit's master flag. Keep the in-process flag off.
Allow/check any already-committing authorized transaction; do not delete customer
data or blindly reverse billing state. Missing schema/secrets always fail closed,
so the app and inert Worker may be released in either order while flags remain off.

## Reproducible local checks

`TEST_SUBSCRIPTION_DB=1 npx vitest run` enables the previously skipped PostgreSQL
suites. Old migration/repository tests use session-local TEMP business fixtures;
the new security suite uses only development nonce metadata and removes its own
fixture nonces. No real Stripe reads/writes or business rows are used.
`npm run build` builds BakerIQ, not a Worker deployment. Worker source is also
bundled locally with esbuild. No production activation is implied by a passing test.

## Final preparation evidence — 2026-10-18

- Full regression run with development PostgreSQL: **159 passed, zero skipped**.
  All 12 formerly skipped tests ran; newly added PostgreSQL security cases also ran.
- Production app build, Worker/operator esbuild bundles, and focused
  Worker/operator TypeScript check passed. The application-wide TypeScript check
  still reports 16 pre-existing unrelated errors; it is not a clean global check.
  Existing HTML/noscript, Browserslist, PostCSS and chunk-size warnings remain.
- Development migration applied/reapplied successfully. Development counts
  remained 11 bakers, 8 customers, 18 quotes, 9 orders, zero quote payments and zero
  commissions. The aggregate baker-record fingerprint was identical before/after;
  all synthetic nonce fixtures were removed.
- Production flag metadata confirmed both reconciliation flags unset. A
  read-only production catalog check confirmed the nonce table is not yet present:
  production migration remains pending approval. No secret values were read.
- Development app restarted and rendered normally; startup logged reconciliation
  disabled. No production reconciliation, migration, flag change, publication,
  Worker deployment or Cron activation was performed. No production signed
  delivery or live account-latency claim is made.
- Before unattended activation, owner secret binding, production schema approval,
  notification routing and supervised-run approval remain required.

## Exact finalization change manifest

Existing implementation is retained; these are the files changed in this pass,
not a claim that publishing uploads only these files:

```text
cloudflare/subscription-reconciler/src/index.ts
cloudflare/subscription-reconciler/wrangler.toml
cloudflare/subscription-reconciler/README.md
script/trigger-subscription-sync-once.ts
server/subscriptions/cloudflare-trigger.ts
server/subscriptions/provider.ts
server/subscriptions/repository.ts
server/subscriptions/service.ts
server/subscriptions/synchronizer.ts
shared/schema.ts
migrations/20261018_subscription_trigger_nonces.sql
server/subscriptions/cloudflare-trigger-storage.test.ts
server/subscriptions/cloudflare-trigger.test.ts
server/subscriptions/cloudflare-worker.test.ts
server/subscriptions/lifecycle.test.ts
server/subscriptions/repository.test.ts
server/subscriptions/cloudflare-postgres.test.ts
server/subscriptions/trigger-once.test.ts
.agents/memory/reconciliation-scheduling.md
```

No payment handlers, entitlement policy, test/admin account definitions,
award-hold policy, web UI or existing deployment type were changed.
