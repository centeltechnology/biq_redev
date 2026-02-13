import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Cake, 
  Calculator, 
  Users, 
  FileText, 
  CalendarCheck, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Clock,
  DollarSign,
  Zap,
  Eye,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Shield,
  BarChart3,
  Send,
  Check,
  X
} from "lucide-react";

import sliderImage1 from "@assets/img-1_1768182819883.png";
import sliderImage2 from "@assets/img-2_1768182819883.png";
import sliderImage3 from "@assets/img-3_1768182819883.png";

const testimonials = [
  {
    name: "Sarah Mitchell",
    business: "Sweet Creations Bakery",
    location: "Austin, TX",
    quote: "I was so tired of the 'how much?' DMs with no details. Now I just send my calculator link and they fill everything out themselves. So much easier!"
  },
  {
    name: "Maria Rodriguez",
    business: "Cake Dreams Studio",
    location: "Miami, FL",
    quote: "Having my prices right there on the calculator means customers know what to expect. The inquiries I get now are way more realistic and ready to order."
  },
  {
    name: "Jennifer Chen",
    business: "Artisan Cake Co.",
    location: "Seattle, WA",
    quote: "I used to have orders scribbled on sticky notes everywhere. Now everything's in one place and I can actually see my whole month at a glance."
  }
];

const previewScreens = [
  { image: sliderImage1, title: "Quote Builder & Calendar", description: "Create quotes, view your calendar, and track business insights all in one place" },
  { image: sliderImage2, title: "Manage Leads & Quotes", description: "Track inquiries, send professional quotes, and monitor your dashboard" },
  { image: sliderImage3, title: "Lead & Order Management", description: "Centralize your orders and manage leads with easy status tracking" }
];

const competitors = [
  {
    name: "HoneyBook",
    monthly: "$19 - $39/mo",
    txFee: "2.9% + $0.25",
    txFeeOnOrder: "$8.95",
    totalCost: "$27.95 - $47.95",
    hasCalculator: false,
    hasLeads: false,
    hasBakeryFocus: false,
  },
  {
    name: "17hats",
    monthly: "$15 - $60/mo",
    txFee: "2.9% + $0.30",
    txFeeOnOrder: "$9.00",
    totalCost: "$24.00 - $69.00",
    hasCalculator: false,
    hasLeads: false,
    hasBakeryFocus: false,
  },
  {
    name: "Square Invoices",
    monthly: "Free",
    txFee: "3.3% + $0.30",
    txFeeOnOrder: "$10.20",
    totalCost: "$10.20",
    hasCalculator: false,
    hasLeads: false,
    hasBakeryFocus: false,
  },
  {
    name: "BakerIQ Pro",
    monthly: "$9.99/mo",
    txFee: "3% + processing",
    txFeeOnOrder: "$18.00",
    totalCost: "$27.99",
    hasCalculator: true,
    hasLeads: true,
    hasBakeryFocus: true,
    highlight: true,
  },
];

