---
name: Web Push notifications
description: How push alerts are wired in BakerIQ and the gotchas around VAPID, iOS, and the dev service worker.
---

# Web Push in BakerIQ

Bakers can opt into device push alerts for three events: new lead, quote accepted, payment received.

- **Opt-in model**: push is off until a device subscribes (Settings → Device Push Notifications). The per-device browser subscription IS the gate; there is no DB "push enabled" flag.
- **Toggle gating**: new-lead push respects `notifyNewLead`, quote-accepted push respects `notifyQuoteAccepted`. There is NO payment-specific notify toggle, so payment push is sent unconditionally (device opt-in is the only gate).
- **VAPID keys** live in env vars `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`. Never print the private key. `server/push.ts` guards on their presence — feature silently no-ops if unset.

**Why these decisions:** user wanted it optional and respecting existing toggles; payment is critical money info with no existing toggle.

## Gotchas
- **iOS** only delivers Web Push when the PWA is installed to the home screen (standalone). `needsIOSInstall()` shows an install hint instead of a toggle until then.
- **Dev service worker cache must stay narrow.** SW is registered in ALL envs (for testability). The fetch cache-first handler must match ONLY `/assets/*` (prod hashed build output) + an explicit root-icon allowlist — never match by file extension, or Vite dev source modules (`/src/index.css`, `/@vite/*`) get cached and HMR breaks.
- **Unsubscribe must be ownership-scoped**: delete by `(endpoint, bakerId)` not endpoint alone, or one baker can delete another's subscription. `notificationclick` in sw.js only navigates same-origin URLs.
- **drizzle-kit push is interactive** and can't be answered via piped stdin in this env; for a brand-new table just create it with raw SQL matching the schema. Beware unrelated pending drift (e.g. a bakers unique-constraint) showing up in the push prompt.
- **NEVER put sensitive values through `setEnvVars`** — it writes them into `.replit`, which is git-tracked, leaking the secret. `setEnvVars` is only for non-sensitive config (the VAPID *public* key + subject are fine there). Sensitive values (VAPID_PRIVATE_KEY) must go to the secret store via `requestEnvVar({requestType:"secret"})`; the agent cannot set secrets directly. **Why:** code review hard-rejects a private key committed to `.replit`; remediation = rotate the key + move private half to secrets.
