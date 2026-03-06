# BakerIQ — Onboarding Walkthrough

This document covers the complete onboarding experience from account creation through full activation, including the in-app wizard, post-onboarding checklist, milestone emails, and the 7-day email drip sequence.

---

## Phase 1: Account Creation

**Route:** `/signup`
**Component:** `client/src/pages/signup.tsx`

The user fills out:
- Business Name
- Email
- Password

On successful registration, the user is automatically redirected to `/onboarding`.

**API:** `POST /api/auth/register`
**Redirect:** `/onboarding`

---

## Phase 2: Onboarding Wizard (8 Steps)

**Route:** `/onboarding`
**Component:** `client/src/pages/onboarding.tsx`
**Access Control:** `ProtectedRoute` allows access to `/onboarding` even when `onboardingCompleted` is false. All other authenticated routes redirect back to `/onboarding` until setup is complete.

**UI Constraint:** Each step is designed to fit within one viewport height on desktop and mobile. Progress is shown as a minimal bar indicator (8 segments). CTA buttons are anchored at the bottom of each step via flexbox `mt-auto`.

### Step 1 — Products (Business Type)

**Purpose:** Determine what the baker sells to customize the rest of onboarding.

**Behavior:**
- Heading: "What do you sell most?"
- 3 tappable cards: Custom Cakes / Treats / Both (with icons)
- Saves `productMode` + sets `enableCakes`/`enableTreats` via `PATCH /api/bakers/me`

**Fields saved:** `product_mode`, `enable_cakes`, `enable_treats`

### Step 2 — Portfolio Upload

**Purpose:** Collect work samples for the baker's public order page.

**Behavior:**
- Dynamic heading based on `productMode` (cakes/treats/both)
- Upload grid (2×3) for up to 6 images
- Uses `useUpload` hook, stores URLs in `portfolio_images` array via `PATCH /api/bakers/me`
- "Skip for now" option when no images uploaded

### Step 3 — Pricing Style

**Purpose:** Select a pricing tier to auto-generate calculator config.

**Behavior:**
- Shows tier cards based on `productMode`:
  - Cakes: Simple ($5/serving) / Detailed ($6.50/serving) / Luxury ($8/serving)
  - Treats: Starter (cupcakes $30/doz) / Popular ($36/doz) / Premium ($48/doz)
  - Both: shows both sections
- On continue, calls `POST /api/baker/seed-pricing` which generates a full `CalculatorConfig` and saves it

**API:** `POST /api/baker/seed-pricing` — accepts `productMode`, `cakePricingTier`, `treatPricingTier`, generates config via `server/pricing-seed.ts`

**Fields saved:** `cake_pricing_tier`, `treat_pricing_tier`, `calculator_config`

### Step 4 — Preview (Quote Simulation)

**Purpose:** Show the baker what a customer quote looks like with their pricing.

**Behavior:**
- Auto-calculates an example order price based on `productMode` and selected tier
- Cakes: 24 servings, Detailed design → shows estimated price
- Treats: 1 dozen Chocolate Dipped Strawberries → shows estimated price
- Centered price card with explanation text
- No API calls — price calculated client-side from tier selection

### Step 5 — DM Activation

**Purpose:** Provide a ready-to-use reply for DM pricing requests.

**Behavior:**
- Asks "Do you get quote requests in your DMs?" with 3 options
- Shows a copyable reply message template containing the baker's order page link
- "Copy Message" button copies the template to clipboard

### Step 6 — Your Bakery (Branding)

**Purpose:** Collect business identity details.

**Fields:**
- Business Name (pre-filled from signup)
- Custom URL Slug (for the public order page at `/c/:slug`)
- Profile Photo (uploaded to object storage)
- Header Image (uploaded to object storage)

**Behavior:**
- Slugs validated in real-time via `GET /api/bakers/check-slug/:slug`
- Images uploaded using `useUpload` hook
- Data saved via `PATCH /api/bakers/me`

### Step 7 — Share Your Order Page (Activation)

**Purpose:** Get the baker to share their public order page link.

**Behavior:**
- Displays the baker's unique public URL (`/c/:slug`)
- Provides "Copy Link" and "Preview Your Order Page" buttons
- Tips for where to add: Instagram bio, Facebook page, pinned posts
- Completing this step marks `onboarding_completed = true`

**API:** `POST /api/baker/onboarding-complete`

### Step 8 — Get Paid (Stripe Connect)

**Purpose:** Connect Stripe for automatic deposit collection.