export default function HomePage() {
  const [previewIndex, setPreviewIndex] = useState(0);

  const nextPreview = () => setPreviewIndex((i) => (i + 1) % previewScreens.length);
  const prevPreview = () => setPreviewIndex((i) => (i - 1 + previewScreens.length) % previewScreens.length);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cake className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">BakerIQ</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <Link href="/help">
              <Button variant="ghost" data-testid="link-help">Help</Button>
            </Link>
            <Link href="/faq">
              <Button variant="ghost" data-testid="link-faq">FAQ</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" data-testid="link-login">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button data-testid="link-signup">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
          <div className="container max-w-7xl mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Cake className="h-4 w-4" />
                <span className="text-sm font-medium">The all-in-one platform for bakers</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Quote, bill, and get paid{" "}
                <span className="text-primary">all in one place</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                BakerIQ replaces your calculator, invoicing app, and payment tool with one simple platform built for bakers. Capture leads, send professional quotes, and collect payments — without juggling multiple subscriptions.
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="gap-2 text-lg" data-testid="button-get-started">
                      Start Free Today
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/c/bakeriq-demo">
                    <Button size="lg" variant="outline" className="gap-2 text-lg" data-testid="button-demo">
                      See Demo Calculator
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap justify-center">
                  <span className="flex items-center gap-1.5" data-testid="text-trust-free">
                    <Check className="h-4 w-4 text-primary" />
                    Free forever plan
                  </span>
                  <span className="flex items-center gap-1.5" data-testid="text-trust-nocard">
                    <Check className="h-4 w-4 text-primary" />
                    No credit card required
                  </span>
                  <span className="flex items-center gap-1.5" data-testid="text-trust-payments">
                    <Check className="h-4 w-4 text-primary" />
                    Get paid directly
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-16 max-w-5xl mx-auto">
              <div className="relative rounded-xl overflow-hidden shadow-2xl border bg-card">
                <img 
                  src={sliderImage1} 
                  alt="BakerIQ Dashboard showing quote management interface" 
                  className="w-full h-auto"
                  data-testid="img-dashboard-preview"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between gap-4 flex-wrap">
                  <div className="text-white">
                    <p className="text-lg font-semibold">Your command center for orders and payments</p>
                    <p className="text-sm opacity-80">Manage quotes, leads, billing, and customers all in one place</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="gap-2" data-testid="button-preview-dashboard">
                        <Eye className="h-4 w-4" />
                        Preview Dashboard
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>{previewScreens[previewIndex].title}</DialogTitle>
                      </DialogHeader>
                      <div className="relative">
                        <img 
                          src={previewScreens[previewIndex].image} 
                          alt={previewScreens[previewIndex].title}
                          className="w-full rounded-lg border"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={prevPreview}
                            className="rounded-full bg-background/80 ml-2"
                            data-testid="button-preview-prev"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={nextPreview}
                            className="rounded-full bg-background/80 mr-2"
                            data-testid="button-preview-next"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-center text-muted-foreground">{previewScreens[previewIndex].description}</p>
                      <div className="flex justify-center gap-2">
                        {previewScreens.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPreviewIndex(idx)}
                            className={`h-2 w-2 rounded-full transition-colors ${idx === previewIndex ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                            data-testid={`button-preview-dot-${idx}`}
                          />
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-how-it-works-heading">
                From inquiry to payment in three steps
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                No more chasing customers through DMs, texts, and Venmo. BakerIQ handles the entire flow.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center" data-testid="step-calculator">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-8 w-8 text-primary" />
                </div>
                <div className="text-sm font-medium text-primary mb-2">Step 1</div>
                <h3 className="text-xl font-semibold mb-2">Share your calculator</h3>
                <p className="text-muted-foreground">
                  Customers visit your custom pricing calculator, build their order, and submit their inquiry. You get a lead instantly.
                </p>
              </div>
              <div className="text-center" data-testid="step-quote">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-primary" />
                </div>
                <div className="text-sm font-medium text-primary mb-2">Step 2</div>
                <h3 className="text-xl font-semibold mb-2">Send a professional quote</h3>
                <p className="text-muted-foreground">
                  Convert the lead into a detailed quote with line items, notes, and your branding. One click sends it to the customer.
                </p>
              </div>
              <div className="text-center" data-testid="step-payment">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
                <div className="text-sm font-medium text-primary mb-2">Step 3</div>
                <h3 className="text-xl font-semibold mb-2">Get paid through BakerIQ</h3>
                <p className="text-muted-foreground">
                  Customers pay deposits or full amounts directly through their quote. Funds go straight to your bank account.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-features-heading">
                Everything you need to run your bakery business
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Stop paying for five different tools. BakerIQ brings lead capture, quoting, billing, scheduling, and analytics into one platform.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover-elevate" data-testid="card-feature-calculator">
                <CardHeader>
                  <Calculator className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">Public Pricing Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Share a custom link. Customers build their cake or treat order and get instant estimates. Every submission becomes a lead.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate" data-testid="card-feature-leads">
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">Lead Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track every inquiry with status updates, notes, and contact history. Get email alerts when new leads come in.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate" data-testid="card-feature-quotes">
                <CardHeader>
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">Professional Quotes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Build detailed quotes with line items and send them directly to customers. Convert leads with a single click.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate" data-testid="card-feature-payments">
                <CardHeader>
                  <CreditCard className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">Built-in Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Accept deposits and full payments directly through quotes. Customers pay online. Funds go to your bank account.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate" data-testid="card-feature-calendar">
                <CardHeader>
                  <CalendarCheck className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">Order Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    See your upcoming orders at a glance. Search by customer, event type, or date to stay on top of your schedule.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate" data-testid="card-feature-pricing">
                <CardHeader>
                  <DollarSign className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">Custom Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Set your own prices for sizes, flavors, frostings, decorations, and treats. Your prices, your rules.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate" data-testid="card-feature-insights">
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">Business Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track pipeline value, conversion rates, revenue trends, and upcoming orders from your dashboard.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate" data-testid="card-feature-fastquote">
                <CardHeader>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Zap className="h-8 w-8 text-primary mb-2" />
                    <Badge variant="secondary" className="no-default-active-elevate text-xs">Basic & Pro</Badge>
                  </div>
                  <CardTitle className="text-base">Fast Quote</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Feature popular items on your calculator. Customers order in a few clicks and quotes auto-fill with their selection.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-comparison-heading">
                Keep more of what you earn
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Other platforms charge high monthly fees and still take a cut of every transaction. BakerIQ gives you more for less.
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="mb-4 text-sm text-muted-foreground text-center">
                Based on a $300 cake order
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" data-testid="table-cost-comparison">
                  <thead>
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Platform</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Monthly Fee</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Per-Transaction Fee</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fee on $300 Order</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total Monthly Cost*</th>
                      <th className="text-center p-4 text-sm font-medium text-muted-foreground">Price Calculator</th>
                      <th className="text-center p-4 text-sm font-medium text-muted-foreground">Lead Capture</th>
                      <th className="text-center p-4 text-sm font-medium text-muted-foreground">Bakery-Focused</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((comp) => (
                      <tr
                        key={comp.name}
                        className={comp.highlight ? "bg-primary/5" : "border-b border-border"}
                        data-testid={`row-competitor-${comp.name.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        <td className="p-4 font-medium">
                          <div className="flex items-center gap-2 flex-wrap">
                            {comp.name}
                            {comp.highlight && <Badge variant="default" className="no-default-active-elevate text-xs">Recommended</Badge>}
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground" data-testid={`text-monthly-${comp.name.toLowerCase().replace(/\s/g, '-')}`}>{comp.monthly}</td>
                        <td className="p-4 text-muted-foreground" data-testid={`text-txfee-${comp.name.toLowerCase().replace(/\s/g, '-')}`}>{comp.txFee}</td>
                        <td className="p-4 font-medium" data-testid={`text-orderfee-${comp.name.toLowerCase().replace(/\s/g, '-')}`}>{comp.txFeeOnOrder}</td>
                        <td className="p-4 font-semibold" data-testid={`text-totalcost-${comp.name.toLowerCase().replace(/\s/g, '-')}`}>{comp.totalCost}</td>
                        <td className="text-center p-4" data-testid={`indicator-calculator-${comp.name.toLowerCase().replace(/\s/g, '-')}`}>
                          {comp.hasCalculator ? <Check className="h-5 w-5 text-primary mx-auto" /> : <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />}
                        </td>
                        <td className="text-center p-4" data-testid={`indicator-leads-${comp.name.toLowerCase().replace(/\s/g, '-')}`}>
                          {comp.hasLeads ? <Check className="h-5 w-5 text-primary mx-auto" /> : <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />}
                        </td>
                        <td className="text-center p-4" data-testid={`indicator-bakery-${comp.name.toLowerCase().replace(/\s/g, '-')}`}>
                          {comp.hasBakeryFocus ? <Check className="h-5 w-5 text-primary mx-auto" /> : <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                *Total monthly cost = subscription + transaction fee on one $300 order. BakerIQ fees include both platform fee (3%) and payment processing (2.9% + $0.30).
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-pricing-heading">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Start free and upgrade as your business grows. Every plan includes built-in billing so your customers can pay you directly.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="hover-elevate" data-testid="card-plan-free">
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>For bakers just getting started</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">5 quotes sent per month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Unlimited leads</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Public pricing calculator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Accept payments online</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">7% platform fee on payments</span>
                    </li>
                  </ul>
                  <Link href="/signup">
                    <Button variant="outline" className="w-full mt-6 gap-2" data-testid="button-plan-free">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover-elevate border-primary/30" data-testid="card-plan-basic">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle>Basic</CardTitle>
                    <Badge variant="secondary" className="no-default-active-elevate text-xs">Popular</Badge>
                  </div>
                  <CardDescription>For growing bakery businesses</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$4.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">15 quotes sent per month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Unlimited leads</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">5 featured items (Fast Quote)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Accept payments online</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium">5% platform fee on payments</span>
                    </li>
                  </ul>
                  <Link href="/signup">
                    <Button className="w-full mt-6 gap-2" data-testid="button-plan-basic">
                      Start with Basic
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-plan-pro">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle>Pro</CardTitle>
                    <Badge variant="secondary" className="no-default-active-elevate text-xs">Best Value</Badge>
                  </div>
                  <CardDescription>For established bakeries</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$9.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Unlimited quotes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Unlimited leads</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Unlimited featured items</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Accept payments online</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium">3% platform fee on payments</span>
                    </li>
                  </ul>
                  <Link href="/signup">
                    <Button variant="outline" className="w-full mt-6 gap-2" data-testid="button-plan-pro">
                      Start with Pro
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="text-benefits-heading">
                  Built for how bakers actually work
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Most business tools weren't designed for custom orders. BakerIQ was built from the ground up for cake and treat makers.
                </p>
                <ul className="space-y-5">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">No more price-shopping DMs</p>
                      <p className="text-muted-foreground text-sm">Customers see transparent pricing upfront. You only hear from people who are ready to order.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Get deposits before you bake</p>
                      <p className="text-muted-foreground text-sm">Collect deposits or full payments directly through the quote. No more chasing payments after delivery.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Everything in one place</p>
                      <p className="text-muted-foreground text-sm">Leads, quotes, payments, calendar, and customer info. No more switching between apps or losing track of orders.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Look professional without the overhead</p>
                      <p className="text-muted-foreground text-sm">Send branded quotes and accept online payments. Your customers get a polished experience without you needing a website.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 lg:p-12">
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">5 min</p>
                      <p className="text-muted-foreground">Average setup time</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">Secure</p>
                      <p className="text-muted-foreground">Bank-level payment security</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">Direct</p>
                      <p className="text-muted-foreground">Payments go straight to your bank</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">40%</p>
                      <p className="text-muted-foreground">Less time on admin work</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-testimonials-heading">
                Trusted by bakers everywhere
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how BakerIQ is helping treat makers run better businesses
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-testimonial-${index}`}>
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {testimonial.location}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-cta-heading">
              Ready to simplify your bakery business?
            </h2>
            <p className="text-lg opacity-90 mb-4 max-w-2xl mx-auto">
              Join bakers who use BakerIQ to capture leads, send quotes, and get paid — all from one platform.
            </p>
            <p className="text-sm opacity-75 mb-8">
              Free forever. No credit card needed. Set up in under 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="gap-2 text-lg" data-testid="button-cta-signup">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/c/bakeriq-demo">
                <Button size="lg" variant="outline" className="gap-2 text-lg bg-transparent border-primary-foreground/30 text-primary-foreground" data-testid="button-cta-demo">
                  Try Demo Calculator
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Cake className="h-6 w-6 text-primary" />
              <span className="font-semibold">BakerIQ</span>
            </div>
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
              Made with love for bakers everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
