# BakerIQ – Onboarding Email Drip v2

> Generated: February 2026
> Purpose: Updated onboarding email sequence (Days 0–6) aligned with the activation-first product flow.
> Flow: Setup → Pricing Ownership → Launch Order Page → Get Requests → Convert to Quote → Payments as Upgrade.

---

## Discovered Routes

| Route Purpose | Path | Notes |
|---|---|---|
| Onboarding wizard | `/onboarding` | 4-step activation wizard |
| Pricing settings | `/pricing` | Baker's pricing configuration page |
| Share & Promote | `/share` | Order page link sharing, QR code, social tools |
| Quotes list | `/quotes` | Quote management workspace |
| Leads / Requests | `/leads` | Where customer requests land |
| Payments / Stripe | `/settings` | Stripe Connect setup lives in Settings |

All CTA URLs are constructed as `${baseUrl}${ctaUrl}` where `baseUrl` is resolved at send-time from environment (production domain or dev domain).

## Template System

- **Location:** `server/email.ts` → `getConditionalOnboardingTemplate()`
- **Sender function:** `sendOnboardingEmail()`
- **Variables:** `businessName` (baker's business name), `baseUrl` (resolved at runtime)
- **Branching:** Day 4 branches on `stripeConnected` boolean (Stripe connected vs. not connected)
- **Previous branching:** Days 3 and 6 previously also branched on Stripe status — v2 removes those branches (single version for Days 0, 1, 2, 3, 5, 6; branched only on Day 4)

## Assumptions

- "Calculator" language removed from all customer-facing onboarding emails, replaced with "order page."
- Day 4 retains Stripe branching (two variants) since the system supports it.
- Days 3 and 6 no longer branch on Stripe — single version per day.
- No transactional emails were modified.
- No Stripe/payment logic, quote logic, or onboarding UI logic was changed.

---

## Day 0 — Welcome (Activation First)

| Field | Value |
|---|---|
| **Email Key** | `day0_welcome` |
| **Trigger** | Immediately after registration (day 0) |
| **Recipient** | Baker |
| **Subject** | `Your order page is getting set up` |
| **CTA** | Finish Setup → `/onboarding` |
| **Status** | Active |

**Body:**

> Hi {{businessName}},
>
> Welcome to BakerIQ — this is your new system for turning DM inquiries into professional quotes (without the back-and-forth).
>
> Here's the move: finish setup and launch your order page.
>
> In a few minutes you'll have:
> - A public order page customers can use for instant estimates
> - A clean request that hits your dashboard (no messy DMs)
> - A professional quote you can send in one click
>
> Start here:
> [Finish Setup] → /onboarding
>
> You'll see payments later — but first, let's get you live.

---

## Day 1 — Pricing Ownership

| Field | Value |
|---|---|
| **Email Key** | `day1_pricing` |
| **Trigger** | 1 day after registration |
| **Recipient** | Baker |
| **Subject** | `We set the foundation — you set the standard` |
| **CTA** | Review Your Pricing → `/pricing` |
| **Status** | Active |

**Body:**

> Hi {{businessName}},
>
> Your order page comes with pricing and offerings preloaded as a starting point.
>
> Now make it yours. Take 3 minutes to review:
> - Sizes & tiers
> - Flavors & frosting options
> - Decorations + add-ons
>
> [Review Your Pricing] → /pricing
>
> Once pricing looks right, you're ready to launch your link.

---

## Day 2 — Launch Your Order Page

| Field | Value |
|---|---|
| **Email Key** | `day2_launch` |
| **Trigger** | 2 days after registration |
| **Recipient** | Baker |
| **Subject** | `Put this link in your bio today` |
| **CTA** | Launch Your Order Page → `/share` |
| **Status** | Active |

**Body:**

> Hi {{businessName}},
>
> Your order page is the whole game.
>
> When someone asks "how much?" you don't explain pricing — you send the link.
>
> Best places to add it:
> - Instagram bio
> - Facebook pinned post
> - Link-in-bio tools
> - DM auto-replies
>
> [Launch Your Order Page] → /share

---

## Day 3 — Get Your First Request

| Field | Value |
|---|---|
| **Email Key** | `day3_first_request` |
| **Trigger** | 3 days after registration |
| **Recipient** | Baker |
| **Subject** | `Stop typing prices — route them here` |
| **CTA** | Copy Your Order Page Link → `/share` |
| **Status** | Active |

**Body:**

> Hi {{businessName}},
>
> Today's goal is simple: get ONE real inquiry through your order page.
>
> Next time someone messages you:
> 1. Reply with your link
> 2. Let them build their request + get an estimate
> 3. You receive the full details (no guessing)
>
> [Copy Your Order Page Link] → /share

---

## Day 4 — Deposits as Upgrade (Stripe)

### Variant A: Stripe Connected

| Field | Value |
|---|---|
| **Email Key** | `day4_stripe_connected` |
| **Trigger** | 4 days after registration, Stripe IS connected |
| **Recipient** | Baker |
| **Subject** | `You're ready to collect deposits automatically` |
| **CTA** | Go to Quotes → `/quotes` |
| **Status** | Active |

**Body:**

> Hi {{businessName}},
>
> You're connected — that means when a customer accepts your quote, the deposit can be collected automatically.
>
> Next time a request comes in:
> - Open the request
> - Convert to a quote
> - Send the quote with a deposit option
>
> [Go to Quotes] → /quotes
>
> This is the part where you stop chasing money in DMs.

### Variant B: Stripe NOT Connected

| Field | Value |
|---|---|
| **Email Key** | `day4_stripe_not_connected` |
| **Trigger** | 4 days after registration, Stripe NOT connected |
| **Recipient** | Baker |
| **Subject** | `Want deposits to collect automatically?` |
| **CTA** | Enable Automatic Deposits → `/settings` |
| **Status** | Active |

**Body:**

> Hi {{businessName}},
>
> You can run BakerIQ without payments… but the upgrade is automatic deposits.
>
> When payments are enabled:
> - Customers can accept quotes and pay deposits online
> - No awkward follow-ups
> - No "did you send it?" messages
>
> [Enable Automatic Deposits] → /settings
>
> No rush — but once you're getting real requests, this saves time fast.

---

## Day 5 — Full Workflow Reinforcement

| Field | Value |
|---|---|
| **Email Key** | `day5_workflow` |
| **Trigger** | 5 days after registration |
| **Recipient** | Baker |
| **Subject** | `Here's the full BakerIQ flow (the simple version)` |
| **CTA** | Go to Requests → `/leads` |
| **Status** | Active |

**Body:**

> Hi {{businessName}},
>
> Here's the clean workflow:
> 1. Customer uses your order page
> 2. You receive a detailed request
> 3. You convert it into a quote
> 4. Customer accepts (and pays deposit if enabled)
>
> If you're still pricing in DMs, you're working too hard.
>
> [Go to Requests] → /leads

---

## Day 6 — Habit Formation

| Field | Value |
|---|---|
| **Email Key** | `day6_habit` |
| **Trigger** | 6 days after registration |
| **Recipient** | Baker |
| **Subject** | `The habit that makes this work` |
| **CTA** | Copy Your Order Page Link → `/share` |
| **Status** | Active |

**Body:**

> Hi {{businessName}},
>
> BakerIQ works best when it becomes your default move:
>
> Every pricing question → send the link.
>
> Review pricing occasionally (only when ingredient costs change), but otherwise this is a set-and-forget system.
>
> [Copy Your Order Page Link] → /share

---

## Summary Table

| Day | Email Key | Subject | CTA Route | Branched? |
|---|---|---|---|---|
| 0 | `day0_welcome` | Your order page is getting set up | `/onboarding` | No |
| 1 | `day1_pricing` | We set the foundation — you set the standard | `/pricing` | No |
| 2 | `day2_launch` | Put this link in your bio today | `/share` | No |
| 3 | `day3_first_request` | Stop typing prices — route them here | `/share` | No |
| 4a | `day4_stripe_connected` | You're ready to collect deposits automatically | `/quotes` | Yes (Stripe connected) |
| 4b | `day4_stripe_not_connected` | Want deposits to collect automatically? | `/settings` | Yes (Stripe not connected) |
| 5 | `day5_workflow` | Here's the full BakerIQ flow (the simple version) | `/leads` | No |
| 6 | `day6_habit` | The habit that makes this work | `/share` | No |

---

## Changes from v1

| Aspect | v1 | v2 |
|---|---|---|
| Day 0 subject | "You just upgraded how you get paid." | "Your order page is getting set up" |
| Day 0 focus | Stripe-first | Activation-first (finish setup) |
| Day 1 focus | Set up pricing from scratch | Review/own preloaded pricing |
| Day 2 focus | Quotes (send your first quote) | Launch order page (share your link) |
| Day 3 focus | Stripe push (connect or congrats) | Get first real request through link |
| Day 4 focus | Deposit mechanics / Stripe reminder | Deposits as optional upgrade |
| Day 5 focus | Full workflow (Stripe-centric) | Full workflow (order-page-centric) |
| Day 6 focus | Habit or final Stripe push | Habit formation (set-and-forget) |
| Stripe branching | Days 3, 4, 6 branched | Only Day 4 branches |
| Language | "calculator" references throughout | "order page" consistently |
| Tone | Payment-forward | Activation-forward |
