# BakerIQ FAQ Export
_Last exported: 2026-02-22_
_Source: client/src/pages/faq.tsx_

---

## Page Title
Frequently Asked Questions

## Page Intro
Find answers to the most common questions about BakerIQ.

---

## Category: Getting Started

### Q: How do I create my calculator?
When you sign up for BakerIQ, your unique order page is created automatically. It's available at a URL based on your business name (e.g., /c/your-bakery-name). You can find your order page URL in the Settings page of your dashboard.

### Q: How do I set my pricing?
Go to 'Pricing' in your dashboard. There you can set prices for cake sizes, adjust pricing for premium flavors and frostings, configure decoration prices, and set up addons like dipped strawberries or delivery fees.

### Q: Can I customize what options appear in my calculator?
Yes! For treats, you can enable or disable specific items (cupcakes, cake pops, cookies, etc.) from Pricing. For cakes, all options are available with fully customizable pricing.

### Q: What can customers order through the calculator?
The calculator supports two categories: Cakes (multi-tier custom cakes with sizes, shapes, flavors, frostings, decorations, and addons) and Treats (cupcakes, cake pops, cookies, brownies, dipped strawberries, and more).

---

## Category: Leads & Quotes

### Q: What happens when someone uses my calculator?
When a customer completes your calculator and submits their information, a new lead is automatically created in your dashboard. You'll receive an email notification, and the customer receives a confirmation email with their estimate.

### Q: How do I convert a lead to a quote?
Open any lead from your Leads page, then click 'Create Quote'. The quote builder will open with the customer's information and cake details pre-filled. You can add, edit, or remove line items, then save or send the quote.

### Q: What's the difference between a lead and a quote?
A lead is an initial inquiry from a customer, containing their contact info and cake preferences. A quote is a formal price estimate you create and send to the customer. One lead can have multiple quotes if the customer requests changes.

### Q: How do I track quote status?
Quotes can have several statuses: Draft (being worked on), Sent (delivered to customer), Accepted (customer approved), Declined (customer rejected), or Expired (past the expiration date). Update the status as you work with the customer.

---

## Category: Orders & Calendar

### Q: How do I create an order?
Orders can be created from accepted quotes, or you can create them directly from the Orders page. Orders appear on your calendar so you can track upcoming deliveries and pickups.

### Q: How does the calendar work?
The Order Calendar shows all your confirmed orders organized by date. Use the search bar to find specific orders by customer name, title, or event type. Click on any order to view full details.

### Q: Can I track deposits and payments?
Yes! Each order tracks total amount, deposit paid, and balance due. You can configure your default deposit percentage and accepted payment methods in Pricing settings.

---

## Category: Pricing & Payments

### Q: How do I figure out what to charge for my baked goods?
Use the Express Items page in your dashboard. Enter your material costs, estimated labor time, hourly rate, and overhead percentage to get a suggested price. You can save calculations for reference and use them to set your order page prices.

### Q: What is Express Items?
Express Items is an internal tool to help you determine fair prices. It calculates: Material Cost + (Labor Hours x Hourly Rate) + Overhead = Suggested Price. It also shows your profit margin so you can make informed pricing decisions.

### Q: What hourly rate should I use?
Most home bakers charge between $20-35 per hour. Consider your skill level, local market rates, and the complexity of your work. The Express Items tool shows tips to help you decide.

### Q: How do I set up addons like dipped strawberries?
Go to Pricing, scroll to the Addons section. You can set prices for pre-configured addons. Some addons like Dipped Strawberries have a flat price, while others like Full Sweets Table are priced per attendee.

### Q: Can I set up delivery fees?
Yes! In Pricing, there's a Delivery & Setup section where you can set prices for Standard Delivery, Express/Rush Delivery, and Full Setup Service options.

### Q: What payment methods can I accept?
You can accept credit/debit card payments directly through your quotes by connecting Stripe in Settings. Once connected, customers will see a 'Pay Now' button on quotes you send.

