# BakerIQ Support & System Copy Export
_Last exported: 2026-02-22_

---

## From: client/src/components/support-chat.tsx

"Hi! I'm your BakerIQ support assistant. How can I help you today? Ask me about pricing, leads, quotes, orders, or any other features!"

---

## From: client/src/components/onboarding-tour.tsx (Dashboard Tour Steps)

**Step: Set Your Prices**
"Start here! Set up your pricing so your order page shows accurate estimates to customers."

**Step: Express Items**
"Need help figuring out what to charge? Use this tool to calculate prices based on your costs and desired profit."

**Step: Manage Leads**
"When customers use your calculator and submit inquiries, they'll appear here as new leads."

**Step: Create Quotes**
"Convert leads into detailed quotes. Send them to customers with just a click!"

**Step: Order Calendar**
"Track your upcoming orders and event dates. Never miss a delivery!"

**Step: Settings & Payments**
"Add your business details, social media links, and connect your Stripe account to accept payments directly from customers on your quotes."

**Step: Payment Tracking**
"Once you connect Stripe, track all your customer payments here. See deposits, full payments, and your total earnings at a glance."

**Step: Get Support**
"Need help? Click this button anytime to chat with our AI assistant or create a support ticket!"

**Welcome Dialog Title:** Welcome to BakerIQ!
**Welcome Dialog Text:** "Let's take a quick tour to help you get started. We'll show you where to set up your pricing, manage leads, and send quotes."

---

## From: client/src/components/onboarding-checklist.tsx (Activation Checklist)

**Title:** Launch Your Bakery

**Checklist Items:**
- "Add bakery branding" → action: Settings
- "Send your first test quote" → action: View Quote / Create Quote
- "Share Your Order Page" → action: Copy Link
- "Activate secure payments" → action: Connect Stripe

**Context Message (when quote sent but no Stripe):**
[Dynamic — varies by baker state]

**Link Copied Toast:**
- Title: "Link copied!"
- Description: "Share it on social media, your website, or directly with customers."

**Link Copy Failed Toast:**
- Title: "Failed to copy"
- Description: "Could not copy the link to clipboard."

---

## From: client/src/components/stripe-connect-modal.tsx

**Title:** "Connect Stripe to start getting paid"
**Description:** "Connecting Stripe takes a few minutes and lets you collect deposits and payments directly through BakerIQ."

**Benefits List:**
- "Collect deposits upfront on orders"
- "Accept full payments through quotes"
- "Get paid directly to your bank account"
- "Track all payments in one place"

**Buttons:** "Not now" | "Connect Stripe" | "Setting up..."

---

## From: client/src/components/stripe-connect-nudge.tsx

**Title:** "Connect Stripe to accept payments"
**Description:** "Connect Stripe to accept deposits and payments on invoices."
**Buttons:** "Connect Stripe" | "Setting up..."

---

## From: client/src/components/stripe-activation-modal.tsx (Post-Stripe-Connect Modal)

**Title:** "Payments Activated"
**Description:** "Now let's put it to work."
**Body:** "Send your calculator link to anyone who asked about pricing recently. Don't reply with a number — reply with your link. Then send your first quote and collect your first deposit."

**Buttons:**
- "Copy Calculator Link"
- "Download QR Code"
- "Send Your First Quote"

**Tip:** "Send your link to everyone who DM'd you about pricing in the last 30 days."

**Toast (copy):** "Calculator link copied!"
**Toast (QR):** "QR code downloaded!"
**Toast Errors:** "Failed to copy link" | "Failed to download QR code"

---

## From: client/src/components/stripe-interstitial-modal.tsx

**Title:** "Activate Automatic Deposits"
**Description:** "You're about to complete a quick, secure setup with Stripe."
**Steps shown:**
- "Connect your payout account"
- "Start collecting deposits automatically"
**Footer:** "Secured by Stripe"

---

## From: client/src/components/instruction-modal.tsx (Page Help Modals)

### Pricing Calculator Help
**Title:** Express Items
**Description:** "Calculate your costs and set profitable prices for any cake or treat."
- **How It Works:** "Enter your material costs, labor hours, and overhead percentage. The calculator will compute your total costs and suggest a selling price based on your desired profit margin."
- **Saving Calculations:** "Give your calculation a name and click Save to store it for future reference. You can load saved calculations anytime and use them as templates for similar orders."
- **Creating Quotes:** "Click the document icon next to any saved calculation to instantly create a new quote with that item pre-filled. This saves time when quoting repeat items."
- **Adding to Quotes:** "From the Quote Builder, use 'Add from Express Items' to search and add any of your saved calculations as line items, complete with cost breakdown tracking."
- **Express Items:** "Showcase your best items on your order page. Customers can select these items directly for quick ordering. Free: 1 item, Basic: 5 items, Pro: unlimited. Use the eye icon to control visibility."
- **Pro Tip:** "Set up calculations for your most popular items to speed up your quoting process!"

