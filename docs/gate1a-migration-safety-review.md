# Gate 1A — production migration safety review

Review date: 2026-10-16. **SAFE TO APPROVE PRODUCTION MIGRATION: NO — pending
the specific evidence and schema-parity gaps below.**

Follow-up: `docs/gate1a-final-publication-readiness.md` records the subsequently
authorized CHECK-parity correction and current test results. The missing-CHECK
finding below is historical and resolved; production approval remains blocked
on the operational evidence described in the follow-up.

This is a read-only production review. No production migration, publishing,
feature-flag changes, reconciliation, provider mutations, or Gate 1B work was
performed. Only documentation was edited. Validation used connection-local
temporary development fixtures; application data and behavior were not changed.

## A. Migration contents

Reviewed `migrations/20261016_subscription_sync.sql`, SHA-256:

`148d8fc9087c8d9b4caf70c3f74c55ada48b2cdd5a44f288416eebe6c852d9c5`

The file contains one transaction:

- Adds nullable `bakers.administrative_plan`, without a default. CHECK permits
  NULL, `basic`, or `pro`.
- Creates `subscription_sync`: one row per baker, FK to `bakers(id)`, with
  `ON DELETE CASCADE`, verified billing state, timestamps, retry information,
  and safe initial defaults.
- Creates partial index `subscription_sync_due(next_attempt_at) WHERE
  needs_reconcile`.
- Creates `subscription_sync_events`: primary key on provider event ID, receipt
  timestamp defaulting to now.
- Creates `subscription_award_candidates`: primary key on invoice ID, baker FK
  with `ON DELETE CASCADE`, subscription ID, Basic/Pro CHECK, and initial
  `policy_review` status.

There are no INSERT, UPDATE, DELETE, DROP, TRUNCATE, data-copy, account backfill,
trigger, function, or extension statements. The tables start empty. Defaults only
apply when a row is subsequently inserted; they do not queue existing accounts.

The cascades point FROM new tables TO bakers: a later authorized baker deletion
can remove its dependent sync/candidate rows, never the reverse. Applying the
migration does not delete anything.

## B. Schema compatibility

Production read-only catalog checks confirm:

- `bakers.id` is varchar with a primary key, matching both new foreign keys.
- `bakers.plan` remains NOT NULL text, default `free`; Stripe ID columns remain
  nullable text.
- The administrative column and all three new tables are absent.
- No baker table triggers or enabled DDL event triggers were returned.

Compared development and production public-schema column definitions,
constraints, and indexes. Differences were the proposed additions plus equivalent
numeric-default representations: `15` versus `'15'::numeric` for calculator
overhead, and `0` versus `'0'::numeric` for quote amount paid. No unrelated
column additions/removals or existing constraint/index differences were found.
This catalog comparison is NOT the actual Publish-generated migration preview.
Review that preview before approval, including any default-normalization SQL.

**Drizzle parity gap:** column types, nullable/default settings, primary keys,
foreign keys, cascade direction, and partial index match. However,
`shared/schema.ts` omits the SQL CHECK definitions for:

1. `bakers.administrative_plan`;
2. `subscription_sync.billing_plan`;
3. `subscription_award_candidates.plan`.

Do not describe the two representations as fully equivalent. A source-driven
schema push could omit/remove these safeguards. Mirror the checks in Drizzle in
a separately authorized change and verify development catalog parity before
accepting the final Publish diff. No schema definitions were changed in this
review.

Adding a nullable column and unused new tables is backward compatible with the
published application's existing named-column operations. This is a structural
assessment, not an execution test of the deployed binary against migrated
production. No production migration was performed to claim such a test.

The new application requires the additions even with synchronization disabled:
Drizzle baker queries include `administrative_plan`, and admin billing diagnostics
read the new tables. Do not deploy it against an unmigrated schema. Missing
diagnostic tables produce a controlled 503 for the dedicated diagnostics route,
not an entitlement downgrade; that response is not a substitute for migration.

## C. Data preservation assessment

Production currently reports 63 bakers: 61 Free and two Pro. Both intentional
test-account fingerprints matched Pro records. No Basic records currently exist
in production; Basic preservation was validated with a temporary fixture.
No raw account identities or billing IDs were included in this report.

The migration does not alter existing plan values, Stripe associations, gift or
trial settings, quotes, payments, commissions, referrals, or completed fees.
All existing administrative grants initially remain NULL. The synthetic
preservation test compared every original fixture field before/after, including
Free, Basic, and two Pro fixtures.

