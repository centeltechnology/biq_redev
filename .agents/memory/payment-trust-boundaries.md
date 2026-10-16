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

Emergency containment must preserve every existing plan assignment, including the super-admin Pro account and the other unbilled Pro account, plus Free accounts, trial/gift settings, and affiliate/referral records.

**Why:** The user explicitly reserved investigation of the source of Pro access for later subscription reconciliation and accepted possible delays to an unidentified caller's entitlement and award updates.

**How to apply:** Do not treat missing billing identifiers as authorization to downgrade accounts. Prepare containment separately from unresolved Connect changes where possible; if bundled, stop until Connect configuration and valid delivery are verified. Publishing still requires explicit approval.
