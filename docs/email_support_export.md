# BakerIQ Email Support Language Export
_Last exported: 2026-02-22_
_Sources: server/email.ts, server/seed-retention-templates.ts_

---

## Baker Email Footer (all baker-facing emails)

"You're receiving this email because you have a BakerIQ account."
"Manage email preferences" → links to /email-preferences/{token} or /settings

---

## Customer Email Footer (all customer-facing emails)

[No support-related text in customer footer]

---

## Password Reset Email (server/email.ts)

**Subject:** "Reset Your BakerIQ Password"
**Support language:** "If you did not request this password reset, please contact support immediately."

---

## Password Reset Confirmation (server/email.ts)

**Subject:** "Your BakerIQ Password Has Been Reset"

---

## Email Verification (server/email.ts)

**Subject:** "Verify Your BakerIQ Account"

---

## Customer Confirmation Email (server/email.ts)

"This is an estimate based on the options you selected. Final pricing may vary based on design complexity and specific requirements."
"We typically respond within 24-48 hours. If you have any urgent questions, feel free to reach out directly."

---

## Onboarding Email Sequence (server/email.ts)

### Day 0 — Welcome
**Subject:** "Your order page is getting set up"
**CTA:** "Finish Setup"

### Day 1 — Pricing
**Subject:** "We set the foundation — you set the standard"
**CTA:** "Review Your Pricing"

### Day 2 — Launch
**Subject:** "Put this link in your bio today"
**CTA:** "Launch Your Order Page"

### Day 3 — First Request
**Subject:** "Stop typing prices — route them here"
**CTA:** "Copy Your Order Page Link"

### Day 4 — Stripe Connected
**Subject:** "You're ready to collect deposits automatically"
**CTA:** "Go to Quotes"

### Day 4 — Stripe Not Connected
**Subject:** "Want deposits to collect automatically?"
**CTA:** "Enable Automatic Deposits"

### Day 5 — Workflow
**Subject:** "Here's the full BakerIQ flow (the simple version)"
**CTA:** "Go to Requests"

### Day 6 — Habit
**Subject:** "The habit that makes this work"
**CTA:** "Copy Your Order Page Link"

---

## Milestone Emails (server/email.ts)

### Pricing Live
**Subject:** "Your order page is officially live 🎉"
**CTA:** "Copy Your Order Page Link"

### First Lead
**Subject:** "You just got your first request 🚀"
**CTA:** "View Request"

### First Quote Sent
**Subject:** "You just sent your first professional quote 💪"
**CTA:** "Go to Quotes"

### First Payment
**Subject:** "You just got paid through BakerIQ 💰"
**CTA:** "View Dashboard"

---

## Payment Received Email (server/email.ts)

**Subject:** "Payment Received: {amount} from {customerName}"

---

## Retention Emails (server/seed-retention-templates.ts)

### Segment: new_but_inactive — "Get Started - Share Your Link"
**Subject:** "Your quote link is ready to share"
**Preheader:** "Start getting customer inquiries today"
**Body:** "Quick reminder: you have a custom calculator link ready to share with customers! When you share it, customers can get instant estimates and submit their info directly to you. No more back-and-forth pricing questions."
**CTA:** "Copy Your Calculator Link"

### Segment: new_but_inactive — "Set Up Your Pricing"
**Subject:** "5 mins to set your cake prices"
**Preheader:** "Customize prices for your business"
**Body:** "The default calculator prices might not match your business. Good news: you can customize them in about 5 minutes. Set your base prices for cake sizes, add your specialty flavors, and adjust decoration costs. Everything updates automatically on your public calculator."
**CTA:** "Set Your Prices"

### Segment: configured_not_shared — "Share Your Calculator Link"
**Subject:** "Ready to get leads? Share your link"
**Preheader:** "Your calculator is set up and ready"
**Body:** "Great news! Your calculator is all set up with your custom pricing. Now it's time to put it to work. Share your link on: Your Instagram bio or stories, Your Facebook business page, Direct messages when customers ask about pricing, Your website or Linktree."
**CTA:** "Copy Your Link"

### Segment: leads_no_quotes — "Turn Leads Into Quotes"
**Subject:** "You have leads waiting for quotes"
**Preheader:** "Convert inquiries into bookings"
**Body:** "You've got customer inquiries coming in! Now's the time to send them a professional quote. Click on any lead, hit 'Create Quote', and customize the details. When you're ready, send it with one click. They'll get a beautiful email with your quote."
**CTA:** "View Your Leads"

### Segment: quotes_no_orders — "Track Accepted Quotes"
**Subject:** "Keep your orders organized"
**Preheader:** "Use your calendar to stay on top of events"
**Body:** "You've been sending quotes! When customers accept, you can track everything in your calendar. Accepted quotes automatically appear in your order calendar. You can see upcoming events, mark orders as completed, and keep everything organized in one place."
**CTA:** "View Your Calendar"

### Segment: active_power_user — "Power User Tips"
**Subject:** "Tips from the BakerIQ team"
**Preheader:** "Get more from your account"
**Body:** "You're doing great! We noticed you've been active and wanted to share a quick tip: Featured Items: Upgrade to a paid plan and add seasonal specials to your calculator. Customers can order directly without going through the full quote process. Thanks for being part of BakerIQ. Keep up the great work!"
**CTA:** "Go to Dashboard"

### Segment: at_risk — "We Miss You"
**Subject:** "Your customers are looking for you"
**Preheader:** "Get back to growing your business"
**Body:** "It's been a little while since you logged in. Just a friendly reminder that your calculator link is still active and ready for customers. If you're getting busy with orders (which is great!), we're here when you need us. Your leads, quotes, and calendar are all waiting for you."
**CTA:** "Log Back In"

### Segment: at_risk — "Quick Check-In"
**Subject:** "Need help with anything?"
**Preheader:** "We're here if you have questions"
**Body:** "Just checking in! If you've run into any issues or have questions about using BakerIQ, we're here to help. You can reach out through our support chat anytime. We want to make sure you get the most out of your account."
**CTA:** "Get Support"

### Segment: new_but_inactive — "Survey Invitation - Free Pro Month"
**Subject:** "Quick question + free Pro upgrade"
**Preheader:** "Take 2 mins, get a free month of Pro"
**Body:** "We noticed you signed up for BakerIQ but haven't had a chance to fully set things up yet. We'd love to understand what's getting in the way. Take 2 minutes to answer 4 quick questions, and we'll give you a free month of Pro - no strings attached. Your feedback helps us make BakerIQ better for bakers like you."
**CTA:** "Take Survey & Get Free Pro"
**Note:** "Pro includes unlimited quotes, featured items, and more."

---

## Invitation Email (server/email.ts)

**Subject:** "You've been invited to join BakerIQ"

---

## Announcement Email (server/email.ts)

**Subject:** "What's New at BakerIQ: Stripe Payments, More Quotes & New Features"

---

## Partner Application Confirmation (server/email.ts)

**Subject:** "We received your BakerIQ partner application"
**Body:** "Thanks for applying, {name}! We've received your application to the BakerIQ Founding Partners Program. Our team reviews every application personally. You can expect to hear back from us within a few business days. In the meantime, feel free to explore BakerIQ to learn more about the platform."

---

## Admin Notification — New Partner Application (server/email.ts)

**Subject:** "New Partner Application: {name}"

---

## Admin Dynamic Emails (server/email.ts)

Available personalization tokens: {{Baker Name}}, {{Business Name}}, {{Calculator Link}}, {{Email}}, {{Plan}}, {{Referral Link}}
[Admin-authored content — not hardcoded templates]
