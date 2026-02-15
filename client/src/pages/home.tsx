import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Cake,
  ArrowRight,
  Check,
  CreditCard,
  QrCode,
  MessageSquare,
  DollarSign,
  ClipboardList,
  BarChart3,
  Clock,
  Link as LinkIcon,
  FileText,
  Users,
  Banknote,
  ShieldCheck,
} from "lucide-react";

export default function HomePage() {
  const scrollToHowItWorks = () => {
    document.getElementById("the-problem")?.scrollIntoView({ behavior: "smooth" });
  };

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
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" data-testid="link-login">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button data-testid="link-signup">Start Free</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="py-24 md:py-36">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6" data-testid="text-hero-heading">
                Stop running your baking business like a secretary.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto" data-testid="text-hero-subheading">
                Share one link. Send professional quotes. Collect deposits automatically.
                Spend less time managing orders — and more time baking.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 text-lg" data-testid="button-hero-start">
                    Start Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 text-lg"
                  onClick={scrollToHowItWorks}
                  data-testid="button-hero-how"
                >
                  See How It Works
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground mt-6 flex-wrap justify-center">
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
        </section>

        <section id="the-problem" className="py-16 md:py-24 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center" data-testid="text-problem-heading">
                The Problem
              </h2>
              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-5">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">Pricing in DMs</p>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">Chasing deposits</p>
                </div>
                <div className="flex items-start gap-3">
                  <ClipboardList className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">Manual order tracking</p>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">Guessing your monthly revenue</p>
                </div>
                <div className="flex items-start gap-3 sm:col-span-2 sm:justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">Spending more time managing than baking</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center" data-testid="text-upgrade-heading">
                The Upgrade
              </h2>
              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-5">
                <div className="flex items-start gap-3">
                  <LinkIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p>One pricing link</p>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p>Clean, branded quotes</p>
                </div>
                <div className="flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p>Automatic deposits through Stripe</p>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p>Organized customer records</p>
                </div>
                <div className="flex items-start gap-3 sm:col-span-2 sm:justify-center">
                  <BarChart3 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p>Real revenue visibility</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="text-stripe-heading">
                Get Paid Like a Professional
              </h2>
              <p className="text-lg text-muted-foreground mb-4">
                Connect your own Stripe account and collect deposits and payments automatically.
              </p>
              <p className="text-lg text-muted-foreground mb-2">
                Money goes directly to your bank.
              </p>
              <p className="text-lg text-muted-foreground">
                No chasing. No confusion.
              </p>
              <div className="flex items-center justify-center gap-3 mt-8 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Bank-level security powered by Stripe</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="text-share-heading">
                Share Anywhere
              </h2>
              <p className="text-lg text-muted-foreground mb-2">
                Download your QR code and add it to packaging, pop-ups, or business cards.
              </p>
              <p className="text-lg text-muted-foreground">
                Let customers build their order before they even message you.
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
                Start free. Upgrade when you're ready. Every plan includes built-in payments.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="hover-elevate" data-testid="card-plan-free">
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>Everything you need to start</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$0</span>
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
                      <span className="text-sm text-muted-foreground">Public pricing calculator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Accept payments online</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">7% platform fee</span>
                    </li>
                  </ul>
                  <Link href="/signup">
                    <Button variant="outline" className="w-full mt-6 gap-2" data-testid="button-plan-free">
                      Start Free
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
                  <CardDescription>For growing operations</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$4.99</span>
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
                      <span className="text-sm text-muted-foreground">5 featured items (Fast Quote)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Accept payments online</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium">5% platform fee</span>
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
                  <CardDescription>For established treat makers</CardDescription>
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
                      <span className="text-sm font-medium">3% platform fee</span>
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

        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="text-closing-heading">
              Built for Treat Makers Who Take Their Business Seriously.
            </h2>
            <p className="text-lg opacity-90 mb-4 max-w-2xl mx-auto">
              Structure. Clarity. Automation. Professionalism.
            </p>
            <p className="text-lg opacity-80 mb-10 max-w-2xl mx-auto">
              BakerIQ gives you the systems to run your business like a business — so you can focus on what you do best.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="gap-2 text-lg" data-testid="button-cta-signup">
                  Start Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/c/bakeriq-demo">
                <Button size="lg" variant="outline" className="gap-2 text-lg bg-transparent border-primary-foreground/30 text-primary-foreground" data-testid="button-cta-demo">
                  See the Calculator
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
              Revenue infrastructure for treat makers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