**Behavior:**
- User can start the Stripe Connect onboarding flow (redirects to Stripe's external onboarding)
- Alternatively, click "Go to Dashboard" to skip
- Wizard was already marked complete in Step 7 — this step is optional

**APIs:**
- `POST /api/stripe-connect/create-account`
- `POST /api/stripe-connect/onboarding-link`

**Step tracking API:** `PATCH /api/baker/onboarding-step` (updates `onboardingStep` integer, max 8)

---

## Phase 3: Post-Onboarding Dashboard

After completing the wizard, the baker lands on the main dashboard. Several activation mechanisms continue to guide them.

### Activation Checklist ("Launch Your Bakery")

**Component:** `client/src/components/onboarding-checklist.tsx`
**Location:** Top of the dashboard

The checklist tracks four tasks, each worth 25%:

| Task | How It's Checked | Weight |
|---|---|---|
| Add bakery branding | `businessName` exists | 25% |
| Send your first test quote | `baker.firstQuoteSentAt` is set | 25% |
| Share your order page | Tracked via `localStorage` when "Copy Link" is clicked | 25% |
| Activate secure payments | `baker.stripeConnectedAt` is set | 25% |

**Visibility rules:**
- Shows at top of dashboard until all 4 tasks are complete (100%)
- Can be manually dismissed by clicking the X button
- After onboarding wizard, minimum progress is 75% (branding, quote, and share are typically done)
- Stripe connection is the remaining 25%

### Dashboard Nudges

If onboarding is complete but certain actions haven't been taken, the dashboard shows contextual cards:

- **Stripe Nudge:** If `stripeConnectedAt` is null, a neutral "Secure Your Payouts" card appears (not a banner — just a dashboard card)
- **Pricing Review Reminder:** If `pricingReviewed` is false, an amber warning card reminds the baker to review their calculator pricing
- **Revenue Metrics Placeholder:** Monthly/Yearly Revenue stats are hidden and replaced with a placeholder message until both Stripe is connected (`stripeConnectedAt`) and the first quote has been sent (`firstQuoteSentAt`)

---

## Phase 4: Milestone Momentum Emails

Four event-triggered, one-time emails that celebrate key activation moments. Each is sent the first time the event occurs and never again (flags are set before sending to prevent duplicates). These are non-blocking (fire-and-forget).

**Implementation:** `sendMilestoneEmail()` in `server/email.ts`
**Flags:** Stored on the baker record (e.g., `milestone_pricing_live_sent`, `milestone_first_lead_sent`, etc.)

### Pricing Live

| Field | Value |
|---|---|
| **Trigger** | Baker reviews/saves their calculator pricing config |
| **Flag** | `milestone_pricing_live_sent` |
| **Subject** | Your order page is officially live 🎉 |
| **CTA** | Copy Your Order Page Link → `/share` |

**Body:**

> Hi {{businessName}},
>
> You did it.
>
> Your pricing is confirmed — which means your order page is ready to receive real requests.
>
> This is where most bakers hesitate. Don't.
>
> Add your link to your bio and start routing inquiries through it.

### First Lead

| Field | Value |
|---|---|
| **Trigger** | Baker receives their first inquiry from the public order page |
| **Flag** | `milestone_first_lead_sent` |
| **Subject** | You just got your first request 🚀 |
| **CTA** | View Request → `/leads` |

**Body:**

> Hi {{businessName}},
>
> That wasn't a test.
>
> Someone just used your order page to request a custom quote.
>
> This is the system working.
>
> Open the request, convert it to a quote, and keep the momentum going.

### First Quote

| Field | Value |
|---|---|
| **Trigger** | Baker sends their first quote to a customer |
| **Flag** | `milestone_first_quote_sent` |
| **Subject** | You just sent your first professional quote 💪 |
| **CTA** | Go to Quotes → `/quotes` |

**Body:**

> Hi {{businessName}},
>
> You just moved from pricing in DMs to running a structured system.
>
> Clean quote. Clear breakdown. Deposit option.
>
> This is how serious businesses operate.
>
> Keep routing inquiries through your order page.

### First Payment

| Field | Value |
|---|---|
| **Trigger** | First deposit or full payment is received via the platform |
| **Flag** | `milestone_first_payment_sent` |
| **Subject** | You just got paid through BakerIQ 💰 |
| **CTA** | View Dashboard → `/dashboard` |

**Body:**

> Hi {{businessName}},
>
> A deposit just landed.
>
> No chasing. No screenshots. No awkward follow-ups.
>
> This is what automated payments feel like.
>
> Keep using your order page — this is only the beginning.

---

## Phase 5: Onboarding Email Drip (Days 0–6)

A 7-day automated email sequence triggered by registration. The sequence is activation-first — payments are positioned as an upgrade, not a requirement. All emails use "order page" language (never "calculator").

**Implementation:**
- Template function: `getConditionalOnboardingTemplate()` in `server/email.ts`
- Sender function: `sendOnboardingEmail()` in `server/email.ts`
- Scheduler: `server/onboarding-scheduler.ts` (background process)
- Branching: Only Day 4 branches based on Stripe connection status

**Email template structure:**
- Header: Gradient background (#E91E63 to #F06292) with "BakerIQ" branding
- Greeting: "Hi {{businessName}},"
- CTA button: Pink (#E91E63), white text
- Footer: Managed by `getBakerEmailFooterHtml()`

---

### Day 0 — Welcome (Activation First)

| Field | Value |
|---|---|
| **Email Key** | `day0_welcome` |
| **Trigger** | Immediately after registration |
| **Subject** | Your order page is getting set up |
| **CTA** | Finish Setup → `/onboarding` |

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
> [Finish Setup]
>
> You'll see payments later — but first, let's get you live.

---

### Day 1 — Pricing Ownership

| Field | Value |
|---|---|
| **Email Key** | `day1_pricing` |
| **Trigger** | 1 day after registration |
| **Subject** | We set the foundation — you set the standard |
| **CTA** | Review Your Pricing → `/pricing` |

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
> [Review Your Pricing]
>
> Once pricing looks right, you're ready to launch your link.

---

### Day 2 — Launch Your Order Page

| Field | Value |
|---|---|
| **Email Key** | `day2_launch` |
| **Trigger** | 2 days after registration |
| **Subject** | Put this link in your bio today |
| **CTA** | Launch Your Order Page → `/share` |

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
> [Launch Your Order Page]

---

### Day 3 — Get Your First Request

| Field | Value |
|---|---|
| **Email Key** | `day3_first_request` |
| **Trigger** | 3 days after registration |
| **Subject** | Stop typing prices — route them here |
| **CTA** | Copy Your Order Page Link → `/share` |

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
> [Copy Your Order Page Link]

---

### Day 4 — Deposits as Upgrade (Stripe Branching)

Day 4 is the only email that branches based on Stripe connection status.

#### Variant A: Stripe Connected

| Field | Value |
|---|---|
| **Email Key** | `day4_stripe_connected` |
| **Trigger** | 4 days after registration, Stripe IS connected |
| **Subject** | You're ready to collect deposits automatically |
| **CTA** | Go to Quotes → `/quotes` |

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
> [Go to Quotes]
>
> This is the part where you stop chasing money in DMs.

#### Variant B: Stripe NOT Connected

| Field | Value |
|---|---|
| **Email Key** | `day4_stripe_not_connected` |
| **Trigger** | 4 days after registration, Stripe NOT connected |
| **Subject** | Want deposits to collect automatically? |
| **CTA** | Enable Automatic Deposits → `/settings` |

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
> [Enable Automatic Deposits]
>
> No rush — but once you're getting real requests, this saves time fast.

---

### Day 5 — Full Workflow Reinforcement

| Field | Value |
|---|---|
| **Email Key** | `day5_workflow` |
| **Trigger** | 5 days after registration |
| **Subject** | Here's the full BakerIQ flow (the simple version) |
| **CTA** | Go to Requests → `/leads` |

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
> [Go to Requests]

---

### Day 6 — Habit Formation

| Field | Value |
|---|---|
| **Email Key** | `day6_habit` |
| **Trigger** | 6 days after registration |
| **Subject** | The habit that makes this work |
| **CTA** | Copy Your Order Page Link → `/share` |

**Body:**

> Hi {{businessName}},
>
> BakerIQ works best when it becomes your default move:
>
> **Every pricing question → send the link.**
>
> Review pricing occasionally (only when ingredient costs change), but otherwise this is a set-and-forget system.
>
> [Copy Your Order Page Link]

---

## Email Summary Table

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

| Milestone | Subject | CTA Route | Trigger |
|---|---|---|---|
| Pricing Live | Your order page is officially live 🎉 | `/share` | Pricing config saved |
| First Lead | You just got your first request 🚀 | `/leads` | First inquiry received |
| First Quote | You just sent your first professional quote 💪 | `/quotes` | First quote sent |
| First Payment | You just got paid through BakerIQ 💰 | `/dashboard` | First payment received |

---

## Key Files Reference

| File | Purpose |
|---|---|
| `client/src/pages/signup.tsx` | Account creation form |
| `client/src/pages/onboarding.tsx` | 4-step onboarding wizard |
| `client/src/components/protected-route.tsx` | Route guard, redirects to onboarding if incomplete |
| `client/src/components/onboarding-checklist.tsx` | Dashboard activation checklist |
| `server/routes.ts` | API endpoints for onboarding steps, demo quote, completion |
| `server/email.ts` | Email templates (drip + milestones) |
| `server/onboarding-scheduler.ts` | Background scheduler for drip campaign |
| `shared/schema.ts` | Data model (`onboardingStep`, `onboardingCompleted`, milestone flags) |
| `docs/email_sequences_v2.md` | Detailed email sequence documentation |

---

## Data Model Fields (on `bakers` table)

| Field | Type | Purpose |
|---|---|---|
| `onboarding_step` | integer | Current wizard step (1-4) |
| `onboarding_completed` | boolean | Whether wizard is finished |
| `first_quote_sent_at` | timestamp | When first quote was sent |
| `stripe_connected_at` | timestamp | When Stripe was connected |
| `first_payment_processed_at` | timestamp | When first payment was received |
| `pricing_reviewed` | boolean | Whether pricing config was reviewed |
| `milestone_pricing_live_sent` | boolean | Flag: pricing live email sent |
| `milestone_first_lead_sent` | boolean | Flag: first lead email sent |
| `milestone_first_quote_sent` | boolean | Flag: first quote email sent |
| `milestone_first_payment_sent` | boolean | Flag: first payment email sent |
| `demo_quote_id` | text | Reference to the demo quote created in Step 2 |
