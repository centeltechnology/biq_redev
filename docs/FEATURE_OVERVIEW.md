# BakerIQ — Feature Inventory & Overview

> Generated: February 21, 2026
> Purpose: Read-only analysis of the current product for planning navigation and onboarding rearrangement.

---

## 1. Product Summary

BakerIQ is a lead capture, quote management, and payment collection platform for custom cake and treat bakers.

**Core flow as implemented today:**

```
Order Page → Customer Request (Lead) → Baker Quote → Customer Payment
```

1. Baker sets up pricing and publishes a public order page (`/c/:slug`)
2. Customers visit the order page, configure their cake/treats, get an instant estimate, and submit a request
3. The request appears as a Lead in the baker's dashboard
4. Baker converts the lead into a professional quote and sends it to the customer
5. Customer views the quote (`/q/:id`), accepts, and pays a deposit or full amount via Stripe
6. Baker receives payment directly to their Stripe account (minus platform fee)

**The platform is optimized for:**
- Replacing DM-based pricing conversations with a structured, shareable order page
- Converting inquiries into professional quotes with one-click send
- Collecting deposits automatically through Stripe Connect
- Operating autonomously with minimal founder involvement after scale

---

## 2. Feature Map

### Core Business Features

| Feature | Route(s) | Nav Location | Plan Gate | Stripe Required? | Primary Outcome | Notes |
|---------|----------|-------------|-----------|-------------------|-----------------|-------|
| Dashboard | `/dashboard` | Sidebar #1 | All | N | Overview of leads, quotes, payments | Shows activation checklist for new users |
| Leads / Requests | `/leads`, `/leads/:id` | Sidebar #2 | All | N | View and manage incoming customer requests | Leads come from public order page submissions |
| Quotes | `/quotes`, `/quotes/new`, `/quotes/:id` | Sidebar #3 | Free: 15/mo (code enforced), Basic/Pro: unlimited | N (to create); Y (to collect payment) | Create, send, and track professional quotes | Note: support KB text says Free=5, code enforces 15. Includes duplicate, archive |
| Calendar | `/calendar` | Sidebar #4 | All | N | View orders/events on a calendar | Based on event dates from quotes/orders |
| Customers | `/customers` | Sidebar #5 | All | N | CRM — manage customer contacts | Auto-created from leads; supports archive |
| Pricing | `/pricing` | Sidebar #6 | All | N | Configure product pricing (sizes, flavors, add-ons) | Drives the public order page calculator |
| Price Calculator | `/pricing-calculator` | Sidebar #7 | All (featured items: Basic/Pro) | N | Manage saved pricing calculations; feature items on order page | "Fast Quote" / featured items gated to paid plans |
| Payments | `/payments` | Sidebar #8 | All | Y | View payment history and totals | Shows Stripe Connect payments received |
| Share & Promote | `/share` | Sidebar #9 | All | N | Share order page link, QR codes, social media tools | Facebook, Twitter/X, Instagram, Pinterest, WhatsApp, LinkedIn |
| Settings | `/settings` | Sidebar #10 | All | N | Profile, branding, business info, Stripe Connect, custom slug | Stripe Connect onboarding lives here |

### Referral & Growth Features

| Feature | Route(s) | Nav Location | Plan Gate | Stripe Required? | Primary Outcome | Notes |
|---------|----------|-------------|-----------|-------------------|-----------------|-------|
| Refer a Friend | `/refer` | Sidebar #11 (always visible) | All | N | Baker-to-baker referral with reward credits | Free plan: Quick Quote credits; Paid plan: free subscription months |
| Affiliate Program | `/referrals` | Sidebar #12 (affiliates only) | Affiliate-invited | N | Influencer commissions dashboard | Conditional: only visible if `isAffiliate=true` |
| Partners Page | `/partners` | Public (no nav) | Public | N | Affiliate application form | Public landing page for influencer sign-ups |

### Admin & Support Features

| Feature | Route(s) | Nav Location | Plan Gate | Stripe Required? | Primary Outcome | Notes |
|---------|----------|-------------|-----------|-------------------|-----------------|-------|
| Admin Panel | `/admin` | Sidebar (super_admin only) | super_admin | N | Manage bakers, analytics, emails, invitations, affiliates | Includes impersonation, account deletion, retention tools |
| Support | `/admin/support` | Sidebar (admin + super_admin) | admin, super_admin | N | View and respond to support tickets | AI-powered chat + ticket system |

### Public Pages (No Auth)