Applying DDL alone cannot start reconciliation or issue awards: no trigger,
worker, or business-data write is installed. The published application does not
gain the new worker merely because tables exist.

With the new application and `SUBSCRIPTION_SYNC_ENABLED` unset or `false`,
event queueing, reconciliation ticks, and worker startup return before database
operations. The production environment inspection returned no configured flag.
Existing managed Stripe startup remains independent: production initialization
can run the existing Stripe-schema library migrations, managed-webhook setup,
provider data synchronization, and product setup. Thus "new synchronization
disabled" does NOT mean all existing Stripe startup activity is disabled.
This review did not start the production-mode app against live services.

### Eventual explicit grants for intentional test accounts

This migration must NOT populate or rewrite those accounts. Later, obtain
separate approval to assign each existing test account an explicit Pro
administrative grant, leaving its existing Pro base, data, and billing IDs
unchanged. Verify effective Pro access and exclusion from paid/revenue metrics
before considering any further change. Keep the test-account protection until a
replacement explicit test classification is implemented and verified.

An administrative grant by itself does not replace the existing test marker:
the current payment-count exclusion depends on the protected test identity.
Do not remove that protection as part of assigning a grant. Do not infer paid
status from a Pro plan or administrative grant.

## D. Tests

Executed during this review:

- `TEST_SUBSCRIPTION_DB=1 npx vitest run`: **80 passed, six files**, including
  PostgreSQL repository integration and subscription/security regressions.
- Temporary PostgreSQL migration rehearsal: **17 assertions passed**.
  Covered field/plan preservation, NULL administrative defaults, three empty
  tables, safe reapplication, queue defaults, three CHECK constraints, foreign
  key rejection, baker/event/invoice uniqueness, cascade direction, and
  transactional rollback of the column and all three tables.
- Disabled-mode guard exercise: unset and `false` both prevented all database
  operations during worker startup, a tick, and event queueing. Invalid event
  JSON was not even parsed while disabled.
- `npm run build`: **passed**, generating `dist/public` and `dist/index.cjs`.
  Existing HTML/noscript, stale Browserslist, PostCSS, and bundle-size warnings
  remain nonfatal. This does not claim a clean full TypeScript check.

Rehearsal transformed only CREATE TABLE into CREATE TEMP TABLE and shadowed
bakers with connection-local fixtures. Connections were destroyed afterward.
It verifies PostgreSQL behavior, not production lock timing, platform migration
transaction boundaries, or actual disaster recovery.

## E. Backup/recovery readiness

**Not verified for this production database.**

Official Replit documentation describes production point-in-time restore and
scheduled backups, with settings/restore points in the production Database
tool. The available read-only SQL and deployment inspection do not expose a
verified usable backup, its timestamp, retention, or restore permissions.
Platform capability is not evidence that this database has a usable point.

Before approval, an authorized owner must inspect production Database Settings
and record an available pre-change recovery point, retention/window, access to
restore, and the person responsible. Do not perform a live restore as a test.
Any restore rehearsal must use a separately approved isolated target.

Recovery preference after an additive migration: keep the schema, keep sync
disabled, and revert only application code if needed, preserving the published
webhook protections. A database restore can discard legitimate business writes
made after its recovery point and requires separate incident authorization.
Code rollback and production database restore are separate operations.

Sources consulted:

- https://docs.replit.com/features/data-and-storage/data-recovery
- https://docs.replit.com/features/data-and-storage/development-and-production

## F. Risks and blockers

1. **Recovery evidence missing:** obtain the owner-verified recovery information
   above before approving a production schema change.
2. **SQL/Drizzle CHECK mismatch:** authorize the narrow schema-definition fix,
   then confirm the checks survive the supported schema-diff path.
3. **Actual Publish diff not reviewed:** the standalone SQL file is not a
   production migration runner. This managed database uses Replit's Publish
   flow to diff development against production and apply changes. Independent
   migration-first execution is not the supported procedure here. Publishing
   needs explicit approval in addition to schema approval.
4. **Execution tracking is incomplete:** IF NOT EXISTS avoids duplicate object
   creation on exact reapplication but is NOT a migration ledger or shape
   validation. The SQL has no version/checksum ledger. Record the reviewed
   artifact checksum, actual schema diff, owner approval, successful publishing
   record/time, and post-change catalog verification in the release record.
   Subsequent publishing should see no remaining corresponding schema diff.
   If that history is unavailable, stop rather than rerunning arbitrary SQL.
