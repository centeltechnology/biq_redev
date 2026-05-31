---
name: Dashboard header horizontal overflow on mobile
description: Why authenticated list pages scrolled sideways on phones — the shared header, not page content.
---

# Dashboard header was the source of mobile sideways scroll

Authenticated pages render inside `DashboardLayout` (`client/src/components/dashboard-layout.tsx`),
whose sticky `<header>` is a single `justify-between` flex row: left = sidebar trigger + page title,
right = plan badge + page `actions` + notification bell + theme toggle.

At ~375px the right group cannot shrink (badge + a `whitespace-nowrap` action button + toggle), and the
title had no `truncate`, so the header's min-content width exceeded the viewport and pushed the theme
toggle ~14px off-screen → document-level horizontal overflow on every dashboard page (quotes/leads/
customers/payments), independent of the page's own card vs. table layout.

**Why:** flex min-content can't go below the intrinsic width of non-shrinkable children, so the whole
row overflows rather than compressing.

**How to apply:** keep the left title group `min-w-0` + title `truncate`, and the right group
`shrink-0`. If you add more header controls (new badges/buttons) re-check at 375px — the right group is
the constraint. When testing "no sideways scroll," compare `scrollWidth` to `clientWidth` (not
`innerWidth`) so the vertical-scrollbar gutter doesn't cause a false positive.
