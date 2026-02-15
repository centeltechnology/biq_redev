# BakerIQ

## Overview

BakerIQ is a lead capture and quote management tool for custom cake bakers. The application enables bakers to:
- Provide public pricing calculators for customers to get cake and treats estimates
- Capture leads when customers submit calculator inquiries
- Manage customer relationships and convert leads to quotes
- Create and track detailed quotes with line items
- Configure custom pricing for cakes, decorations, addons, and treats

The platform includes Stripe Connect for accepting customer payments directly through quotes, with tiered platform fees based on subscription plan.

### Calculator Categories
The public calculator (/c/:slug) supports two categories:
- **Cakes**: Multi-tier cake builder with size, shape, flavor, frosting, decorations, and addons
- **Treats**: Standalone treat items like cupcakes, cake pops, cookies, brownies, dipped strawberries, etc.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, local React state for UI
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful JSON API under `/api/*` routes
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Authentication**: Cookie-based sessions with bcrypt password hashing

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions and Zod validators
- **Migrations**: Drizzle Kit for schema management (`db:push` for development)

### Key Data Models
- **Bakers**: Business accounts with unique slugs for public calculator URLs
- **Customers**: Contacts belonging to a baker
- **Leads**: Incoming inquiries from the public calculator with status tracking
- **Quotes**: Formal price quotes with line items, linked to customers

### Role-Based Admin Access
- **Roles**: Three roles on `bakers.role` field: `baker` (default), `admin` (support/ops), `super_admin`
- **Middleware**: `requireAdmin` allows admin + super_admin; `requireSuperAdmin` allows only super_admin
- **Admin routes (super_admin only)**: Analytics, financials, payments, bakers management, affiliates, retention, announcements, onboarding stats, impersonation, email logs
- **Support routes (admin + super_admin)**: Support tickets (list, update, reply), baker context endpoint
- **Admin UI routes**: `/admin` (super_admin analytics dashboard), `/admin/support` (ticket management for both roles)
- **Role guard**: Admin role users navigating to `/admin` are redirected to `/admin/support`
- **Sidebar**: Admin role sees only "Support" nav link; Super Admin sees both "Admin" and "Support" links
- **Role badge**: Displayed in both admin page headers showing current role
- **Audit logging**: `admin_audit_logs` table tracks TICKET_REPLY, TICKET_STATUS_CHANGE, ROLE_CHANGE actions
- **Baker context endpoint**: `GET /api/admin/support-tickets/:id/baker-context` returns limited info (plan, Stripe status, dates) for support resolution
- **Files**: `client/src/pages/admin.tsx` (super_admin), `client/src/pages/admin-support.tsx` (support dashboard)

### Social Media Sharing
- **Share & Promote page**: `/share` route accessible from sidebar for all bakers
- **Platforms**: Facebook, Twitter/X, Instagram (copy-to-clipboard), Pinterest, WhatsApp, LinkedIn
- **Caption templates**: Pre-written templates in 3 categories (General, Featured Items, Seasonal)
- **Featured items sharing**: Per-item share buttons for all featured pricing items
- **Calculator link tools**: Copy link, QR code download, preview
- **OG meta tags**: Server-side dynamic Open Graph tags for `/c/:slug` calculator pages (baker name, description, hero image)
- **Sharing tips**: Practical advice card with timing, content, and offline promotion tips
- **Files**: `client/src/pages/share.tsx`

### Design Patterns
- **Shared Types**: Schema definitions in `shared/` are used by both client and server
- **Storage Interface**: `server/storage.ts` abstracts database operations
- **Path Aliases**: `@/` for client code, `@shared/` for shared code
- **Component Structure**: UI primitives in `components/ui/`, feature components at component root

### Subscription Model
- **Free Plan**: 15 quotes sent per month, unlimited leads received, 7% platform fee
- **Basic Plan**: Unlimited quotes + 5 featured items @ $4.99/month, 5% platform fee
- **Pro Plan**: Unlimited quotes per month @ $9.99/month, 3% platform fee
- Stripe integration for subscription management
- Stripe Connect for accepting customer payments (deposits and full payments)
- Platform fees computed dynamically based on plan via `getPlatformFeePercent()` in routes.ts
- Quote limits enforced when sending quotes (drafts are free)

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database queries
- Session storage in PostgreSQL via connect-pg-simple

