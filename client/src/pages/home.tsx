import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MockPaymentsDashboard } from "@/components/mock-payments-dashboard";
import { trackSignupClick } from "@/lib/analytics";
import {
  Cake,
  ArrowRight,
  Check,
  Share2,
  MessageSquareText,
  FileText,
  CreditCard,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import orderPageImg from "@assets/generated_images/bakeriq_public_cake_calculator.png";
import cakeImg from "@assets/generated_images/elegant_wedding_cake_hero.png";

export default function HomePage() {
  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
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
              <Button data-testid="link-signup" onClick={() => trackSignupClick()}>Start Free</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
          <div className="absolute -top-24 -right-24 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="container max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="flex flex-col">
                <span
                  className="inline-flex items-center gap-2 self-start rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-6"
                  data-testid="text-hero-eyebrow"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Made for custom cake &amp; treat makers
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.08] mb-6" data-testid="text-hero-heading">
                  Stop pricing cakes in your DMs.
                </h1>
                <p className="text-lg text-muted-foreground mb-7 max-w-md leading-relaxed" data-testid="text-hero-subheading">
                  Share one beautiful order page that quotes every request instantly — so you look professional, stop undercharging, and get paid without the endless back-and-forth.
                </p>
                <div className="space-y-3 mb-8 max-w-md" data-testid="list-hero-relief">
                  <ReliefItem text="No more guessing your prices in chat threads" />
                  <ReliefItem text="Every request arrives complete — no follow-up questions" />
                  <ReliefItem text="Deposits collected automatically when you're ready" />
                </div>
                <div className="flex flex-col sm:flex-row items-start gap-3 mb-5">
                  <Link href="/signup">
                    <Button size="lg" className="gap-2 text-base" data-testid="button-hero-start" onClick={() => trackSignupClick()}>
                      Start Free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 text-base"
                    onClick={scrollToHowItWorks}
                    data-testid="button-hero-how"
                  >
                    See How It Works
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-trust-line">
                  Free to start. No credit card. We only earn when you get paid.
                </p>
              </div>

              {/* Hero visual: the actual order page customers see */}
              <div className="relative">
                <div className="relative rounded-2xl border bg-card shadow-xl overflow-hidden" data-testid="img-hero-order-page-frame">
                  <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
                    <span className="h-2.5 w-2.5 rounded-full bg-chart-4/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-chart-5/50" />
                    <span className="ml-3 text-[11px] text-muted-foreground truncate">bakeriq.app/c/your-bakery</span>
                  </div>
                  <img
                    src={orderPageImg}
                    alt="A baker's public order page where customers build their cake and get an instant price"
                    width={900}
                    height={680}
                    className="w-full h-auto object-cover"
                    data-testid="img-hero-order-page"
                  />
                </div>
                <div className="absolute -bottom-5 -left-4 w-32 sm:w-40 rounded-xl overflow-hidden border-4 border-background shadow-lg rotate-[-4deg]">
                  <img
                    src={cakeImg}
                    alt="An elegant custom cake"
                    width={320}
                    height={320}
                    className="w-full h-auto object-cover"
                    data-testid="img-hero-cake"
                  />
                </div>
                <div className="absolute -top-3 -right-3 sm:-right-4 rounded-full bg-card border shadow-md px-4 py-2 flex items-center gap-2" data-testid="badge-instant-quote">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Instant quote</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section id="how-it-works" className="py-20 md:py-28 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center" data-testid="text-workflow-heading">
              From request to paid — without the back-and-forth.
            </h2>
            <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
              Four simple steps. You stay in control the whole way.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-5xl mx-auto">
              <WorkflowStep
                step={1}
                icon={<Share2 className="h-6 w-6 text-primary" />}
                title="Share your order page"
                description="One link. Customers see your pricing and send a complete request."
              />
              <WorkflowStep
                step={2}
                icon={<MessageSquareText className="h-6 w-6 text-primary" />}
                title="Get a clean request"
                description="Every detail you need. No missing info, no chasing."
              />
              <WorkflowStep
                step={3}
                icon={<FileText className="h-6 w-6 text-primary" />}
                title="Send a polished quote"
                description="Deposit built in. Clear terms. Ready to accept in a tap."
              />
              <WorkflowStep
                step={4}
                icon={<CreditCard className="h-6 w-6 text-primary" />}
                title="Get your deposit"
                description="Secure deposits through Stripe, paid straight to your account."
              />
            </div>
          </div>
        </section>

        <div className="py-10 text-center" data-testid="text-authority-line">
          <p className="text-sm text-muted-foreground tracking-wide">
            Loved by home bakers and custom cake studios alike.
          </p>
        </div>

        {/* WHAT MAKES IT DIFFERENT */}
        <section className="py-20 md:py-28">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center" data-testid="text-different-heading">
                Everything you need to look professional.
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
                The tools that used to take a dozen apps — now in one simple place.
              </p>
              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-5 max-w-xl mx-auto">
                <Feature text="Unlimited quotes on every plan" />
                <Feature text="Express Items for featured specials" />
                <Feature text="Custom deposit policies" />
                <Feature text="Stripe-powered payments" />
                <Feature text="A clear view of your real revenue" />
                <Feature text="Your own branded order page" />
              </div>
            </div>
          </div>
        </section>

        {/* REVENUE VISIBILITY */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-5" data-testid="text-revenue-heading">
                  See every payment in one place.
                </h2>
                <p className="text-lg text-muted-foreground mb-6 max-w-md leading-relaxed">
                  Once you connect Stripe, deposits and payments land here automatically. No spreadsheets, no guessing what you actually earned this month.
                </p>
                <div className="space-y-3 max-w-md">
                  <ReliefItem text="Deposits collected the moment a quote is accepted" />
                  <ReliefItem text="Your real take-home, after fees, at a glance" />
                  <ReliefItem text="Set it up only when you're ready — it's optional" />
                </div>
              </div>
              <div className="rounded-xl border bg-card shadow-lg overflow-hidden p-4">
                <MockPaymentsDashboard />
              </div>
            </div>
          </div>
        </section>

        {/* PRICING MODEL CLARITY */}
        <section className="py-20 md:py-28">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8" data-testid="text-pricing-heading">
                Free to start. Pay as you grow.
              </h2>
              <div className="space-y-2 text-muted-foreground text-base mb-10">
                <p>Unlimited quotes on every plan.</p>
                <p>A small fee only when you actually get paid.</p>
                <p>Upgrade anytime to keep more of what you earn.</p>
              </div>
              <Link href="/plans">
                <Button variant="outline" size="lg" className="gap-2" data-testid="button-view-pricing">
                  View Pricing
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center" data-testid="text-faq-heading">
                Frequently Asked Questions
              </h2>
              <div className="space-y-0 divide-y">
                <FaqItem
                  question="Do I need Stripe?"
                  answer="Only if you want to collect payments online. You can use BakerIQ for quoting and lead management without Stripe. When you're ready, connect Stripe to start accepting deposits and payments."
                />
                <FaqItem
                  question="Can customers accept a quote and pay later?"
                  answer="Yes. Customers can accept a quote without paying immediately. You control whether a deposit is required upfront."
                />
                <FaqItem
                  question="What if I don't want deposits?"
                  answer="You can set your deposit type to full payment or adjust the percentage to zero. You're in complete control of your payment terms."
                />
                <FaqItem
                  question="Can I change my currency?"
                  answer="Yes. You can change your currency anytime from the Payments page. Changes apply to future quotes — past quotes keep their original currency."
                />
              </div>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="py-20 md:py-28 bg-primary text-primary-foreground">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-closing-heading">
              Spend less time quoting. More time baking.
            </h2>
            <p className="text-lg opacity-90 mb-10">
              Set up your order page in minutes — it's free to start.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="gap-2 text-lg" data-testid="button-cta-signup" onClick={() => trackSignupClick()}>
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
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
              Made for custom cake &amp; treat makers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function WorkflowStep({ step, icon, title, description }: { step: number; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center" data-testid={`workflow-step-${step}`}>
      <div className="h-12 w-12 rounded-full bg-primary/15 dark:bg-primary/10 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <Check className="h-4 w-4 text-primary shrink-0" />
      <span className="text-base">{text}</span>
    </div>
  );
}

function ReliefItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3" data-testid="relief-item">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Check className="h-3 w-3 text-primary" />
      </span>
      <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-5" data-testid={`faq-item-${question.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
      <button
        className="flex items-center justify-between w-full text-left gap-4"
        onClick={() => setOpen(!open)}
        data-testid={`faq-toggle-${question.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      >
        <span className="text-base font-medium">{question}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{answer}</p>
      )}
    </div>
  );
}