5. **Writer privileges/lock window not verified:** the production query role
   reports schema CREATE privilege and ownership of bakers, but the read-only
   replica role does not prove the actual Publish writer's permissions or live
   lock availability. The platform operator must verify its migration access.
6. **Scheduler is not configured:** production Autoscale timers are not a
   guarantee of background work while idle. Keep synchronization off until
   approved durable scheduling and controlled first-run arrangements exist.

### Constraints and operating limits

Primary keys supply the required uniqueness indexes; provider customer IDs are
not newly made unique because ambiguous existing associations must be diagnosed,
not destroyed or silently rewritten. Baker FK in the one-row sync table is
already indexed by its primary key. Candidate baker FK has no separate index;
that is acceptable for initially empty/small review queues, but add a reviewed
index before high-volume baker diagnostics/deletions become a problem.
Database CHECKs do not bound attempts or candidate status; current application
code bounds retries and uses a fixed review status. These are not new
production-data rewrites.

`ALTER TABLE ... ADD COLUMN` takes an ACCESS EXCLUSIVE lock on bakers. NULL/no
default avoids a heap rewrite, but the CHECK may require validation work.
Foreign-key creation also locks referenced bakers; locks persist until transaction
completion for this SQL file. Old/new baker reads and writes may wait. Ordinary
index creation is on a new empty table. No long-running table backfill, new
extension, or provider network call is required by this file.

No intentional application outage is required, but zero downtime cannot be
promised: lock waits and deployment replacement can interrupt requests.
Choose a low-traffic window, confirm no long-running baker transactions, and use
bounded lock/statement timeouts if the supported platform migration controls
expose them. This SQL supplies no timeout settings. If timeout controls are
unavailable, agree a platform-supported monitoring/abort procedure first; do not
work around it with custom production DDL.

## G. Exact recommended procedure — NOT authorization to execute

1. Resolve recovery evidence and obtain permission for the narrow Drizzle CHECK
   parity correction. Rerun its relevant validation after that correction.
2. Keep production `SUBSCRIPTION_SYNC_ENABLED` unset/false. Do not modify Stripe
   accounts, webhook settings, historical events, or application business data.
3. Prepare the owner-approved Publish operation for this managed database.
   Inspect its actual schema changes: only the nullable administrative column,
   three new tables, their checks/keys/indexes, plus any separately reviewed
   harmless default normalization. Reject unrelated/destructive operations,
   renames, data overwrites, or development-data replacement. Do not run
   `db:push` against production, add build/startup DDL, or create a custom
   production migration runner. If a safe preview cannot be obtained before
   authorization, stop.
4. Record checksum, approved diff, recovery point, operator, low-traffic window,
   permissions, and lock-abort plan. Obtain explicit combined schema/application
   publishing approval; migration approval alone is insufficient.
5. Only after approval, the owner initiates Publish. The supported platform flow
   applies the additive schema change before the new application relies on it.
   Record successful execution/deployment history and compare resulting catalog
   objects to the approved definitions. Do not rely solely on IF NOT EXISTS.
6. With the flag still off, verify startup, login, super-admin diagnostics,
   Refresh, disabled reconciliation control, safe callback 503, and signature
   rejection. Confirm original plan/Stripe/gift/trial values are preserved,
   both intentional tests remain Pro and excluded from paying counts, and new
   sync tables remain empty absent a separately authorized operation.
7. Configure an approved always-running worker or supported scheduled job that
   connects to the intended production database and uses the same trusted code.
   Keep scheduled execution and web-app synchronization disabled initially.
   Review secrets scope, concurrency, retry caps, job packaging and monitoring.
8. Obtain separate controlled-enablement approval. The web worker runs a tick
   immediately when enabled; enabling it is NOT a dry run and can change up to
   20 due accounts per tick. Prefer an approved supervised one-batch job with the
   web flag still off, inspecting pending associations and intended accounts
   first. The existing CLI is bounded but not an account-specific canary selector.
   Do not promise per-account rollout without adding and testing that control.
9. Review results/fees/test access/failure preservation. Only then authorize
   normal periodic scheduling and signed-event queueing. Affiliate/referral
   candidates remain review-only; no awards or historical backfill are authorized.

## H. Decision

**SAFE TO APPROVE PRODUCTION MIGRATION: NO.**

The isolated SQL is additive and its preservation/constraint tests pass. The
remaining blockers are operational recovery evidence, CHECK parity, and review
of the actual supported Publish migration and its execution safeguards. These
are approval gaps, not evidence of existing data loss.

Stop here. No migration, publishing, synchronization enablement, administrative
grant conversion, or Gate 1B work is authorized by this review.