### UI Libraries
- Radix UI primitives for accessible component foundations
- Lucide React for icons
- class-variance-authority and clsx for conditional styling
- date-fns for date formatting

### Build Tools
- Vite for frontend development and bundling
- esbuild for server bundling in production
- TypeScript for type checking

### Onboarding Email System (Conditional)
- **7-Day Series (Day 0-6)**: Activation-focused emails with conditional Stripe logic
  - Day 0: Welcome + Connect Stripe CTA
  - Day 1: Pricing calculator setup
  - Day 2: Professional quotes
  - Day 3: Stripe push (if not connected) OR Stripe connected congrats (if connected)
  - Day 4: Deposits (if Stripe connected) OR Stripe reminder (if not connected)
  - Day 5: Pro workflow example
  - Day 6: Habit formation (if Stripe connected) OR final Stripe push (if not connected)
- **Feature Flag**: `ONBOARDING_CONDITIONALS_ENABLED` env var (set to "true" to enable)
- **Scheduler**: Runs hourly via `server/onboarding-scheduler.ts`, checks for eligible bakers
- **Activation Tracking**: `stripeConnectedAt`, `firstProductCreatedAt`, `firstQuoteSentAt`, `firstInvoiceCreatedAt`, `firstPaymentProcessedAt` timestamps on bakers table
- **Tracking**: `baker_onboarding_emails` table with `email_key` (template variant) and `stripe_connected` (status at send time)
- **Idempotency**: `onboarding_email_sends` table with UNIQUE(bakerId, emailKey) prevents duplicate sends; scheduler checks before sending
- **Admin UI**: Activation Funnel card in System tab shows Stripe adoption rate, activation milestones, and emails sent by template
- **Admin Resend**: `/api/admin/bakers/:id/resend-email` with `force` flag; returns 409 if already sent unless `force=true`
- **Retry Logic**: Failed emails are recorded and retried by scheduler; successful sends prevent duplicates
- **Safety**: Skips admin accounts; feature flag prevents sends until explicitly enabled; payment timestamps only set on webhook-confirmed success

### Dashboard Onboarding Checklist ("Let's Get You Paid")
- **3-Step Checklist**: Persistent card on dashboard driving activation path
  1. **Connect Stripe** — "Connect Stripe to start getting paid." CTA triggers Stripe Connect flow
  2. **Send your first quote** — CTA opens FirstQuoteModal with two options:
     - "Send to a real customer" → routes to /quotes/new
     - "Send a test quote to myself" → calls POST /api/quotes/test-quote (auto-creates test customer + $100 draft quote), routes to /quotes/:id for editing/sending
  3. **Share your calculator link** — Two CTAs: "Copy Link" copies calculator URL to clipboard; "Download QR" generates 1024x1024 PNG QR code with "Scan to build your order" text + URL, triggers download. Distribution tip toast shown after QR download.
- **Completion**: Each step tracked via server fields (`stripeConnectedAt`, `firstQuoteSentAt`) or localStorage (`linkShared`). Checklist hides when all 3 complete or permanently dismissed (X button, localStorage)
- **Revenue De-emphasis**: When checklist is visible, revenue/metric cards replaced with placeholder: "Your revenue metrics will appear after your first quote is sent."
- **Admin exclusion**: Checklist never shown to super_admin accounts
- **Activity tracking**: `onboarding_checklist_seen`, `first_quote_cta_used`, `quick_quote_link_copied` events via POST /api/activity/track
- **Stripe Banner**: Persistent banner on all auth pages when Stripe not connected (24h snooze via localStorage)
- **Stripe Connect Toast**: After return from Stripe Connect, shows "You're ready to send your first quote."
- **Test Quote Guardrails**: POST /api/quotes/test-quote requires stripeConnectedAt NOT NULL, firstQuoteSentAt NULL, non-admin
- **Files**: `client/src/components/onboarding-checklist.tsx`, `client/src/components/first-quote-modal.tsx`, `client/src/pages/dashboard.tsx`, `client/src/components/dashboard-layout.tsx`

