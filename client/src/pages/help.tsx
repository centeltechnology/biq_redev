import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Cake, 
  Calculator, 
  Users, 
  FileText, 
  Settings,
  CalendarCheck,
  ArrowRight,
  MessageSquare,
  Mail,
  BookOpen,
  Zap,
  CreditCard
} from "lucide-react";

export default function HelpPage() {
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
              <Button variant="ghost" className="text-primary" data-testid="link-help">Help</Button>
            </Link>
            <Link href="/faq">
              <Button variant="ghost" data-testid="link-faq">FAQ</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" data-testid="link-login">Log In</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="py-12 md:py-20">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn how to get the most out of BakerIQ for your bakery business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="hover-elevate">
              <CardHeader>
                <Calculator className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Set up your account and calculator</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">1. Create Your Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Sign up with your email and business name. Your unique calculator URL will be created automatically based on your business name.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">2. Configure Your Pricing</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Calculator Pricing in the dashboard to set your prices for cake sizes, flavors, decorations, and addons.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">3. Share Your Calculator</h4>
                  <p className="text-sm text-muted-foreground">
                    Copy your unique calculator URL from Settings and share it on your website, social media, or with customers directly.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Managing Leads</CardTitle>
                <CardDescription>Track and convert your inquiries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Lead Statuses</h4>
                  <p className="text-sm text-muted-foreground">
                    Track leads through stages: New, Contacted, Quoted, Won, or Lost. Update status as you work with each customer.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Lead Details</h4>
                  <p className="text-sm text-muted-foreground">
                    Click on any lead to see their full cake design, contact info, and event details from the calculator.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Converting to Quotes</h4>
                  <p className="text-sm text-muted-foreground">
                    Click "Create Quote" on any lead to start a professional quote with their details pre-filled.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Creating Quotes</CardTitle>
                <CardDescription>Build professional estimates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Quote Builder</h4>
                  <p className="text-sm text-muted-foreground">
                    Add line items for each part of the order: tiers, decorations, delivery, and custom items.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Quote Status</h4>
                  <p className="text-sm text-muted-foreground">
                    Track quotes as Draft, Sent, Accepted, Declined, or Expired. Update as customers respond.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Converting to Orders</h4>
                  <p className="text-sm text-muted-foreground">
                    Once a quote is accepted, convert it to an order to track in your calendar.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CalendarCheck className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Order Calendar</CardTitle>
                <CardDescription>View your upcoming orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Calendar View</h4>
                  <p className="text-sm text-muted-foreground">
                    See all your confirmed orders displayed by date. Different colors indicate order status.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Search Orders</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the search bar to find orders by customer name, title, or event type.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Order Details</h4>
                  <p className="text-sm text-muted-foreground">
                    Click on any order to view full details including customer contact info and delivery requirements.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Calculator className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Price Calculator</CardTitle>
                <CardDescription>Calculate cost-based pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Cost-Based Pricing</h4>
                  <p className="text-sm text-muted-foreground">
                    Enter your material costs, labor hours, hourly rate, and overhead to calculate suggested prices.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Save Calculations</h4>
                  <p className="text-sm text-muted-foreground">
                    Save your calculations for reference when setting prices in Calculator Pricing.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Profit Margins</h4>
                  <p className="text-sm text-muted-foreground">
                    See your profit margin for each item to ensure your pricing covers costs and supports growth.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Basic & Pro</span>
                </div>
                <CardTitle>Fast Quote</CardTitle>
                <CardDescription>Quick ordering for popular items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Feature Your Best Items</h4>
                  <p className="text-sm text-muted-foreground">
                    Save a pricing calculation, then click the star to feature it on your public calculator. Control visibility with the eye icon.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Plan Limits</h4>
                  <p className="text-sm text-muted-foreground">
                    Basic plan: up to 5 featured items. Pro plan: unlimited featured items. Free plan does not include Fast Quote.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Quick Quote Creation</h4>
                  <p className="text-sm text-muted-foreground">
                    Fast Quote leads show a special badge. Click "Quick Quote" to create a quote with the item name, price, and details pre-filled.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CreditCard className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Accepting Payments</CardTitle>
                <CardDescription>Get paid directly through your quotes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Connect Stripe</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Settings and click "Connect with Stripe" to link your Stripe account. This lets customers pay deposits or full amounts directly on your quotes.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">How Customers Pay</h4>
                  <p className="text-sm text-muted-foreground">
                    When you send a quote, customers see a "Pay Now" button. They can choose to pay a deposit or the full amount using a secure Stripe checkout page.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Track Your Earnings</h4>
                  <p className="text-sm text-muted-foreground">
                    Visit the Payments page in your dashboard to see all transactions, total revenue, and payment status for each quote. You also get email notifications for every payment.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Settings className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Calculator Pricing</CardTitle>
                <CardDescription>Customize your prices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Base Prices</h4>
                  <p className="text-sm text-muted-foreground">
                    Set prices for each cake size. These form the foundation of your estimates.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Flavors & Frostings</h4>
                  <p className="text-sm text-muted-foreground">
                    Add price adjustments for premium flavors and specialty frostings.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Addons & Delivery</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure prices for extras like dipped strawberries, sweets tables, and delivery fees.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Mail className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Stay informed automatically</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">New Lead Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive an email whenever a customer submits an inquiry through your calculator.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Customer Confirmations</h4>
                  <p className="text-sm text-muted-foreground">
                    Customers automatically receive a confirmation email with their estimate details.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Quote Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Send professional quote emails to customers directly from the platform.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Cake className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Cakes & Treats</CardTitle>
                <CardDescription>What customers can order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Custom Cakes</h4>
                  <p className="text-sm text-muted-foreground">
                    Multi-tier cakes with customizable sizes, shapes, flavors, frostings, decorations, and addons.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Treats</h4>
                  <p className="text-sm text-muted-foreground">
                    Cupcakes, cake pops, cookies, brownies, dipped strawberries, and more. Enable or disable items in Calculator Pricing.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Delivery & Setup</h4>
                  <p className="text-sm text-muted-foreground">
                    Offer standard delivery, rush delivery, or full setup service with customizable pricing.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Customer Management</CardTitle>
                <CardDescription>Organize your client relationships</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Customer Database</h4>
                  <p className="text-sm text-muted-foreground">
                    Keep track of all your customers with contact info, notes, and order history in one place.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Auto-Create from Leads</h4>
                  <p className="text-sm text-muted-foreground">
                    When you create a quote from a lead, you can automatically create a customer record if one doesn't exist.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Link to Quotes & Orders</h4>
                  <p className="text-sm text-muted-foreground">
                    All quotes and orders are linked to customers, making it easy to see their complete history.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <ArrowRight className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>Choose the right plan for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Free Plan</h4>
                  <p className="text-sm text-muted-foreground">
                    15 quotes per month, unlimited leads, 7% platform fee on payments. Perfect for getting started.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Basic - $4.99/month</h4>
                  <p className="text-sm text-muted-foreground">
                    Unlimited quotes + Fast Quote with up to 5 featured items. Lower 5% platform fee.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Pro - $9.99/month</h4>
                  <p className="text-sm text-muted-foreground">
                    Unlimited quotes + unlimited Fast Quote featured items. Lowest 3% platform fee. Upgrade anytime in Settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted/30 rounded-2xl p-8 text-center">
            <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Check out our FAQ or get in touch with support.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/faq">
                <Button variant="outline" className="gap-2" data-testid="button-view-faq">
                  <BookOpen className="h-4 w-4" />
                  View FAQ
                </Button>
              </Link>
              <a href="mailto:support@bakeriq.app">
                <Button className="gap-2" data-testid="button-contact-support">
                  <Mail className="h-4 w-4" />
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
