---
name: Settings notification-prefs type errors (pre-existing)
description: Known tsc errors in settings.tsx for notify* fields — not a regression, don't chase them
---

`client/src/pages/settings.tsx` has long-standing `npx tsc --noEmit` errors
around the notification preferences form: `notifyOnboarding`,
`notifyRetention`, `notifyAnnouncements` are sent in an update object whose
inferred type only allows `notifyNewLead` / `notifyQuoteViewed` /
`notifyQuoteAccepted`.

**Why:** the form posts more notify* fields than the update mutation's
parameter type lists, so TS flags TS2353. These columns DO exist on the baker
record (the session payload returns all of them), so it's a type-surface gap,
not missing data.

**How to apply:** if you run a typecheck and see these three errors, they are
pre-existing and unrelated to whatever you're doing. Only fix them if the task
is specifically about the notification settings form (widen the update
schema/param type to include the notify* fields). Otherwise ignore.
