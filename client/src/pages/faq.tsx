import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Cake, ArrowLeft } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I create my order page?",
        a: "Your order page is created automatically when you sign up. It lives at bakeriq.app/c/your-bakery. Find the link in Share."
      },
      {
        q: "How do I set my pricing?",
        a: "Go to Pricing. Set base prices for cake sizes, flavors, frostings, treats, decorations, and delivery."
      },
      {
        q: "Can I customize what appears on my order page?",
        a: "Yes. Enable or disable treats in Pricing. Feature Express Items for fast ordering. Upload branding in Settings."
      },
      {
        q: "What can customers order?",
        a: "Two categories: Cakes (multi-tier with sizes, shapes, flavors, frostings, decorations, add-ons) and Treats (cupcakes, cake pops, cookies, brownies, dipped strawberries)."
      }
    ]
  },
  {
    category: "Leads & Quotes",
    questions: [
      {
        q: "What happens when someone uses my order page?",
        a: "You receive a structured lead in your dashboard and by email. The customer receives a confirmation with their estimate."
      },
      {
        q: "How do I convert a lead to a quote?",
        a: "Open the lead. Click 'Create Quote'. Customer info and selections are pre-filled. Adjust line items, save, and send."
      },
      {
        q: "What's the difference between a lead and a quote?",
        a: "Lead = inquiry from a customer. Quote = professional estimate you send back. One lead can have multiple quotes."
      },
      {
        q: "How do I track quote status?",
        a: "Statuses: Draft, Sent, Accepted, Declined, Expired. Acceptance locks pricing. Customers can pay online if Stripe is connected."
      }
    ]
  },
  {
    category: "Orders & Calendar",
    questions: [
      {
        q: "How do I create an order?",
        a: "Convert an accepted quote to an order, or create one directly from Orders. Orders appear on your calendar."
      },
      {
        q: "How does the calendar work?",
        a: "Confirmed orders displayed by event date. Color-coded by status. Search by customer name, title, or event type."
      },
      {
        q: "Can I track deposits and payments?",
        a: "Yes. Each order tracks total, deposit paid, and balance due. Configure deposit settings in Payments."
      }
    ]
  },
  {
    category: "Pricing & Cost",
    questions: [
      {
        q: "What does BakerIQ cost?",
        a: "Free to start. Platform fee only when you process payments. Upgrade to reduce your fee. Free: 7%. Basic ($4.99/mo): 5%. Pro ($9.99/mo): 3%."
      },
      {
        q: "How do I figure out what to charge?",
        a: "Use the cost calculator in Express Items. Enter material costs, labor hours, hourly rate, and overhead. It outputs a suggested price and profit margin."
      },
      {
        q: "What hourly rate should I use?",
        a: "Most home bakers charge $20-35/hour. Factor in skill level, local market, and complexity."
      },
      {
        q: "How do I set up add-ons and delivery?",
        a: "Go to Pricing. Add-ons section for extras (dipped strawberries, sweets tables). Delivery & Setup section for delivery tiers."
      },
      {
        q: "How do deposits work?",
        a: "Set deposit percentage or flat amount in Payments → Deposit Settings. Deposits are calculated automatically on quotes. Customers can accept now and pay later."
      }
    ]
  },
  {
    category: "Stripe & Payments",
    questions: [
      {
        q: "Do I need Stripe to use BakerIQ?",
        a: "No. Stripe is optional and only required for online payments. All other features work without it."
      },
      {
        q: "How do I connect Stripe?",
        a: "Go to Payments → Connect Stripe. Once connected, customers see a 'Pay Now' button on your quotes. Money goes to your Stripe account."
      },
      {
        q: "What are the fees?",
        a: "Platform fee: Free 7%, Basic 5%, Pro 3%. Stripe also charges 2.9% + $0.30 per transaction. Upgrading your plan lowers total cost."
      },
      {
        q: "What are the total fees on a $300 order?",
        a: "Free: $21 BakerIQ + $9 Stripe = $30 total, you receive $270. Basic: $15 + $9 = $24, you receive $276. Pro: $9 + $9 = $18, you receive $282."
      },
      {
        q: "Can customers pay a deposit instead of full amount?",
        a: "Yes. Customers choose deposit or full amount at checkout. Track partial payments and balances in Payments."
      },
      {
        q: "How do I track payments?",
        a: "Go to Payments. View total revenue, transaction count, and per-payment details. Email notifications sent for every payment."
      },
      {
        q: "How do I disconnect Stripe?",
        a: "Contact support. Disconnecting removes the 'Pay Now' button from quotes."
      }
    ]
  },
  {
    category: "Notifications",
    questions: [
      {
        q: "What emails does BakerIQ send?",
        a: "Lead alerts (to you), customer confirmations (to them), quote notifications (to them), and payment receipts (both). All branded with your business name."
      },
      {
        q: "Can I customize email templates?",
        a: "Emails use BakerIQ's professional design with your business name. Custom templates are on the roadmap."
      },
      {
        q: "What if I don't receive notifications?",
        a: "Verify your email address in Settings. Check your spam folder. If issues persist, contact support."
      }
    ]
  },
  {
    category: "Account & Settings",
    questions: [
      {
        q: "How do I change my business name?",
        a: "Go to Settings. Update business name, phone, and address. Changing the name does not change your order page URL — edit that in Share."
      },
      {
        q: "Can I have multiple order pages?",
        a: "One order page per account. Multiple business lines require separate accounts."
      },
      {
        q: "How do I share my order page?",
        a: "Go to Share. One-click sharing to Facebook, Instagram, Twitter/X, Pinterest, WhatsApp, LinkedIn. Download a QR code. Customize your URL slug."
      },
      {
        q: "How do I create a social media banner?",
        a: "Go to Share → Social Media Banners. Pick a design or upload your own photo. Your business name is added automatically. Downloads at 1200x630 (Facebook/LinkedIn size)."
      },
      {
        q: "Can I change my currency?",
        a: "Yes. Go to Payments → Currency & Region."
      },
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot password?' on the login page. Enter your email. Reset link valid for 1 hour."
      },
      {
        q: "How do I add social media links?",
        a: "Go to Settings → Social Media. Add Facebook, Instagram, TikTok, Pinterest. These appear on your order page header."
      }
    ]
  },
  {
    category: "Plans & Subscriptions",
    questions: [
      {
        q: "What plans are available?",
        a: "Free: unlimited quotes, 1 Express Item, 7% fee. Basic ($4.99/mo): up to 5 Express Items, 5% fee. Pro ($9.99/mo): unlimited Express Items, 3% fee. All plans include unlimited leads."
      },
      {
        q: "Are quotes limited?",
        a: "No. All plans include unlimited quotes."
      },
      {
        q: "What's the difference between Basic and Pro?",
        a: "Basic: 5 Express Items, 5% fee. Pro: unlimited Express Items, 3% fee. Both include all core features."
      },
      {
        q: "How do I upgrade?",
        a: "Go to Settings → Subscription. Upgrade to Basic or Pro through Stripe's secure portal."
      },
      {
        q: "Can I cancel?",
        a: "Yes. Click 'Manage Subscription' in Settings. Cancel anytime. Paid features remain active through the end of your billing period."
      }
    ]
  },
  {
    category: "Referral Program",
    questions: [
      {
        q: "How does the referral program work?",
        a: "Share your unique referral link. When a baker signs up and subscribes, you earn a reward. Paid plan: 1 free month. Free plan: 1 month Express Items access. Stack up to 12 months."
      },
      {
        q: "Where do I find my referral link?",
        a: "Go to Refer a Friend in your dashboard. Your link is displayed and ready to copy."
      },
      {
        q: "When do I get my credit?",
        a: "Automatically, when the referred baker subscribes to a paid plan."
      },
      {
        q: "Is there a cap?",
        a: "12 months maximum. Unlimited referrals, but credits cap at 12 months."
      },
      {
        q: "What's the difference between referral and affiliate?",
        a: "Referral: available to all bakers, rewards with free months. Affiliate: invite-only for influencers, earns cash commissions (20% of subscription revenue). Apply at the Partners page."
      },
      {
        q: "Do I get credit if they stay on Free?",
        a: "No. Credits awarded when the referred baker subscribes to a paid plan. If they upgrade later, the credit applies automatically."
      }
    ]
  },
  {
    category: "Express Items",
    questions: [
      {
        q: "What is Express Items?",
        a: "Featured items at the top of your order page for fast ordering. Customers select and submit in a few clicks. Free: 1 item. Basic: 5. Pro: unlimited."
      },
      {
        q: "How do I feature an item?",
        a: "Go to Express Items. Save a pricing calculation. Click the star icon to feature it. Use the eye icon to control visibility."
      },
      {
        q: "Where do Express Items appear?",
        a: "At the top of your order page in the Quick Order section. Lightning bolt icon."
      },
      {
        q: "How do Express Item leads work?",
        a: "Orders appear in Leads with a lightning bolt badge. Click 'Quick Quote' to create a quote with item details pre-filled."
      },
      {
        q: "Why can't I feature items?",
        a: "Express Items requires Basic ($4.99/mo) or Pro ($9.99/mo). Upgrade in Settings."
      }
    ]
  },
  {
    category: "Customers",
    questions: [
      {
        q: "How do I manage customers?",
        a: "Go to Customers. View, add, and edit records. Each customer has contact info, notes, and linked quotes/orders."
      },
      {
        q: "Are customers created automatically?",
        a: "When you create a quote from a lead, BakerIQ matches by email. If no match, create a new record with one click."
      },
      {
        q: "Can I see order history?",
        a: "Yes. Click any customer to view all associated quotes and orders."
      }
    ]
  },
  {
    category: "Troubleshooting",
    questions: [
      {
        q: "Prices aren't updating on my order page.",
        a: "Prices update immediately after saving in Pricing. Refresh your browser. Make sure you clicked 'Save Prices'."
      },
      {
        q: "Customer didn't receive an email.",
        a: "Have them check spam/junk. Confirmations are sent automatically on submission. If persistent, contact support."
      },
      {
        q: "How do I delete a lead or quote?",
        a: "Open the lead or quote. Click the trash icon in the header. Deletion is permanent."
      },
      {
        q: "Calendar isn't showing all orders.",
        a: "Only orders with an event date appear. Check that event dates are set and status isn't 'Cancelled'."
      },
      {
        q: "Can I recover a deleted item?",
        a: "No. Use status 'Lost' instead of deleting if you may need the record later."
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home-logo">
              <Cake className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">BakerIQ</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/help">
              <Button variant="ghost" data-testid="link-help">Help</Button>
            </Link>
            <Link href="/faq">
              <Button variant="ghost" className="text-primary" data-testid="link-faq">FAQ</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" data-testid="link-login">Log In</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="py-12 md:py-20">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Link href="/help">
              <Button variant="ghost" size="sm" className="gap-2 -ml-3 mb-4" data-testid="button-back-help">
                <ArrowLeft className="h-4 w-4" />
                Back to Help
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-muted-foreground">
              Short answers. No fluff.
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="text-xl font-semibold mb-4 text-primary" data-testid={`text-category-${categoryIndex}`}>
                  {category.category}
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.questions.map((faq, faqIndex) => (
                    <AccordionItem 
                      key={faqIndex} 
                      value={`${categoryIndex}-${faqIndex}`}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger 
                        className="text-left hover:no-underline"
                        data-testid={`accordion-${categoryIndex}-${faqIndex}`}
                      >
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-muted/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Need more detail?</h2>
            <p className="text-muted-foreground mb-6">
              Check the Help Center or contact support directly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/help">
                <Button variant="outline" className="gap-2" data-testid="button-visit-help">
                  Visit Help Center
                </Button>
              </Link>
              <a href="mailto:support@bakeriq.app">
                <Button className="gap-2" data-testid="button-contact-support">
                  Contact Support
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer" data-testid="footer-link-home-logo">
                <Cake className="h-6 w-6 text-primary" />
                <span className="font-semibold">BakerIQ</span>
              </div>
            </Link>
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <Link href="/help">
                <span className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-help">Help</span>
              </Link>
              <Link href="/faq">
                <span className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-faq">FAQ</span>
              </Link>
              <Link href="/terms">
                <span className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-terms">Terms</span>
              </Link>
              <Link href="/privacy">
                <span className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-privacy">Privacy</span>
              </Link>
              <a href="mailto:support@bakeriq.app" className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-support">
                Contact
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Made with love for cake bakers everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
