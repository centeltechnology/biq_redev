# Gate 1A: subscription reconciliation and rollout hold

## Status

Workspace implementation only. Production remains on the previously published
webhook-containment release. This document is NOT publishing or migration approval.
Gate 1A remains BLOCKED pending the operational and award-policy items below.

## Live evidence collected before implementation

On 2026-10-16, safe probes against the deployment URL returned:

| Check | Observed |
|---|---|
| Public site and login | HTTP 200; login form rendered |
| Anonymous session | HTTP 200, unauthenticated |
| Protected subscription status | HTTP 401 |
| Empty login form submission | HTTP 400 |
| Legacy subscription callback with `{}` | HTTP 503, `SUBSCRIPTION_CALLBACK_DISABLED`, `no-store` |
| Connect callback, absent or invalid signature | HTTP 400 |
| Managed callback, absent signature | HTTP 400 |
| Existing intentional Pro test accounts | Both still Pro, with no Stripe subscriptions |

Before/after entitlement fingerprints and commission/referral/payment record
counts were unchanged across the probes. Isolated route tests additionally
verify that the contained callback makes no business reads/writes or Stripe calls.
This does not claim that production storage writes were independently traced.

The managed subscription endpoint is enabled on the deployment's Replit production
hostname; Connect is enabled on its custom production hostname. The owner reported
personally checking the Connect signing secret. No recent Stripe events were
available for provider-signed delivery verification. No real events were replayed.
Successful production login was not attempted using an existing user's credentials.

Returned deployment logs included transient healthcheck failures before startup,
followed by the server listening and managed synchronization completing. Later
termination was reported as a system signal. No application-level webhook/sync
failure was found in that limited window. This is not continuous monitoring.

## Trust path

The existing `/api/stripe/webhook` raw-body integration verifies signatures and
updates managed Stripe tables. Only after it accepts the raw event does the bridge
durably enqueue a reconciliation signal. The public legacy callback stays disabled.
There is no second subscription webhook or client-authorized entitlement update.

Reconciliation uses live server-to-server Stripe reads, not event-supplied statuses:

1. Match a uniquely stored baker/customer association.
2. Load current subscriptions belonging to that customer.
3. Verify the completed subscription Checkout session, its server-issued baker
   metadata, customer, subscription, and allowlisted Checkout price.
4. Verify canonical paid invoices and subscription line periods.
5. Resolve current access and commit billing state, local plan, and review
   candidates atomically under a PostgreSQL transaction/advisory lock.

Prices are resolved by the existing Basic/Pro lookup keys, then checked for exact
USD monthly amounts of 499/999 cents and interval count one. Their exact Price IDs,
not arbitrary product names or plan metadata, authorize the tier. Missing, multiple,
retired/unconfigured, or unsupported prices cause a visible failure without a plan
change. Existing custom subscriptions without the required Checkout association
require explicit operator investigation; they are not automatically adopted.

## Approved entitlement policy

- Free: $0/month; 7% platform fee.
- Basic: $4.99/month; 5% platform fee.
- Pro: $9.99/month; 3% platform fee.
- Positive paid invoice subscription lines establish the purchased coverage.
- Scheduled or immediate cancellation does not erase unexpired purchased coverage.
- A paid higher tier is retained through its verified coverage before downgrade.
- No extra failed-payment grace follows the verified paid-through date.
- Fresh successful reconciliation after expiration can return the billing base
  to Free. Failed, missing, ambiguous, budget-limited, or unavailable authoritative
  information never takes a downgrade/error fallback.
- A still-unexpired previously verified period cannot be erased by an omitted
  invoice response.
- Successful qualifying renewals restore/extend access automatically.
- Stripe trials, survey trials, gifts, administrative grants, and the two
  owner-confirmed Pro test identities are distinguished from paying subscribers.
- Test identities are protected by server-generated account fingerprints in the
  server policy, without rewriting historical accounts. No client can choose
  those identities or grant an administrative plan.
- New explicit complimentary plan edits use the existing super-admin-only editor
  and separate `administrative_plan`; Free clears the explicit grant.
- No customer data is deleted. Existing paid transactions, application fees,
  products, prices, referral relationships and historical commissions are not
  rewritten. New fee calculations use the effective plan (including authorized
  overlays), never a retroactive adjustment to completed transactions.
- Paid metrics require verified payment coverage, not `bakers.plan` distribution.

## Retry, ordering, and concurrency

- Unique event IDs prevent repeated durable enqueue effects.
- Duplicate/delayed signals always fetch current canonical Stripe state.
- Per-baker PostgreSQL transaction/advisory locks prevent simultaneous updates
  across instances. A busy account is retried by the durable/periodic queue.
- Periodic reconciliation scans up to 20 due accounts per tick and normally
  makes successful accounts eligible after 15 minutes or at a known coverage
  boundary. Actual verification waits for the next approved worker execution;
  a 15-minute cron can mean 15–30 minutes between ordinary successful checks
  because of due-time/cron alignment, with longer delays under failures/backlog.
- Per-request timeout is 10 seconds with one network retry; account work has a
  40-request/45-second checked budget. A final in-flight request can exceed the
  checked deadline by its bounded timeout/retry.
- Pagination or unsupported high-volume history is surfaced, not silently
  truncated into a downgrade. Operator-assisted reconciliation is required.
- Five automatic failed attempts are followed by visible outstanding work;
  new verified signals or super-admin queue action allow a bounded retry cycle.
- The CLI `npx tsx script/reconcile-subscriptions.ts` runs one batch and exits
  unsuccessfully when a batch contains failures. It is server-only and requires
  explicit enablement.
