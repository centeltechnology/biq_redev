# BakerIQ Platform Overview

## What is BakerIQ?

BakerIQ is a lead capture and quote management platform designed specifically for custom cake bakers and bakery businesses. The platform streamlines the process of receiving customer inquiries, generating professional quotes, and managing customer relationships—all from one centralized dashboard.

Whether you're a home baker just starting out or an established bakery handling dozens of orders per week, BakerIQ helps you present a professional image, capture more leads, and convert inquiries into paying customers.

---

## Who is BakerIQ For?

- **Custom Cake Bakers**: Wedding cakes, birthday cakes, specialty occasion cakes
- **Home Bakers**: Small-scale bakers looking to professionalize their business
- **Bakery Businesses**: Established bakeries wanting better lead and quote management
- **Treat Makers**: Bakers specializing in cupcakes, cake pops, cookies, and other sweet treats

---

## Current Features

### Public Pricing Calculator
Each baker gets a unique public calculator URL (e.g., `/c/your-bakery-name`) that customers can use to:
- **Cake Builder**: Configure multi-tier cakes with size, shape, flavor, frosting, decorations, and add-ons
- **Treats Selector**: Browse and select treats like cupcakes, cake pops, cookies, brownies, and dipped strawberries
- **Instant Estimates**: See real-time pricing based on the baker's configured rates
- **Lead Submission**: Submit their request directly to the baker with event details and contact information

### Lead Management
- Receive and track all incoming inquiries from the public calculator
- View lead details including customer info, event date, and requested items
- Status tracking: New, Contacted, Quoted, Converted, Lost
- Convert leads to customers and quotes with one click

### Quote Management
- Create detailed quotes with itemized line items
- Support for cakes, treats, delivery fees, and custom items
- Professional quote presentation
- Send quotes via email to customers
- Track quote status: Draft, Sent, Viewed, Accepted, Declined

### Customer Management
- Maintain a database of all your customers
- View customer history including past quotes and orders
- Add notes and contact information
- Link customers to leads and quotes

### Order Calendar
- Visual calendar view of all upcoming orders
- See orders by day, week, or month
- Quick overview of your schedule and workload

### Customizable Pricing
- **Cake Pricing**: Set base prices by size and shape, add-on pricing for decorations
- **Treat Catalog**: Define your treat offerings with individual pricing
- **Decorations & Add-ons**: Configure custom decorations and additional services
- **Delivery Options**: Set delivery fees and setup charges

### Subscription Plans
BakerIQ offers a freemium model with three tiers:

| Plan | Price | Quotes/Month | Features |
|------|-------|--------------|----------|
| **Free** | $0 | 5 quotes | Unlimited leads, full dashboard access |
| **Basic** | $9.97/mo | 15 quotes + 5 featured items | Everything in Free + more quote capacity |
| **Pro** | $29.97/mo | Unlimited | Full platform access with no limits |

*Note: Leads are always unlimited. Quote limits only apply when sending quotes to customers.*

### Email Notifications
- Automated email notifications via AWS SES
- New lead notifications sent to bakers
- Quote delivery to customers
- Professional email templates with baker branding

### Onboarding Experience
- **Welcome Email Series**: 8-day automated email series introducing platform features
- **Interactive Tour**: Guided walkthrough of the dashboard for new users
- **Restart Tour**: Option to replay the tour anytime from Settings

### Authentication & Security
- Secure email/password authentication with bcrypt hashing
- Session management with PostgreSQL session store
- Password reset via email
- Email verification for new accounts

### Super Admin Dashboard
- Platform-wide analytics and user management
- View all bakers and their subscription status
- System monitoring and administration tools

### Social Media Integration
- Add social media links to your public calculator page
- Connect Instagram, Facebook, TikTok, and more
- Build your brand presence alongside your pricing calculator

---

## Future Features (Roadmap)

### Payment Processing
- **Stripe Connect Integration**: Accept deposits and payments directly through quotes
- **Deposit Requests**: Request partial payment to secure bookings
- **Payment Tracking**: See which quotes have been paid

### AI-Powered Features
- **Smart Pricing Suggestions**: AI recommendations based on market rates
- **Quote Templates**: AI-generated quote text and descriptions
- **Lead Scoring**: Automatically prioritize high-value leads

### Marketplace
- **Baker Directory**: Public listing of bakers for customers to discover
- **Search & Filter**: Find bakers by location, specialty, and availability
- **Reviews & Ratings**: Customer feedback and testimonials

### Advanced Analytics
- **Revenue Tracking**: See your earnings over time
- **Conversion Metrics**: Lead-to-quote and quote-to-order conversion rates
- **Popular Items**: Identify your best-selling products
- **Seasonal Trends**: Understand busy periods and plan accordingly

### Mobile Application
- **iOS & Android Apps**: Manage your business on the go
- **Push Notifications**: Instant alerts for new leads
- **Mobile Quote Creation**: Create quotes from your phone

### Enhanced Communication
- **SMS Notifications**: Text message alerts for leads and quotes
- **In-App Messaging**: Direct communication with customers
- **Automated Follow-ups**: Scheduled reminders for pending quotes

### Inventory & Supplies
- **Ingredient Tracking**: Monitor your baking supplies
- **Cost Calculation**: Understand true costs per item
- **Reorder Alerts**: Get notified when supplies run low

### Team Collaboration
- **Multiple Users**: Add team members to your account
- **Role Permissions**: Control who can view and edit what
- **Task Assignment**: Delegate orders to team members

### Contract & Terms
- **Digital Contracts**: Send contracts for customer signature
- **Terms & Conditions**: Include your policies with quotes
- **E-Signature**: Legally binding digital signatures

### Website Builder
- **Custom Landing Pages**: Create a full website for your bakery
- **Portfolio Gallery**: Showcase your cake creations
- **Testimonials**: Display customer reviews

---

## Technical Stack

- **Frontend**: React with TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom email/password with bcrypt and session cookies
- **Payments**: Stripe for subscription billing
- **Email**: AWS SES for transactional emails
- **Hosting**: Replit Deployments

---

## Getting Started

1. **Sign Up**: Create your BakerIQ account at the homepage
2. **Set Up Pricing**: Configure your cake sizes, treats, and pricing
3. **Share Your Calculator**: Send your unique calculator URL to customers
4. **Manage Leads**: Respond to inquiries and create quotes
5. **Grow Your Business**: Convert leads to customers and track your success

---

## Support

For questions, feedback, or support, visit our Help & FAQ section or contact us through the platform.

---

*BakerIQ - Helping bakers capture leads and create quotes with ease.*
