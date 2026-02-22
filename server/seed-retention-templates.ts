import { db } from "./db";
import { retentionEmailTemplates, type InsertRetentionEmailTemplate } from "@shared/schema";
import { sql } from "drizzle-orm";

const RETENTION_EMAIL_TEMPLATES: InsertRetentionEmailTemplate[] = [
  {
    segment: "new_but_inactive",
    name: "Get Started - Share Your Link",
    subject: "Your quote link is ready to share",
    preheader: "Start getting customer inquiries today",
    bodyHtml: `
      <p>Hi {{first_name}},</p>
      <p>Quick reminder: you have a custom calculator link ready to share with customers!</p>
      <p>When you share it, customers can get instant estimates and submit their info directly to you. No more back-and-forth pricing questions.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="{{quick_quote_url}}" class="cta" style="display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Copy Your Calculator Link</a>
      </p>
      <p>Try pasting it in your Instagram bio or sharing it when someone asks about pricing.</p>
    `,
    bodyText: `Hi {{first_name}},

Quick reminder: you have a custom calculator link ready to share with customers!

When you share it, customers can get instant estimates and submit their info directly to you. No more back-and-forth pricing questions.

Your calculator link: {{quick_quote_url}}

Try pasting it in your Instagram bio or sharing it when someone asks about pricing.`,
    ctaText: "Copy Your Calculator Link",
    ctaRoute: "/settings",
    isActive: true,
    priority: 1,
  },
  {
    segment: "new_but_inactive",
    name: "Set Up Your Pricing",
    subject: "5 mins to set your cake prices",
    preheader: "Customize prices for your business",
    bodyHtml: `
      <p>Hi {{first_name}},</p>
      <p>The default calculator prices might not match your business. Good news: you can customize them in about 5 minutes.</p>
      <p>Set your base prices for cake sizes, add your specialty flavors, and adjust decoration costs. Everything updates automatically on your public calculator.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="{{dashboard_url}}/pricing" class="cta" style="display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Set Your Prices</a>
      </p>
    `,
    bodyText: `Hi {{first_name}},

The default calculator prices might not match your business. Good news: you can customize them in about 5 minutes.

Set your base prices for cake sizes, add your specialty flavors, and adjust decoration costs. Everything updates automatically on your public calculator.

Set your prices: {{dashboard_url}}/pricing`,
    ctaText: "Set Your Prices",
    ctaRoute: "/pricing",
    isActive: true,
    priority: 0,
  },
  {
    segment: "configured_not_shared",
    name: "Share Your Calculator Link",
    subject: "Ready to get leads? Share your link",
    preheader: "Your calculator is set up and ready",
    bodyHtml: `
      <p>Hi {{first_name}},</p>
      <p>Great news! Your calculator is all set up with your custom pricing.</p>
      <p>Now it's time to put it to work. Share your link on:</p>
      <ul style="margin: 16px 0; padding-left: 20px;">
        <li>Your Instagram bio or stories</li>
        <li>Your Facebook business page</li>
        <li>Direct messages when customers ask about pricing</li>
        <li>Your website or Linktree</li>
      </ul>
      <p style="text-align: center; margin: 24px 0;">
        <a href="{{quick_quote_url}}" class="cta" style="display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Copy Your Link</a>
      </p>
    `,
    bodyText: `Hi {{first_name}},

Great news! Your calculator is all set up with your custom pricing.

Now it's time to put it to work. Share your link on:
- Your Instagram bio or stories
- Your Facebook business page
- Direct messages when customers ask about pricing
- Your website or Linktree

Your calculator link: {{quick_quote_url}}`,
    ctaText: "Copy Your Link",
    ctaRoute: "/settings",
    isActive: true,
    priority: 1,
  },
  {
    segment: "leads_no_quotes",
    name: "Turn Leads Into Quotes",
    subject: "You have leads waiting for quotes",
    preheader: "Convert inquiries into bookings",
    bodyHtml: `
      <p>Hi {{first_name}},</p>
      <p>You've got customer inquiries coming in! Now's the time to send them a professional quote.</p>
      <p>Click on any lead, hit "Create Quote", and customize the details. When you're ready, send it with one click. They'll get a beautiful email with your quote.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="{{dashboard_url}}/leads" class="cta" style="display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Your Leads</a>
      </p>
    `,
    bodyText: `Hi {{first_name}},

You've got customer inquiries coming in! Now's the time to send them a professional quote.

Click on any lead, hit "Create Quote", and customize the details. When you're ready, send it with one click. They'll get a beautiful email with your quote.

View your leads: {{dashboard_url}}/leads`,
    ctaText: "View Your Leads",
    ctaRoute: "/leads",
    isActive: true,
    priority: 1,
  },
  {
    segment: "quotes_no_orders",
    name: "Track Accepted Quotes",
    subject: "Keep your orders organized",
    preheader: "Use your calendar to stay on top of events",
    bodyHtml: `
      <p>Hi {{first_name}},</p>
      <p>You've been sending quotes! When customers accept, you can track everything in your calendar.</p>
      <p>Accepted quotes automatically appear in your order calendar. You can see upcoming events, mark orders as completed, and keep everything organized in one place.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="{{dashboard_url}}/calendar" class="cta" style="display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Your Calendar</a>
      </p>
    `,
    bodyText: `Hi {{first_name}},

You've been sending quotes! When customers accept, you can track everything in your calendar.

Accepted quotes automatically appear in your order calendar. You can see upcoming events, mark orders as completed, and keep everything organized in one place.

View your calendar: {{dashboard_url}}/calendar`,
    ctaText: "View Your Calendar",
    ctaRoute: "/calendar",
    isActive: true,
    priority: 1,
  },
  {
    segment: "active_power_user",
    name: "Power User Tips",
    subject: "Tips from the BakerIQ team",
    preheader: "Get more from your account",
    bodyHtml: `
      <p>Hi {{first_name}},</p>
      <p>You're doing great! We noticed you've been active and wanted to share a quick tip:</p>
      <p><strong>Featured Items:</strong> Upgrade to a paid plan and add seasonal specials to your calculator. Customers can order directly without going through the full quote process.</p>
      <p>Thanks for being part of BakerIQ. Keep up the great work!</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="{{dashboard_url}}/dashboard" class="cta" style="display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to Dashboard</a>
      </p>
    `,
    bodyText: `Hi {{first_name}},

You're doing great! We noticed you've been active and wanted to share a quick tip:

Featured Items: Upgrade to a paid plan and add seasonal specials to your calculator. Customers can order directly without going through the full quote process.

Thanks for being part of BakerIQ. Keep up the great work!

Go to dashboard: {{dashboard_url}}/dashboard`,
    ctaText: "Go to Dashboard",
    ctaRoute: "/dashboard",
    isActive: true,
    priority: 1,
  },
  {
    segment: "at_risk",
    name: "We Miss You",
    subject: "Your customers are looking for you",
    preheader: "Get back to growing your business",
    bodyHtml: `
      <p>Hi {{first_name}},</p>
      <p>It's been a little while since you logged in. Just a friendly reminder that your calculator link is still active and ready for customers.</p>
      <p>If you're getting busy with orders (which is great!), we're here when you need us. Your leads, quotes, and calendar are all waiting for you.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="{{login_url}}" class="cta" style="display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Log Back In</a>
      </p>
    `,
    bodyText: `Hi {{first_name}},

It's been a little while since you logged in. Just a friendly reminder that your calculator link is still active and ready for customers.

If you're getting busy with orders (which is great!), we're here when you need us. Your leads, quotes, and calendar are all waiting for you.

Log back in: {{login_url}}`,
    ctaText: "Log Back In",
    ctaRoute: "/login",
    isActive: true,
    priority: 1,
  },
  {
    segment: "at_risk",
    name: "Quick Check-In",
    subject: "Need help with anything?",
    preheader: "We're here if you have questions",
    bodyHtml: `
      <p>Hi {{first_name}},</p>
      <p>Just checking in! If you've run into any issues or have questions about using BakerIQ, we're here to help.</p>
      <p>You can reach out through our support chat anytime. We want to make sure you get the most out of your account.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="{{dashboard_url}}/help" class="cta" style="display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Get Support</a>
      </p>
    `,
    bodyText: `Hi {{first_name}},

Just checking in! If you've run into any issues or have questions about using BakerIQ, we're here to help.

You can reach out through our support chat anytime. We want to make sure you get the most out of your account.

Get support: {{dashboard_url}}/help`,
    ctaText: "Get Support",
    ctaRoute: "/help",
    isActive: true,
    priority: 0,
  },
  {
    segment: "new_but_inactive",
    name: "Survey Invitation - Free Pro Month",
    subject: "Quick question + free Pro upgrade",
    preheader: "Take 2 mins, get a free month of Pro",
    bodyHtml: `
      <p>Hi {{first_name}},</p>
      <p>We noticed you signed up for BakerIQ but haven't had a chance to fully set things up yet. We'd love to understand what's getting in the way.</p>
      <p><strong>Take 2 minutes to answer 4 quick questions, and we'll give you a free month of Pro</strong> - no strings attached.</p>
      <p>Your feedback helps us make BakerIQ better for bakers like you.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="{{dashboard_url}}/feedback" class="cta" style="display: inline-block; background: #E91E63; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Take Survey & Get Free Pro</a>
      </p>
      <p style="color: #666; font-size: 14px;">Pro includes unlimited quotes, featured items, and more.</p>
    `,
    bodyText: `Hi {{first_name}},

We noticed you signed up for BakerIQ but haven't had a chance to fully set things up yet. We'd love to understand what's getting in the way.

Take 2 minutes to answer 4 quick questions, and we'll give you a free month of Pro - no strings attached.

Your feedback helps us make BakerIQ better for bakers like you.

Take the survey: {{dashboard_url}}/feedback

Pro includes unlimited quotes, featured items, and more.`,
    ctaText: "Take Survey & Get Free Pro",
    ctaRoute: "/feedback",
    isActive: true,
    priority: 2,
  },
];

export async function seedRetentionTemplates(): Promise<void> {
  console.log("Seeding retention email templates...");

  const existing = await db.select().from(retentionEmailTemplates);
  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing templates, skipping seed.`);
    return;
  }

  for (const template of RETENTION_EMAIL_TEMPLATES) {
    await db.insert(retentionEmailTemplates).values(template);
    console.log(`  Created template: ${template.name} (${template.segment})`);
  }

  console.log(`Seeded ${RETENTION_EMAIL_TEMPLATES.length} retention email templates.`);
}