- Prepared scheduling separation requires a second, default-off
  `SUBSCRIPTION_SYNC_IN_PROCESS_ENABLED` opt-in for the legacy web timer.
  Scheduled execution uses the existing master gate with that timer off.
  Whole-batch coordination adds a transaction-scoped advisory lock, preserving
  existing per-account locks and policy. See `gate1a-reconciliation-scheduling.md`
  for costs, platform-validation blockers and the unexecuted activation procedure.

## Affiliate/referral hold

The old callback used configurable affiliate rates/month caps (defaults 20% and
three months) and referral credits capped at a combined 12. It could trigger on
`active` OR `trialing`, lacked a required invoice, and did not unambiguously define
upgrade/proration, free-trial, renewal, and invoice-to-commission-month eligibility.

No percentages or qualifying rules have been invented. Positive verified invoice
activity is retained in an invoice-unique review-candidate ledger. Candidates are
NOT awards, commissions, payouts, or historical adjustments. Existing award tables
and relationships are untouched.

**Decision required:** define the qualifying paid activation/renewal invoice,
whether prorated upgrades qualify, whether zero-payment trials ever qualify,
commission month counting, and the one-time referral qualifying point. Then build
transactional award creation with unique invoice/type claims using existing rates,
caps, and referral-credit rules. The bridge does not currently issue these awards.

## Files and database

- `server/subscriptions/policy.ts`: entitlement precedence, protected test
  identities, effective fees, paying classification.
- `provider.ts`: canonical associations, approved prices, paid periods.
- `synchronizer.ts`: fail-safe reconciliation orchestration.
- `repository.ts`: transactional persistence, retries, PII-minimized diagnostics.
- `service.ts`: authenticated signal queue, scheduler, super-admin diagnostics.
- `managed-handler.ts`: verified managed integration followed by durable enqueue.
- `*.test.ts`: isolated lifecycle, HTTP trust-boundary, PostgreSQL TEMP-table tests.
- `server/index.ts`: managed integration hook, worker start, safe development
  startup (does not provision live Stripe products/webhooks).
- `server/routes.ts`: exact approved Checkout price, shared effective entitlements,
  explicit admin grants, verified revenue metrics, diagnostics registration.
- `shared/schema.ts`: additive administrative entitlement and sync tables.
- `client/src/components/subscription-sync-panel.tsx` and `pages/admin.tsx`:
  super-admin diagnostics, source/status/association/error visibility and retry.
- `script/reconcile-subscriptions.ts`: trusted one-batch operator entry point.
- `migrations/20261016_subscription_sync.sql`: adds nullable `administrative_plan`
  and three tables (`subscription_sync`, `subscription_sync_events`,
  `subscription_award_candidates`). No historical account backfill.

The migration was applied to DEVELOPMENT only. PostgreSQL integration tests use
connection-local TEMP tables and mocked provider results, not application rows.

## Production rollout requirements — owner approval required

1. Review and approve the additive schema change. For this Replit-managed
   production database, schema changes are applied by the owner-approved Publish
   flow, not a separate production SQL script, startup migration, or build hook.
   Review the actual development-to-production schema diff before authorizing
   publishing; migration approval alone does not authorize publishing. See
   `docs/gate1a-migration-safety-review.md` for unresolved approval requirements.
   Do not overwrite production data with development data or run a backfill.
2. Keep `SUBSCRIPTION_SYNC_ENABLED` unset/false during migration and initial review.
   This flag gates new queue/worker activity, not the existing managed webhook.
3. Review configured Price IDs/lookup keys and Checkout associations. Unsupported
   associations remain visible and unchanged.
4. Approve durable worker hosting: current production uses Autoscale, which can
   stop timers when scaled to zero. For guaranteed session-independent periodic
   work, choose an always-running worker/Reserved VM or an approved external
   scheduler invoking the server-only command. No deployment type was changed.
5. Obtain publishing approval separately, then approve explicit enablement in the
   intended runtime. Do not enable workspace processing against real billing data
   merely to demonstrate the feature.
6. Run one supervised bounded reconciliation batch and review diagnostics before
   normal periodic processing. There is no automatic historical entitlement
   migration or referral/commission backfill.
7. Verify a safe provider-signed delivery if available. Local SDK-signature tests
   are not evidence of live Stripe delivery.

## Monitoring and recovery

Immediately: verify public/login routes, callback 503, unsigned webhook rejection,
managed registration/delivery, and retention of test entitlements. In the first
hour inspect diagnostics every 15 minutes; daily for seven days inspect stale
success timestamps, retry caps, association errors, expired paid coverage with
pending reconciliation, test/gift/trial classification, fee policy, and award review.
Do not put raw events, signatures, credentials, customer IDs or PII in new logs.

If sync is suspect: disable the new worker/queue flag, preserve current access,
investigate diagnostics and authoritative billing. The managed webhook can
continue independently. Never reopen the anonymous callback. Any application
rollback must retain the already-published webhook protections and use the
additive schema compatibly; do not drop new tables or rewrite account histories.

## Verification

`TEST_SUBSCRIPTION_DB=1 npx vitest run`: 90 passing tests after the narrow
CHECK-parity correction, including permanent migration-preservation and
SQL/Drizzle CHECK consistency coverage.
`npm run build`: successful frontend and server bundle.
TypeScript retains the 16 previously identified unrelated errors; no new bridge,
schema, admin diagnostics, or component errors are accepted.
The legacy standalone e2e workflow previously failed on IPv6 localhost connection
setup; it is not represented as a passing regression suite.

The dedicated development browser pass verified real fixture login, diagnostics
HTTP 200, Refresh, disabled queue controls while sync is off, absence of raw Stripe
identifiers/PII in the panel, and desktop/390px phone layouts without page-wide
horizontal overflow. Its synthetic development fixture, login event and session
were removed. No production account or provider billing action was used.
