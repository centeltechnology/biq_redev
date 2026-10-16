---
name: Subscription entitlement policy
description: Owner-approved paid-through, failure-safety and non-billing access rules.
---

Use paid-through access only, with no extra grace. Preserve access through the
verified paid-through date, including scheduled cancellations, then return the
billing base to Free when a successful authoritative check confirms no qualifying
payment or authorized entitlement. Verified successful renewal restores access.

**Why:** The owner explicitly selected this policy and prohibited downgrades caused
only by delayed webhooks, failed synchronization, or temporary provider unavailability.

**How to apply:** Reconcile against trusted current provider state; failures preserve
existing access and expose the unresolved work. Never delete customer data or
retroactively change completed transaction fees. Keep trials, gifts, intentional
test accounts and administrative access separate from payment/revenue status.
New fee calculations follow the effective plan: Free 7%, Basic 5%, Pro 3%.

Affiliate/referral qualification remains a separate decision: the old callback's
trial/activation versus invoice/renewal/proration eligibility is ambiguous.

**Why:** The owner prohibited invented commission/award rules and authorized
isolating unclear portions rather than fabricating awards.

**How to apply:** Preserve verified candidate activity and existing relationships;
do not pay or backfill commissions until qualifying activity and month counting
are explicitly approved.