| Feature | Route(s) | Nav Location | Primary Outcome | Notes |
|---------|----------|-------------|-----------------|-------|
| Home / Landing | `/` | — | Marketing landing page | Entry point for new users |
| Help Center | `/help` | Footer / menu | Self-service FAQ and guides | — |
| FAQ | `/faq` | Footer / menu | Common questions | — |
| Login | `/login` | Header | User authentication | — |
| Sign Up | `/signup` | Header | New user registration | Supports invitation tokens and referral codes |
| Forgot Password | `/forgot-password` | Login page | Password reset request | — |
| Reset Password | `/reset-password` | Email link | Password reset completion | — |
| Verify Email | `/verify-email` | Email link | Email verification | — |
| Public Order Page | `/c/:slug` | External (shared link) | Customer-facing pricing calculator | The core public-facing product |
| Quote View | `/q/:id` | Email link | Customer views and accepts/pays a quote | Includes Stripe payment flow |
| Terms of Service | `/terms` | Footer | Legal | — |
| Privacy Policy | `/privacy` | Footer | Legal | — |
| Feedback Survey | `/feedback` | In-app prompt | User feedback collection | Grants survey trial (free Pro access) |
| Email Preferences | `/email-preferences/:token` | Email footer link | Manage email opt-outs | Token-based, no auth required |

### Onboarding

| Feature | Route(s) | Nav Location | Primary Outcome | Notes |
|---------|----------|-------------|-----------------|-------|
| Onboarding Wizard | `/onboarding` | Redirect after signup | 4-step setup: branding → demo quote → share link → Stripe | `allowDuringOnboarding` flag; Step 3 marks `onboarding_completed=true` |

---

## 3. Navigation Tree (Current Sidebar Order)

```
SIDEBAR
├── 1.  Dashboard          /dashboard        [Home icon]
├── 2.  Leads              /leads            [ClipboardList icon]
├── 3.  Quotes             /quotes           [FileText icon]
├── 4.  Calendar           /calendar         [CalendarDays icon]
├── 5.  Customers          /customers        [Users icon]
├── 6.  Pricing            /pricing          [DollarSign icon]
├── 7.  Price Calculator   /pricing-calculator [Calculator icon]
├── 8.  Payments           /payments         [CreditCard icon]
├── 9.  Share & Promote    /share            [Share2 icon]
├── 10. Settings           /settings         [Settings icon]
├── ──────────────────── (conditional items below)
├── 11. Refer a Friend     /refer            [Gift icon]        (always visible)
├── 12. Affiliate Program  /referrals        [Share2 icon]      (if isAffiliate)
├── 13. Support            /admin/support    [Ticket icon]      (if admin)
└── 14. Admin              /admin            [Shield icon]      (if super_admin)
        └── Support        /admin/support    [Ticket icon]      (also shown for super_admin)

FOOTER
└── Sign out
```

---

## 4. Module Details

### 4.1 Pricing / Order Page Configuration
- **What it does**: Bakers configure pricing for cake tiers (size, shape, flavor, frosting), decorations, add-ons, and delivery options. This data powers the public order page.
- **Primary goal**: Set up pricing once so customers get instant estimates.
- **UI location**: Sidebar → "Pricing" (`/pricing`) for config; "Price Calculator" (`/pricing-calculator`) for saved calculations.
- **Key screens**: Pricing editor, pricing calculation list, featured item management.
- **Tables**: `bakers` (calculatorConfig JSON), `pricing_calculations`.
- **Plan gating**: Featured items require Basic or Pro. Pricing config is free for all.
- **Dependencies**: None.
- **Status**: Working.

### 4.2 Public Order Page
- **What it does**: Customer-facing page where visitors configure their cake/treat, see an instant estimate, and submit a request.
- **Primary goal**: Replace DM-based pricing inquiries with a structured form.
- **UI location**: `/c/:slug` (public, no auth). Bakers share this link via social media, bio links, etc.
- **Key screens**: Multi-tier cake builder, treat selector, customer info form, estimate display.
- **Tables**: `leads`, `customers`.
- **Plan gating**: None (public page). Featured items on the page require baker to be on paid plan.
- **Dependencies**: Baker must have pricing configured.
- **Status**: Working.

### 4.3 Leads / Requests
- **What it does**: Incoming customer requests from the public order page. Each lead includes customer info, cake configuration, and estimated total.
- **Primary goal**: Capture and organize incoming inquiries.
- **UI location**: Sidebar → "Leads" (`/leads`), detail view (`/leads/:id`).
- **Key screens**: Lead list (with search/filter), lead detail, convert-to-quote action.
- **Tables**: `leads`, `customers`.
- **Plan gating**: Unlimited leads on all plans.
- **Dependencies**: Public order page must be shared.
- **Status**: Working.

