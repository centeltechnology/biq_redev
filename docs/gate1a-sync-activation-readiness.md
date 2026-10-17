# Gate 1A — Subscription sync activation readiness

This is an operational plan, not activation authorization. The admin usability
update does not change billing rules, production records, deployment settings,
or scheduling. Publishing the interface and activating synchronization are
separate approval decisions.

## Read-only observations (2026-10-17 UTC)

- Production is a successful Autoscale deployment at `https://bakeriq.app`,
  with `https://bakery-os--centeltechnolog.replit.app` as a production alias.
- The production activation setting is absent. Startup also reports
  reconciliation disabled.
- Stripe's live managed endpoint is enabled at
  `https://bakery-os--centeltechnolog.replit.app/api/stripe/webhook`.
  Its 89 subscribed events include subscription, invoice, and Checkout events.
  Enabled configuration is **not evidence of successful signed delivery**.
- No reconciliation scheduler is present in the visible Replit configuration.
  Configuration in an unrelated external service cannot be ruled out.
- Three customer-linked Free accounts have no stored subscription association,
  sync record, attempt, success, or recorded error. Their pending flags are
  expected while disabled; they do not demonstrate a broken association or
  prove that Stripe has no subscription. Do not repair or downgrade them from
  this observation alone.

## Admin view semantics

Needs review retains the existing definition:
`needsReconcile || Boolean(errorCode)`. The card and table use the same selector.
With no sync row, the server marks a stored customer association as needing
reconciliation. That is an informational first-sync state, not a payment failure.
Award-policy review counts remain separate; paid-subscriber/MRR cards retain
their server-supplied definitions and are not converted into approximate filters.

Search uses the existing server-redacted account reference. No customer names,
email addresses, raw account IDs, or Stripe IDs were added to the API response.
Filtering, search, pagination, and refresh do not request a reconciliation.
The existing retry control remains server-gated and unavailable while disabled.

## Owner configuration location and activation behavior

After separate activation approval, configure `SUBSCRIPTION_SYNC_ENABLED` for
the **published app**, not for the development workspace:

1. Open **Tools → Secrets → Configurations → More → New published app
   configuration**. Feature flags are non-sensitive configuration.
2. If it is managed as a deployment secret instead, the documented production
   location is **Publishing → Adjust settings → Production app secrets**.
   Do not create conflicting shared/development/production entries.
3. Review the pending code and environment changes, and **Republish** only
   after approval. Replit's documented environment update flow requires a new
   publication; restarting the workspace does not update production.

The server accepts only its explicit enabled setting. The interface never
displays environment values or edits settings.

**Scheduling preparation changes the startup contract, once published:**
the master gate alone no longer starts the web worker. The legacy timer also
requires `SUBSCRIPTION_SYNC_IN_PROCESS_ENABLED` to be explicitly enabled.
Keep that second setting absent/off in every scheduled-only environment.
The private command still requires the master gate and runs one bounded batch.
Do not activate either setting or execute the command without separate approval.
Successful authoritative checks can update plan/subscription state under the
already approved entitlement policy. Until these code changes are published,
the previous production startup behavior still applies.

## Reliable scheduling

Autoscale may scale to zero when idle. Its Node process and in-process timer
cannot provide unattended deadlines while stopped. The prepared scheduled-only
mode deliberately does not start a timer when traffic wakes the web app.

Recommended approach **if retaining Autoscale**:

- Use a separately approved trusted Scheduled Deployment/job runner for
  `npx tsx script/reconcile-subscriptions.ts`.
- Package the source entry point and its runtime dependencies; the normal web
  bundle is not itself the standalone job entry point.
- Explicitly verify that the runner uses the intended production database and
  Stripe account through approved secret/configuration tooling. A new project
  must not accidentally reconcile its own development database.
- Approve the cadence, bounded execution timeout, non-overlap policy, failure
  alerts, and deployment/plan availability before creating the job.
- The command requires the same activation gate. Do not enable either the
  command or the web process as part of this readiness work.
- Scheduled deployments do not serve a web app. **Do not replace the current
  web deployment with the Scheduled deployment type.**

The lowest-complexity single-service alternative is an owner-approved
**Reserved VM** deployment, which can keep the existing worker running without
Autoscale sleep. That changes hosting/compute and requires separate approval.
Current deployment metadata does not establish the owner's plan quota or
permission to add a second deployment.

Do not substitute browser polling, an exposed unauthenticated cron URL, or
workspace uptime for a durable trusted scheduler.

## Outstanding prerequisites and controlled rollout

1. Obtain actual provider-signed delivery evidence for the managed endpoint.
   Use existing delivery evidence or an explicitly approved safe Stripe-supported
   verification method. Do not create subscriptions, charge anyone, or treat
   locally generated test signatures as live provider delivery evidence.
2. Read-only check the live approved price lookup configuration and canonical
   customer/Checkout associations before processing the three linked accounts.
   Stored association booleans alone do not verify provider identity or payment.
   Resolve any actual discrepancies through a separately approved plan; do not
   guess IDs or rewrite records automatically.
3. Select and approve reliable scheduling/always-on compute. None was configured
   by this work.
4. Separately approve activation, a supervised first batch, monitoring, and a
   stop plan. Publish the flag separation first with all execution disabled;
   then follow `gate1a-reconciliation-scheduling.md`. Do not enable the master
   gate on the previous production build, which starts a timer immediately.
5. Re-establish the aggregate production baseline immediately before activation.
   Observe diagnostics, errors, authoritative paid-through states, and affected
   entitlements/fee tiers. Preserve test/admin/trial/gift access and all customer
   data; do not change completed transaction fees.
6. On failure, stop further approved jobs/workers and disable the activation
   setting through the deployment process. Do not blindly rewrite plan history.

Gate 1B is outside this work.

## Replit documentation consulted

- [Secrets and published-app configuration](https://docs.replit.com/core-concepts/project-editor/app-setup/secrets)
- [Deployment types: Autoscale, Reserved VM, Scheduled](https://docs.replit.com/features/publishing/deployment-types)
- [Publishing overview](https://docs.replit.com/features/publishing/overview)
