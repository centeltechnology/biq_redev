---
name: Reconciliation scheduling constraints
description: BakerIQ's Cloudflare scheduler decision and activation safety boundaries.
---

Keep the existing Replit Autoscale web application. Use a standalone BakerIQ
Cloudflare Worker Cron Trigger for periodic subscription reconciliation, with
its own Worker and secrets; never modify the other project's Worker. Target a
15-minute UTC cadence.

**Why:** The owner changed the scheduler decision to Cloudflare Cron Triggers and
requires BakerIQ to have an independent Worker and secrets while preserving the
existing website deployment.

**How to apply:** Keep Cloudflare Cron execution gated off until explicitly
approved, with no Cron Triggers configured before activation rather than relying
only on a runtime flag. Keep Stripe credentials and database access on BakerIQ's server; the
Worker only sends a signed trigger. Treat a supervised first run, reconciliation
activation, and recurring scheduling as separate approvals. Do not deploy or
activate the Worker without approval.
