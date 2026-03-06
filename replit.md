# BakerIQ

## Overview

BakerIQ is a comprehensive lead capture and quote management platform designed for custom cake bakers. Its primary purpose is to streamline the business operations of bakers by providing tools for public pricing calculation, automated lead generation, customer relationship management, and detailed quote creation. The platform also integrates with Stripe Connect to facilitate direct customer payments for quotes, incorporating a tiered platform fee structure based on subscription plans. Key capabilities include configurable pricing for various cake and treat items, and efficient lead-to-quote conversion. The business vision is to empower bakers with professional tools to manage their orders, attract new clients, and grow their businesses efficiently.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite)
- **Routing**: Wouter
- **State Management**: TanStack React Query for server state, local React for UI
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables (light/dark mode)
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **API Pattern**: RESTful JSON API (`/api/*`)
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Cookie-based sessions, bcrypt password hashing

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Defined in `shared/schema.ts` with Zod validators
- **Migrations**: Drizzle Kit

### Key Data Models
- **Bakers**: Business accounts
- **Customers**: Contacts associated with bakers
- **Leads**: Inquiries from public calculators
- **Quotes**: Formal price quotes with line items

### Core Features & Design
- **Calculator Categories**: Supports multi-tier cake builder and standalone treat items.
- **Role-Based Admin Access**: `baker`, `admin`, `super_admin` roles with specific middleware for access control to routes and UI. Includes audit logging for critical actions and a baker context endpoint for support.
- **Social Media Sharing**: `/share` page ("Your Order Page") with integrated tools for Facebook, Twitter/X, Instagram, Pinterest, WhatsApp, LinkedIn. Features customizable caption templates, per-item sharing, QR code generation, dynamic Open Graph tags, custom URL editor (SlugEditor), and header image upload. "Launch Your Landing Page" card centralizes all order page customization.
- **Subscription Model**: Processing-first tiered plans (Free, Basic, Pro). All plans have unlimited quotes. Express Items limited by plan (Free=1, Basic=5, Pro=unlimited). Platform fees: Free=7%, Basic=5%, Pro=3%. Managed via Stripe.
- **Shared Types**: Centralized schema definitions (`shared/`) for client and server.
- **Storage Interface**: Abstracted database operations via `server/storage.ts`.
- **Path Aliases**: `@/` for client, `@shared/` for shared code.
- **Component Structure**: `components/ui/` for primitives, feature components at root. `MockPaymentsDashboard` in `components/` is a purely presentational marketing component used on the homepage hero — no API calls, hardcoded demo data only.
- **Homepage Structure**: 5-section marketing page (Hero with mock dashboard, Workflow, What Makes It Different, Pricing Model Clarity, FAQ). Hero uses two-column layout with `MockPaymentsDashboard` on right showing activated Stripe state. All copy is positioning-focused ("structured financial operating system").
- **Consolidated Financial Controls**: `/payments` is the single financial control center. Contains Stripe activation card (when disconnected), Deposit Settings form, Currency & Region selector, revenue stats (dimmed when Stripe not connected), and payment history. No global Stripe banner — replaced with a dashboard-only neutral card for unconnected bakers. Stripe connection CTA triggers onboarding flow directly from /payments.
- **Activation-First Onboarding**: New users are redirected to a 7-step `/onboarding` wizard before accessing the dashboard. Steps: (1) Product mode selection (cakes/treats/both), (2) Bakery details (business name, slug, photos), (3) Portfolio upload (up to 6 images, dynamic copy by product mode), (4) Pricing tier selection with auto-seeded calculator config via `POST /api/baker/seed-pricing` and `server/pricing-seed.ts`, (5) Quote simulation preview, (6) DM activation + share link merged step with dynamic helper copy (marks `onboarding_completed=true`), (7) Optional Stripe Connect. Each step fits one viewport height. `ProtectedRoute` has `allowDuringOnboarding` flag. Post-onboarding: "Launch Your Bakery" activation checklist on dashboard.
- **Product Mode & Category Toggles**: Bakers select a `product_mode` (cakes/treats/both) during onboarding. `enable_cakes` and `enable_treats` boolean fields control which sections appear on the `/pricing` config page (toggle switches at top) and the public `/c/:slug` order page. Category labels: "Build a Custom Cake" for cakes, "Treat Menu" for treats, "Popular Orders" for quick order section.
- **Pricing Seed System**: `server/pricing-seed.ts` generates `CalculatorConfig` from `productMode` + tier selections. Cake tiers: Simple (1x), Detailed (1.44x), Luxury (1.78x) multiplied against default `CAKE_SIZES` prices. Treat tiers: Starter (0.83x), Popular (1x), Premium (1.33x) multiplied against default `TREATS` prices. Shapes, flavors, frostings, decorations, delivery included with all items enabled.
- **Demo Quote Flow**: Demo quotes use `baker.demoQuoteId` for detection. Email greeting uses "Here's your custom quote preview" instead of "Hi Test Customer". Demo note moved to subtle footer. CTA reads "Review Your Custom Quote". External quote page shows "Ready to lock in your date?" and "Accept & Pay Deposit". Demo quote acceptance shows simulated success without processing payment.
- **Super Admin Account Deletion**: Super admins can delete baker accounts via Admin panel with cascade deletion across all related tables (customers, leads, quotes, orders, payments, etc.) and audit logging via `ACCOUNT_DELETED` action.
- **Admin Invitation System**: Super admins can invite new bakers with optional gifted plans (Basic/Pro for 1-12 months). Gifted plans prioritize over free tier but not active subscriptions. Invitation tokens expire after 7 days, and audit logging tracks actions.
- **Onboarding Email Drip v2**: 7-day activation-first sequence (Days 0-6). Stripe branching only on Day 4. Email keys: `day0_welcome`, `day1_pricing`, `day2_launch`, `day3_first_request`, `day4_stripe_connected`/`day4_stripe_not_connected`, `day5_workflow`, `day6_habit`. No "calculator" language in onboarding emails; uses "order page" instead. Documented in `docs/email_sequences_v2.md`.
- **Milestone Momentum Emails**: 4 event-triggered one-time emails celebrating key user actions: pricing confirmed (`milestone_pricing_live_sent`), first lead received (`milestone_first_lead_sent`), first quote sent (`milestone_first_quote_sent`), first payment received (`milestone_first_payment_sent`). Uses `sendMilestoneEmail()` in `server/email.ts`. Flags set before email send to prevent duplicates. Non-blocking (fire-and-forget).
- **Retention Email System**: Weekly activation and engagement emails triggered by user activity. Users are segmented into `new_but_inactive`, `configured_not_shared`, `leads_no_quotes`, `quotes_no_orders`, `active_power_user`, and `at_risk` categories. Email templates are segment-specific and use personalization tokens.
- **Admin Email Manager**: Full CRUD system for creating, saving as drafts, editing, previewing, and sending personalized emails to targeted baker audiences. Supports personalization tokens (`{{Baker Name}}`, `{{Business Name}}`, `{{Calculator Link}}`, `{{Email}}`, `{{Plan}}`, `{{Referral Link}}`). Audience targeting by plan (Free/Basic/Pro) and Stripe connection status. Stored in `admin_emails` table. Replaces old hardcoded announcement email with dynamic system.
- **Two-Tier Referral System**:
    - **Baker Referral Program**: All bakers receive a unique referral link (`/join/r/:code`). Rewards include free subscription months for paid plan bakers and Quick Quote access for free plan bakers.
    - **Affiliate Program**: Admin-invited influencer tier with customizable pretty links (`/join/:slug`). Features 45-day cookie tracking, configurable commission rates (e.g., 20% for 3 months), and an admin dashboard for payout management. Public `/partners` page for application.