### Future Feature Ideas
- **Recurring Event Reminders** (planned for ~late March 2026): Track customer birthdays/anniversaries with `eventDate` and `eventType` on customers. Daily scheduler sends dual reminders (baker + customer) 4-6 weeks before the event. Drives repeat annual orders.

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption (optional in dev, defaults to dev key)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SES_REGION`: For email sending via AWS SES
- `AWS_SES_FROM_EMAIL`: Default sender email (fallback for all email types)
- `AWS_SES_PLATFORM_EMAIL`: Sender email for platform emails to bakers (uses "BakerIQ" sender name)
- `AWS_SES_CUSTOMER_EMAIL`: Sender email for customer-facing emails (uses "Your Baker at [Business Name]" sender name)

### Email Sender Types
- **Platform emails**: Onboarding, password reset, admin notifications sent from "BakerIQ"
- **Customer emails**: Quotes, lead confirmations sent from "Your Baker at [Business Name]"

### Retention Email System
Weekly activation and engagement emails for user retention:
- **Event Tracking**: `user_activity_events` table logs key user actions (login, lead creation, quote actions, orders, pricing updates, featured items)
- **Segmentation Engine**: `server/segmentation.ts` classifies users into 6 segments based on activity patterns:
  - `new_but_inactive`: Signed up >7 days ago, no key actions
  - `configured_not_shared`: Calculator configured but link not shared
  - `leads_no_quotes`: Has leads but no quotes created
  - `quotes_no_orders`: Quotes sent but no orders marked
  - `active_power_user`: 3+ key actions in last 7 days
  - `at_risk`: Previously active, no activity in 14+ days
- **Email Templates**: `retention_email_templates` table with segment-specific templates using personalization tokens ({{first_name}}, {{business_name}}, {{quick_quote_url}}, {{dashboard_url}})
- **Scheduler**: `server/retention-scheduler.ts` runs weekly, respects 48-hour onboarding cooldown and 7-day retention email cooldown
- **Admin UI**: System tab in admin dashboard shows segment distribution, email stats (open/click rates), and manual trigger button
- **Tracking**: `retention_email_sends` table tracks sends, opens, and clicks per user/template

### Two-Tier Referral System

#### Baker Referral Program (All Bakers)
Every baker gets a referral link to invite others:
- **Referral Link**: Pretty URL format `/join/r/:code` with auto-generated referral code
- **Rewards**: 
  - Paid plan bakers: 1 free month of subscription per successful referral (up to 12 months stacked)
  - Free plan bakers: 1 month of Quick Quote access per successful referral (up to 12 months stacked)
- **Tracking**: `baker_referrals` table tracks referrals, credits awarded via `referralCredits` and `quickQuoteCredits` fields on bakers
- **Baker Dashboard**: "Refer a Friend" page accessible to all bakers showing link, stats, and referred baker list
- **Credit Awarding**: Automatic when referred baker subscribes to a paid plan (triggered in subscription webhook)

#### Affiliate Program (Influencer Tier - Admin Invite Only)
Premium referral program for influencers:
- **Pretty Links**: `/join/:slug` format with customizable affiliate slug (editable by affiliate)
- **Admin Management**: Affiliates tab in admin dashboard with searchable list, enable/disable affiliates, set commission rate and duration
- **Cookie Tracking**: 45-day `bakeriq_ref` cookie set when visitors click affiliate link, attributed on signup
- **Commission Model**: 20% of subscription revenue (default) for first 3 months (configurable per affiliate)
- **Payout System**: Admin reviews pending commissions and marks them as paid via the Affiliates tab
- **Baker Dashboard**: "Affiliate Program" page shows referral link with slug editor, click stats, signups, and commission history (only visible to affiliates)
- **Data Model**: `referral_clicks` table tracks clicks, `affiliate_commissions` table tracks earned commissions, affiliate fields on `bakers` table
- **Commission Tracking**: Automated commission recording when referred baker's subscription payment is processed via Stripe webhook
- **Application Page**: Public `/partners` page with program details and application form for influencers/creators to request affiliate access
- **Application Management**: `affiliate_requests` table tracks applications; admin Affiliates tab shows pending applications with approve/deny actions