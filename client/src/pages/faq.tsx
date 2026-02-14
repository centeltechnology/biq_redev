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
        q: "How do I create my calculator?",
        a: "When you sign up for BakerIQ, your unique public calculator is created automatically. It's available at a URL based on your business name (e.g., /c/your-bakery-name). You can find your calculator URL in the Settings page of your dashboard."
      },
      {
        q: "How do I set my pricing?",
        a: "Go to 'Calculator Pricing' in your dashboard. There you can set prices for cake sizes, adjust pricing for premium flavors and frostings, configure decoration prices, and set up addons like dipped strawberries or delivery fees."
      },
      {
        q: "Can I customize what options appear in my calculator?",
        a: "Yes! For treats, you can enable or disable specific items (cupcakes, cake pops, cookies, etc.) from Calculator Pricing. For cakes, all options are available with fully customizable pricing."
      },
      {
        q: "What can customers order through the calculator?",
        a: "The calculator supports two categories: Cakes (multi-tier custom cakes with sizes, shapes, flavors, frostings, decorations, and addons) and Treats (cupcakes, cake pops, cookies, brownies, dipped strawberries, and more)."
      }
    ]
  },
  {
    category: "Leads & Quotes",
    questions: [
      {
        q: "What happens when someone uses my calculator?",
        a: "When a customer completes your calculator and submits their information, a new lead is automatically created in your dashboard. You'll receive an email notification, and the customer receives a confirmation email with their estimate."
      },
      {
        q: "How do I convert a lead to a quote?",
        a: "Open any lead from your Leads page, then click 'Create Quote'. The quote builder will open with the customer's information and cake details pre-filled. You can add, edit, or remove line items, then save or send the quote."
      },
      {
        q: "What's the difference between a lead and a quote?",
        a: "A lead is an initial inquiry from a customer, containing their contact info and cake preferences. A quote is a formal price estimate you create and send to the customer. One lead can have multiple quotes if the customer requests changes."
      },
      {
        q: "How do I track quote status?",
        a: "Quotes can have several statuses: Draft (being worked on), Sent (delivered to customer), Accepted (customer approved), Declined (customer rejected), or Expired (past the expiration date). Update the status as you work with the customer."
      }
    ]
  },
  {
    category: "Orders & Calendar",
    questions: [
      {
        q: "How do I create an order?",
        a: "Orders can be created from accepted quotes, or you can create them directly from the Orders page. Orders appear on your calendar so you can track upcoming deliveries and pickups."
      },
      {
        q: "How does the calendar work?",
        a: "The Order Calendar shows all your confirmed orders organized by date. Use the search bar to find specific orders by customer name, title, or event type. Click on any order to view full details."
      },
      {
        q: "Can I track deposits and payments?",
        a: "Yes! Each order tracks total amount, deposit paid, and balance due. You can configure your default deposit percentage and accepted payment methods in Calculator Pricing settings."
      }
    ]
  },
  {
    category: "Pricing & Payments",
    questions: [
      {
        q: "How do I figure out what to charge for my baked goods?",
        a: "Use the Price Calculator in your dashboard. Enter your material costs, estimated labor time, hourly rate, and overhead percentage to get a suggested price. You can save calculations for reference and use them to set your public calculator prices."
      },
      {
        q: "What is the Price Calculator?",
        a: "The Price Calculator is an internal tool to help you determine fair prices. It calculates: Material Cost + (Labor Hours x Hourly Rate) + Overhead = Suggested Price. It also shows your profit margin so you can make informed pricing decisions."
      },
      {
        q: "What hourly rate should I use?",
        a: "Most home bakers charge between $20-35 per hour. Consider your skill level, local market rates, and the complexity of your work. The Price Calculator tool shows tips to help you decide."
      },
      {
        q: "How do I set up addons like dipped strawberries?",
        a: "Go to Calculator Pricing, scroll to the Addons section. You can set prices for pre-configured addons. Some addons like Dipped Strawberries have a flat price, while others like Full Sweets Table are priced per attendee."
      },
      {
        q: "Can I set up delivery fees?",
        a: "Yes! In Calculator Pricing, there's a Delivery & Setup section where you can set prices for Standard Delivery, Express/Rush Delivery, and Full Setup Service options."
      },
      {
        q: "What payment methods can I accept?",
        a: "You can accept credit/debit card payments directly through your quotes by connecting Stripe in Settings. Once connected, customers will see a 'Pay Now' button on quotes you send."
      },
      {
        q: "How do deposits work?",
        a: "Set your default deposit percentage in Calculator Pricing. When you create quotes and orders, the deposit amount is automatically calculated. You can track deposit status on each order."
      }
    ]
  },
  {
    category: "Stripe Connect & Payments",
    questions: [
      {
        q: "How do I accept payments from customers?",
        a: "Go to Settings in your dashboard and click 'Connect with Stripe' to link your Stripe account. Once connected, customers will see a 'Pay Now' button on quotes you send them. They can pay a deposit or the full amount using credit/debit cards through Stripe's secure checkout."
      },
      {
        q: "What is Stripe Connect?",
        a: "Stripe Connect lets you accept payments directly into your own Stripe account. BakerIQ uses it so your customers can pay you securely online. You keep control of your funds, and payouts go straight to your bank account through Stripe."
      },
      {
        q: "Is there a fee for accepting payments?",
        a: "BakerIQ charges a platform fee that varies by plan: 7% on Free, 5% on Basic, and 3% on Pro. Stripe also charges their standard processing fee (2.9% + $0.30 per transaction). Upgrading your plan lowers your total cost per transaction."
      },
      {
        q: "What are the total fees on a typical order?",
        a: "On a $300 cake order, here's what the total fees look like by plan: Free plan: $21.00 BakerIQ fee (7%) + $9.00 Stripe fee (2.9% + $0.30) = $30.00 total, you receive $270.00. Basic plan ($4.99/mo): $15.00 BakerIQ fee (5%) + $9.00 Stripe fee = $24.00 total, you receive $276.00. Pro plan ($9.99/mo): $9.00 BakerIQ fee (3%) + $9.00 Stripe fee = $18.00 total, you receive $282.00."
      },
      {
        q: "How does BakerIQ compare to other platforms?",
        a: "BakerIQ is an all-in-one tool that replaces separate subscriptions for a website builder, booking system, and invoicing software. For comparison: HoneyBook charges $19-$39/month plus 2.9% + $0.25 per transaction. 17hats charges $15-$60/month plus payment processing fees. Square charges 3.5% + $0.15 per online transaction with no quoting tools. With BakerIQ Pro at just $9.99/month and 3% platform fee, you get a public calculator, lead capture, quoting, order calendar, and payment processing — all in one place."
      },
      {
        q: "Can customers pay a deposit instead of the full amount?",
        a: "Yes! When viewing a quote, customers can choose to pay a deposit or the full amount. The deposit percentage is based on your settings. You can track partial payments and remaining balances on the Payments page."
      },
      {
        q: "How do I track payments I've received?",
        a: "Go to the Payments page in your dashboard. You'll see your total revenue, number of transactions, and a detailed list of every payment with customer name, quote details, amount, and date. You also receive an email notification for each payment."
      },
      {
        q: "Do I need a Stripe account to use BakerIQ?",
        a: "A Stripe account is only needed if you want to accept online payments through your quotes. You can use all other BakerIQ features (calculator, leads, quotes, calendar) without Stripe."
      },
      {
        q: "How do I disconnect my Stripe account?",
        a: "You can manage your Stripe connection from the Settings page. If you need to disconnect, contact support. Note that disconnecting will remove the 'Pay Now' button from your quotes."
      }
    ]
  },
  {
    category: "Email Notifications",
    questions: [
      {
        q: "What emails does BakerIQ send?",
        a: "BakerIQ sends automatic emails for: new lead notifications (to you), lead confirmation (to the customer), and quote notifications (to the customer). All emails use your business name and branding."
      },
      {
        q: "Can I customize the email templates?",
        a: "Email templates currently use BakerIQ's professional design with your business name. Custom email templates are on our roadmap for a future update."
      },
      {
        q: "What if I don't receive email notifications?",
        a: "Make sure you've verified your email address and check your spam folder. Email notifications require proper AWS SES configuration. If issues persist, contact support."
      }
    ]
  },
  {
    category: "Account & Settings",
    questions: [
      {
        q: "How do I change my business name?",
        a: "Go to Settings in your dashboard. You can update your business name, contact phone, and address. Note that changing your business name won't change your calculator URL - that stays the same for consistency."
      },
      {
        q: "Can I have multiple calculators?",
        a: "Currently, each BakerIQ account has one public calculator. If you need multiple calculators for different business lines, you would need separate accounts."
      },
      {
        q: "How do I share my calculator?",
        a: "Your calculator URL is shown in Settings. Copy it and share on your website, Instagram bio, Facebook page, or anywhere you connect with potential customers. The URL format is: /c/your-bakery-slug"
      },
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot password?' on the login page and enter your email address. You'll receive a password reset link that's valid for 1 hour. Follow the link to set a new password."
      },
      {
        q: "How do I verify my email address?",
        a: "When you sign up, we send a verification email to your address. Click the link in that email to verify. If you didn't receive it, you can request a new verification email from your Settings page."
      },
      {
        q: "How do I add my social media links?",
        a: "Go to Settings and scroll to the Social Media section. You can add your Facebook, Instagram, TikTok, and Pinterest handles or URLs. These will appear in your calculator header so customers can find you."
      }
    ]
  },
  {
    category: "Subscription & Plans",
    questions: [
      {
        q: "What plans are available?",
        a: "BakerIQ offers three plans: Free (15 quotes/month, 7% platform fee), Basic ($4.99/month for unlimited quotes + 5 featured items, 5% fee), and Pro ($9.99/month for unlimited quotes + unlimited featured items, 3% fee). All plans include unlimited leads and Stripe Connect for accepting payments."
      },
      {
        q: "What counts toward my quote limit?",
        a: "Only quotes you actually send to customers count toward your monthly limit. You can create unlimited draft quotes on any plan. Leads from your calculator are always unlimited."
      },
      {
        q: "What's the difference between Basic and Pro?",
        a: "Basic ($4.99/mo) gives you unlimited quotes, up to 5 featured items, and a 5% platform fee. Pro ($9.99/mo) gives you unlimited quotes, unlimited featured items, and the lowest 3% platform fee. Both plans include all core features like lead management, customer tracking, and email notifications."
      },
      {
        q: "How do I upgrade my plan?",
        a: "Go to Settings in your dashboard and scroll to the Subscription section. You can upgrade to Basic or Pro, and manage your subscription through Stripe's secure portal."
      },
      {
        q: "Can I cancel or downgrade my subscription?",
        a: "Yes! Click 'Manage Subscription' in Settings to access the Stripe portal. You can cancel anytime, and your paid features will remain active until the end of your billing period."
      }
    ]
  },
  {
    category: "Referral Program",
    questions: [
      {
        q: "How does the referral program work?",
        a: "Every BakerIQ baker gets a unique referral link. When someone signs up using your link and subscribes to a paid plan, you earn a reward. Paid plan bakers get 1 free month of their subscription. Free plan bakers get 1 month of Fast Quote access. You can earn up to 12 months of stacked credits."
      },
      {
        q: "Where do I find my referral link?",
        a: "Go to 'Refer a Friend' in your dashboard sidebar. Your unique referral link is displayed there and ready to copy. Share it on social media, in group chats, or anywhere bakers hang out."
      },
      {
        q: "When do I get my referral credit?",
        a: "Your credit is awarded automatically when the baker you referred subscribes to a paid plan (Basic or Pro). You'll see the credit reflected on your Refer a Friend page."
      },
      {
        q: "Is there a limit to how many referrals I can make?",
        a: "You can refer as many bakers as you like. The credit cap is 12 months — once you've earned 12 months of free subscription (or Fast Quote access), additional referrals won't add more credits."
      },
      {
        q: "What's the difference between the referral program and the affiliate program?",
        a: "The referral program is available to every baker and rewards you with free months of service. The affiliate program is an invite-only program for influencers and content creators who earn cash commissions (20% of subscription revenue) for referring new bakers. You can apply for the affiliate program on our Partners page."
      },
      {
        q: "Do I get credit if the person I referred stays on the free plan?",
        a: "No — referral credits are awarded when the referred baker subscribes to a paid plan. If they stay on the free plan, the referral is tracked but no credit is awarded yet. You'll receive the credit automatically if they upgrade later."
      }
    ]
  },
  {
    category: "Fast Quote",
    questions: [
      {
        q: "What is Fast Quote?",
        a: "Fast Quote lets you feature your pricing calculations on your public calculator. Customers can select a featured item and submit an inquiry in just a few clicks, skipping the full cake/treat builder. Available on Basic and Pro plans."
      },
      {
        q: "How do I feature an item?",
        a: "Go to Price Calculator in your dashboard and save a pricing calculation. Then click the star icon next to any saved calculation to feature it. Use the eye icon to control whether it appears in Quick Order. You can unfeature it anytime by clicking the star again."
      },
      {
        q: "What are the plan limits for Fast Quote?",
        a: "Free plan: Fast Quote is not available. Basic plan ($4.99/month): Up to 5 featured items. Pro plan ($9.99/month): Unlimited featured items. The limits only apply to how many items you can feature, not how many orders you receive."
      },
      {
        q: "Where do featured items appear?",
        a: "Featured items appear at the top of your public calculator page in a special 'Quick Order' section with a lightning bolt icon. Use the eye icon in Price Calculator to control which featured items show in Quick Order."
      },
      {
        q: "How do Fast Quote leads work?",
        a: "When a customer orders through Fast Quote, the lead appears in your dashboard with a special lightning bolt badge. You can click 'Quick Quote' to instantly create a quote with the item name, price, and details pre-filled."
      },
      {
        q: "Why can't I feature items?",
        a: "Fast Quote requires at least the Basic plan ($4.99/month). If you're on the Free plan, upgrade in Settings to unlock Fast Quote. Basic allows 5 featured items, Pro allows unlimited."
      }
    ]
  },
  {
    category: "Customers",
    questions: [
      {
        q: "How do I manage my customers?",
        a: "Go to Customers in your dashboard to view, add, and edit customer records. Each customer has contact info, notes, and links to their quotes and orders."
      },
      {
        q: "Are customers created automatically?",
        a: "When you create a quote from a lead, BakerIQ will try to match the customer by email. If no match is found, you can create a new customer record with one click from the quote builder."
      },
      {
        q: "Can I see a customer's order history?",
        a: "Yes! Click on any customer to view their profile, which shows all associated quotes and orders. This helps you track repeat customers and their preferences."
      }
    ]
  },
  {
    category: "Troubleshooting",
    questions: [
      {
        q: "Why isn't my calculator showing my updated prices?",
        a: "Prices update immediately after you save them in Calculator Pricing. Try refreshing your browser or clearing your cache. If prices still don't appear, make sure you clicked 'Save Prices' after making changes."
      },
      {
        q: "A customer says they didn't receive an email - what should I do?",
        a: "Ask them to check their spam/junk folder first. Customer confirmation emails are sent automatically when they submit the calculator. If emails consistently aren't being delivered, contact support to check your email configuration."
      },
      {
        q: "How do I delete a lead or quote?",
        a: "You can delete leads from the lead detail page and quotes from the quote builder. Look for the delete button (trash icon) in the page header. Note that deleting is permanent and cannot be undone."
      },
      {
        q: "My calendar isn't showing all my orders - why?",
        a: "Only orders with an event date appear on the calendar. Make sure your orders have event dates set. Also check that the order status isn't 'Cancelled' - cancelled orders are hidden from the calendar."
      },
      {
        q: "Can I recover a deleted lead or quote?",
        a: "Unfortunately, deleted items cannot be recovered. We recommend updating the status to 'Lost' instead of deleting if you might need to reference the information later."
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
              Find answers to the most common questions about BakerIQ.
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
            <h2 className="text-2xl font-bold mb-2">Didn't find your answer?</h2>
            <p className="text-muted-foreground mb-6">
              Check out our detailed Help Center or contact support directly.
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
