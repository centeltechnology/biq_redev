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

## Phase 2: Onboarding Wizard (4 Steps)

**Route:** `/onboarding`
**Component:** `client/src/pages/onboarding.tsx`
**Access Control:** `ProtectedRoute` allows access to `/onboarding` even when `onboardingCompleted` is false. All other authenticated routes redirect back to `/onboarding` until setup is complete.

### Step 1 — Your Bakery (Branding)

**Purpose:** Collect basic business identity.

**Fields:**
- Business Name (pre-filled from signup)
- Custom URL Slug (for the public order page at `/c/:slug`)
- Profile Photo (uploaded to object storage)
- Header Image (uploaded to object storage)

**Behavior:**
- Slugs are validated in real-time via `GET /api/bakers/check-slug/:slug`
- Images are uploaded using the `useUpload` hook to Replit object storage
- Data is saved via `PATCH /api/bakers/me`
- User advances to Step 2 after saving

### Step 2 — Try a Quote (Education)

**Purpose:** Demonstrate the quoting workflow so the baker understands the core product loop.

**Behavior:**
1. User clicks "Create Demo Quote"
2. Server creates a sample customer (the baker themselves) and a draft quote with two pre-filled items (Two-Tier Birthday Cake and Custom Cake Topper)
3. User can send this demo quote to their own email to see the customer-facing experience
4. The "Continue" button is gated — the user must either send the test quote or click "Skip for now" before advancing

**API:**
- `POST /api/baker/demo-quote` — creates the demo customer + quote
- `POST /api/quotes/:id/send` — sends the quote email

**Demo Quote Detection:** Uses `baker.demoQuoteId` field. Demo quotes show modified copy:
- Email greeting: "Here's your custom quote preview" (instead of "Hi Test Customer")
- Demo note moved to subtle footer
- CTA reads "Review Your Custom Quote"
- Acceptance shows simulated success without processing real payment

### Step 3 — Share Your Link (Activation)

**Purpose:** Get the baker to share their public order page link.

**Behavior:**
- Displays the baker's unique public URL (`/c/:slug`)
- Provides a "Copy Link" button
- Completing this step marks `onboarding_completed = true` in the database and advances to Step 4

**API:** `POST /api/baker/onboarding-complete`

### Step 4 — Get Paid (Stripe Connect)

**Purpose:** Connect Stripe for automatic deposit collection.

**Behavior:**
- User can start the Stripe Connect onboarding flow, which redirects to Stripe's external onboarding pages (returns to `/settings` when complete)
- Alternatively, user can click "Go to Dashboard" to skip Stripe setup
- The wizard was already marked complete in Step 3 — this step is an optional add-on

**APIs:**
- `POST /api/stripe-connect/create-account` — creates the Stripe Connect account
- `POST /api/stripe-connect/onboarding-link` — generates the Stripe onboarding redirect URL

**Step tracking API:** `PATCH /api/baker/onboarding-step` (updates `onboardingStep` integer field throughout the wizard)

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
