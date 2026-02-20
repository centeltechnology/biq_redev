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
- **Social Media Sharing**: `/share` page with integrated tools for Facebook, Twitter/X, Instagram, Pinterest, WhatsApp, LinkedIn. Features customizable caption templates, per-item sharing, QR code generation, and dynamic Open Graph tags for calculator pages.
- **Subscription Model**: Tiered plans (Free, Basic, Pro) with varying quote limits and platform fees, managed via Stripe.
- **Shared Types**: Centralized schema definitions (`shared/`) for client and server.
- **Storage Interface**: Abstracted database operations via `server/storage.ts`.
- **Path Aliases**: `@/` for client, `@shared/` for shared code.
- **Component Structure**: `components/ui/` for primitives, feature components at root.
- **Activation-First Onboarding**: New users are redirected to a 4-step `/onboarding` wizard (branding, demo quote, share calculator link, optional Stripe Connect) before accessing the dashboard. Step 3 marks `onboarding_completed=true`; Step 4 (Stripe) is skippable. Existing users see a "Launch Your Bakery" activation checklist on their dashboard showing progress percentage across 4 items (branding, first quote, calculator link sharing, Stripe). The checklist auto-hides at 100% or can be dismissed. `ProtectedRoute` has `allowDuringOnboarding` flag for routes accessible during setup.
- **Super Admin Account Deletion**: Super admins can delete baker accounts via Admin panel with cascade deletion across all related tables (customers, leads, quotes, orders, payments, etc.) and audit logging via `ACCOUNT_DELETED` action.
- **Admin Invitation System**: Super admins can invite new bakers with optional gifted plans (Basic/Pro for 1-12 months). Gifted plans prioritize over free tier but not active subscriptions. Invitation tokens expire after 7 days, and audit logging tracks actions.
- **Retention Email System**: Weekly activation and engagement emails triggered by user activity. Users are segmented into `new_but_inactive`, `configured_not_shared`, `leads_no_quotes`, `quotes_no_orders`, `active_power_user`, and `at_risk` categories. Email templates are segment-specific and use personalization tokens.
- **Admin Email Manager**: Full CRUD system for creating, saving as drafts, editing, previewing, and sending personalized emails to targeted baker audiences. Supports personalization tokens (`{{Baker Name}}`, `{{Business Name}}`, `{{Calculator Link}}`, `{{Email}}`, `{{Plan}}`, `{{Referral Link}}`). Audience targeting by plan (Free/Basic/Pro) and Stripe connection status. Stored in `admin_emails` table. Replaces old hardcoded announcement email with dynamic system.
- **Two-Tier Referral System**:
    - **Baker Referral Program**: All bakers receive a unique referral link (`/join/r/:code`). Rewards include free subscription months for paid plan bakers and Quick Quote access for free plan bakers.
    - **Affiliate Program**: Admin-invited influencer tier with customizable pretty links (`/join/:slug`). Features 45-day cookie tracking, configurable commission rates (e.g., 20% for 3 months), and an admin dashboard for payout management. Public `/partners` page for application.

## External Dependencies

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Session Store**: connect-pg-simple (for PostgreSQL)
- **UI Libraries**: Radix UI, Lucide React
- **Utility Libraries**: class-variance-authority, clsx, date-fns
- **Build Tools**: Vite (frontend), esbuild (server), TypeScript
- **Email Service**: AWS SES (requires `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SES_REGION`, `AWS_SES_FROM_EMAIL`, `AWS_SES_PLATFORM_EMAIL`, `AWS_SES_CUSTOMER_EMAIL`)
- **Payment Processing**: Stripe Connect (for subscription management and customer payments)