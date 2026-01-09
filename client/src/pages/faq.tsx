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
        a: "Currently, the calculator shows a standard set of options (sizes, shapes, flavors, frostings, decorations, and addons). The prices for each option are fully customizable. We're working on adding the ability to enable/disable specific options."
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
        q: "How do I set up addons like dipped strawberries?",
        a: "Go to Calculator Pricing, scroll to the Addons section. You can set prices for pre-configured addons. Some addons like Dipped Strawberries have a flat price, while others like Full Sweets Table are priced per attendee."
      },
      {
        q: "Can I set up delivery fees?",
        a: "Yes! In Calculator Pricing, there's a Delivery & Setup section where you can set prices for Standard Delivery, Express/Rush Delivery, and Full Setup Service options."
      },
      {
        q: "What payment methods can I accept?",
        a: "You can configure which payment methods you accept (Zelle, PayPal, CashApp, Venmo, Cash) in Calculator Pricing. This information is shown to customers on their quotes."
      },
      {
        q: "How do deposits work?",
        a: "Set your default deposit percentage in Calculator Pricing. When you create quotes and orders, the deposit amount is automatically calculated. You can track deposit status on each order."
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
              Check out our detailed Help Center for more information.
            </p>
            <Link href="/help">
              <Button className="gap-2" data-testid="button-visit-help">
                Visit Help Center
              </Button>
            </Link>
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
            <div className="flex items-center gap-6">
              <Link href="/help">
                <span className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-help">Help</span>
              </Link>
              <Link href="/faq">
                <span className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-faq">FAQ</span>
              </Link>
              <Link href="/login">
                <span className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-login">Log In</span>
              </Link>
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
