---
name: Reconciliation scheduling constraints
description: Owner hosting/cost constraints and Scheduled Deployment versus Agent Routine distinction.
---

Keep the existing Autoscale web application. Do not upgrade web hosting or
create paid infrastructure without approval. Prefer approximately 15-minute
reconciliation if supported and cost-effective.

**Why:** The owner explicitly requires reliable reconciliation without changing
web hosting and requires approval before paid infrastructure or live execution.

**How to apply:** Prepare the existing private command and confirm the owner's
actual scheduling/coexistence path, production bindings, timeout and quote before
configuration. Do not migrate the whole project merely to add a job without
separate approval. Treat supervised execution and recurrence as separate approvals.

Do not apply Agent Routines' one-hour minimum to Scheduled Deployments.

**Why:** Documentation-search summaries conflated them; the Routine source has
the limit, while the Scheduled Deployment source describes cron without specifying
a minimum interval or numeric maximum timeout.

**How to apply:** Check the actual Scheduled deployment UI for cadence/timeout
limits; do not promise 15-minute support or assert an hourly restriction from
search summaries alone.
