# BakerIQ – Email Sequences Audit

> Generated: February 2026
> Purpose: Consolidated documentation of all email sequences related to onboarding, activation, and quote flow.
> This document is for internal review only. No code was modified.

---

## Table of Contents

1. [Registration & Verification](#1-registration--verification)
2. [Onboarding Drip Sequence (Days 0–6)](#2-onboarding-drip-sequence-days-06)
3. [Lead & Quote Transactional Emails](#3-lead--quote-transactional-emails)
4. [Payment Notifications](#4-payment-notifications)
5. [Password & Account Management](#5-password--account-management)
6. [Retention / Re-engagement Emails](#6-retention--re-engagement-emails)
7. [Admin & Platform Emails](#7-admin--platform-emails)
8. [Affiliate / Partner Program Emails](#8-affiliate--partner-program-emails)

---

## 1. Registration & Verification

### 1.1 Email Verification

| Field | Value |
|---|---|
| **Email Name** | Email Verification |
| **Function** | `sendEmailVerification()` |
| **Trigger** | Immediately after baker registration; also re-sent on manual request |
| **Recipient** | Baker |
| **Subject** | `Verify Your BakerIQ Account` |
| **Status** | Active |
| **Related Flow** | Registration |

**Body Copy:**

> Hi,
>
> Thanks for signing up! Please verify your email address by clicking the button below:
>
> [Verify Email]
>
> This link will expire in 24 hours.

---

## 2. Onboarding Drip Sequence (Days 0–6)

The onboarding sequence is a 7-day drip campaign sent to bakers after registration. Emails are sent via `sendOnboardingEmail()` and are branched based on whether the baker has connected Stripe. Each day selects one of potentially two variants (Stripe connected vs. not connected).

### 2.1 Day 0 – Welcome

| Field | Value |
|---|---|
| **Email Name** | Day 0 Welcome |
| **Email Key** | `day0_welcome` |
| **Trigger** | Immediately after registration (day 0) |
| **Recipient** | Baker |
| **Subject** | `You just upgraded how you get paid.` |
| **Status** | Active |
| **Related Flow** | Onboarding, Stripe |

**Body Copy:**

> Hi [Business Name],
>
> Welcome to BakerIQ. You now have a system that handles pricing, quotes, and payments — so you can stop doing it in DMs.
>
> Here's what BakerIQ replaces:
> - Pricing conversations in text messages
> - Chasing deposits over Venmo or cash
> - Sending quotes as screenshots or PDFs nobody responds to
>
> The first thing to do: **connect Stripe** so you can accept deposits and payments directly through your quotes. It takes about 5 minutes.
>
> Once Stripe is connected, every quote you send can collect a deposit automatically. No awkward follow-ups.
>
> We'll walk you through the rest this week.
>
> [Connect Stripe Now] → /settings

---

### 2.2 Day 1 – Pricing Setup

| Field | Value |
|---|---|
| **Email Name** | Day 1 Pricing |
| **Email Key** | `day1_pricing` |
| **Trigger** | 1 day after registration |
| **Recipient** | Baker |
| **Subject** | `Stop quoting in text messages.` |
| **Status** | Active |
| **Related Flow** | Onboarding, Pricing |

**Body Copy:**

> Hi [Business Name],
>
> Every time you price a cake in a DM, you're doing math that a system should handle for you.
>
> BakerIQ's pricing calculator lets you set your prices once — by size, shape, flavor, frosting, and add-ons. Then your customers get an instant estimate without you typing a single message.
>
> Today, set up your first product. Pick your most popular cake and add it to your calculator. It takes about 3 minutes.
>
> Once it's live, you'll have a link you can share anywhere — Instagram bio, Facebook page, or directly to customers who ask "how much?"
>
> [Set Up Your First Product] → /calculator-pricing

**Stripe P.S. (shown only if Stripe NOT connected):**

> P.S. Haven't connected Stripe yet? Do that first so you're ready to collect payments when quotes start going out. [Connect Stripe] → /settings

---

### 2.3 Day 2 – Quotes

| Field | Value |
|---|---|
| **Email Name** | Day 2 Quotes |
| **Email Key** | `day2_quotes` |
| **Trigger** | 2 days after registration |
| **Recipient** | Baker |
| **Subject** | `A real quote gets a real deposit.` |
| **Status** | Active |
| **Related Flow** | Onboarding, Quotes |

**Body Copy:**

> Hi [Business Name],
>
> Bakers who send structured quotes with clear line items and a deposit request get paid faster. Customers take you more seriously when you look like a business, not a text thread.
>
> BakerIQ quotes include:
> - Itemized pricing your customer can review
> - A deposit request they can pay online
> - A professional look that builds trust
>
> Try it today. Send your first quote — even to yourself as a test. See what your customers will see.
>
> Once you see how clean it looks, you won't go back to screenshots.
>
> [Send Your First Quote] → /quotes

**Stripe P.S. (shown only if Stripe NOT connected):**

> P.S. Stripe not connected yet? Your quotes can't collect payment without it. [Connect Stripe] → /settings

---

### 2.4 Day 3 – Stripe Push (NOT connected)

| Field | Value |
|---|---|
| **Email Name** | Day 3 Stripe Push |
| **Email Key** | `day3_stripe_push` |
| **Trigger** | 3 days after registration, Stripe NOT connected |
| **Recipient** | Baker |
| **Subject** | `You can't get paid if Stripe isn't connected.` |
| **Status** | Active |
| **Related Flow** | Onboarding, Stripe |

**Body Copy:**

> Hi [Business Name],
>
> Quick check: is your Stripe account connected?
>
> Without it, your quotes are informational only. Customers can view them, but they can't pay you. That means you're still chasing deposits the old way.
>
> Common hesitations:
> - **"Is it safe?"** — Stripe handles billions in payments. Your data is encrypted and secure.
> - **"Does it cost money?"** — There's no monthly fee for Stripe. Standard processing applies only when you get paid.
> - **"Is it complicated?"** — It takes about 5 minutes. BakerIQ walks you through it.
>
> Once connected, every quote you send becomes a payment link. Deposits land in your bank account automatically.
>
> This is the single most important step in your setup.
>
> [Connect Stripe Now] → /settings

---

### 2.5 Day 3 – Stripe Connected (alternate)

| Field | Value |
|---|---|
| **Email Name** | Day 3 Stripe Connected |
| **Email Key** | `day3_stripe_connected` |
| **Trigger** | 3 days after registration, Stripe IS connected |
| **Recipient** | Baker |
| **Subject** | `Stripe is connected. Now let's put it to work.` |
| **Status** | Active |
| **Related Flow** | Onboarding, Stripe, Quotes |

**Body Copy:**

> Hi [Business Name],
>
> Your Stripe account is live — that means every quote you send can collect a deposit or full payment automatically.
>
> Here's what to do next:
> - Send a quote to a real customer (or yourself as a test)
> - Include a deposit request so they can pay right away
> - Watch the payment land in your Stripe dashboard
>
> No more chasing deposits over text. No more screenshots of Zelle confirmations. This is how professional bakers get paid.
>
> [Send Your First Quote] → /quotes

---

### 2.6 Day 4 – Deposit (Stripe connected)

| Field | Value |
|---|---|
| **Email Name** | Day 4 Deposit |
| **Email Key** | `day4_deposit` |
| **Trigger** | 4 days after registration, Stripe IS connected |
| **Recipient** | Baker |
| **Subject** | `No deposit? No commitment.` |
| **Status** | Active |
| **Related Flow** | Onboarding, Quotes, Payments |

**Body Copy:**

> Hi [Business Name],
>
> If you've ever had a customer ghost after you spent hours on a design, you already know: no deposit means no commitment.
>
> BakerIQ lets you require a deposit right inside your quote. You set the amount — flat fee or percentage — and the customer pays it when they accept. No awkward conversations. No chasing.
>
> Today, create a quote with a deposit requirement. Pick a real or recent order and build it out.
>
> Your time is worth protecting. A deposit does that before you ever pick up a spatula.
>
> [Create a Quote with Deposit] → /quotes

---

### 2.7 Day 4 – Stripe Reminder (Stripe NOT connected, alternate)

| Field | Value |
|---|---|
| **Email Name** | Day 4 Stripe Reminder |
| **Email Key** | `day4_stripe_reminder` |
| **Trigger** | 4 days after registration, Stripe NOT connected |
| **Recipient** | Baker |
| **Subject** | `Still haven't connected Stripe?` |
| **Status** | Active |
| **Related Flow** | Onboarding, Stripe |

**Body Copy:**

> Hi [Business Name],
>
> We've shown you the pricing calculator, the quote system, and how deposits work — but none of it collects real money without Stripe.
>
> Right now, your quotes are informational. Customers see them, but they can't pay you through them. You're still handling payments the old way.
>
> Connecting takes about 5 minutes:
> - Go to Settings
> - Click "Connect Stripe"
> - Follow the Stripe setup prompts
>
> Once connected, deposits collect automatically when customers accept your quotes. That's the whole point.
>
> [Connect Stripe Now] → /settings

---

### 2.8 Day 5 – Workflow

| Field | Value |
|---|---|
| **Email Name** | Day 5 Workflow |
| **Email Key** | `day5_workflow` |
| **Trigger** | 5 days after registration |
| **Recipient** | Baker |
| **Subject** | `What happens when a baker goes pro.` |
| **Status** | Active |
| **Related Flow** | Onboarding |

**Body Copy:**

> Hi [Business Name],
>
> Here's what a typical BakerIQ workflow looks like:
> 1. Customer clicks your pricing calculator link
> 2. They get an instant estimate and submit their details
> 3. You get a lead notification with everything they selected
> 4. You send a professional quote with a deposit request
> 5. Customer accepts and pays — deposit hits your bank
>
> No DMs. No back-and-forth. No chasing.
>
> That's the system working for you instead of you working for the system.
>
> If you haven't sent a real quote to a customer yet, today is the day.
>
> [Send a Quote to a Customer] → /quotes

**Stripe P.S. (shown only if Stripe NOT connected):**

> P.S. Stripe not connected? That's the missing piece. [Connect Stripe] → /settings

---

### 2.9 Day 6 – Habit (Stripe connected)

| Field | Value |
|---|---|
| **Email Name** | Day 6 Habit |
| **Email Key** | `day6_habit` |
| **Trigger** | 6 days after registration, Stripe IS connected |
| **Recipient** | Baker |
| **Subject** | `Make this your new normal.` |
| **Status** | Active |
| **Related Flow** | Onboarding, Sharing |

**Body Copy:**

> Hi [Business Name],
>
> You have a pricing calculator, a quote system, and a payment tool. The only thing left is to use it consistently.
>
> Here's how to make the switch:
>
> **Share your calculator link publicly.** Add it to your Instagram bio, your Facebook page, or wherever customers find you. When someone asks "how much?", send the link instead of typing out prices.
>
> Every inquiry that comes through your calculator becomes a lead you can convert into a quote — and a quote you can convert into a paid order.
>
> Stop pricing in DMs. You have a better system now.
>
> [Copy Your Calculator Link] → /settings

---

### 2.10 Day 6 – Final Stripe Push (Stripe NOT connected, alternate)

| Field | Value |
|---|---|
| **Email Name** | Day 6 Final Stripe Push |
| **Email Key** | `day6_final_stripe_push` |
| **Trigger** | 6 days after registration, Stripe NOT connected |
| **Recipient** | Baker |
| **Subject** | `Last chance: connect Stripe and start getting paid.` |
| **Status** | Active |
| **Related Flow** | Onboarding, Stripe |

**Body Copy:**

> Hi [Business Name],
>
> This is the last email in your getting-started series, and your Stripe account still isn't connected.
>
> That means right now, you have a pricing calculator and a quote system — but no way to collect payment through them. Customers see your quotes but still have to pay you the old way.
>
> Five minutes is all it takes. Once connected:
> - Deposits collect automatically through your quotes
> - Payments go straight to your bank account
> - No more chasing customers for money
>
> This is the one step that turns BakerIQ from a nice tool into a real payment system for your business.
>
> [Connect Stripe Now] → /settings

---

## 3. Lead & Quote Transactional Emails

### 3.1 New Lead Notification (to Baker)

| Field | Value |
|---|---|
| **Email Name** | New Lead Notification |
| **Function** | `sendNewLeadNotification()` |
| **Trigger** | Customer submits an inquiry through the public order page |
| **Recipient** | Baker |
| **Subject** | `New Lead: [Customer Name] - [Estimated Total]` |
| **Status** | Active |
| **Related Flow** | Lead capture |

**Body Copy:**

> **New Lead Received!**
> A customer is interested in your creations
>
> **Lead Details**
> - Customer: [Customer Name]
> - Email: [Customer Email]
> - Phone: [Phone] *(if provided)*
> - Event Type: [Event Type] *(if provided)*
> - Event Date: [Event Date] *(if provided)*
> - Estimated Total: [Amount]
>
> Log in to your BakerIQ dashboard to view full details and follow up with this lead.

---

### 3.2 Lead Confirmation (to Customer)

| Field | Value |
|---|---|
| **Email Name** | Lead Confirmation to Customer |
| **Function** | `sendLeadConfirmationToCustomer()` |
| **Trigger** | Customer submits an inquiry through the public order page (sent simultaneously with baker notification) |
| **Recipient** | Customer |
| **Subject** | `Your [Cake/Treats] Inquiry - [Business Name]` |
| **Sender** | `"Your Baker at [Business Name]"` |
| **Status** | Active |
| **Related Flow** | Lead capture |

**Body Copy:**

> Hi [Customer Name],
>
> Thank you for your interest in our [custom cakes / treats]! We've received your inquiry and will get back to you soon.
>
> **Your Estimate Summary**
> - Event: [Event Type] *(if provided)*
> - Date: [Event Date] *(if provided)*
> - Estimated Total: [Amount]
>
> This is an estimate based on the options you selected. Final pricing may vary based on design complexity and specific requirements.
>
> Your baker will review your request and respond soon.
>
> Sweet regards,
> **[Business Name]**

---

### 3.3 Quote Sent Notification (to Customer)

| Field | Value |
|---|---|
| **Email Name** | Quote Notification |
| **Function** | `sendQuoteNotification()` |
| **Trigger** | Baker sends a quote to a customer |
| **Recipient** | Customer |
| **Subject** | `Your Quote from [Business Name] - [Total]` |
| **Sender** | `"Your Baker at [Business Name]"` |
| **Status** | Active |
| **Related Flow** | Quote submission |

**Body Copy (standard quote):**

> Hi [Customer Name],
>
> Great news! We've prepared a custom quote for your [cake order / treats order / order].
>
> **Quote #[Number]**
> Event Date: [Date]
>
> *Itemized sections: Cake, Treats, Decorations, Extras, Delivery, Other*
>
> - Subtotal: [Amount]
> - Tax ([Rate]%): [Amount]
> - **Total: [Amount]**
> - Deposit Required ([Percentage]%): [Amount] *(if configured)*
>
> Notes: [Baker's notes] *(if any)*
>
> [View Full Quote & Payment Details]
>
> To confirm your order, please respond to this email or contact us directly.
>
> Sweet regards,
> **[Business Name]**

**Body Copy (demo quote variant):**

> Here's your custom quote preview 👇
>
> *(Same itemized breakdown, no "Hi [Name]" greeting)*
>
> [Review Your Custom Quote]
>
> *This is a demo quote created during onboarding setup.*

---

### 3.4 Quote Response Notification (to Baker)

| Field | Value |
|---|---|
| **Email Name** | Quote Response Notification |
| **Function** | `sendQuoteResponseNotification()` |
| **Trigger** | Customer accepts or declines a quote |
| **Recipient** | Baker |
| **Subject** | `Quote [Accepted/Declined]: [Customer Name] - [Total]` |
| **Status** | Active |
| **Related Flow** | Quote acceptance/decline |

**Body Copy (Accepted):**

> **✓ Quote Accepted!**
> A customer has responded to your quote
>
> - Customer: [Name]
> - Email: [Email]
> - Quote: #[Number] - [Title]
> - Total: [Amount]
> - Status: **Accepted**
>
> Great news! Your customer has accepted this quote. Time to confirm the order details and collect the deposit.
>
> [View in Dashboard]

**Body Copy (Declined):**

> **✗ Quote Declined!**
> A customer has responded to your quote
>
> *(Same details as above)*
> - Status: **Declined**
>
> The customer has declined this quote. You may want to follow up to understand their needs better.
>
> [View in Dashboard]

---

## 4. Payment Notifications

### 4.1 Payment Received (to Baker)

| Field | Value |
|---|---|
| **Email Name** | Payment Received Notification |
| **Function** | `sendPaymentReceivedNotification()` |
| **Trigger** | Successful Stripe payment (deposit or full payment) for a quote |
| **Recipient** | Baker |
| **Subject** | `Payment Received: [Amount] from [Customer Name]` |
| **Status** | Active |
| **Related Flow** | Stripe payments |

**Body Copy:**

> **Payment Received!**
> [Deposit / Full Payment] for Quote #[Number]
>
> **[Amount]** *(large, centered)*
>
> - Customer: [Name]
> - Quote: [Title] (#[Number])
> - Payment Type: [Deposit / Full Payment]
> - Quote Total: [Total]
> - Total Paid: [Amount Paid]
>
> *(If paid in full):* This quote is now paid in full!
> *(If partial):* Remaining balance: [Amount]

---

## 5. Password & Account Management

### 5.1 Password Reset (Self-Service)

| Field | Value |
|---|---|
| **Email Name** | Password Reset |
| **Function** | `sendPasswordResetEmail()` |
| **Trigger** | Baker requests password reset from login page |
| **Recipient** | Baker |
| **Subject** | `Reset Your BakerIQ Password` |
| **Status** | Active |
| **Related Flow** | Account management |

**Body Copy:**

> **Password Reset Request**
>
> Hi,
>
> We received a request to reset your BakerIQ password. Click the button below to create a new password:
>
> [Reset Password]
>
> This link will expire in 1 hour.
>
> If you didn't request a password reset, you can safely ignore this email.

---

### 5.2 Admin Password Reset

| Field | Value |
|---|---|
| **Email Name** | Admin Password Reset |
| **Function** | `sendAdminPasswordReset()` |
| **Trigger** | Super admin resets a baker's password from the admin panel |
| **Recipient** | Baker |
| **Subject** | `Your BakerIQ Password Has Been Reset` |
| **Status** | Active |
| **Related Flow** | Admin account management |

**Body Copy:**

> **Password Reset by Admin**
>
> Hi [Business Name],
>
> A BakerIQ administrator has reset your password. Your temporary password is:
>
> `[Temporary Password]`
>
> **Important:** Please log in and change your password immediately for security.
>
> [Log In Now]
>
> If you did not request this password reset, please contact support immediately.

---

## 6. Retention / Re-engagement Emails

Retention emails are stored in the `retention_email_templates` database table and sent weekly by the retention scheduler. Bakers are segmented automatically based on activity. Each segment has one or more templates; the highest-priority active template is selected.

Bakers can opt out via `notifyRetention` preference.

### 6.1 Get Started – Share Your Link

| Field | Value |
|---|---|
| **Email Name** | Get Started – Share Your Link |
| **Segment** | `new_but_inactive` |
| **Priority** | 1 |
| **Trigger** | Weekly scheduler, baker is new but hasn't shared their link |
| **Recipient** | Baker |
| **Subject** | `Your quote link is ready to share` |
| **Preheader** | Start getting customer inquiries today |
| **Status** | Active |
| **Related Flow** | Activation |

**Body Copy:**

> Hi {{first_name}},
>
> Quick reminder: you have a custom calculator link ready to share with customers!
>
> When you share it, customers can get instant estimates and submit their info directly to you. No more back-and-forth pricing questions.
>
> [Copy Your Calculator Link] → /settings
>
> Try pasting it in your Instagram bio or sharing it when someone asks about pricing.

---

### 6.2 Set Up Your Pricing

| Field | Value |
|---|---|
| **Email Name** | Set Up Your Pricing |
| **Segment** | `new_but_inactive` |
| **Priority** | 0 |
| **Trigger** | Weekly scheduler, baker is new but inactive |
| **Recipient** | Baker |
| **Subject** | `5 mins to set your cake prices` |
| **Preheader** | Customize prices for your business |
| **Status** | Active |
| **Related Flow** | Activation, Pricing |

**Body Copy:**

> Hi {{first_name}},
>
> The default calculator prices might not match your business. Good news: you can customize them in about 5 minutes.
>
> Set your base prices for cake sizes, add your specialty flavors, and adjust decoration costs. Everything updates automatically on your public calculator.
>
> [Set Your Prices] → /pricing

---

### 6.3 Share Your Calculator Link

| Field | Value |
|---|---|
| **Email Name** | Share Your Calculator Link |
| **Segment** | `configured_not_shared` |
| **Priority** | 1 |
| **Trigger** | Weekly scheduler, baker has configured pricing but hasn't shared |
| **Recipient** | Baker |
| **Subject** | `Ready to get leads? Share your link` |
| **Preheader** | Your calculator is set up and ready |
| **Status** | Active |
| **Related Flow** | Activation, Sharing |

**Body Copy:**

> Hi {{first_name}},
>
> Great news! Your calculator is all set up with your custom pricing.
>
> Now it's time to put it to work. Share your link on:
> - Your Instagram bio or stories
> - Your Facebook business page
> - Direct messages when customers ask about pricing
> - Your website or Linktree
>
> [Copy Your Link] → /settings

---

### 6.4 Turn Leads Into Quotes

| Field | Value |
|---|---|
| **Email Name** | Turn Leads Into Quotes |
| **Segment** | `leads_no_quotes` |
| **Priority** | 1 |
| **Trigger** | Weekly scheduler, baker has leads but hasn't sent any quotes |
| **Recipient** | Baker |
| **Subject** | `You have leads waiting for quotes` |
| **Preheader** | Convert inquiries into bookings |
| **Status** | Active |
| **Related Flow** | Activation, Quotes |

**Body Copy:**

> Hi {{first_name}},
>
> You've got customer inquiries coming in! Now's the time to send them a professional quote.
>
> Click on any lead, hit "Create Quote", and customize the details. When you're ready, send it with one click. They'll get a beautiful email with your quote.
>
> [View Your Leads] → /leads

---

### 6.5 Track Accepted Quotes

| Field | Value |
|---|---|
| **Email Name** | Track Accepted Quotes |
| **Segment** | `quotes_no_orders` |
| **Priority** | 1 |
| **Trigger** | Weekly scheduler, baker has sent quotes but hasn't tracked orders |
| **Recipient** | Baker |
| **Subject** | `Keep your orders organized` |
| **Preheader** | Use your calendar to stay on top of events |
| **Status** | Active |
| **Related Flow** | Activation, Orders |

**Body Copy:**

> Hi {{first_name}},
>
> You've been sending quotes! When customers accept, you can track everything in your calendar.
>
> Accepted quotes automatically appear in your order calendar. You can see upcoming events, mark orders as completed, and keep everything organized in one place.
>
> [View Your Calendar] → /calendar

---

### 6.6 Power User Tips

| Field | Value |
|---|---|
| **Email Name** | Power User Tips |
| **Segment** | `active_power_user` |
| **Priority** | 1 |
| **Trigger** | Weekly scheduler, baker is actively using the platform |
| **Recipient** | Baker |
| **Subject** | `Tips from the BakerIQ team` |
| **Preheader** | Get more from your account |
| **Status** | Active |
| **Related Flow** | Engagement |

**Body Copy:**

> Hi {{first_name}},
>
> You're doing great! We noticed you've been active and wanted to share a quick tip:
>
> **Featured Items:** Upgrade to a paid plan and add seasonal specials to your calculator. Customers can order directly without going through the full quote process.
>
> Thanks for being part of BakerIQ. Keep up the great work!
>
> [Go to Dashboard] → /dashboard

---

### 6.7 Order Page Active

| Field | Value |
|---|---|
| **Email Name** | Order Page Active |
| **Segment** | `at_risk` |
| **Priority** | 1 |
| **Trigger** | Weekly scheduler, baker hasn't logged in for an extended period |
| **Recipient** | Baker |
| **Subject** | `Your customers are looking for you` |
| **Preheader** | Your order page is still live |
| **Status** | Active |
| **Related Flow** | Re-engagement |

**Body Copy:**

> Hi {{first_name}},
>
> Your order page is still active and ready for customers. Leads, quotes, and your calendar are waiting.
>
> Log in to check for new activity.
>
> [Log Back In] → /login

---

### 6.8 Quick Check-In

| Field | Value |
|---|---|
| **Email Name** | Quick Check-In |
| **Segment** | `at_risk` |
| **Priority** | 0 |
| **Trigger** | Weekly scheduler, baker at risk of churning |
| **Recipient** | Baker |
| **Subject** | `Have a question about setup or payments?` |
| **Preheader** | Support resources for your account |
| **Status** | Active |
| **Related Flow** | Re-engagement, Support |

**Body Copy:**

> Hi {{first_name}},
>
> If you have questions about setting up your order page, configuring pricing, or connecting Stripe, the Help Center covers it.
>
> You can also contact support directly.
>
> [Visit Help Center] → /help

---

### 6.9 Survey Invitation – Free Pro Month

| Field | Value |
|---|---|
| **Email Name** | Survey Invitation – Free Pro Month |
| **Segment** | `new_but_inactive` |
| **Priority** | 2 |
| **Trigger** | Weekly scheduler, baker is new but inactive (highest priority for this segment) |
| **Recipient** | Baker |
| **Subject** | `Quick question + free Pro upgrade` |
| **Preheader** | Take 2 mins, get a free month of Pro |
| **Status** | Active |
| **Related Flow** | Activation, Feedback |

**Body Copy:**

> Hi {{first_name}},
>
> We noticed you signed up for BakerIQ but haven't had a chance to fully set things up yet. We'd love to understand what's getting in the way.
>
> **Take 2 minutes to answer 4 quick questions, and we'll give you a free month of Pro** — no strings attached.
>
> Your feedback helps us make BakerIQ better for bakers like you.
>
> [Take Survey & Get Free Pro] → /feedback
>
> Pro includes unlimited quotes, featured items, and more.

---

## 7. Admin & Platform Emails

### 7.1 Admin Invitation

| Field | Value |
|---|---|
| **Email Name** | Admin Invitation |
| **Function** | `sendInvitationEmail()` |
| **Trigger** | Super admin invites a new baker from the admin panel |
| **Recipient** | Invited baker (new user) |
| **Subject** | `You've been invited to join BakerIQ` |
| **Status** | Active |
| **Related Flow** | Admin invitation |

**Body Copy:**

> **You're Invited to BakerIQ**
>
> Hi there,
>
> You've been invited to join **BakerIQ** as a **[Role]**. BakerIQ is a lead capture and quote management platform designed specifically for custom cake bakers.
>
> With BakerIQ you can:
> - Capture leads with a customizable cake pricing calculator
> - Create and send professional quotes
> - Accept payments through Stripe
> - Manage orders and customer relationships
>
> *(If gifted plan):* As part of this invitation, you'll receive **[X] month(s)** of our **[Plan] plan** at no cost!
>
> [Accept Invitation]
>
> This invitation link will expire in 7 days.

---

### 7.2 Platform Announcement Email

| Field | Value |
|---|---|
| **Email Name** | Platform Announcement |
| **Function** | `sendAnnouncementEmail()` |
| **Trigger** | Admin sends announcement from admin panel (batch or individual test) |
| **Recipient** | Baker |
| **Subject** | `What's New at BakerIQ: Stripe Payments, More Quotes & New Features` |
| **Status** | Active (manual send) |
| **Related Flow** | Platform communication |

**Body Copy:**

> Hi [Baker Name],
>
> We've been busy building new tools to help you capture more leads, close more orders, and get paid faster. Here's what's new:
>
> **Accept Payments with Stripe**
> - Get paid directly through quotes — customers can pay deposits or full amounts
> - Stripe Connect — connect your Stripe account in Settings; funds go straight to your bank
> - Automatic tracking — all payments logged in your dashboard
>
> **Updated Pricing & Quote Limits**
> - Free: 15 quotes/month (7% platform fee)
> - Basic: Unlimited (5% platform fee)
> - Pro: Unlimited (3% platform fee)
>
> **More New Features**
> - Custom calculator URL
> - Custom header image
> - Video tutorials
> - Improved dashboard
>
> **Tip:** Share your calculator link on social media to start receiving leads!
>
> **Earn Free Months — Refer a Friend:** Share your referral link with fellow bakers. Stack up to 12 free months.
>
> [Log In to Your Dashboard]

---

### 7.3 Dynamic Admin Email

| Field | Value |
|---|---|
| **Email Name** | Dynamic Admin Email |
| **Function** | `sendDynamicAdminEmail()` |
| **Trigger** | Admin composes and sends custom email from Admin Email Manager |
| **Recipient** | Baker (targeted by plan and/or Stripe status) |
| **Subject** | *(Custom — set by admin)* |
| **Status** | Active (manual send) |
| **Related Flow** | Admin communication |

**Body Copy:**

> *(Custom content authored by admin in the Email Manager UI)*
>
> Supports personalization tokens:
> - `{{Baker Name}}`
> - `{{Business Name}}`
> - `{{Calculator Link}}`
> - `{{Email}}`
> - `{{Plan}}`
> - `{{Referral Link}}`
>
> Auto-includes CTA: [Log In to Your Dashboard]

---

## 8. Affiliate / Partner Program Emails

### 8.1 Affiliate Application Confirmation (to Applicant)

| Field | Value |
|---|---|
| **Email Name** | Affiliate Application Confirmation |
| **Function** | `sendAffiliateApplicationConfirmation()` |
| **Trigger** | User submits partner application on /partners page |
| **Recipient** | Applicant |
| **Subject** | `We received your BakerIQ partner application` |
| **Status** | Active |
| **Related Flow** | Affiliate program |

**Body Copy:**

> **Application Received!**
> BakerIQ Founding Partners Program
>
> Hi [Name],
>
> Thanks for applying to the BakerIQ Founding Partners Program! We've received your application and are excited to review it.
>
> Our team reviews every application personally. You can expect to hear back from us within a few business days.
>
> In the meantime, feel free to explore [BakerIQ](https://bakeriq.app) to learn more about the platform and what your audience will love about it.
>
> Thanks for your interest,
> **The BakerIQ Team**

---

### 8.2 Affiliate Application Notification (to Admins)

| Field | Value |
|---|---|
| **Email Name** | Affiliate Application Notification |
| **Function** | `sendAffiliateApplicationNotification()` |
| **Trigger** | User submits partner application on /partners page (sent to all super_admin emails) |
| **Recipient** | Super Admin(s) |
| **Subject** | `New Partner Application: [Applicant Name]` |
| **Status** | Active |
| **Related Flow** | Affiliate program, Admin |

**Body Copy:**

> **New Partner Application**
> Someone wants to join the BakerIQ affiliate program
>
> **Application Details**
> - Name: [Name]
> - Email: [Email]
> - Social Media: [Link]
> - Followers: [Count or "Not specified"]
> - Niche: [Niche or "Not specified"]
> - Message: [Message or "No message"]
>
> [Review in Admin Dashboard]

---

## Summary Table

| # | Email Name | Recipient | Trigger | Subject | Status |
|---|---|---|---|---|---|
| 1 | Email Verification | Baker | Registration | Verify Your BakerIQ Account | Active |
| 2 | Day 0 Welcome | Baker | Registration (day 0) | You just upgraded how you get paid. | Active |
| 3 | Day 1 Pricing | Baker | Day 1 post-reg | Stop quoting in text messages. | Active |
| 4 | Day 2 Quotes | Baker | Day 2 post-reg | A real quote gets a real deposit. | Active |
| 5 | Day 3 Stripe Push | Baker | Day 3, no Stripe | You can't get paid if Stripe isn't connected. | Active |
| 6 | Day 3 Stripe Connected | Baker | Day 3, has Stripe | Stripe is connected. Now let's put it to work. | Active |
| 7 | Day 4 Deposit | Baker | Day 4, has Stripe | No deposit? No commitment. | Active |
| 8 | Day 4 Stripe Reminder | Baker | Day 4, no Stripe | Still haven't connected Stripe? | Active |
| 9 | Day 5 Workflow | Baker | Day 5 post-reg | What happens when a baker goes pro. | Active |
| 10 | Day 6 Habit | Baker | Day 6, has Stripe | Make this your new normal. | Active |
| 11 | Day 6 Final Stripe Push | Baker | Day 6, no Stripe | Last chance: connect Stripe and start getting paid. | Active |
| 12 | New Lead Notification | Baker | Customer submits inquiry | New Lead: [Name] - [Amount] | Active |
| 13 | Lead Confirmation | Customer | Customer submits inquiry | Your [Cake/Treats] Inquiry - [Business] | Active |
| 14 | Quote Notification | Customer | Baker sends quote | Your Quote from [Business] - [Total] | Active |
| 15 | Quote Response | Baker | Customer accepts/declines | Quote [Accepted/Declined]: [Name] - [Total] | Active |
| 16 | Payment Received | Baker | Stripe payment succeeds | Payment Received: [Amount] from [Name] | Active |
| 17 | Password Reset | Baker | Self-service request | Reset Your BakerIQ Password | Active |
| 18 | Admin Password Reset | Baker | Admin resets password | Your BakerIQ Password Has Been Reset | Active |
| 19 | Retention: Share Link | Baker | Weekly, new_but_inactive | Your quote link is ready to share | Active |
| 20 | Retention: Set Pricing | Baker | Weekly, new_but_inactive | 5 mins to set your cake prices | Active |
| 21 | Retention: Share Calculator | Baker | Weekly, configured_not_shared | Ready to get leads? Share your link | Active |
| 22 | Retention: Leads→Quotes | Baker | Weekly, leads_no_quotes | You have leads waiting for quotes | Active |
| 23 | Retention: Track Quotes | Baker | Weekly, quotes_no_orders | Keep your orders organized | Active |
| 24 | Retention: Power User | Baker | Weekly, active_power_user | Tips from the BakerIQ team | Active |
| 25 | Retention: Order Page Active | Baker | Weekly, at_risk | Your customers are looking for you | Active |
| 26 | Retention: Check-In | Baker | Weekly, at_risk | Have a question about setup or payments? | Active |
| 27 | Retention: Survey | Baker | Weekly, new_but_inactive | Quick question + free Pro upgrade | Active |
| 28 | Admin Invitation | New User | Admin sends invite | You've been invited to join BakerIQ | Active |
| 29 | Platform Announcement | Baker | Admin sends manually | What's New at BakerIQ... | Active |
| 30 | Dynamic Admin Email | Baker | Admin composes in Email Manager | *(Custom)* | Active |
| 31 | Affiliate Confirmation | Applicant | Partner app submission | We received your BakerIQ partner application | Active |
| 32 | Affiliate Admin Alert | Super Admin(s) | Partner app submission | New Partner Application: [Name] | Active |

---

## Email Infrastructure Notes

- **Provider:** AWS SES
- **Platform sender:** `"BakerIQ" <noreply@bakeriq.app>` (configurable via `AWS_SES_PLATFORM_EMAIL`)
- **Customer-facing sender:** `"Your Baker at [Business Name]" <noreply@bakeriq.app>` (configurable via `AWS_SES_CUSTOMER_EMAIL`)
- **Footer (baker emails):** Includes "Manage email preferences" link (token-based or /settings fallback)
- **Footer (customer emails):** "Powered by BakerIQ"
- **Onboarding scheduler:** Sends one email per day (days 0–6), branches on Stripe connection status
- **Retention scheduler:** Runs weekly (7-day interval), initial check 1 hour after server start, respects `notifyRetention` opt-out
- **Admin Email Manager:** Full CRUD for drafting/sending custom emails with audience targeting by plan and Stripe status
