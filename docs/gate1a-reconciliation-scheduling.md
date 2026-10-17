# Gate 1A — scheduled reconciliation preparation

Prepared 2026-10-17 UTC. Nothing here authorizes deployment, paid infrastructure,
flag changes, production execution, or Gate 1B.

## Recommendation and platform facts

Retain the existing Autoscale web app. Prefer a Replit **Scheduled Deployment**
running `npx tsx script/reconcile-subscriptions.ts` every 15 minutes in UTC:
`*/15 * * * *`. This supplies execution independent of web traffic without an
always-on web-hosting upgrade.

Replit documents cron expressions, configurable job timeouts, build/run commands,
logs, and an alert on failed scheduled runs. The published deployment-types page
does **not** specify a minimum cron interval or a numeric maximum job timeout.
The documented one-hour minimum belongs to **Agent Routines**, not Scheduled
Deployments. Do not substitute an Agent Routine for a deterministic server job.
Confirm the 15-minute expression and allowed timeout in the owner's actual
Publishing UI before purchasing/configuring anything.

Projects/artifacts documentation describes shared backend/data and project-wide
publishing. It does not provide an exact Scheduled-artifact creation procedure
for this existing legacy `.replit` web deployment. Confirm whether a separate
Scheduled execution unit can coexist in this project without converting its web
deployment or requiring a broader migration. Do not migrate the project or change
its Autoscale target as part of this preparation. If that UI path is unavailable,
a separately approved private job project/runner needs an explicitly verified
production database binding; it must not assume its default database is BakerIQ's.

## Cost estimate (not a purchase or account-specific quote)

The current publishing pricing page lists Scheduled Deployments at:

- $2/month base fee.
- $0.60 per million compute units; scheduler itself $0.
- CPU-second = 18 units; GB-second of memory = 2 units.

At 15-minute intervals there are **2,880 runs per 30 days**. Illustrative job-only
costs, assuming 0.5 CPU-seconds per wall-second plus 2 GB throughout each run:

| Average duration per run | Estimated monthly base + job compute |
| --- | ---: |
| 10 seconds | $2.22 |
| 60 seconds | $3.35 |
| 5 minutes | $8.74 |

These are assumptions, not measured reconciliation timings. They exclude
incremental database compute, storage, egress, tax, and other project usage.
Frequent database wakeups may add cost; included credits may offset charges but
must not be treated as guaranteed free infrastructure. Confirm the actual
machine/price quote and measure the supervised batch before approving a budget.

For comparison, the August 2026 table lists the smallest current Reserved VM
(0.5 vCPU / 2 GiB) at $0.0208/hour: approximately **$15.18 per 730-hour month**.
An additional always-on worker is unnecessary for short periodic batches, and
upgrading the web host is explicitly outside scope. Long-running scheduled jobs
can lose the cost advantage; revisit only after measured timings.

## Minimal code preparation

- `SUBSCRIPTION_SYNC_ENABLED` remains the master gate for trusted event queueing
  and reconciliation. It has not been enabled.
- New `SUBSCRIPTION_SYNC_IN_PROCESS_ENABLED` is a separate, default-off opt-in
  for the legacy web timer. Master enablement alone no longer starts it.
- Scheduled CLI execution does not depend on the timer setting. The command
  imports the service directly, not the web server, so it does not start web
  startup tasks, provisioning, or a timer.
- A PostgreSQL transaction-level advisory lock on a dedicated coordination
  connection excludes other batches, including across processes. It requires
  no schema change. Existing per-account transaction locks/deduplication remain.
  Coordination performs no writes and ends with rollback; per-account saves
  retain their existing independent atomic transactions.
- Overlap skips and incomplete/failed batches exit nonzero in the CLI, making
  them visible to scheduler failure alerts. Lock-cleanup failure discards the
  connection instead of returning a potentially locked transaction to the pool.
- Logs contain aggregate counts/duration and existing redacted failure refs,
  never credentials or customer PII. Nonzero exit alerts and stale successful-run
  monitoring must be checked in the actual scheduler setup.
- The 20-account bound, five-attempt retry cap, canonical Stripe verification,
  paid-through policy, Pro test/admin/trial/gift protections, pricing/fees, and
  affiliate award hold are unchanged. Verified award candidates may still be
  retained under policy review; no payout/commission authorization is added.

## Required runner configuration — not applied

- Existing Autoscale web target remains unchanged.
- Scheduled job only: build `npm ci --include=dev`; run
  `npx --no-install tsx script/reconcile-subscriptions.ts` (equivalent local tsx
  entry point, but fails instead of downloading a missing runner).
- Include the source tree and runtime dependencies. `dist/index.cjs` is the web
  server bundle, not the scheduled command.
- Intended UTC cron: `*/15 * * * *`, only after platform validation and approval.
- Use a hard execution timeout shorter than the interval **if measured batch
  duration permits**; 10 minutes is a provisional cap, not a verified platform
  limit. Otherwise obtain approval for a longer cadence/timeout. Account budgets
  can accumulate across 20 records; do not assume every batch takes seconds.