- **Internal Analytics System**: Two distinct analytics surfaces for super admins:
    - **Business Analytics** (admin panel "Business" tab): Activation funnel, revenue health, retention snapshot, tier distribution, growth trend chart, and **Activation Cohorts** table. Cohorts group bakers by signup week or month, showing users, first quote %, Stripe connected %, and first payment % with raw counts and percentages. Endpoint: `GET /api/admin/analytics/cohorts?groupBy=week|month&range=`. All sections respect the shared 9-option date range filter (Today, Yesterday, 7d, 14d, 30d, 90d, 180d, 1 Year, All Time, default 7d). Overview and trends endpoints accept `?range=` param.
    - **Landing Page Analytics** (`/admin/analytics`): Lightweight event tracking for public pages. `analytics_events` table stores `page_view`, `calculator_used`, `signup_click`, `account_created`, `servings_changed`, `design_level_changed`, `calculator_visible`, `cta_click`, `example_button_used`, `price_recalculated` events with session IDs. Summary tiles (9 metrics), calculated funnel percentage metrics (Visitor→Calculator, Calculator Engagement, Signup Intent, Visitor→Signup), visual conversion funnel with horizontal bars and drop-off percentages, expanded page breakdown table (Views, Calc Visible, Calc Uses, Signup Clicks, Accounts, Conv. Rate — sorted by conversion rate), trend chart, and real-time activity feed. Same 9-option date range filter. Page views auto-tracked on route changes via `usePageTracking()` in App.tsx but only for marketing routes — internal app routes (`/admin`, `/dashboard`, `/login`, `/settings`, `/app`, `/onboarding`, `/payments`, `/pricing`, `/share`, `/quotes`, `/leads`, `/customers`, `/orders`, `/signup`) are excluded client-side and server-side. Server-side `marketingPageFilter()` in storage excludes internal routes from summary, trend, and page breakdown queries using exact + prefix matching (`!= prefix AND NOT LIKE prefix/%`), while the Recent Activity feed remains unfiltered for debugging. Calculator use tracked once per session. Calculator visibility tracked via IntersectionObserver.