### 4.4 Quotes
- **What it does**: Professional itemized quotes with line items, deposit options, and email delivery to customers.
- **Primary goal**: Convert leads into formal quotes that can collect payment.
- **UI location**: Sidebar → "Quotes" (`/quotes`), builder (`/quotes/new`, `/quotes/:id`), lead-to-quote (`/leads/:id/quote`).
- **Key screens**: Quote list, quote builder (with line items, tax, deposit %), send flow, duplicate, archive.
- **Tables**: `quotes`, `quote_items`.
- **Plan gating**: Free: 15 quotes/month. Basic/Pro: unlimited.
- **Dependencies**: Stripe Connect required for payment collection (not for creating/sending quotes).
- **Status**: Working.

### 4.5 Orders
- **What it does**: Tracks accepted/paid quotes as active orders with event dates and fulfillment status.
- **Primary goal**: Manage upcoming work.
- **UI location**: No dedicated nav item. Accessed via Calendar and Dashboard.
- **Key screens**: Order list, order detail, monthly stats.
- **Tables**: `orders`.
- **Plan gating**: All plans.
- **Dependencies**: Quotes must be accepted.
- **Status**: Working. Note: No dedicated "Orders" nav item — orders are accessed via Calendar.

### 4.6 Payments / Stripe Connect
- **What it does**: Stripe Connect integration for bakers to receive customer payments (deposits and full payments) directly to their bank accounts.
- **Primary goal**: Automate deposit and payment collection.
- **UI location**: Sidebar → "Payments" (`/payments`) for history. Stripe Connect setup in Settings (`/settings`).
- **Key screens**: Payment history list with totals, Stripe Connect onboarding, Stripe dashboard link.
- **Tables**: `quote_payments`.
- **Plan gating**: All plans can connect Stripe. Platform fee varies: Free 7%, Basic 5%, Pro 3%.
- **Dependencies**: Stripe Connect account required. Quote must be sent to customer.
- **Status**: Working.

### 4.7 Customers / CRM
- **What it does**: Contact management for customers. Auto-created when leads come in. Supports manual creation, editing, archiving.
- **Primary goal**: Track customer relationships.
- **UI location**: Sidebar → "Customers" (`/customers`).
- **Key screens**: Customer list with quote history, customer detail/edit, archive/unarchive.
- **Tables**: `customers`.
- **Plan gating**: All plans.
- **Dependencies**: None.
- **Status**: Working.

### 4.8 Share & Promote
- **What it does**: Tools to share the baker's order page link — social media sharing (Facebook, Twitter/X, Instagram, Pinterest, WhatsApp, LinkedIn), QR code generation, customizable caption templates, per-item sharing, dynamic Open Graph tags.
- **Primary goal**: Drive traffic to the order page.
- **UI location**: Sidebar → "Share & Promote" (`/share`).
- **Key screens**: Link copy, QR code download, social platform share buttons, caption editor, banner URL.
- **Tables**: `bakers` (socialBannerUrl, calculatorHeaderImage).
- **Plan gating**: All plans.
- **Dependencies**: Order page must exist (pricing configured).
- **Status**: Working.

### 4.9 Calendar
- **What it does**: Calendar view of upcoming orders based on event dates.
- **Primary goal**: Visual scheduling of upcoming work.
- **UI location**: Sidebar → "Calendar" (`/calendar`).
- **Key screens**: Monthly calendar with order cards.
- **Tables**: `orders`, `quotes`.
- **Plan gating**: All plans.
- **Dependencies**: Orders with event dates.
- **Status**: Working.

### 4.10 Settings
- **What it does**: Business profile, branding (logo, header image, colors), contact info, custom order page slug, Stripe Connect setup, deposit percentage, tax rate, email preferences, password change.
- **Primary goal**: Configure baker's account and business identity.
- **UI location**: Sidebar → "Settings" (`/settings`).
- **Key screens**: Profile form, branding section, Stripe Connect section, slug customization.
- **Tables**: `bakers`.
- **Plan gating**: Custom slug available on all plans.
- **Dependencies**: None.
- **Status**: Working.

### 4.11 Referral Program
- **What it does**: Baker-to-baker referral system with unique referral links (`/join/r/:code`). Rewards: paid plan bakers get free subscription months; free plan bakers get Quick Quote credits.
- **Primary goal**: Organic user acquisition through existing bakers.
- **UI location**: Sidebar → "Refer a Friend" (`/refer`).
- **Key screens**: Referral link, stats (referrals sent, converted), reward tracker.
- **Tables**: `baker_referrals`, `referral_clicks`.
- **Plan gating**: All plans (rewards differ by plan).
- **Dependencies**: None.
- **Status**: Working.