### Q: How do deposits work?
Set your default deposit percentage in Pricing. When you create quotes and orders, the deposit amount is automatically calculated. You can track deposit status on each order.

---

## Category: Stripe Connect & Payments

### Q: How do I accept payments from customers?
Go to Settings in your dashboard and click 'Connect with Stripe' to link your Stripe account. Once connected, customers will see a 'Pay Now' button on quotes you send them. They can pay a deposit or the full amount using credit/debit cards through Stripe's secure checkout.

### Q: What is Stripe Connect?
Stripe Connect lets you accept payments directly into your own Stripe account. BakerIQ uses it so your customers can pay you securely online. You keep control of your funds, and payouts go straight to your bank account through Stripe.

### Q: Is there a fee for accepting payments?
BakerIQ charges a platform fee that varies by plan: 7% on Free, 5% on Basic, and 3% on Pro. Stripe also charges their standard processing fee (2.9% + $0.30 per transaction). Upgrading your plan lowers your total cost per transaction.

### Q: What are the total fees on a typical order?
On a $300 cake order, here's what the total fees look like by plan: Free plan: $21.00 BakerIQ fee (7%) + $9.00 Stripe fee (2.9% + $0.30) = $30.00 total, you receive $270.00. Basic plan ($4.99/mo): $15.00 BakerIQ fee (5%) + $9.00 Stripe fee = $24.00 total, you receive $276.00. Pro plan ($9.99/mo): $9.00 BakerIQ fee (3%) + $9.00 Stripe fee = $18.00 total, you receive $282.00.

### Q: How does BakerIQ compare to other platforms?
BakerIQ is an all-in-one tool that replaces separate subscriptions for a website builder, booking system, and invoicing software. For comparison: HoneyBook charges $19-$39/month plus 2.9% + $0.25 per transaction. 17hats charges $15-$60/month plus payment processing fees. Square charges 3.5% + $0.15 per online transaction with no quoting tools. With BakerIQ Pro at just $9.99/month and 3% platform fee, you get an order page, lead capture, quoting, order calendar, and payment processing — all in one place.

### Q: Can customers pay a deposit instead of the full amount?
Yes! When viewing a quote, customers can choose to pay a deposit or the full amount. The deposit percentage is based on your settings. You can track partial payments and remaining balances on the Payments page.

### Q: How do I track payments I've received?
Go to the Payments page in your dashboard. You'll see your total revenue, number of transactions, and a detailed list of every payment with customer name, quote details, amount, and date. You also receive an email notification for each payment.

### Q: Do I need a Stripe account to use BakerIQ?
A Stripe account is only needed if you want to accept online payments through your quotes. You can use all other BakerIQ features (calculator, leads, quotes, calendar) without Stripe.

### Q: How do I disconnect my Stripe account?
You can manage your Stripe connection from the Settings page. If you need to disconnect, contact support. Note that disconnecting will remove the 'Pay Now' button from your quotes.

---

## Category: Email Notifications

### Q: What emails does BakerIQ send?
BakerIQ sends automatic emails for: new lead notifications (to you), lead confirmation (to the customer), and quote notifications (to the customer). All emails use your business name and branding.

### Q: Can I customize the email templates?
Email templates currently use BakerIQ's professional design with your business name. Custom email templates are on our roadmap for a future update.

### Q: What if I don't receive email notifications?
Make sure you've verified your email address and check your spam folder. Email notifications require proper AWS SES configuration. If issues persist, contact support.

---

## Category: Account & Settings

### Q: How do I change my business name?
Go to Settings in your dashboard. You can update your business name, contact phone, and address. Note that changing your business name won't change your order page URL — you can customize that separately from Your Order Page.

### Q: Can I have multiple calculators?
Currently, each BakerIQ account has one order page. If you need multiple order pages for different business lines, you would need separate accounts.