- Use non-overlap settings if offered, in addition to the database lock.
- Bind the correct production database and existing intended live Stripe
  account through approved Secrets/Configurations tools. Never copy credentials
  into source, logs, cron strings, URLs, or chat. The existing client can fall
  back to a development connector if production credentials are unavailable:
  explicitly validate the runner's production credential binding so this cannot
  silently become the selected environment. No Stripe-client contract changed.
- Verify primary writer/pooler settings, at least two pool connections, and that
  idle-transaction timeouts permit the coordination transaction for the approved
  job duration. Development lock tests do not establish production-primary facts.
- Keep `SUBSCRIPTION_SYNC_IN_PROCESS_ENABLED` absent/off in **web and runner**.
  Keep the master gate off until the staged approvals below.

## Exact controlled activation sequence — DO NOT EXECUTE YET

1. **Approve the code-only release first.** Keep both settings off. Publish only
   after separate owner approval. Verify the published build contains the new
   timer separation before ever enabling the master flag.
2. **Read-only production preflight.** Confirm production URLs/schema, intended
   live Stripe account and approved price lookup keys; obtain actual provider-
   signed managed-webhook delivery evidence. Verify canonical customer/Checkout
   associations. Capture aggregate counts/fingerprints, the review set, and both
   intentional Pro test accounts' protected entitlements. Preserve all records.
3. **Approve infrastructure/configuration.** Confirm the owner's cron/timeout
   support, coexistence path, plan quota, quoted cost and spending limits. Create
   a paused/disabled job only after that approval. If the platform cannot stage
   a job without running it, stop: deployment with an enabled master gate can
   itself be the first production execution.
4. **Verify the trusted job environment.** From the approved runner, verify the
   production database/project binding and live Stripe account using read-only
   checks, without printing secrets. Confirm it is not a workspace/development
   database or the read replica used by inspection tools. Verify coordination
   lock behavior on the actual writer before processing records.
5. **Approve one supervised batch separately.** Keep recurring execution paused.
   Configure the master gate for the intended runner; keep the timer opt-in off.
   Configure the web master gate only when trusted webhook queueing is approved.
   Republish/restart the relevant production environment as its platform requires.
   Run **one** command via the same trusted job runtime, under the approved
   timeout. It selects at most 20 due accounts; it is not a dry run and can update
   verified entitlements. Do not queue/reset extra retries automatically.
6. **Review before recurrence.** Require a completed successful run, duration and
   account-level diagnostics. Compare plans, fee entitlements, customer-data/
   payment/history aggregates, held candidates, and financial-award counts.
   Both intentional Pro test accounts must remain protected/non-revenue.
   Provider/storage failures preserve access and require investigation; do not
   interpret a skipped lock-contended run as a successful billing verification.
7. **Approve recurrence only after that review.** Activate the validated cron;
   verify logs/alerts, an expected subsequent run, and a missing-success/staleness
   alert policy. No Autoscale timer should be running. Fifteen-minute scheduling
   adds up to roughly one interval after a queued event or known coverage
   boundary becomes due. Without a signal, the existing 15-minute eligibility
   delay plus cron alignment can mean 15–30 minutes between normal checks.
   This is scheduling latency, not a new grace policy; retries/large backlogs
   can take longer. If only a longer interval is available,
   obtain approval rather than silently substituting it.
8. **Stop plan.** Pause recurrence first; keep the timer opt-in off. Disable the
   master gate through the approved deployment process if needed. A job already
   running must be stopped by the runner; changing a setting is not retroactive
   cancellation. Job termination rolls back its current account transaction;
   earlier successful account commits remain. Do not rewrite history blindly.

## Remaining blockers

Owner approval; confirmed job/coexistence path and account-specific quote;
validated cron and hard-timeout limits; verified production writer/credentials;
provider-signed delivery evidence; supervised timing/baseline review; and proven
failure/stale-run notification settings. No scheduler or paid service was created.

## Local verification

`TEST_SUBSCRIPTION_DB=1 npx vitest run`: **125 tests passed**, none skipped.
This includes actual two-connection development PostgreSQL lock exclusion/
release, mock-runner exit behavior, independent timer gates, verified event
queue deduplication, and the existing lifecycle/security/entitlement regressions.
Database regressions use development temporary fixtures or advisory locks;
no production reconciliation was executed.

`npm run build`: client and server production bundles generated successfully,
with the existing HTML/PostCSS/large-chunk warnings. The project-wide type check
still reports 16 existing errors in untouched files; none occur in these changes.
Production inspection still shows Autoscale and neither activation setting
configured.

## Official sources consulted

- https://docs.replit.com/features/publishing/deployment-types
- https://docs.replit.com/billing/deployment-pricing
- https://docs.replit.com/billing/aug-cloud-billing-updates
- https://docs.replit.com/features/projects-and-artifacts/artifacts
- https://docs.replit.com/home/routines (distinguishes the one-hour Routine limit)