### 4.12 Affiliate Program
- **What it does**: Admin-invited influencer tier with customizable pretty links (`/join/:slug`), 45-day cookie tracking, configurable commission rates (default 20% for 3 months), and admin payout management.
- **Primary goal**: Paid acquisition through influencer partnerships.
- **UI location**: Sidebar → "Affiliate Program" (`/referrals`) — only visible to affiliates. Public application at `/partners`.
- **Key screens**: Affiliate dashboard (stats, commissions, slug editor), admin affiliate management.
- **Tables**: `affiliate_commissions`, `affiliate_requests`.
- **Plan gating**: Affiliate-only (admin-invited).
- **Dependencies**: Admin approval.
- **Status**: Working.

### 4.13 Admin Panel
- **What it does**: Super admin tools for managing all bakers, viewing analytics, sending emails, managing invitations, retention campaigns, affiliate management, survey responses, support tickets.
- **Primary goal**: Platform operations and user management.
- **UI location**: Sidebar → "Admin" (`/admin`) — super_admin only.
- **Key screens**: Baker list, baker detail/edit, analytics dashboard, email manager (CRUD + send), invitation system, retention email management, affiliate management, onboarding stats, audit logs.
- **Tables**: `admin_audit_logs`, `invitations`, `admin_emails`, `retention_email_templates`, `retention_email_sends`, `survey_responses`.
- **Plan gating**: super_admin role only.
- **Dependencies**: None.
- **Status**: Working.

### 4.14 Support System
- **What it does**: AI-powered support chat + ticket system. Users submit questions and get AI responses. Tickets escalate to admin for review and manual replies.
- **Primary goal**: Self-service support with escalation path.
- **UI location**: Floating chat icon (bottom-right), Sidebar → "Support" for admin/super_admin.
- **Key screens**: Chat widget, ticket list (admin), ticket detail with baker context.
- **Tables**: `support_tickets`, `ticket_messages`.
- **Plan gating**: All plans.
- **Dependencies**: OpenAI for AI responses.
- **Status**: Working.

### 4.15 Subscription / Billing
- **What it does**: Stripe-based subscription management for Free, Basic ($4.99/mo), and Pro ($9.99/mo) plans. Handles checkout, portal access, webhook-driven status updates.
- **Primary goal**: Monetize the platform through tiered plans.
- **UI location**: Settings page (plan display), upgrade prompts in various locations.
- **Key screens**: Stripe Checkout (external), Stripe Customer Portal (external), plan badges in UI.
- **Tables**: `bakers` (plan, stripeCustomerId, stripeSubscriptionId).
- **Plan gating**: N/A (this IS the gating mechanism).
- **Dependencies**: Stripe.
- **Status**: Working.

### 4.16 Email System
- **What it does**: Comprehensive email system covering: registration welcome, onboarding drip (7-day), transactional (lead notifications, quote sent, payment received), milestone celebrations (4 events), retention (weekly segments), admin broadcast emails.
- **Primary goal**: User activation, engagement, and transactional notifications.
- **UI location**: No user-facing UI (backend-driven). Admin Email Manager in Admin panel.
- **Key screens**: Admin email CRUD, preview, audience targeting, send.
- **Tables**: `baker_onboarding_emails`, `onboarding_email_sends`, `retention_email_templates`, `retention_email_sends`, `admin_emails`.
- **Dependencies**: AWS SES.
- **Status**: Working.

---

## 5. Onboarding Alignment

### Current Onboarding Steps (4-step wizard at `/onboarding`)

| Step | Screen Goal | Aligned Feature | Route Used |
|------|------------|-----------------|------------|
| 1. Branding | Set business name, logo, colors | Settings | `/onboarding` (inline) |
| 2. Demo Quote | Experience sending a quote | Quotes | `/onboarding` (inline) |
| 3. Share Link | Copy/share order page link | Share & Promote | `/onboarding` (inline) |
| 4. Stripe Connect | Connect Stripe (skippable) | Payments / Settings | `/onboarding` (inline) |

### Post-Onboarding Activation Checklist (Dashboard)

| Checklist Item | Feature Module | Checked When |
|---------------|---------------|--------------|
| Set up branding | Settings | businessName + logo set |
| Create demo quote | Quotes | demoQuoteId exists |
| Share Your Order Page | Share & Promote | Link copied/shared |
| Connect Stripe | Payments | stripeConnectedAt set |

