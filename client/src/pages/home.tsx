import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Sparkles,
  Clock,
  DollarSign,
  Zap,
  Eye,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import dashboardImage from "@assets/generated_images/abstract_dashboard_ui_mockup.png";
import quoteBuilderImage from "@assets/generated_images/abstract_quote_form_mockup.png";
import calendarImage from "@assets/generated_images/abstract_calendar_ui_mockup.png";
import calculatorImage from "@assets/generated_images/abstract_calculator_ui_mockup.png";

const testimonials = [
  {
    name: "Sarah Mitchell",
    business: "Sweet Creations Bakery",
    location: "Austin, TX",
    quote: "BakerIQ cut my quote time in half. I used to spend hours on back-and-forth emails. Now customers get instant estimates and I focus on what I love - baking!",
    metric: "2x more leads captured"
  },
  {
    name: "Maria Rodriguez",
    business: "Cake Dreams Studio",
    location: "Miami, FL",
    quote: "The public calculator is a game-changer. Customers can see my pricing upfront, which means the leads I get are serious buyers ready to order.",
    metric: "40% higher conversion rate"
  },
  {
    name: "Jennifer Chen",
    business: "Artisan Cake Co.",
    location: "Seattle, WA",
    quote: "I went from juggling spreadsheets and notes to having everything in one place. The calendar view alone saves me from double-booking weekends.",
    metric: "Zero missed orders"
  }
];

const previewScreens = [
  { image: dashboardImage, title: "Dashboard & Quotes", description: "See all your quotes, leads, and customers in one organized view" },
  { image: quoteBuilderImage, title: "Quote Builder", description: "Create detailed quotes with custom line items and automatic calculations" },
  { image: calendarImage, title: "Order Calendar", description: "View upcoming orders with revenue tracking and easy search" },
  { image: calculatorImage, title: "Public Calculator", description: "Your customers use this to build their dream cake and get instant pricing" }
];

export default function HomePage() {
  const [previewIndex, setPreviewIndex] = useState(0);

  const nextPreview = () => setPreviewIndex((i) => (i + 1) % previewScreens.length);
  const prevPreview = () => setPreviewIndex((i) => (i - 1 + previewScreens.length) % previewScreens.length);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cake className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">BakerIQ</span>
          </div>
          <nav className="flex items-center gap-4">
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
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Made for custom cake bakers</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Turn cake inquiries into{" "}
                <span className="text-primary">paying customers</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                BakerIQ helps custom cake bakers capture leads, manage quotes, and grow their business with a beautiful public pricing calculator.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 text-lg px-8" data-testid="button-get-started">
                    Start Free Today
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/c/sweet-dreams-bakery">
                  <Button size="lg" variant="outline" className="gap-2 text-lg" data-testid="button-demo">
                    See Demo Calculator
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-16 max-w-5xl mx-auto">
              <div className="relative rounded-xl overflow-hidden shadow-2xl border bg-card">
                <img 
                  src={dashboardImage} 
                  alt="BakerIQ Dashboard showing quote management interface" 
                  className="w-full h-auto"
                  data-testid="img-dashboard-preview"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                  <div className="text-white">
                    <p className="text-lg font-semibold">Your command center for cake orders</p>
                    <p className="text-sm opacity-80">Manage quotes, leads, and customers all in one place</p>
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
                            className="h-10 w-10 rounded-full bg-background/80 hover:bg-background ml-2"
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
                            className="h-10 w-10 rounded-full bg-background/80 hover:bg-background mr-2"
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
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything you need to grow your bakery
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From lead capture to quote management, BakerIQ streamlines your entire customer journey.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover-elevate">
                <CardHeader>
                  <Calculator className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Public Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Let customers design their dream cake and get instant price estimates. Your unique calculator URL captures leads automatically.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Lead Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Track every inquiry with status updates, notes, and contact history. Never lose a potential customer again.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardHeader>
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Quote Builder</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Create professional quotes with custom line items, multiple tiers, and automatic calculations in minutes.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardHeader>
                  <CalendarCheck className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Order Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    View all your upcoming orders in a beautiful calendar. Search by customer, event type, or date.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardHeader>
                  <DollarSign className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Customizable Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Set your own prices for sizes, flavors, decorations, and addons. Configure deposit percentages and payment methods.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Business Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Track your pipeline value, conversion rates, and upcoming orders from a single dashboard.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-10 w-10 text-primary mb-2" />
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Basic & Pro</span>
                  </div>
                  <CardTitle>Fast Quote</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Feature your popular items on the public calculator. Customers order in a few clicks and quotes are pre-filled with their selection. Basic: 10 items, Pro: unlimited.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Stop losing leads to complicated quote requests
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Most cake bakers lose 50% of inquiries because their quote process is too slow or confusing. BakerIQ changes that.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Instant price estimates</p>
                      <p className="text-muted-foreground text-sm">Customers see pricing immediately, no back-and-forth needed</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Automatic lead capture</p>
                      <p className="text-muted-foreground text-sm">Every calculator submission becomes a lead in your dashboard</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Email notifications</p>
                      <p className="text-muted-foreground text-sm">Get notified instantly when new leads come in</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Professional quotes</p>
                      <p className="text-muted-foreground text-sm">Convert leads to detailed quotes with a single click</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 lg:p-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">5 min</p>
                      <p className="text-muted-foreground">Average setup time</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">2x</p>
                      <p className="text-muted-foreground">More leads captured</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">40%</p>
                      <p className="text-muted-foreground">Time saved on quotes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Loved by cake bakers everywhere
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how BakerIQ is helping custom cake bakers grow their businesses
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {testimonial.location}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {testimonial.metric}
                        </span>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to grow your bakery business?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join hundreds of custom cake bakers who use BakerIQ to capture more leads and create beautiful quotes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="gap-2 text-lg px-8" data-testid="button-cta-signup">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/c/sweet-dreams-bakery">
                <Button size="lg" variant="outline" className="gap-2 text-lg bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-cta-demo">
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
              Made with love for cake bakers everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
