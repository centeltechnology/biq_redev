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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn how to get the most out of BakerIQ for your bakery business.
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
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Set up your account and order page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">1. Create Your Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Sign up with your email and business name. Your unique order page URL will be created automatically based on your business name.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">2. Configure Your Pricing</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Pricing in the dashboard to set your prices for cake sizes, flavors, decorations, and addons.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">3. Share Your Order Page</h4>
                  <p className="text-sm text-muted-foreground">
                    Copy your unique order page URL from Settings and share it on your website, social media, or with customers directly.
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
                    Click on any lead to see their full cake design, contact info, and event details from their order request.
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
                <CardTitle>Express Items</CardTitle>
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
                    Save your calculations for reference when setting prices in Pricing.
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
                <CardTitle>Express Items</CardTitle>
                <CardDescription>Quick ordering for popular items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Showcase Your Best Items</h4>
                  <p className="text-sm text-muted-foreground">
                    Save a pricing calculation, then click the star to feature it on your order page. Control visibility with the eye icon.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Plan Limits</h4>
                  <p className="text-sm text-muted-foreground">
                    Basic plan: up to 5 express items. Pro plan: unlimited express items. Free plan does not include Express Items.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Express Items</h4>
                  <p className="text-sm text-muted-foreground">
                    Express Items leads show a special badge. Click "Quick Quote" to create a quote with the item name, price, and details pre-filled.
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
                <CardTitle>Pricing</CardTitle>
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
                    Receive an email whenever a customer submits an inquiry through your order page.
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
                    Cupcakes, cake pops, cookies, brownies, dipped strawberries, and more. Enable or disable items in Pricing.
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
                <Share2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Share Your Order Page</CardTitle>
                <CardDescription>Promote your business on social media</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Social Media Sharing</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to the Share page in your dashboard to share your order page link on Facebook, Instagram, Twitter/X, Pinterest, WhatsApp, and LinkedIn with a single click.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Caption Templates</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose from General, Wedding, Events, Express Items, or Seasonal caption categories. Each comes with ready-to-use captions you can customize before posting.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Social Media Banners</h4>
                  <p className="text-sm text-muted-foreground">
                    Create professional social media banners right from the Share page. Pick a pre-made design (Elegant Wedding, Fun Birthday, Clean Modern, or Holiday Seasonal) or upload your own cake photo. Your business name is overlaid automatically and the banner downloads as a ready-to-post image (1200x630, ideal for Facebook and LinkedIn).
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">QR Code Download</h4>
                  <p className="text-sm text-muted-foreground">
                    Download a QR code for your order page link. Print it on business cards, flyers, or packaging so customers can scan and get an instant estimate.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Share Individual Items</h4>
                  <p className="text-sm text-muted-foreground">
                    If you have express items (Express Items), you can share each one individually on social media with its own link and caption.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Gift className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Refer a Friend</CardTitle>
                <CardDescription>Earn free months by sharing BakerIQ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Your Referral Link</h4>
                  <p className="text-sm text-muted-foreground">
                    Every baker gets a unique referral link. Find yours on the "Refer a Friend" page in your dashboard. Share it with other bakers to start earning rewards.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">How Rewards Work</h4>
                  <p className="text-sm text-muted-foreground">
                    On a paid plan: earn 1 free month of your subscription for each baker who signs up and subscribes. On the free plan: earn 1 month of Express Items access per referral. Stack up to 12 months of credits.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Track Your Referrals</h4>
                  <p className="text-sm text-muted-foreground">
                    See how many bakers you've referred, who has signed up, and how many credits you've earned — all from your Refer a Friend dashboard.
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
                    Unlimited quotes, 1 Express Item, unlimited leads, 7% platform fee on payments. Perfect for getting started.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Basic - $4.99/month</h4>
                  <p className="text-sm text-muted-foreground">
                    Unlimited quotes + Express Items with up to 5 express items. Lower 5% platform fee.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Pro - $9.99/month</h4>
                  <p className="text-sm text-muted-foreground">
                    Unlimited quotes + unlimited express items. Lowest 3% platform fee. Upgrade anytime in Settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div id="onboarding" className="mb-12" data-testid="section-help-onboarding">
            <div className="flex items-center gap-2 mb-6">
              <Rocket className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Onboarding &amp; Getting Set Up</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  When you first sign up, BakerIQ walks you through a quick setup wizard so your account is ready to receive orders. Here's what each step does:
                </p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
                    <div>
                      <h4 className="font-medium">Profile &amp; Branding</h4>
                      <p className="text-sm text-muted-foreground">Add your business name, upload a logo or banner, and set your location. This personalizes your order page for customers.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
                    <div>
                      <h4 className="font-medium">Review Your Pricing</h4>
                      <p className="text-sm text-muted-foreground">Confirm or adjust your cake sizes, flavors, and treat prices so estimates match what you actually charge.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
                    <div>
                      <h4 className="font-medium">Share Your Order Page</h4>
                      <p className="text-sm text-muted-foreground">Copy your unique link and share it on social media or with customers. This is how people find you and request quotes.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">4</span>
                    <div>
                      <h4 className="font-medium">Try a Demo Quote</h4>
                      <p className="text-sm text-muted-foreground">Send yourself a test quote to see exactly what your customers will receive. You can skip this step if you prefer.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">5</span>
                    <div>
                      <h4 className="font-medium">Connect Stripe (Optional)</h4>
                      <p className="text-sm text-muted-foreground">Link your Stripe account to collect deposits and payments online. You can always do this later from the Payments page.</p>
                    </div>
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="onboarding-q1" data-testid="accordion-onboarding-q1">
                    <AccordionTrigger>Why can't I accept payments yet?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Online payment collection requires a connected Stripe account. Go to your <strong>Payments</strong> page and click "Connect with Stripe" to complete the setup. Once connected, customers will see a "Pay Now" button on your quotes. You can still create and send quotes without Stripe — customers just won't be able to pay online.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="onboarding-q2" data-testid="accordion-onboarding-q2">
                    <AccordionTrigger>Where do I edit my order page URL?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Go to the <strong>Share</strong> page in your dashboard. You'll find the "Launch Your Landing Page" card where you can customize your URL slug (the part after bakeriq.app/c/). You can also upload a header image and preview how your page looks to customers.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="onboarding-q3" data-testid="accordion-onboarding-q3">
                    <AccordionTrigger>What does "processing-first" mean?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        BakerIQ uses a processing-first pricing model. Instead of charging a monthly fee for basic features, you only pay a small percentage when you actually collect a payment through the platform. Free plan: 7%, Basic: 5%, Pro: 3%. All plans include unlimited quotes — the platform fee is only applied when a customer pays through your quote link.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="onboarding-q4" data-testid="accordion-onboarding-q4">
                    <AccordionTrigger>Can I redo onboarding or change my answers later?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Yes. Everything you set during onboarding can be updated anytime. Change your branding in <strong>Settings</strong>, adjust pricing in <strong>Pricing</strong>, and customize your order page link from the <strong>Share</strong> page.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <div id="order-page" className="mb-12" data-testid="section-help-order-page">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Your Order Page &amp; Sharing</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">What is your Order Page?</h4>
                  <p className="text-sm text-muted-foreground">
                    Your order page is a public link (like bakeriq.app/c/your-bakery) where customers can browse your menu, see pricing, and submit a quote request. It's your online storefront — no website needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Where to Find Your Link</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to the <strong>Share</strong> page in your dashboard. Your order page URL is displayed at the top and can be copied with one click.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">How to Share in DMs (Facebook &amp; Instagram)</h4>
                  <p className="text-sm text-muted-foreground">
                    When someone asks "how much?" in your DMs, paste your order page link. They'll see your menu with live pricing and can submit a request with their event details. No more back-and-forth messages about sizes and flavors.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">What Customers See</h4>
                  <p className="text-sm text-muted-foreground">
                    Customers see your branding (logo, banner, business name), your cake and treat menu with prices, and any Express Items you've featured. They fill out their event details and submit a quote request. You receive the lead in your dashboard and by email.
                  </p>
                </div>

                <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="sharing-q1" data-testid="accordion-sharing-q1">
                    <AccordionTrigger>What are Express Items?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Express Items are your featured specials — popular items you want to highlight on your order page. Create them in the <strong>Pricing Calculator</strong>, then star them to feature on your public page. Customers can order them with one click. Plan limits: Free = 1 item, Basic = up to 5, Pro = unlimited.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sharing-q2" data-testid="accordion-sharing-q2">
                    <AccordionTrigger>How do I customize my branding and URL?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        From the <strong>Share</strong> page, use the "Launch Your Landing Page" card to: upload a header/banner image, change your URL slug, and preview your page. Your business name and logo come from <strong>Settings</strong>. All changes are reflected immediately on your public order page.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sharing-q3" data-testid="accordion-sharing-q3">
                    <AccordionTrigger>Can I share individual items on social media?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Yes. If you have Express Items, each one gets its own shareable link. On the <strong>Share</strong> page, you'll see sharing buttons for each featured item with pre-written captions you can customize before posting to Facebook, Instagram, Twitter/X, Pinterest, WhatsApp, or LinkedIn.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sharing-q4" data-testid="accordion-sharing-q4">
                    <AccordionTrigger>How do I get a QR code for my order page?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        On the <strong>Share</strong> page, click "Download QR Code." Print it on business cards, flyers, packaging, or booth displays so customers can scan and land directly on your order page.
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
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="payments-q1" data-testid="accordion-payments-q1">
                    <AccordionTrigger>Can I set up deposits without Stripe?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Yes. Go to <strong>Payments</strong> and configure your deposit settings (percentage or flat amount). These will appear on your quotes so customers know how much is due upfront. Without Stripe, they'll see the amount but will need to pay you directly (cash, Venmo, Zelle, etc.). Connect Stripe to let them pay the deposit online.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payments-q2" data-testid="accordion-payments-q2">
                    <AccordionTrigger>What does connecting Stripe do?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Stripe lets your customers pay deposits or full amounts directly on your quotes through a secure checkout page. Money goes to your Stripe account (minus the platform fee for your plan). You can track all payments on your <strong>Payments</strong> page and get email notifications for each one.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payments-q3" data-testid="accordion-payments-q3">
                    <AccordionTrigger>How does "accept now, pay later" work?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        When you send a quote, your customer can accept it right away even if they're not ready to pay. Accepting locks in the price and confirms the order. They can come back and pay the deposit (or full amount) later using the same quote link. You'll see the quote status update in your dashboard as they accept and pay.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payments-q4" data-testid="accordion-payments-q4">
                    <AccordionTrigger>What are platform fees?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        BakerIQ charges a small percentage only when a customer pays through your quote link. Free plan: 7%, Basic ($4.99/mo): 5%, Pro ($9.99/mo): 3%. The fee is deducted automatically — you receive the rest in your Stripe account. No payments through the platform means no fees.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
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