### Q: How do I share my calculator?
The easiest way is to use the Your Order Page section in your dashboard. It gives you one-click sharing to Facebook, Instagram, Twitter/X, Pinterest, WhatsApp, and LinkedIn — with ready-made captions you can customize. You can also download a QR code to print on business cards or flyers, and customize your URL. The URL format is: /c/your-bakery-slug

### Q: What is the Share page?
The Share page is a built-in tool in your dashboard that makes it easy to promote your calculator on social media. It includes sharing buttons for all major platforms, caption templates organized by category (General, Wedding, Events, Express Items, Seasonal), a social media banner creator with pre-made designs and custom photo upload, a downloadable QR code, and per-item sharing for express items.

### Q: How do I create a social media banner?
Go to the Share page and scroll to Social Media Banners. Choose from four pre-made designs (Elegant Wedding, Fun Birthday, Clean Modern, or Holiday Seasonal) or upload your own cake photo. Your business name is automatically added to the banner. Click 'Download Banner' to save it as a ready-to-post image. The banner is 1200x630 pixels, which is the ideal size for Facebook and LinkedIn posts. For Instagram, you can crop the downloaded image to a square.

### Q: What size photo should I upload for a social banner?
Any photo will work — the banner maker automatically crops and fits your image to 1200x630 pixels. For best results, use a landscape (horizontal) photo that's at least 1200 pixels wide. Photos of your finished cakes, treats, or your workspace work great.

### Q: How do I reset my password?
Click 'Forgot password?' on the login page and enter your email address. You'll receive a password reset link that's valid for 1 hour. Follow the link to set a new password.

### Q: How do I verify my email address?
When you sign up, we send a verification email to your address. Click the link in that email to verify. If you didn't receive it, you can request a new verification email from your Settings page.

### Q: How do I add my social media links?
Go to Settings and scroll to the Social Media section. You can add your Facebook, Instagram, TikTok, and Pinterest handles or URLs. These will appear in your calculator header so customers can find you.

---

## Category: Subscription & Plans

### Q: What plans are available?
BakerIQ offers three plans: Free (unlimited quotes, 1 Express Item, 7% platform fee), Basic ($4.99/month, unlimited quotes, up to 5 Express Items, 5% fee), and Pro ($9.99/month, unlimited quotes, unlimited Express Items, 3% fee). All plans include unlimited leads and Stripe Connect for accepting payments.

### Q: Are quotes limited?
No! All plans include unlimited quotes. You can create and send as many quotes as you need. Leads from your order page are always unlimited too.

### Q: What's the difference between Basic and Pro?
Basic ($4.99/mo) gives you unlimited quotes, up to 5 express items, and a 5% platform fee. Pro ($9.99/mo) gives you unlimited quotes, unlimited express items, and the lowest 3% platform fee. Both plans include all core features like lead management, customer tracking, and email notifications.

### Q: How do I upgrade my plan?
Go to Settings in your dashboard and scroll to the Subscription section. You can upgrade to Basic or Pro, and manage your subscription through Stripe's secure portal.

### Q: Can I cancel or downgrade my subscription?
Yes! Click 'Manage Subscription' in Settings to access the Stripe portal. You can cancel anytime, and your paid features will remain active until the end of your billing period.

---

## Category: Referral Program

### Q: How does the referral program work?
Every BakerIQ baker gets a unique referral link. When someone signs up using your link and subscribes to a paid plan, you earn a reward. Paid plan bakers get 1 free month of their subscription. Free plan bakers get 1 month of Express Items access. You can earn up to 12 months of stacked credits.

### Q: Where do I find my referral link?
Go to 'Refer a Friend' in your dashboard sidebar. Your unique referral link is displayed there and ready to copy. Share it on social media, in group chats, or anywhere bakers hang out.

### Q: When do I get my referral credit?
Your credit is awarded automatically when the baker you referred subscribes to a paid plan (Basic or Pro). You'll see the credit reflected on your Refer a Friend page.