- **Activity Toast System**: Social proof / tips toast notifications on `/pricing-demo` and `/pricing-demo-v2`. Uses spintax engine (`client/src/lib/spintax.ts`) for varied messages. Two modes: Mode A (tips) when <20 analytics events exist; Mode B (real activity from `GET /api/analytics/recent`) when >=20 events. Toasts appear bottom-right, cycle every 25–40s, display for 5s with fade animation. Dark card with cake emoji. Mobile-safe (bottom-20 on small screens).
- **Landing Page Conversion Optimization**: Both pricing demo pages include: (1) "Guided First Click" micro-instruction above calculator ("Quick test: Set servings to 36, then tap Luxury"), (2) "Try an Example" pill buttons (Birthday/Detailed/Luxury presets) that auto-fill values with "Example loaded" confirmation, (3) undercharging reinforcement line below price result, (4) sticky mobile mini-CTA bar appearing after first calculator interaction, (5) trust lines under CTA ("Free to start / No credit card / Takes 60 seconds"), (6) desktop auto-focus on servings input after hero CTA scroll. V2 page also has "Now try your own numbers below" bridge text under before/after cards. Analytics events: `example_button_used`, `price_recalculated`.

### Planned Future Features
- **Baker Spotlight**: Success story / testimonial section on the `/help` page. Mini case studies highlighting real bakers and how they use BakerIQ (e.g., "Meet Sarah from Sweet Layers — she went from answering DMs all day to getting 20 quote requests a week through her order page"). Content-driven, no backend changes needed — just add entries to the help page when ready.

## External Dependencies

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Session Store**: connect-pg-simple (for PostgreSQL)
- **UI Libraries**: Radix UI, Lucide React
- **Utility Libraries**: class-variance-authority, clsx, date-fns
- **Build Tools**: Vite (frontend), esbuild (server), TypeScript
- **Email Service**: AWS SES (requires `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SES_REGION`, `AWS_SES_FROM_EMAIL`, `AWS_SES_PLATFORM_EMAIL`, `AWS_SES_CUSTOMER_EMAIL`)
- **Email URL Management**: Centralized in `server/url.ts` via `getCanonicalAppUrl()` and `buildAppUrl()`. All email links built through these helpers using `APP_CANONICAL_URL` env var (defaults to `https://bakeriq.app`). Pre-send validator in `sendEmail()` blocks emails containing replit.dev/localhost URLs. Audit script at `scripts/audit-emails.ts` (run with `APP_CANONICAL_URL=https://bakeriq.app npx tsx scripts/audit-emails.ts`).
- **Payment Processing**: Stripe Connect (for subscription management and customer payments)