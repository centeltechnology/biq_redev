import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, ChevronDown, Cake } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    fee: "7%",
    expressItems: "1",
    description: "For bakers just getting started",
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$4.99",
    period: "/mo",
    fee: "5%",
    expressItems: "5",
    description: "For bakers building their client base",
    cta: "Start Free",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/mo",
    fee: "3%",
    expressItems: "Unlimited",
    description: "For established baking businesses",
    cta: "Start Free",
    highlighted: false,
  },
] as const;

const EXAMPLE_AMOUNT = 1000;
const EXAMPLES = [
  { plan: "Free", fee: 70, monthly: 0, total: 70 },
  { plan: "Growth", fee: 50, monthly: 4.99, total: 54.99 },
  { plan: "Pro", fee: 30, monthly: 9.99, total: 39.99 },
];

const PRICING_FAQS = [
  {
    question: "What does BakerIQ cost?",
    answer: "BakerIQ is free to start. There's no monthly fee on the Free plan. We charge a small platform fee only when you process payments through Stripe — 7% on Free, 5% on Growth ($4.99/mo), and 3% on Pro ($9.99/mo).",
  },
  {
    question: "Is there a monthly fee?",
    answer: "The Free plan has no monthly fee. Growth is $4.99/month and Pro is $9.99/month, both with lower platform fees and more Express Items.",
  },
  {
    question: "Do I need Stripe to use BakerIQ?",
    answer: "No. You can use BakerIQ for quoting and lead management without Stripe. Connect Stripe only when you're ready to collect deposits and payments online.",
  },
  {
    question: "Can I change plans later?",
    answer: "Yes. You can upgrade or downgrade anytime. Changes take effect immediately and your platform fee adjusts on your next processed payment.",
  },
];

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Cake className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg tracking-tight" data-testid="text-brand">BakerIQ</span>
            </div>
          </Link>
          <Link href="/signup">
            <Button size="sm" data-testid="button-nav-signup">Start Free</Button>
          </Link>
        </div>
      </div>

      <section className="py-12 md:py-16" data-testid="section-plans-hero">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight" data-testid="text-plans-headline">
            Free to start. Pay as you grow.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto" data-testid="text-plans-subline">
            Process payments when you're ready. Upgrade as your volume increases.
          </p>
        </div>
      </section>

      <section className="pb-12 md:pb-16" data-testid="section-plan-cards">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.highlighted ? "border-primary shadow-lg ring-1 ring-primary/20" : "border-border/60"}`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" data-testid="badge-popular">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-6 md:p-8 space-y-5">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold" data-testid={`text-plan-name-${plan.name.toLowerCase()}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold" data-testid={`text-plan-price-${plan.name.toLowerCase()}`}>
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-plan-desc-${plan.name.toLowerCase()}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span><strong>{plan.fee}</strong> platform fee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Unlimited quotes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span><strong>{plan.expressItems}</strong> Express {plan.expressItems === "1" ? "Item" : "Items"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>Stripe-powered payments</span>
                    </div>
                  </div>

                  <Link href="/signup">
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                      data-testid={`button-plan-cta-${plan.name.toLowerCase()}`}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-10 md:pb-14" data-testid="section-mid-cta">
        <div className="container max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup">
            <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-mid-start-free">
              Start Free
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            onClick={() => document.getElementById("break-even")?.scrollIntoView({ behavior: "smooth" })}
            data-testid="button-mid-compare"
          >
            Compare Plans
          </Button>
        </div>
      </section>

      <section id="break-even" className="pb-12 md:pb-16" data-testid="section-breakeven">
        <div className="container max-w-2xl mx-auto px-4">
          <Card className="border-border/60 bg-muted/20">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-base font-semibold mb-4" data-testid="text-breakeven-title">
                When should I upgrade?
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong>Growth</strong> pays for itself at around <strong>$1,000/month</strong> in orders.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong>Pro</strong> is best once you're consistently above <strong>~$1,250–$1,500/month</strong>.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="pb-16 md:pb-24" data-testid="section-example">
        <div className="container max-w-2xl mx-auto px-4">
          <Card className="border-border/60">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-lg font-semibold text-center mb-2" data-testid="text-example-title">
                Example: ${EXAMPLE_AMOUNT.toLocaleString()} in orders this month
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Here's what you'd pay on each plan.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center">
                {EXAMPLES.map((ex) => (
                  <div key={ex.plan} className="space-y-1" data-testid={`example-${ex.plan.toLowerCase()}`}>
                    <p className="text-sm font-medium">{ex.plan}</p>
                    <p className="text-2xl font-bold text-primary">${ex.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      ${ex.fee} fee{ex.monthly > 0 ? ` + $${ex.monthly.toFixed(2)}/mo` : ""}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-6">
                Platform fee is only charged when you process payments through Stripe.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="pb-16 md:pb-24" data-testid="section-pricing-faq">
        <div className="container max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center" data-testid="text-pricing-faq-heading">
            Pricing Questions
          </h2>
          <div className="space-y-0 divide-y">
            {PRICING_FAQS.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30 border-t" data-testid="section-plans-bottom-cta">
        <div className="container max-w-2xl mx-auto px-4 text-center space-y-4">
          <p className="text-base text-muted-foreground">
            Ready to structure your bakery revenue?
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2" data-testid="button-bottom-signup">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            No credit card required.
          </p>
        </div>
      </section>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-5" data-testid={`pricing-faq-item-${question.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
      <button
        className="flex items-center justify-between w-full text-left gap-4"
        onClick={() => setOpen(!open)}
        data-testid={`pricing-faq-toggle-${question.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
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