### Q: Is there a limit to how many referrals I can make?
You can refer as many bakers as you like. The credit cap is 12 months — once you've earned 12 months of free subscription (or Express Items access), additional referrals won't add more credits.

### Q: What's the difference between the referral program and the affiliate program?
The referral program is available to every baker and rewards you with free months of service. The affiliate program is an invite-only program for influencers and content creators who earn cash commissions (20% of subscription revenue) for referring new bakers. You can apply for the affiliate program on our Partners page.

### Q: Do I get credit if the person I referred stays on the free plan?
No — referral credits are awarded when the referred baker subscribes to a paid plan. If they stay on the free plan, the referral is tracked but no credit is awarded yet. You'll receive the credit automatically if they upgrade later.

---

## Category: Express Items

### Q: What is Express Items?
Express Items lets you feature your pricing calculations on your order page. Customers can select an express item and submit an inquiry in just a few clicks, skipping the full cake/treat builder. Available on Basic and Pro plans.

### Q: How do I feature an item?
Go to Express Items in your dashboard and save a pricing calculation. Then click the star icon next to any saved calculation to feature it. Use the eye icon to control whether it appears in Quick Order. You can unfeature it anytime by clicking the star again.

### Q: What are the plan limits for Express Items?
Free plan: Express Items is not available. Basic plan ($4.99/month): Up to 5 express items. Pro plan ($9.99/month): Unlimited express items. The limits only apply to how many items you can feature, not how many orders you receive.

### Q: Where do express items appear?
Express items appear at the top of your order page in a special 'Quick Order' section with a lightning bolt icon. Use the eye icon in Express Items to control which express items show in Quick Order.

### Q: How do Express Items leads work?
When a customer orders through Express Items, the lead appears in your dashboard with a special lightning bolt badge. You can click 'Quick Quote' to instantly create a quote with the item name, price, and details pre-filled.

### Q: Why can't I feature items?
Express Items requires at least the Basic plan ($4.99/month). If you're on the Free plan, upgrade in Settings to unlock Express Items. Basic allows 5 express items, Pro allows unlimited.

---

## Category: Customers

### Q: How do I manage my customers?
Go to Customers in your dashboard to view, add, and edit customer records. Each customer has contact info, notes, and links to their quotes and orders.

### Q: Are customers created automatically?
When you create a quote from a lead, BakerIQ will try to match the customer by email. If no match is found, you can create a new customer record with one click from the quote builder.

### Q: Can I see a customer's order history?
Yes! Click on any customer to view their profile, which shows all associated quotes and orders. This helps you track repeat customers and their preferences.

---

## Category: Troubleshooting

### Q: Why isn't my calculator showing my updated prices?
Prices update immediately after you save them in Pricing. Try refreshing your browser or clearing your cache. If prices still don't appear, make sure you clicked 'Save Prices' after making changes.

### Q: A customer says they didn't receive an email - what should I do?
Ask them to check their spam/junk folder first. Customer confirmation emails are sent automatically when they submit the calculator. If emails consistently aren't being delivered, contact support to check your email configuration.

### Q: How do I delete a lead or quote?
You can delete leads from the lead detail page and quotes from the quote builder. Look for the delete button (trash icon) in the page header. Note that deleting is permanent and cannot be undone.

### Q: My calendar isn't showing all my orders - why?
Only orders with an event date appear on the calendar. Make sure your orders have event dates set. Also check that the order status isn't 'Cancelled' - cancelled orders are hidden from the calendar.

### Q: Can I recover a deleted lead or quote?
Unfortunately, deleted items cannot be recovered. We recommend updating the status to 'Lost' instead of deleting if you might need to reference the information later.

---

## Footer Callout
### Didn't find your answer?
Check out our detailed Help Center or contact support directly.

**Buttons:** Visit Help Center | Contact Support (mailto:support@bakeriq.app)
