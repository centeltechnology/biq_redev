import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  CreditCard,
  Play,
  Gift,
  Share2,
  Rocket,
  Globe,
  Wallet
} from "lucide-react";

const VIDEOS = [
  { id: "WHdEtrAWE2A", title: "Dashboard Walkthrough", description: "See how to navigate your dashboard and manage orders", testId: "dashboard" },
  { id: "dswX7yLHlN4", title: "Settings Overview", description: "Learn how to configure your account and preferences", testId: "settings" },
  { id: "EByQ4x9wCQs", title: "Express Items", description: "Set up your pricing and share your order page link", testId: "calculator" },
];

export default function HelpPage() {
  const [activeVideo, setActiveVideo] = useState<typeof VIDEOS[0] | null>(null);
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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Run your bakery like a business.</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              BakerIQ is your operating system for structured orders, deposits, and revenue visibility.
            </p>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Play className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Video Tutorials</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {VIDEOS.map((video) => (
                <Card
                  key={video.id}
                  className="cursor-pointer hover-elevate"
                  onClick={() => setActiveVideo(video)}
                  data-testid={`card-video-${video.testId}`}
                >
                  <CardHeader>
                    <CardTitle className="text-base">{video.title}</CardTitle>
                    <CardDescription>{video.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video rounded-md overflow-hidden relative bg-muted">
                      <img
                        src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="rounded-full bg-primary p-3">
                          <Play className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={!!activeVideo} onOpenChange={(open) => { if (!open) setActiveVideo(null); }}>
              <DialogContent className="max-w-4xl w-[90vw] p-0 gap-0">
                <DialogHeader className="p-4 pb-0">
                  <DialogTitle data-testid="text-video-modal-title">{activeVideo?.title}</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                  <div className="aspect-video rounded-md overflow-hidden">
                    {activeVideo && (
                      <iframe
                        src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1`}
                        title={activeVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                        data-testid={`video-${activeVideo.testId}-modal`}
                      />
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="hover-elevate">
              <CardHeader>
                <Calculator className="h-10 w-10 text-primary mb-2" />
                <CardTitle>System Workflow</CardTitle>
                <CardDescription>How orders move through BakerIQ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">1. Customer visits your order page</h4>
                  <p className="text-sm text-muted-foreground">
                    They browse your pricing, select options, and submit a structured request.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">2. Lead appears in your dashboard</h4>
                  <p className="text-sm text-muted-foreground">
                    You receive an email alert and the lead shows in <strong>Leads</strong> with full details.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">3. You send a professional quote</h4>
                  <p className="text-sm text-muted-foreground">
                    Convert the lead to a quote, adjust pricing, and send it. Customer receives an email with payment options.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Lead Management</CardTitle>
                <CardDescription>Every inquiry is captured and tracked</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Structured Intake</h4>
                  <p className="text-sm text-muted-foreground">
                    Every order page submission creates a lead with contact info, event details, and itemized selections.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Status Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    Track leads through stages: New, Contacted, Quoted, Won, or Lost.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Convert to Quote</h4>
                  <p className="text-sm text-muted-foreground">
                    Click "Create Quote" on any lead. Customer details and selections are pre-filled.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Quoting</CardTitle>
                <CardDescription>Send professional, payment-ready quotes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Quote Builder</h4>
                  <p className="text-sm text-muted-foreground">
                    Itemized line items for tiers, decorations, delivery, and custom charges. Pull from Express Items or add manually.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Quote Lifecycle</h4>
                  <p className="text-sm text-muted-foreground">
                    Draft → Sent → Accepted or Declined. Acceptance locks pricing. Customers can pay online if Stripe is connected.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Convert to Order</h4>
                  <p className="text-sm text-muted-foreground">
                    Accepted quotes convert to orders. Orders appear on your calendar for delivery tracking.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CalendarCheck className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Order Calendar</CardTitle>
                <CardDescription>Delivery and fulfillment tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Calendar View</h4>
                  <p className="text-sm text-muted-foreground">
                    Confirmed orders displayed by event date. Color-coded by status.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Search</h4>
                  <p className="text-sm text-muted-foreground">
                    Find orders by customer name, title, or event type.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Order Details</h4>
                  <p className="text-sm text-muted-foreground">
                    Click any order to view customer contact, delivery requirements, and payment status.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Calculator className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Express Items</CardTitle>
                <CardDescription>Feature popular items on your order page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">What They Are</h4>
                  <p className="text-sm text-muted-foreground">
                    Express Items let you feature popular or seasonal offers at the top of your order page. Customers order in a few clicks.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Examples</h4>
                  <p className="text-sm text-muted-foreground">
                    1 Dozen Dipped Strawberries, Seasonal Pound Cake Special, Custom Cupcake Box.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Plan Limits</h4>
                  <p className="text-sm text-muted-foreground">
                    Free: 1 item. Basic: 5 items. Pro: Unlimited.
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
                <CardTitle>Express Items Setup</CardTitle>
                <CardDescription>How to feature and manage items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Feature an Item</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Express Items, save a pricing calculation, then click the star icon to feature it. Control visibility with the eye icon.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Express Item Leads</h4>
                  <p className="text-sm text-muted-foreground">
                    Express Item orders appear in <strong>Leads</strong> with a lightning bolt badge. Click "Quick Quote" to create a quote with item details pre-filled.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Cost Calculator</h4>
                  <p className="text-sm text-muted-foreground">
                    Enter material costs, labor hours, hourly rate, and overhead. The calculator shows suggested price and profit margin.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CreditCard className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Revenue & Payments</CardTitle>
                <CardDescription>Collect deposits and track revenue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Connect Stripe</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to <strong>Payments → Connect Stripe</strong>. Customers see a "Pay Now" button on your quotes. Money goes directly to your Stripe account.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Deposit Collection</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure deposit percentage or flat amount in <strong>Payments → Deposit Settings</strong>. Deposits are collected automatically when customers pay online.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Revenue Visibility</h4>
                  <p className="text-sm text-muted-foreground">
                    Track all transactions, total revenue, and payment status per quote in <strong>Payments</strong>. Email notifications sent for every payment.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Settings className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Pricing Configuration</CardTitle>
                <CardDescription>Set what customers see on your order page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Cake Sizes & Shapes</h4>
                  <p className="text-sm text-muted-foreground">
                    Set base prices by size and shape. These appear on your order page.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Flavors, Frostings & Add-ons</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure premium flavor pricing, frosting types, decorations, and extras.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Treats & Delivery</h4>
                  <p className="text-sm text-muted-foreground">
                    Per-unit treat pricing and delivery tiers. Enable or disable items in <strong>Pricing</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Mail className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Automated Notifications</CardTitle>
                <CardDescription>System-generated alerts and confirmations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Lead Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    You receive an email when a customer submits through your order page.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Customer Confirmations</h4>
                  <p className="text-sm text-muted-foreground">
                    Customers receive an automatic confirmation with their estimate details.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Payment Receipts</h4>
                  <p className="text-sm text-muted-foreground">
                    You and your customer receive email notifications for every payment processed.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Cake className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Product Categories</CardTitle>
                <CardDescription>What your order page supports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Custom Cakes</h4>
                  <p className="text-sm text-muted-foreground">
                    Multi-tier with configurable sizes, shapes, flavors, frostings, decorations, and add-ons.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Treats</h4>
                  <p className="text-sm text-muted-foreground">
                    Cupcakes, cake pops, cookies, brownies, dipped strawberries. Enable or disable in <strong>Pricing</strong>.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Delivery & Setup</h4>
                  <p className="text-sm text-muted-foreground">
                    Standard delivery, rush delivery, or full setup service. Priced per tier in <strong>Pricing</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Customer Records</CardTitle>
                <CardDescription>Centralized contact and order history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Customer Database</h4>
                  <p className="text-sm text-muted-foreground">
                    Contact info, notes, and complete order history per customer.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Auto-Created from Leads</h4>
                  <p className="text-sm text-muted-foreground">
                    Creating a quote from a lead auto-creates a customer record if none exists.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Linked History</h4>
                  <p className="text-sm text-muted-foreground">
                    All quotes and orders are linked to the customer record for full visibility.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Share2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Distribution Tools</CardTitle>
                <CardDescription>Share your order page link everywhere</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Social Media Sharing</h4>
                  <p className="text-sm text-muted-foreground">
                    One-click sharing to Facebook, Instagram, Twitter/X, Pinterest, WhatsApp, and LinkedIn from <strong>Share</strong>.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Caption Templates & Banners</h4>
                  <p className="text-sm text-muted-foreground">
                    Pre-written captions by category (General, Wedding, Events, Seasonal). Generate branded banners (1200x630) with your business name.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">QR Code</h4>
                  <p className="text-sm text-muted-foreground">
                    Download a QR code from <strong>Share</strong>. Print on business cards, packaging, or booth displays.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Per-Item Sharing</h4>
                  <p className="text-sm text-muted-foreground">
                    Each Express Item gets its own shareable link with platform-specific captions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Gift className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>Earn free months for every baker you refer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Your Referral Link</h4>
                  <p className="text-sm text-muted-foreground">
                    Find your unique link in <strong>Refer a Friend</strong>. Share it with other bakers.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Rewards</h4>
                  <p className="text-sm text-muted-foreground">
                    Paid plan: 1 free month per referred baker who subscribes. Free plan: 1 month Express Items access per referral. Stack up to 12 months.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    View referral count, sign-ups, and earned credits in your <strong>Refer a Friend</strong> dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <ArrowRight className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Plans & Platform Fees</CardTitle>
                <CardDescription>Processing-first pricing model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Free</h4>
                  <p className="text-sm text-muted-foreground">
                    Unlimited quotes. 1 Express Item. 7% platform fee on processed payments.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Basic — $4.99/month</h4>
                  <p className="text-sm text-muted-foreground">
                    Unlimited quotes. Up to 5 Express Items. 5% platform fee.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Pro — $9.99/month</h4>
                  <p className="text-sm text-muted-foreground">
                    Unlimited quotes. Unlimited Express Items. 3% platform fee. Upgrade in <strong>Settings</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div id="onboarding" className="mb-12" data-testid="section-help-onboarding">
            <div className="flex items-center gap-2 mb-6">
              <Rocket className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Onboarding &amp; Setup</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  The goal of onboarding is simple: get your account structured and ready to receive real orders.
                </p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
                    <div>
                      <h4 className="font-medium">Branding</h4>
                      <p className="text-sm text-muted-foreground">Add your business name and logo. This appears on your public order page. Edit anytime in <strong>Settings</strong>.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
                    <div>
                      <h4 className="font-medium">Review Your Pricing</h4>
                      <p className="text-sm text-muted-foreground">Set cake sizes, treats, flavors, add-ons, and delivery. This determines what customers see. Edit anytime in <strong>Pricing</strong>.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
                    <div>
                      <h4 className="font-medium">Launch Your Order Page</h4>
                      <p className="text-sm text-muted-foreground">Your public link is automatically created: bakeriq.app/c/your-bakery. Share it in your Instagram bio, Facebook posts, or DMs when someone asks "how much?" Find it in <strong>Share</strong>.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">4</span>
                    <div>
                      <h4 className="font-medium">Send a Test Quote</h4>
                      <p className="text-sm text-muted-foreground">See exactly what customers receive. Optional but recommended.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">5</span>
                    <div>
                      <h4 className="font-medium">Connect Stripe (Optional)</h4>
                      <p className="text-sm text-muted-foreground">Go to <strong>Payments → Connect Stripe</strong> to enable online deposits. Stripe adds a Pay Now button to quotes. Money goes directly to your Stripe account.</p>
                    </div>
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="onboarding-q1" data-testid="accordion-onboarding-q1">
                    <AccordionTrigger>Why can't I accept payments yet?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Online payments require Stripe. Go to <strong>Payments → Connect Stripe</strong> to link your account. Once connected, customers see a "Pay Now" button on your quotes.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="onboarding-q2" data-testid="accordion-onboarding-q2">
                    <AccordionTrigger>Where do I edit my order page URL?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Go to <strong>Share → Launch Your Landing Page</strong>. You can change your URL slug (the part after bakeriq.app/c/) and upload a header image.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="onboarding-q3" data-testid="accordion-onboarding-q3">
                    <AccordionTrigger>What does "processing-first" mean?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        You only pay a platform fee when a customer pays through your quote link. Free: 7%, Basic: 5%, Pro: 3%. All plans include unlimited quotes. No payments = no fees.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="onboarding-q4" data-testid="accordion-onboarding-q4">
                    <AccordionTrigger>Can I redo onboarding or change my settings later?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Yes. Go to <strong>Settings</strong> for branding, <strong>Pricing</strong> for prices, and <strong>Share → Launch Your Landing Page</strong> for your URL and header image.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <div id="processing-first" className="mb-12" data-testid="section-help-processing-first">
            <div className="flex items-center gap-2 mb-6">
              <Wallet className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">What Processing-First Means</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  You don't pay for logging in. You only pay when you process money through your quote link.
                </p>
                <div className="grid grid-cols-3 gap-4 py-2">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">Free</p>
                    <p className="text-2xl font-bold text-primary">7%</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">Basic</p>
                    <p className="text-2xl font-bold text-primary">5%</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">Pro</p>
                    <p className="text-2xl font-bold text-primary">3%</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  No processed payments = no platform fees.
                </p>
              </CardContent>
            </Card>
          </div>

          <div id="order-page" className="mb-12" data-testid="section-help-order-page">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Your Order Page</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  Your order page is your online storefront. No website required.
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium">What Customers Do</h4>
                  <p className="text-sm text-muted-foreground">
                    Browse your pricing. Select options. Submit a structured request. This triggers a lead in your dashboard.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Where to Find Your Link</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to <strong>Share</strong>. Your order page URL is at the top. Copy it with one click.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Using It in DMs</h4>
                  <p className="text-sm text-muted-foreground">
                    Stop typing custom prices. Reply with your link. Customers build their order. You receive a structured lead. You send a professional quote. That's the system.
                  </p>
                </div>

                <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="sharing-q1" data-testid="accordion-sharing-q1">
                    <AccordionTrigger>How do Express Items work?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Go to <strong>Express Items</strong>, save an item, then click the star icon to feature it on your order page. Customers can order featured items with one click. Limits: Free = 1, Basic = 5, Pro = unlimited.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sharing-q2" data-testid="accordion-sharing-q2">
                    <AccordionTrigger>How do I customize my branding and URL?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Go to <strong>Share → Launch Your Landing Page</strong> to upload a header image, change your URL slug, and preview your page. Business name and logo are set in <strong>Settings</strong>.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sharing-q3" data-testid="accordion-sharing-q3">
                    <AccordionTrigger>Can I share individual items on social media?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Yes. Each Express Item gets its own shareable link. On the <strong>Share</strong> page, use the sharing buttons next to each item with platform-specific captions.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sharing-q4" data-testid="accordion-sharing-q4">
                    <AccordionTrigger>How do I get a QR code?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        On the <strong>Share</strong> page, click "Download QR Code." Print on business cards, packaging, or booth displays.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sharing-q5" data-testid="accordion-sharing-q5">
                    <AccordionTrigger>Where do I find my Order Page link?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Go to <strong>Share</strong>. Your link (bakeriq.app/c/your-bakery) is displayed at the top. Click "Copy" to grab it.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <div id="payments-basics" className="mb-12" data-testid="section-help-payments">
            <div className="flex items-center gap-2 mb-6">
              <Wallet className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Payments Basics</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  Stripe is optional. Without Stripe, customers accept quotes and pay you manually. With Stripe, customers pay deposits online, funds go to your Stripe account, and you track everything in <strong>Payments</strong>.
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium">Deposits</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure deposits in <strong>Payments → Deposit Settings</strong>. Customers can accept now and pay later. Acceptance locks pricing.
                  </p>
                </div>
                <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="payments-q1" data-testid="accordion-payments-q1">
                    <AccordionTrigger>Do I need Stripe to use BakerIQ?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        No. You can create quotes, manage leads, and run your order page without Stripe. Stripe is only needed if you want customers to pay online through your quotes. Go to <strong>Payments → Connect Stripe</strong> when you're ready.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payments-q2" data-testid="accordion-payments-q2">
                    <AccordionTrigger>Can I set up deposits without Stripe?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Yes. Go to <strong>Payments → Deposit Settings</strong> to set a percentage or flat amount. Without Stripe, customers pay you directly (cash, Venmo, Zelle). With Stripe, they pay the deposit online.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payments-q3" data-testid="accordion-payments-q3">
                    <AccordionTrigger>What does connecting Stripe do?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Stripe adds a "Pay Now" button to your quotes. Customers pay deposits or full amounts through secure checkout. Money goes to your Stripe account minus the platform fee. Track payments in <strong>Payments</strong>.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payments-q4" data-testid="accordion-payments-q4">
                    <AccordionTrigger>Why can customers accept a quote and pay later?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Accepting locks in the price and confirms the order. The customer can return to the same quote link and pay whenever ready. You see the status update in <strong>Quotes</strong>.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payments-q5" data-testid="accordion-payments-q5">
                    <AccordionTrigger>What are platform fees?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        A percentage deducted only when a customer pays through your quote link. Free: 7%, Basic ($4.99/mo): 5%, Pro ($9.99/mo): 3%. No processed payments = no fees.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payments-q6" data-testid="accordion-payments-q6">
                    <AccordionTrigger>I got an email link that didn't work. What happened?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        All BakerIQ links should start with bakeriq.app. If you clicked a link that went to a different address or showed a "page not found" error, the link may have been outdated. Try going directly to <strong>bakeriq.app/help</strong> or <strong>bakeriq.app/login</strong> instead.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted/30 rounded-2xl p-8 text-center">
            <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Need more detail?</h2>
            <p className="text-muted-foreground mb-6">
              Check the FAQ for specific answers or contact support directly.
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
