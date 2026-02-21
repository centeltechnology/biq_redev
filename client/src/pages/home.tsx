import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { MockPaymentsDashboard } from "@/components/mock-payments-dashboard";
import {
  Cake,
  ArrowRight,
  Check,
  Share2,
  MessageSquareText,
  FileText,
  CreditCard,
  ChevronDown,
} from "lucide-react";

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
              <Button data-testid="link-signup">Start Free</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="py-16 md:py-24">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div className="flex flex-col justify-center lg:pt-8">
                <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-tight mb-6" data-testid="text-hero-heading">
                  You've mastered the craft. Now master the business.
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg" data-testid="text-hero-subheading">
                  Structure your orders. Automate deposits. See your real revenue — from inquiry to payout.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-3 mb-6">
                  <Link href="/signup">
                    <Button size="lg" className="gap-2 text-base" data-testid="button-hero-start">
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
                  Free to start. We only earn when you do.
                </p>
              </div>

              <div className="rounded-xl border bg-card shadow-lg overflow-hidden p-4">
                <MockPaymentsDashboard />
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section id="how-it-works" className="py-16 md:py-24 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-14 text-center" data-testid="text-workflow-heading">
              From inquiry to deposit — all in one system.
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              <WorkflowStep
                step={1}
                icon={<Share2 className="h-6 w-6 text-primary" />}
                title="Share your Order Page"
                description="One link. Customers see your pricing and build their order."
              />
              <WorkflowStep
                step={2}
                icon={<MessageSquareText className="h-6 w-6 text-primary" />}
                title="Customer requests a quote"
                description="You get a structured lead with everything you need."
              />
              <WorkflowStep
                step={3}
                icon={<FileText className="h-6 w-6 text-primary" />}
                title="Send structured quote with deposit"
                description="Professional quote with built-in deposit requirement."
              />
              <WorkflowStep
                step={4}
                icon={<CreditCard className="h-6 w-6 text-primary" />}
                title="Get paid through Stripe"
                description="Customer pays securely. Money goes to your bank."
              />
            </div>
          </div>
        </section>

        {/* WHAT MAKES IT DIFFERENT */}
        <section className="py-16 md:py-24">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center" data-testid="text-different-heading">
                Built for serious baking businesses.
              </h2>
              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4 max-w-xl mx-auto">
                <Feature text="Unlimited quotes" />
                <Feature text="Express Items for featured specials" />
                <Feature text="Custom deposit policies" />
                <Feature text="Stripe-powered payments" />
                <Feature text="Real revenue dashboard" />
              </div>
            </div>
          </div>
        </section>

        {/* PRICING MODEL CLARITY */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="text-pricing-heading">
                Free to start. Pay as you grow.
              </h2>
              <div className="space-y-3 text-muted-foreground text-base mb-8">
                <p>No monthly quote limits — every plan includes unlimited quotes.</p>
                <p>Platform fee only when you process payments through Stripe.</p>
                <p>Upgrade your plan to reduce your platform fee.</p>
                <p>Express Item limits increase with each plan tier.</p>
              </div>
              <Link href="/faq">
                <Button variant="outline" size="lg" className="gap-2" data-testid="button-view-pricing">
                  View Pricing
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center" data-testid="text-faq-heading">
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
                <FaqItem
                  question="What does BakerIQ cost?"
                  answer="BakerIQ is free to start. There's no monthly fee on the Free plan. We charge a small platform fee only when you process payments through Stripe — 7% on Free, 5% on Basic ($4.99/mo), and 3% on Pro ($9.99/mo)."
                />
                <FaqItem
                  question="Is there a monthly fee?"
                  answer="The Free plan has no monthly fee. Basic is $4.99/month and Pro is $9.99/month, both with lower platform fees and more Express Items."
                />
              </div>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-closing-heading">
              Ready to run your bakery like a business?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Structure. Clarity. Revenue visibility. Start free — upgrade when you're ready.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="gap-2 text-lg" data-testid="button-cta-signup">
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
              Revenue infrastructure for treat makers
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
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <div className="text-xs font-medium text-primary mb-1.5">Step {step}</div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Check className="h-4 w-4 text-primary shrink-0" />
      <span className="text-base">{text}</span>
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
