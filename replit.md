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

### Onboarding Email System
- **Welcome Email (Day 0)**: Sent immediately on signup
- **7-Day Series (Days 1-7)**: Automated emails covering pricing setup, quotes, leads, calendar, treats, plans, and success tips
- **Scheduler**: Runs hourly via `server/onboarding-scheduler.ts`, checks for eligible bakers
- **Tracking**: `baker_onboarding_emails` table with unique constraint on (baker_id, email_day)
- **Retry Logic**: Failed emails are recorded and retried by scheduler; successful sends prevent duplicates

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

### Affiliate Program
Admin-invite-only referral program for baker/treat maker influencers:
- **Admin Management**: Affiliates tab in admin dashboard to enable/disable bakers as affiliates, set commission rate and duration
- **Cookie Tracking**: 45-day `bakeriq_ref` cookie set when visitors click `/api/ref/:code`, attributed on signup
- **Commission Model**: 20% of subscription revenue (default) for first 3 months (configurable per affiliate)
- **Baker Dashboard**: Referrals page shows referral link, click stats, signups, and commission history (only visible to affiliates)
- **Data Model**: `referral_clicks` table tracks clicks, `affiliate_commissions` table tracks earned commissions, affiliate fields on `bakers` table
- **Commission Tracking**: Automated commission recording when referred baker's subscription payment is processed via Stripe webhook