### Onboarding Email Drip (Days 0–6) Alignment

| Day | Email Focus | Target Feature | CTA Route |
|-----|-----------|---------------|-----------|
| 0 | Welcome / finish setup | Onboarding | `/onboarding` |
| 1 | Review pricing | Pricing | `/pricing` |
| 2 | Share your link | Share & Promote | `/share` |
| 3 | Get first request | Share & Promote | `/share` |
| 4 | Stripe (branched) | Payments / Settings | `/quotes` or `/settings` |
| 5 | Full workflow | Leads | `/leads` |
| 6 | Build the habit | Share & Promote | `/share` |

### Milestone Emails Alignment

| Milestone | Trigger | Target Feature |
|-----------|---------|---------------|
| Pricing Live | `pricingReviewed = true` | Pricing |
| First Lead | First lead created | Leads |
| First Quote Sent | First quote sent | Quotes |
| First Payment | First Stripe payment | Payments |

### Gaps / Misalignment

1. **Pricing is step 1 in emails (Day 1) but not in the onboarding wizard** — the wizard focuses on branding first, then demo quote. Pricing review happens later via email nudge.
2. **"Price Calculator" nav item is separate from "Pricing"** — two nav items for related pricing functions may confuse new users. "Pricing" = configure base prices; "Price Calculator" = saved calculations / featured items.
3. **Orders have no nav entry** — accepted/paid quotes become orders, but there's no "Orders" sidebar link. Users find orders through Calendar or Dashboard.
4. **Payments nav item requires Stripe** — if a baker hasn't connected Stripe, the Payments page is empty. No gating or guidance shown.
5. **Share & Promote is positioned at #9** — given that sharing the order page is the most critical activation action, it's buried below Calendar, Customers, and two pricing items.

---

## 6. Recommendations (No Code Changes)

### Navigation Reorganization

**Proposed grouping: Core Flow → Business Tools → Growth → Settings**

```
CORE FLOW (the money path)
  1. Dashboard
  2. Leads (rename to "Requests" for consistency with email language)
  3. Quotes
  4. Payments

BUSINESS TOOLS
  5. Pricing (merge "Price Calculator" into this as a tab or section)
  6. Customers
  7. Calendar
  8. Orders (add as dedicated nav item)

GROWTH
  9. Share & Promote (consider renaming to "Your Order Page")
  10. Refer a Friend

ACCOUNT
  11. Settings
```

### Surfacing Priorities

- **Share & Promote should be more prominent** — it's the primary activation lever. Consider moving it higher or making it a persistent element (e.g., banner, dashboard card).
- **Merge Pricing + Price Calculator** — having two separate nav items for pricing creates confusion. The "Price Calculator" (saved calculations, featured items) could be a tab within the Pricing page.
- **Add an Orders nav item** — orders are a natural step in the flow (after quote is accepted) and currently have no dedicated entry point.
- **Leads → "Requests"** — the onboarding emails and public-facing copy already use "requests" language. The nav label should match.
- **Consider gating or empty-state guidance on Payments** — if Stripe isn't connected, show a clear "Connect Stripe to see payments" state rather than an empty page.
- **Referral and Affiliate items** — keep as secondary/footer items since they don't serve the core flow.

### Onboarding Alignment Suggestions

- Consider adding a pricing review step to the onboarding wizard (between branding and demo quote) to match the email sequence.
- The "Share Your Order Page" step in onboarding could be more prominent — it's the single most important action for activation.
- Post-onboarding activation checklist could include "Get your first request" and "Send your first real quote" to extend momentum.

---

## 7. Validation Summary

| Metric | Count |
|--------|-------|
| Total client routes (excluding catch-all) | 33 |
| Protected routes (auth required) | 19 |
| Public routes (no auth) | 15 (includes `/c/:slug`, `/q/:id`, `/email-preferences/:token`) |
| Routes with admin/super_admin gating | 2 (`/admin`, `/admin/support`) |
| Sidebar nav items (core, always visible) | 10 |
| Sidebar nav items (conditional) | 4 (Refer a Friend, Affiliate Program, Support x2) |
| API endpoints (approximate) | ~115 |
| Database tables | 25 |
| Dead/missing links detected | 0 |
| Features in code but not in nav | Orders (exists as API + Calendar integration, no dedicated nav item) |
| Nav items with no matching feature | None |
| Known data discrepancy | Support KB says Free=5 quotes/mo; code enforces `FREE_QUOTE_LIMIT=15` |