### Quote Builder Help
**Title:** Quote Builder
**Description:** "Create professional quotes to send to your customers."
- **Creating a Quote:** "Select a customer (or create one), add a title, and set an event date if applicable. Then add line items for each product or service you're quoting."
- **Line Items:** "Add items manually or pull them from your Express Items. Items from the calculator show a calculator icon with a cost breakdown tooltip when you hover over it."
- **From Express Items:** "Click 'Add from Express Items' to search your saved calculations. Select one to add it as a line item with all the pricing details preserved."
- **Sending Quotes:** "Once your quote is ready, click 'Send Quote' to email it to your customer. They'll receive a professional PDF with all the details."
- **Converting to Orders:** "When a customer accepts, click 'Convert to Order' to move it to your calendar for fulfillment tracking."
- **Pro Tip:** "Use the notes field to include terms, deposit requirements, or special instructions!"

### Pricing Setup Help
**Title:** Pricing Setup
**Description:** "Configure your base prices for cakes, treats, and delivery options."
- **Cake Pricing:** "Set base prices by cake size and shape. These prices appear on your order page when customers build their cake requests."
- **Flavor & Frosting:** "Configure prices for different cake flavors and frosting types. You can add premium pricing for specialty options."
- **Decorations & Add-ons:** "Set up decoration categories and add-ons like cake toppers, edible images, or special finishes with their associated costs."
- **Treats:** "Configure pricing for individual treats like cupcakes, cake pops, cookies, and more. Set per-unit prices that will be multiplied by quantity."
- **Delivery Options:** "Define your delivery zones and pricing. You can offer pickup (free) or various delivery tiers based on distance or complexity."
- **Pro Tip:** "Review your pricing regularly to ensure it covers your costs and provides healthy margins!"

### Settings Help
**Title:** Settings
**Description:** "Manage your bakery profile, subscription, and account preferences."
- **Bakery Profile:** "Update your bakery name, contact information, and order page URL slug. Your slug appears in your order page link that you share with customers."
- **Subscription Plan:** "View your current plan and quote usage. Upgrade to Basic or Pro for more monthly quotes and premium features like Express Items."
- **Email Notifications:** "Configure which email notifications you receive, including new lead alerts and quote activity updates."
- **Account Security:** "Update your password and manage your account access. Keep your login credentials secure."
- **Data Export:** "Export your customer data, quotes, and orders for backup or use in other systems."
- **Pro Tip:** "Customize your order page URL to match your bakery brand!"

---

## From: client/src/pages/onboarding.tsx

**Page Title:** "Set up your bakery"
**Subtitle:** "Just a few steps to get started"

**Step 1: Tell us about your bakery**
"This info appears on your order page."
- Placeholder: "e.g. Sweet Creations by Jane"

**Step 5: Accept payments from customers**
"Connect Stripe to let customers pay deposits and invoices directly through your quotes."
- Connected state: "Stripe is connected!" / "You're ready to accept payments."
- Not connected: "Connect Stripe"

**Toast (link copied):** Title: "Link copied!" Description: "Share it on social media or your website."

---

## From: client/src/pages/payments.tsx

**Stripe Activation Card (not connected):**
"Enable Online Payments"
"Connect Stripe to collect deposits automatically."

**Stripe Activation Card (connected):**
Badge: "Stripe Connected"
"Collecting deposits automatically from quotes."

**Card Title:** "Deposit Settings"

---

## From: client/src/pages/dashboard.tsx

**Empty State:** "No leads yet"

---

## From: client/src/pages/quotes.tsx

**Empty State:** "Create your first quote to get started"

---

## From: client/src/pages/payments.tsx

**Empty State:** "No payments yet"

---

## From: client/src/pages/pricing-calculator.tsx

**Empty State:** "No saved calculations yet."

---

## From: client/src/pages/share.tsx

**Empty Express Items:** "You don't have any express items yet."

**Sharing Tips (Share Page):**
- "Share between 10am-2pm and 6-9pm when people are browsing and planning."
- "Posts with photos of your creations get more engagement. Pair your link with your best shots."
- "Short videos of your process or finished items perform great. Add your link sticker."
- "Print your QR code on business cards, packaging, and booth displays for in-person events."

**Order Page Launched Toast:** Title: "✔ Order Page Launched" Description: "Link copied to clipboard!"

---

## From: client/src/pages/quote-builder.tsx

**Empty State:** "No saved calculations yet"
**Empty State:** "No items added yet"

---

## From: client/src/pages/calculator.tsx

"Once payment is received, we'll confirm your order and get started!"

---

## From: client/src/pages/email-preferences.tsx

### Activity Toggles
- **New Lead Alerts:** "Get notified when someone submits your calculator"
- **Quote Viewed:** "Get notified when a customer views their quote"
- **Quote Accepted:** "Get notified when a customer accepts a quote"

### Marketing Toggles
- **Onboarding Tips:** "Helpful tips to get started with BakerIQ"
- **Engagement Reminders:** "Periodic reminders and tips to grow your business"
- **Announcements & Updates:** "New features, updates, and platform news"

---

## From: client/src/pages/settings.tsx

"Helpful tips to get started with BakerIQ" (onboarding notification description)

---

## From: client/src/pages/admin.tsx (Admin Panel — Internal)

**Empty States:**
- "No emails yet. Create your first one to get started."
- "No invitations sent yet"
- "No bakers with gifted plans yet"
- "No affiliates match your search." / "No affiliates yet. Enable a baker as an affiliate above."
- "No affiliate applications yet. Share your /partners page to receive applications."
- "No support tickets yet"
- "No messages yet"
- "No email logs yet"
- "No payments recorded yet"
