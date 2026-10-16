---
name: Payment trust-boundary changes
description: Preserve unknown external subscription dependencies when securing payment endpoints.
---

Do not assume a subscription callback is unused merely because repository and installed-library searches find no caller. Verify external dependencies before removing it or inventing a replacement authentication scheme.

**Why:** The user explicitly required stopping the subscription-endpoint change if its actual caller or trust mechanism could not be established, rather than breaking legitimate billing synchronization.

**How to apply:** When continuing payment authentication work, establish the caller and authoritative subscription source first; report the security gate as blocked while an unauthorized update path remains.
