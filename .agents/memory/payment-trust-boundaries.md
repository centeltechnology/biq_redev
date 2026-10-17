---
name: Payment trust-boundary changes
description: Preserve unknown external subscription dependencies when securing payment endpoints.
---

Do not assume a subscription callback is unused merely because repository and installed-library searches find no caller. Verify external dependencies before removing it or inventing a replacement authentication scheme.

**Why:** The user explicitly required stopping the subscription-endpoint change if its actual caller or trust mechanism could not be established, rather than breaking legitimate billing synchronization.

**How to apply:** When continuing payment authentication work, establish the caller and authoritative subscription source first. Do not equate containment with verified end-to-end billing synchronization.

The user approved implementing and testing fail-closed containment of the unsupported subscription callback, explicitly without publishing.

**Why:** Blocking unauthorized updates was preferred despite the disclosed risk of interrupting an unknown caller's plan, referral, and commission synchronization.

**How to apply:** Do not restore the body-driven callback to resolve sync issues. Establish a verified synchronization path and obtain separate publishing approval.

Emergency containment must preserve every existing plan assignment, including the super-admin Pro account and the other unbilled Pro account, plus Free accounts, trial/gift settings, and affiliate/referral records. The owner confirmed both unbilled Pro accounts are intentional test accounts: preserve their access and exclude them from paying-subscriber and subscription-revenue counts.

**Why:** The owner confirmed the test-access purpose and prohibited automatic downgrades or historical entitlement rewrites without an approved migration plan.

**How to apply:** Do not treat missing billing identifiers as authorization to downgrade accounts. Prepare containment separately from unresolved Connect changes where possible; if bundled, stop until Connect configuration and valid delivery are verified. Publishing still requires explicit approval.

Treat production read-only SQL observations as replica-scoped, not proof of
the primary migration writer's execution safeguards.

**Why:** The production inspection connection reports recovery/replica mode while
also reporting schema CREATE, baker ownership, and unbounded connection timeouts.
Those apparent privileges/settings do not establish the Publish writer's role,
primary lock availability, or migration timeout/cancellation guarantees.

**How to apply:** Label permission, lock, and timeout evidence by connection scope;
require separate primary/platform execution evidence before approving a release.

Publishing diagnostics or security changes is not authorization to activate
subscription synchronization.

**Why:** The owner treats interface/readiness work and operational activation as
separate approvals and prohibits automatic activation or production account changes.

**How to apply:** Keep activation approval separate from release approval. Confirm
actual provider-signed delivery evidence, reliable scheduling and a monitored
rollout before requesting activation; never enable sync as an admin-page side effect.
