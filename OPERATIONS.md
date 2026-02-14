# BakerIQ Operations Manual

> This document provides a complete overview of BakerIQ's systems, automated processes, and day-to-day operations. It is written so that a non-technical office manager or support staff member can understand what the platform does, how it runs, and when to escalate issues.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [How BakerIQ Makes Money](#how-bakeriq-makes-money)
3. [Subscription Plans](#subscription-plans)
4. [Automated Systems (Runs Without You)](#automated-systems)
5. [Admin Dashboard Guide](#admin-dashboard-guide)
6. [Daily Operations Checklist](#daily-operations-checklist)
7. [Weekly Operations Checklist](#weekly-operations-checklist)
8. [Support Playbook](#support-playbook)
9. [Escalation Guide](#escalation-guide)
10. [Decision Authority Matrix (Who Decides What)](#decision-authority-matrix)
11. [User Lifecycle](#user-lifecycle)
12. [Key Pages & Features](#key-pages--features)
13. [Email Systems](#email-systems)
14. [Referral & Affiliate Programs](#referral--affiliate-programs)
15. [Financial Tracking](#financial-tracking)
16. [KPI Thresholds & Health Targets](#kpi-thresholds--health-targets)
17. [External Services & Integrations](#external-services--integrations)
18. [Technical Architecture (For Developers)](#technical-architecture)
19. [Troubleshooting Common Issues](#troubleshooting-common-issues)
20. [Founder Step-Back Milestones](#founder-step-back-milestones)

---

## Platform Overview

BakerIQ is a lead capture and quote management tool built for custom cake and treats bakers. It helps bakers:

- Share a **public pricing calculator** with potential customers (accessible at `/c/:baker-slug`)
- **Capture leads** automatically when customers submit calculator inquiries
- **Manage customers** and convert leads into formal quotes
- **Send professional quotes** with line items, deposits, and online payment via Stripe
- **Track orders** through a calendar view
- **Accept payments** through Stripe Connect (deposits and full payments)

The platform operates on a freemium model where bakers sign up for free and can upgrade to paid plans for additional features and lower platform fees.

---

## How BakerIQ Makes Money

BakerIQ has **two revenue streams**:

### 1. Platform Fees (Transaction-Based)
When a customer pays a baker through a BakerIQ quote, we take a percentage:
- **Free plan bakers**: 7% platform fee
- **Basic plan bakers**: 5% platform fee
- **Pro plan bakers**: 3% platform fee

This is handled automatically through **Stripe Connect**. When a customer pays, Stripe splits the payment — the baker gets their share, and BakerIQ keeps the platform fee. No manual intervention needed.

### 2. Subscription Revenue (Recurring)
- **Basic Plan**: $4.99/month
- **Pro Plan**: $9.99/month

Subscriptions are managed through Stripe. Billing, renewals, and cancellations are all automatic.

### Key Financial Metrics to Track
- **GMV (Gross Merchandise Volume)**: Total dollar amount of all payments flowing through the platform
- **Platform Fee Revenue**: Our cut from each transaction
- **ARR (Annual Recurring Revenue)**: Subscription revenue annualized (monthly sub revenue x 12)
- **ARPU (Average Revenue Per User)**: Total revenue divided by total users
- **Net Revenue**: Gross revenue minus affiliate costs and Stripe processing fees

All of these are visible in the **Financials tab** of the Admin Dashboard.

---

## Subscription Plans

| Feature | Free | Basic ($4.99/mo) | Pro ($9.99/mo) |
|---------|------|-------------------|----------------|
| Leads received | Unlimited | Unlimited | Unlimited |
| Quotes sent/month | 15 | Unlimited | Unlimited |
| Featured items (Fast Quote) | 0 | 5 | Unlimited |
| Platform fee | 7% | 5% | 3% |
| Calculator | Yes | Yes | Yes |
| Calendar | Yes | Yes | Yes |
| Customer management | Yes | Yes | Yes |

**Quote limits reset monthly.** Drafts don't count against the limit — only sent quotes do.

---

## Automated Systems

These systems run continuously without any human intervention. They are the backbone of the platform's ability to operate hands-off.

### 1. Onboarding Email Series
- **What it does**: Sends a sequence of 8 emails to new bakers over their first week
- **Schedule**: Checks hourly for eligible bakers
- **Emails sent**:
  - Day 0: Welcome email (sent immediately on signup)
  - Day 1: Set up your pricing
  - Day 2: Send your first quote
  - Day 3: Managing leads
  - Day 4: Using the calendar
  - Day 5: Treats menu setup
  - Day 6: Plans and upgrading
  - Day 7: Success tips
- **Duplicate prevention**: Each email is only sent once per baker (tracked in database)
- **Retry logic**: Failed emails are recorded and retried on the next hourly check
- **Code location**: `server/onboarding-scheduler.ts`

### 2. Retention Email System
- **What it does**: Sends weekly targeted emails based on how active each baker is
- **Schedule**: Runs weekly
- **User segments** (automatic classification):
  - **New but Inactive**: Signed up more than 7 days ago, hasn't taken any key actions
  - **Configured not Shared**: Set up their calculator but hasn't shared the link
  - **Leads no Quotes**: Getting leads but hasn't created any quotes
  - **Quotes no Orders**: Sending quotes but no orders marked complete
  - **Active Power User**: 3+ key actions in the last 7 days (these users get no retention emails)
  - **At Risk**: Was previously active, no activity in 14+ days
- **Cooldowns**: Won't send if baker received an onboarding email in the last 48 hours, or a retention email in the last 7 days
- **Admin control**: Can be manually triggered from the System tab in admin
- **Code location**: `server/retention-scheduler.ts`, `server/segmentation.ts`

### 3. Stripe Webhook Processing
- **What it does**: Listens for events from Stripe and updates the platform accordingly
- **Events handled**:
  - Subscription created/updated/cancelled (updates baker's plan)
  - Payment succeeded (records payment, awards referral credits)
  - Connect account updates (tracks onboarding status)
  - Invoice paid (triggers affiliate commission recording)
- **No manual action needed**: Everything is processed automatically
- **Code location**: `server/webhookHandlers.ts`, `server/index.ts`

### 4. Referral Credit Awarding
- **What it does**: When a referred baker subscribes to a paid plan, automatically awards the referrer:
  - Paid plan referrers: 1 free month of subscription credit
  - Free plan referrers: 1 month of Quick Quote access
- **Cap**: Maximum 12 months of stacked credits per baker
- **Triggered by**: Stripe subscription webhook

### 5. Affiliate Commission Tracking
- **What it does**: When a baker referred by an affiliate pays their subscription, automatically records the commission (20% of subscription amount, for months 1-3)
- **Triggered by**: Stripe invoice payment webhook
- **Payout**: Commissions must be manually reviewed and marked as paid by admin

### 6. Quote Limit Enforcement & Reset
- **What it does**: Prevents free-plan bakers from sending more than 15 quotes per month
- **Reset**: Monthly automatic reset of quote counters
- **Drafts are free**: Only counts when a quote is actually sent to a customer

### 7. Stripe Product Seeding
- **What it does**: On server startup, ensures the Basic and Pro subscription products exist in Stripe
- **Runs**: Once at startup, idempotent (safe to run repeatedly)

---

## Admin Dashboard Guide

The admin dashboard is accessible at `/admin` (requires super_admin role). It has 8 tabs:

### Accounts Tab
- **Search and browse** all registered bakers
- **View baker details**: business name, email, plan, signup date, verification status
- **Actions available**:
  - Change a baker's role (baker vs super_admin)
  - Change a baker's plan (free/basic/pro)
  - Suspend or unsuspend an account (with reason)
  - Reset a baker's password (generates temporary password)
  - Reset a baker's monthly quote limit
  - Impersonate a baker (log in as them to troubleshoot)
  - View detailed activity (leads, quotes, orders, customers)
  - Delete an account

### Analytics Tab
- Platform-wide statistics: total bakers, plan distribution, recent signups
- Verified vs unverified bakers
- Total leads, quotes, and orders across the platform
- Platform revenue overview

### Email Tab
- Preview and send announcement emails to all active bakers
- Send test emails to yourself first
- View results (sent count, failed count)

### Payments Tab
- **Total payment volume** (GMV) and platform fees earned
- **Monthly volume** and transaction count
- **Revenue breakdown by plan** (Free/Basic/Pro with fee percentages)
- **Recent transactions** table with baker name, customer, amount, fee, and status
- **Stripe Connect health**: Shows which bakers have connected Stripe, completed onboarding, and enabled payouts

### Support Tab
- View and manage support tickets submitted by bakers
- Filter by status: Open, In Progress, Resolved, Archived
- Filter by priority: Low, Medium, High
- Reply to tickets directly from the admin panel
- Change ticket status and priority
- Manual email tools for resending onboarding emails

### System Tab
- **Retention email segment distribution**: Shows how many bakers fall into each segment
- **Retention email stats**: Open rates, click rates, send counts
- **Manual trigger**: Button to run the retention email scheduler on demand
- **Retention email templates**: View and edit the email templates for each segment

### Affiliates Tab
- **Affiliate applications**: Review pending applications from the /partners page
  - Approve or deny with admin notes
  - Note: Approving an application does NOT automatically enable them as an affiliate. You must also search for them in the affiliate search tool and enable them manually.
- **Manage affiliates**: Search for bakers, enable/disable affiliate status, set commission rate and duration
- **View commissions**: See all pending, approved, and paid commissions
- **Mark commissions as paid**: After sending payment to an affiliate

### Financials Tab
- **Live metrics from real data**:
  - Total bakers with plan breakdown
  - Monthly and total GMV
  - Monthly platform fees (with all-time total)
  - Subscription revenue (monthly and annual)
  - ARR (Annual Recurring Revenue)
  - Monthly net revenue with ARPU
- **Monthly trends**: Last 6 months of GMV, platform fees, subscription revenue, new bakers
- **Revenue projections**: Adjustable model with 4 scenarios (500 / 1,000 / 10,000 / 50,000 users)
  - Configurable assumptions: tier distribution, avg GMV per baker, transactions, affiliate rate, Stripe fee
  - Calculates: platform fees, subscription revenue, gross revenue, affiliate costs, Stripe processing, net revenue, ARPU, ARR, annual projections
- **CSV export**: Download live metrics or projections for investor presentations

---

## Daily Operations Checklist

These are the tasks someone should do every business day:

1. **Check support tickets** (Support tab)
   - Open any new tickets and respond within 24 hours
   - Escalate "High" priority tickets immediately
   - Mark resolved tickets after confirming the issue is fixed

2. **Review new affiliate applications** (Affiliates tab)
   - Check for pending applications
   - Review their social media presence and follower count
   - Approve or deny with a note explaining why

3. **Glance at payment health** (Payments tab)
   - Check for any failed payments or unusual patterns
   - Verify Stripe Connect health — any bakers stuck in onboarding?

4. **Check for suspended accounts** (Accounts tab)
   - Review if any accounts were auto-flagged
   - Verify suspensions are still warranted

---

## Weekly Operations Checklist

1. **Review financial metrics** (Financials tab)
   - Check monthly GMV trend — is it growing?
   - Check ARR — are subscriptions increasing?
   - Review ARPU — are we making more per user over time?
   - Export data if needed for reporting

2. **Review retention email performance** (System tab)
   - Check open and click rates
   - Identify underperforming segments
   - Consider template updates for low-engagement segments

3. **Review affiliate commissions** (Affiliates tab)
   - Check for pending commissions ready to be paid
   - Verify commission amounts are correct
   - Mark paid commissions after sending payment

4. **Review analytics** (Analytics tab)
   - Weekly signup trend
   - Plan distribution changes
   - Overall platform activity

---

## Support Playbook

### Common Support Issues & Resolutions

| Issue | Resolution |
|-------|-----------|
| "I can't log in" | Use admin to reset their password. Send them the temporary password. |
| "My calculator isn't showing" | Verify their slug is set. Check if their account is suspended. |
| "I hit my quote limit" | If free plan, explain the 15/month limit. Suggest upgrading, or reset their limit via admin if warranted. |
| "Customer can't pay through my quote" | Check Stripe Connect status — they need to complete onboarding and have payouts enabled. |
| "I'm not getting lead emails" | Verify their email is correct and not bouncing. Check their notification settings (notifyNewLead should be enabled). |
| "I want to cancel my subscription" | Direct them to Settings page where they can manage their subscription through Stripe. |
| "I want a refund" | Direct them to contact support. Refund decisions should be escalated to the founder. |
| "How do I set up my calculator?" | Direct them to Calculator Pricing in their dashboard, or share a link to the FAQ/Help page. |
| "My Stripe Connect isn't working" | Check the Payments tab > Connect Health. If they're stuck, they may need to retry the Stripe onboarding process from Settings. |

### Impersonation (Logging In As A Baker)
When a baker has a problem you can't diagnose from the admin panel:
1. Go to Accounts tab
2. Find the baker
3. Click the impersonate button
4. You'll see exactly what they see
5. **Important**: Click "Stop Impersonation" when done — otherwise you'll still be logged in as them

---

## Escalation Guide

### What Counts as ROUTINE (Handle It Yourself)
- Password resets
- Account questions
- Feature questions (point to FAQ/Help)
- Affiliate application reviews
- Commission payouts
- Quote limit resets
- Basic Stripe Connect troubleshooting

### What Counts as SERIOUS (Escalate to Founder)
- Platform is completely down or unreachable
- Stripe payments are failing for ALL bakers (not just one)
- Database connectivity issues
- Security concerns (unauthorized access, data breach)
- Refund requests over $100
- Legal or compliance inquiries
- Stripe account warnings or restrictions from Stripe
- Any system error appearing repeatedly in logs

### How to Escalate
1. Document the issue clearly: what happened, when, who's affected
2. Note any error messages you see
3. Contact the founder via the agreed communication channel (text/call for urgent, email for non-urgent)

---

## Decision Authority Matrix

This matrix clarifies who has the authority to make each type of decision. The goal is to keep day-to-day operations running without needing the founder, while still protecting the business on high-impact decisions.

**Roles:**
- **Support Staff**: Front-line team handling tickets and basic account questions
- **Ops Manager**: Person overseeing daily operations, support quality, and reporting
- **Founder**: Business owner / CEO (you want to minimize this column over time)
- **Dev / Tech Lead**: Technical team member for code, infrastructure, and data issues

### Refunds & Financial Decisions

| Decision | Owner | Backup | Notes |
|----------|-------|--------|-------|
| Refund up to $25 | Support Staff | Ops Manager | Document reason in ticket. Max 3 per week per staff member. |
| Refund $25 - $100 | Ops Manager | Founder | Requires ticket documentation + screenshot of payment. |
| Refund over $100 | Founder | — | Always requires founder approval, no exceptions. |
| Subscription credit (1 month free) | Ops Manager | Founder | Use for goodwill gestures during outages or severe bugs. Max 5 per month. |
| Subscription credit (2+ months) | Founder | — | Rare. Only for major platform failures affecting the baker's business. |
| Affiliate commission disputes | Ops Manager | Founder | Review click/signup data. If unclear, escalate to founder. |
| Affiliate payout approval | Ops Manager | Founder | Verify amounts match commission records before marking paid. |
| Pricing or plan structure changes | Founder | — | Never changed without founder sign-off. |

### Account Management

| Decision | Owner | Backup | Notes |
|----------|-------|--------|-------|
| Password reset | Support Staff | Ops Manager | Routine. Verify identity via email match. |
| Quote limit reset (one-time) | Support Staff | Ops Manager | Allowed once per baker per month. Document reason. |
| Quote limit reset (repeated) | Ops Manager | Founder | If a baker asks more than once, suggest upgrading. |
| Account suspension (abuse/spam) | Ops Manager | Founder | Document evidence. Notify baker via email with reason. |
| Account unsuspension | Ops Manager | Founder | Review original suspension reason. Verify issue is resolved. |
| Account deletion request | Ops Manager | Founder | Confirm via email. Allow 7-day cooling-off period. |
| Plan upgrade/downgrade (manual) | Support Staff | Ops Manager | Only when Stripe self-service isn't working. |

### Affiliate & Referral Program

| Decision | Owner | Backup | Notes |
|----------|-------|--------|-------|
| Approve affiliate application | Ops Manager | Founder | Check social following, content quality, audience relevance. |
| Deny affiliate application | Ops Manager | Founder | Always include a reason in admin notes. |
| Enable baker as affiliate (post-approval) | Ops Manager | Founder | Required step after approving application. |
| Change commission rate or duration | Founder | — | Default is 20% for 3 months. Changes are strategic decisions. |
| Disable an affiliate | Ops Manager | Founder | Only for policy violations. Document thoroughly. |

### Legal, Data & Compliance

| Decision | Owner | Backup | Notes |
|----------|-------|--------|-------|
| Data export request (GDPR, etc.) | Founder | Dev / Tech Lead | Must be handled within 30 days. Founder coordinates with dev. |
| Legal inquiry or subpoena | Founder | — | Do not respond. Forward immediately to founder. |
| Privacy complaint | Ops Manager | Founder | Acknowledge receipt. Escalate to founder within 24 hours. |
| Terms of service violation | Ops Manager | Founder | Suspend account first, then escalate for review. |

### Technical & Platform

| Decision | Owner | Backup | Notes |
|----------|-------|--------|-------|
| Outage communication to users | Ops Manager drafts | Founder approves | Dev confirms root cause before sending. |
| Emergency server restart | Dev / Tech Lead | Founder | Only if platform is completely down. |
| Feature requests from users | Ops Manager collects | Founder prioritizes | Log in feedback system. Do not promise timelines. |
| Email template changes | Ops Manager | Founder | Test with admin preview before sending to all users. |
| Send announcement email blast | Ops Manager | Founder | Always send a test email first. Review content for tone. |

---

## User Lifecycle

Here's the journey a baker takes through the platform:

```
1. DISCOVERY
   - Finds BakerIQ via affiliate link, referral, social media, or organic search
   - Views the home page (/) or pricing page (/pricing)

2. SIGNUP
   - Creates account at /signup
   - If referred by affiliate: 45-day cookie tracks attribution
   - If referred by another baker: referral code links them
   - Welcome email sent immediately (Day 0)

3. ONBOARDING (Days 1-7)
   - Receives daily onboarding emails with setup guidance
   - Sets up calculator pricing
   - Configures business profile and deposit settings
   - Connects Stripe (optional but encouraged)

4. ACTIVE USE
   - Shares calculator link with customers
   - Receives leads from calculator submissions
   - Converts leads to quotes
   - Sends quotes to customers
   - Customers pay through quotes (if Stripe connected)
   - Manages orders via calendar

5. GROWTH
   - Upgrades to Basic or Pro for lower fees and more features
   - Refers other bakers via referral program
   - May apply for affiliate program if they have influence

6. RETENTION
   - If activity drops, retention emails re-engage them
   - Segmentation engine classifies their engagement level
   - Targeted emails based on what they haven't tried yet
```

---

## Key Pages & Features

### Public Pages (No Login Required)
| Page | URL | Purpose |
|------|-----|---------|
| Home/Landing | `/` | Marketing page with features, pricing, testimonials |
| Pricing | `/pricing` | Detailed plan comparison |
| Calculator | `/c/:slug` | Baker's public pricing calculator for customers |
| Quote View | `/q/:quoteId` | Customer views a quote and can pay |
| FAQ | `/faq` | Frequently asked questions |
| Terms | `/terms` | Terms of service |
| Privacy | `/privacy` | Privacy policy |
| Partners | `/partners` | Affiliate application page |
| Referral Join | `/join/r/:code` | Baker-to-baker referral signup |
| Affiliate Join | `/join/:slug` | Affiliate referral signup |

### Authenticated Baker Pages (Login Required)
| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/dashboard` | Overview with lead count, pending quotes, recent activity |
| Leads | `/leads` | List of all incoming leads with status |
| Lead Detail | `/leads/:id` | Individual lead with calculator details, convert to quote |
| Customers | `/customers` | Customer database with contact info |
| Quotes | `/quotes` | List of all quotes with status tracking |
| Quote Builder | `/quotes/new` or `/quotes/:id/edit` | Create and edit quotes with line items |
| Calendar | `/calendar` | Order calendar with upcoming events |
| Payments | `/payments` | Payment history and revenue tracking |
| Settings | `/settings` | Business profile, deposit settings, Stripe Connect, subscription |
| Calculator Pricing | `/pricing-calculator` | Configure calculator prices for cakes, treats, decorations |
| Help | `/help` | Getting started guides, tips, and FAQ |
| Referrals | `/referrals` | Refer-a-Friend page with referral link and stats |
| Feedback | `/feedback` | Submit feedback or feature requests |

### Admin Pages
| Page | URL | Purpose |
|------|-----|---------|
| Admin Dashboard | `/admin` | Full platform management (8 tabs) |

---

## Email Systems

BakerIQ sends emails through **AWS SES** (Simple Email Service). There are two types of sender identities:

### Platform Emails (From "BakerIQ")
- Onboarding series (Days 0-7)
- Retention emails
- Password reset emails
- Admin announcements
- Affiliate application confirmations

### Customer-Facing Emails (From "Your Baker at [Business Name]")
- Quote sent notifications
- Lead confirmation emails
- Payment confirmation emails

### Email Notifications Bakers Can Control
Each baker can toggle these in their settings:
- **New lead alerts**: When a customer submits a calculator inquiry
- **Quote viewed**: When a customer opens their quote
- **Quote accepted**: When a customer accepts a quote

---

## Referral & Affiliate Programs

### Baker Referral Program (Everyone Gets This)
- Every baker gets a unique referral link at `/referrals`
- Link format: `bakeriq.app/join/r/:code`
- **Rewards**:
  - If the referrer is on a paid plan: 1 free month of subscription per successful referral
  - If the referrer is on the free plan: 1 month of Quick Quote (featured items) access
- **Cap**: Maximum 12 months of stacked credits
- **"Successful referral"**: The referred baker signs up AND subscribes to a paid plan
- **Automatic**: Credits are awarded via Stripe webhook — no manual action needed

### Affiliate Program (Admin-Invite Only)
- For influencers and content creators with significant following
- Bakers apply through the `/partners` page
- Admin reviews and approves/denies applications
- After approval, admin must also enable them as an affiliate in the Affiliates tab

#### Affiliate Workflow:
1. Influencer applies at `/partners`
2. Admin reviews application in Affiliates tab
3. If approved: Admin searches for their account and enables affiliate status
4. Admin sets commission rate (default 20%) and duration (default 3 months)
5. Affiliate gets a custom link: `bakeriq.app/join/:slug`
6. Affiliate shares link; 45-day tracking cookie is set on click
7. When someone signs up through that link and subscribes, commission is recorded automatically
8. Admin reviews pending commissions and marks them as paid after sending payment

#### Commission Calculation:
- Default: 20% of subscription revenue for the first 3 months
- Example: Referred baker subscribes to Pro ($9.99/mo)
  - Month 1: $9.99 x 20% = $2.00 commission
  - Month 2: $9.99 x 20% = $2.00 commission
  - Month 3: $9.99 x 20% = $2.00 commission
  - Total: $6.00 per referred Pro baker

---

## Financial Tracking

### Where to Find Financial Data
- **Admin > Financials tab**: Live metrics, trends, projections, CSV export
- **Admin > Payments tab**: Individual transactions, Stripe Connect health
- **Admin > Analytics tab**: User growth and platform activity

### Key Metrics Explained

| Metric | What It Means | Why It Matters |
|--------|--------------|----------------|
| GMV | Total payment volume through the platform | Shows overall platform adoption |
| Platform Fee Revenue | Our cut from each transaction (7%/5%/3%) | Direct transaction revenue |
| Subscription Revenue | Monthly income from Basic + Pro plans | Recurring, predictable revenue |
| ARR | Subscription revenue x 12 | The #1 metric investors look at |
| ARPU | Average revenue per user per month | Shows monetization efficiency |
| Net Revenue | Gross revenue minus affiliate costs and Stripe fees | Actual take-home |
| Stripe Connect Adoption | % of bakers who connected Stripe | Indicates payment feature traction |

### Projections Tool
The Financials tab includes a projections calculator that models revenue at 500, 1,000, 10,000, and 50,000 users. You can adjust:
- Tier distribution (% free/basic/pro)
- Average GMV per baker
- Average transactions per month
- Affiliate acquisition rate
- Stripe processing fee rate

Export projections as CSV for investor decks.

---

## KPI Thresholds & Health Targets

Use this section to quickly assess whether the platform is healthy, needs attention, or requires immediate action. Check these during your daily and weekly reviews.

> All thresholds below are labeled **Default (Adjustable)** — the founder can update them as the platform matures and benchmarks become clearer.

### KPI Health Dashboard

| KPI | Healthy | Watch | Critical | Where to Check |
|-----|---------|-------|----------|----------------|
| **Stripe Connect Adoption** (% of bakers connected) | > 40% | 25% - 40% | < 25% | Admin > Payments > Connect Health |
| **Payment Success Rate** (% of attempted payments that succeed) | > 95% | 90% - 95% | < 90% | Stripe Dashboard > Payments |
| **Dispute / Chargeback Rate** | < 0.5% | 0.5% - 1.0% | > 1.0% | Stripe Dashboard > Disputes |
| **Daily Support Tickets** | < 5 | 5 - 15 | > 15 | Admin > Support tab |
| **Weekly Support Tickets** | < 20 | 20 - 50 | > 50 | Admin > Support tab |
| **First Response Time** (support tickets) | < 12 hours | 12 - 24 hours | > 24 hours | Manual tracking |
| **Platform Uptime** (monthly) | > 99.5% | 99% - 99.5% | < 99% | Server monitoring / incident log |
| **Outage Frequency** | 0-1 per month | 2-3 per month | 4+ per month | Incident log |
| **Subscription Churn** (monthly) | < 5% | 5% - 10% | > 10% | Admin > Financials > Trends |
| **GMV Month-over-Month Growth** | > 5% growth | Flat (0% - 5%) | Declining (negative) | Admin > Financials > Trends |
| **Retention Email Open Rate** | > 25% | 15% - 25% | < 15% | Admin > System > Retention Stats |
| **New Signups (weekly)** | Growing week-over-week | Flat | Declining for 3+ weeks | Admin > Analytics |

### What To Do When a KPI Hits "Watch"

1. **Log it** — Write down which KPI, the current value, and the date
2. **Investigate** — Look for a root cause (is there a bug? A Stripe issue? A seasonal dip?)
3. **Monitor daily** — Check the KPI each day for the next 5 business days
4. **If it improves**: Note the recovery and resume normal cadence
5. **If it stays flat or worsens**: Move to the "Critical" action steps below

### What To Do When a KPI Hits "Critical"

1. **Escalate to Ops Manager immediately** (or Founder if no Ops Manager yet)
2. **Document**:
   - Which KPI
   - Current value vs. expected range
   - When it first entered "Watch" territory
   - Any suspected root cause
3. **Take immediate action based on the KPI**:

| Critical KPI | Immediate Action |
|--------------|-----------------|
| Stripe Connect Adoption < 25% | Review onboarding emails — are bakers being prompted to connect Stripe? Consider a targeted email campaign. |
| Payment Success Rate < 90% | Check Stripe Dashboard for errors. If platform-wide, escalate to Dev. If one baker, help them directly. |
| Dispute Rate > 1.0% | Stripe may restrict the account. Identify which bakers are generating disputes. Suspend repeat offenders. Escalate to Founder. |
| Daily Tickets > 15 | Check for a platform-wide bug causing the spike. Prioritize by severity. Pull in additional support if available. |
| First Response > 24 hours | Redistribute ticket load. If understaffed, escalate hiring need to Founder. |
| Uptime < 99% | Escalate to Dev / Tech Lead immediately. Document all outage incidents. |
| Churn > 10% | Review recent changes — did pricing change? Is there a competitor? Survey churned users. Report findings to Founder. |
| GMV Declining | Check if it's seasonal or a trend. Review Stripe Connect adoption. Check if bakers are sending fewer quotes. Report to Founder. |
| Retention Open Rate < 15% | Review email subject lines and content. Test new templates. Check if emails are landing in spam. |

### Monthly KPI Summary Report

At the end of each month, compile a short summary (can be a simple email or shared doc):
- Each KPI's current value and whether it's Healthy / Watch / Critical
- Any KPIs that changed status during the month
- Actions taken for any Watch or Critical KPIs
- Recommendations for the next month

Send this to the Founder by the 3rd business day of the following month.

---

## External Services & Integrations

### Stripe (Payments & Subscriptions)
- **Purpose**: Handles all payment processing, subscription billing, and baker payouts
- **Components**:
  - Stripe Subscriptions: Manages Basic/Pro plan billing
  - Stripe Connect: Enables bakers to receive customer payments through quotes
  - Stripe Webhooks: Automated event processing for payments, subscriptions, and Connect
- **Admin visibility**: Payments tab shows all transactions and Connect account status
- **If Stripe goes down**: Bakers can still use the platform for leads and quotes, but payments won't process. This is extremely rare.

### AWS SES (Email)
- **Purpose**: Sends all platform and customer-facing emails
- **If SES goes down**: Emails will fail but be retried. The platform itself continues to work. Check AWS status page if emails aren't sending.

### PostgreSQL Database
- **Purpose**: Stores all application data — bakers, customers, leads, quotes, orders, payments, etc.
- **Managed by**: Replit's built-in PostgreSQL (Neon-backed)
- **If database has issues**: This is a critical failure — escalate immediately.

### Object Storage
- **Purpose**: Stores uploaded images (profile photos, portfolio images, calculator headers)
- **If storage has issues**: Images won't load but the platform continues to function.

---

## Technical Architecture

> This section is for developers or technical hires. Non-technical staff can skip this.

### Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Hosting**: Replit
- **Payments**: Stripe (Subscriptions + Connect)
- **Email**: AWS SES
- **Storage**: Replit Object Storage

### Project Structure
```
client/                  # Frontend React application
  src/
    pages/               # Page components (one per route)
    components/          # Reusable UI components
    hooks/               # Custom React hooks
    lib/                 # Utilities (query client, etc.)

server/                  # Backend Express application
  routes.ts              # All API routes
  storage.ts             # Database access layer (IStorage interface)
  email.ts               # Email sending functions
  onboarding-scheduler.ts  # Hourly onboarding email job
  retention-scheduler.ts   # Weekly retention email job
  segmentation.ts          # User activity segmentation
  webhookHandlers.ts       # Stripe webhook processing
  stripeClient.ts          # Stripe SDK configuration
  seed-stripe-products.ts  # Stripe product initialization
  index.ts                 # Server entry point

shared/
  schema.ts              # Database schema + TypeScript types (shared between frontend/backend)
```

### Key Environment Variables
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Encrypts user sessions |
| `STRIPE_SECRET_KEY` | Stripe API authentication |
| `STRIPE_PUBLISHABLE_KEY` | Stripe frontend key |
| `AWS_ACCESS_KEY_ID` | AWS authentication for SES |
| `AWS_SECRET_ACCESS_KEY` | AWS authentication for SES |
| `AWS_SES_REGION` | AWS region for email sending |

### Database Tables (Key Ones)
| Table | Purpose |
|-------|---------|
| `bakers` | User accounts with business info, plan, Stripe Connect, referral data |
| `customers` | Customer contacts belonging to each baker |
| `leads` | Incoming calculator inquiries |
| `quotes` | Formal price quotes with line items |
| `orders` | Confirmed orders from accepted quotes |
| `quote_payments` | Payment transactions via Stripe Connect |
| `baker_onboarding_emails` | Tracks onboarding email delivery |
| `retention_email_sends` | Tracks retention email delivery |
| `retention_email_templates` | Editable retention email templates |
| `user_activity_events` | Activity tracking for segmentation |
| `baker_referrals` | Baker-to-baker referral tracking |
| `referral_clicks` | Affiliate link click tracking |
| `affiliate_commissions` | Affiliate commission records |
| `affiliate_requests` | Affiliate program applications |
| `support_tickets` | Support ticket submissions |
| `ticket_messages` | Support ticket conversation messages |

---

## Troubleshooting Common Issues

### Platform Won't Load
1. Check if the server is running (Replit dashboard)
2. Check database connectivity
3. If both are fine, check for recent code changes that may have introduced errors
4. **Escalate** if you can't resolve within 15 minutes

### Emails Aren't Sending
1. Check AWS SES dashboard for sending limits or bounces
2. Verify AWS credentials are still valid
3. Check the System tab in admin for retention email stats
4. The onboarding scheduler logs to console — check server logs for errors
5. Individual email failures don't affect the rest of the platform

### Stripe Payments Failing
1. Check the Stripe Dashboard directly (dashboard.stripe.com)
2. Verify the webhook endpoint is receiving events
3. Check if it's one baker or all bakers
4. One baker: Likely their Connect account issue — have them check their Stripe dashboard
5. All bakers: **Escalate immediately** — possible API key or webhook issue

### Baker Can't See Their Calculator
1. Verify they have a slug set (check Accounts tab in admin)
2. Check if their account is suspended
3. Try accessing `/c/:their-slug` yourself
4. If the page loads but prices are wrong, they need to configure Calculator Pricing

### High Volume of Support Tickets
1. Check if there's a platform-wide issue causing the spike
2. Prioritize by severity: High > Medium > Low
3. Look for patterns — multiple bakers reporting the same issue = systemic problem
4. If it's a bug, document and **escalate**

---

## Founder Step-Back Milestones

This section outlines a phased plan for progressively removing the founder from day-to-day operations as BakerIQ grows. The goal: by the time the platform reaches 5,000 users, the founder should be fully strategic with no involvement in routine tasks.

### Phase 0: Now (Pre-1,000 Users)

**Status**: Founder involved in escalations only. Platform is largely automated.

| Area | Who Handles It |
|------|---------------|
| Daily checklist | Founder (or first hire) |
| Support tickets | Founder (or first hire) |
| Affiliate reviews | Founder |
| Refunds (any amount) | Founder |
| Financial reviews | Founder |
| Feature development | Founder + Dev |
| Escalations | Founder |

**Founder's focus**: Getting to product-market fit, building user base, handling everything until first hires are in place.

**Reporting**: N/A (founder sees everything directly).

---

### Phase 1: 1,000 Users — Hire Ops Manager

**What changes**: An Operations Manager takes over the daily and weekly checklists. Founder shifts to oversight.

| What the Founder STOPS Doing | What Ops Manager OWNS |
|------------------------------|----------------------|
| Daily support ticket triage | Daily checklist (all 4 items) |
| Routine password resets | First-line support responses |
| Quote limit resets | Affiliate application reviews |
| Basic Stripe Connect troubleshooting | Weekly checklist (all 4 items) |
| Monitoring payment health daily | Refunds up to $25 |

**What still goes to the Founder**:
- Refunds over $25
- Account suspensions (Ops recommends, Founder approves)
- Affiliate commission disputes
- Any "Critical" KPI escalation
- Legal or compliance matters
- Pricing or plan changes

**Reporting cadence**: Ops Manager sends Founder a daily Slack/email summary (2-3 sentences: ticket count, any issues, anything escalated). Weekly KPI report.

---

### Phase 2: 2,000 Users — Founder Removed from Routine Support

**What changes**: Ops Manager has full authority over routine operations. Support staff may be added. Founder only sees escalations and weekly reports.

| What the Founder STOPS Doing | What Ops / Support Team OWNS |
|------------------------------|------------------------------|
| Reviewing individual support tickets | All support tickets (Support Staff handles, Ops Manager oversees) |
| Approving routine refunds | Refunds up to $100 (Ops Manager authority) |
| Account suspensions | Ops Manager can suspend/unsuspend with documentation |
| Daily anything | Full daily + weekly operations |
| Affiliate application reviews | Ops Manager approves/denies (standard criteria) |

**What still goes to the Founder**:
- Refunds over $100
- Affiliate commission rate or duration changes
- KPIs in "Critical" status for 7+ days
- Legal, compliance, data export requests
- Pricing changes
- Outage communication approval (Ops drafts, Founder reviews)

**Reporting cadence**: Weekly KPI email from Ops Manager (using the Monthly KPI Summary format, but weekly). Founder checks Financials tab when they want to.

**Milestone marker**: The founder can leave for 2 weeks and nothing breaks. This is the target state described at the top of this document.

---

### Phase 3: 3,000 Users — Weekly KPI Review Only

**What changes**: Founder shifts to product direction, partnerships, and growth strategy. Ops Manager runs the show.

| What the Founder STOPS Doing | What Ops Team OWNS |
|------------------------------|-------------------|
| Weekly operational reviews | Ops Manager runs weekly review independently |
| Affiliate payout approvals | Ops Manager handles all payouts |
| Outage communication drafting | Ops Manager drafts and sends (Founder CC'd) |
| Feature request prioritization | Ops Manager collects and ranks; Founder reviews monthly |

**What still goes to the Founder**:
- Strategic decisions (pricing, new features, partnerships)
- Investor relations and financial projections
- Legal and compliance
- Hiring decisions
- Critical escalations that Ops Manager can't resolve

**Reporting cadence**: Weekly KPI summary (email or shared doc). Monthly financial review meeting (30 min). Quarterly business review.

---

### Phase 4: 5,000+ Users — Founder Fully Strategic

**What changes**: Founder operates at the executive level. Monthly reviews only. Day-to-day is invisible to founder unless something breaks badly.

| What the Founder STOPS Doing | What the Team OWNS |
|------------------------------|-------------------|
| Weekly KPI reviews | Ops Manager + Dev Lead handle weekly |
| Reviewing any support tickets | Support team is self-sufficient |
| Any routine operational task | Everything is delegated |

**What the Founder DOES**:
- Monthly executive review (1 hour): KPIs, revenue, growth, roadmap
- Quarterly strategic planning
- Partnership and business development
- Investor relations
- Hiring and team development
- Product vision and roadmap (with Dev Lead)

**Reporting cadence**: Monthly executive summary from Ops Manager. Quarterly business review with full financials.

**Escalation boundaries** (only these reach the Founder):
- Platform down for 1+ hour with no Dev resolution
- Stripe account restriction or legal action
- Chargeback rate threatening Stripe account
- Security breach or data leak
- Legal or regulatory inquiry
- Revenue decline for 3+ consecutive months
- Any decision that changes pricing, plans, or business model

---

### Quick Reference: Founder Involvement by Phase

| Task | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|------|---------|---------|---------|---------|---------|
| Daily support | Founder | Ops | Ops + Staff | Team | Team |
| Refunds < $25 | Founder | Ops | Staff | Staff | Staff |
| Refunds $25-$100 | Founder | Founder | Ops | Ops | Ops |
| Refunds > $100 | Founder | Founder | Founder | Founder | Founder |
| Affiliate reviews | Founder | Founder | Ops | Ops | Ops |
| Weekly KPI review | Founder | Founder | Founder | Ops | Ops |
| Monthly financials | Founder | Founder | Founder | Founder | Founder |
| Pricing changes | Founder | Founder | Founder | Founder | Founder |
| Legal / compliance | Founder | Founder | Founder | Founder | Founder |
| Outage response | Founder | Founder | Ops + Dev | Ops + Dev | Ops + Dev |
| Feature roadmap | Founder | Founder | Founder | Founder monthly | Founder quarterly |

---

*Last updated: February 2026*
*For questions about this document, contact the founder.*
