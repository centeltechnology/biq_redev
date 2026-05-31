import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { trackSignupClick } from "@/lib/analytics";
import {
  Cake,
  ArrowRight,
  Check,
  X,
  Minus,
  Sparkles,
  Share2,
  MessageSquareText,
  FileText,
  CreditCard,
} from "lucide-react";

type Cell = boolean | "partial" | string;

const competitors = [
  "BakerIQ",
  "HoneyBook",
  "Dubsado",
  "CakeBoss",
  "Bakesy",
  "Spreadsheets & DMs",
] as const;

const rows: { label: string; values: Cell[] }[] = [
  {
    label: "Monthly price",
    values: ["Free–$9.99", "$36–59", "$35–55", "~$12", "$9.99–17.99", "Free"],
  },
  {
    label: "Built specifically for bakers",
    values: [true, false, false, true, true, false],
  },
  {
    label: "Interactive order page with live pricing",
    values: [true, false, false, "partial", "partial", false],
  },
  {
    label: "Structured lead capture",
    values: [true, false, false, "partial", "partial", false],
  },
  {
    label: "Quote builder (line items, tax, deposit)",
    values: [true, true, true, "partial", true, false],
  },
  {
    label: "Built-in online payments",
    values: [true, true, true, false, true, false],
  },
  {
    label: "Customer records (CRM)",
    values: [true, true, true, "partial", "partial", false],
  },
  {
    label: "Order calendar",
    values: [true, true, true, "partial", true, false],
  },
  {
    label: "Social sharing tools (QR, captions, banners)",
    values: [true, false, false, false, false, false],
  },
];

function CellContent({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center" aria-label="Yes">
        <Check className="h-5 w-5 text-primary" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center" aria-label="No">
        <X className="h-4 w-4 text-muted-foreground/50" />
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="inline-flex items-center justify-center" aria-label="Partial">
        <Minus className="h-4 w-4 text-muted-foreground/60" />
      </span>
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

export default function ComparePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home-logo">
              <Cake className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">BakerIQ</span>
            </div>
          </Link>
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
          <div className="container max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
            <span
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-6"
              data-testid="text-compare-eyebrow"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Thinking of switching?
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-6" data-testid="text-compare-heading">
              Stop paying $40+ a month for a tool that wasn't built for baking.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed" data-testid="text-compare-subheading">
              Most bakers run their business on generic CRMs, back-office spreadsheets, or
              endless DMs. BakerIQ is purpose-built for custom cake &amp; treat makers — the
              order page, lead capture, quoting, and deposits all in one place, starting free.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="gap-2 text-base" data-testid="button-compare-start" onClick={() => trackSignupClick()}>
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/plans">
                <Button size="lg" variant="outline" className="gap-2 text-base" data-testid="button-compare-pricing">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-5" data-testid="text-compare-trust">
              Free to start. No credit card. We only earn when you get paid.
            </p>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center" data-testid="text-table-heading">
              How BakerIQ compares
            </h2>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
              The tools bakers use today are either generic, internal-only, or scattered.
              Here's how they stack up for the customer-facing side of your business.
            </p>

            <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm" data-testid="table-comparison-wrapper">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <caption className="sr-only">
                  Feature comparison of BakerIQ against HoneyBook, Dubsado, CakeBoss, Bakesy, and spreadsheets and DMs
                </caption>
                <thead>
                  <tr className="border-b">
                    <th scope="col" className="p-4 text-sm font-semibold text-muted-foreground align-bottom w-[260px]">
                      Feature
                    </th>
                    {competitors.map((name) => (
                      <th
                        key={name}
                        scope="col"
                        className={`p-4 text-center text-sm font-bold align-bottom ${
                          name === "BakerIQ" ? "text-primary" : "text-foreground"
                        }`}
                        data-testid={`col-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      >
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr
                      key={row.label}
                      className="border-b last:border-0"
                      data-testid={`row-${rowIndex}`}
                    >
                      <th
                        scope="row"
                        className="p-4 text-sm font-medium text-foreground"
                      >
                        {row.label}
                      </th>
                      {row.values.map((value, i) => (
                        <td
                          key={i}
                          className={`p-4 text-center ${
                            i === 0 ? "bg-primary/5" : ""
                          }`}
                          data-testid={`cell-${rowIndex}-${i}`}
                        >
                          <CellContent value={value} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-5 text-xs text-muted-foreground" data-testid="legend-comparison">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" /> Included
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Minus className="h-4 w-4 text-muted-foreground/60" /> Partial / limited
              </span>
              <span className="inline-flex items-center gap-1.5">
                <X className="h-4 w-4 text-muted-foreground/50" /> Not available
              </span>
              <span>Prices in USD per month. Competitor pricing as of May 2026.</span>
            </div>
          </div>
        </section>

        {/* PRICE STORY */}
        <section className="py-20 md:py-28">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-5" data-testid="text-price-story-heading">
                  Purpose-built, at a fraction of the price.
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Generic CRMs like HoneyBook and Dubsado run $36–59 a month and have no
                  concept of cake tiers, serving counts, or complexity pricing. BakerIQ Pro
                  is <span className="font-semibold text-foreground">$9.99/month</span> — and
                  everything you need is included.
                </p>
                <div className="space-y-3">
                  <PriceLine label="HoneyBook / Dubsado" value="$36–59 / mo" muted />
                  <PriceLine label="BakerIQ Pro" value="$9.99 / mo" highlight />
                  <PriceLine label="BakerIQ Free" value="$0 to start" highlight />
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-8 shadow-sm">
                <h3 className="text-xl font-bold mb-6">One flow, end to end</h3>
                <div className="space-y-5">
                  <FlowStep icon={<Share2 className="h-5 w-5 text-primary" />} title="Share your order page" desc="Customers see your pricing and send a complete request." />
                  <FlowStep icon={<MessageSquareText className="h-5 w-5 text-primary" />} title="Get a clean lead" desc="Every detail captured — no follow-up questions." />
                  <FlowStep icon={<FileText className="h-5 w-5 text-primary" />} title="Send a polished quote" desc="Line items, tax, and deposit built in." />
                  <FlowStep icon={<CreditCard className="h-5 w-5 text-primary" />} title="Collect the deposit" desc="Paid securely through Stripe, straight to you." />
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  No competitor joins all four steps cleanly for bakers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="py-20 md:py-28 bg-primary text-primary-foreground">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-compare-closing-heading">
              Make the switch in minutes.
            </h2>
            <p className="text-lg opacity-90 mb-10">
              Set up your order page for free — bring your prices, keep your customers, lose the busywork.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="gap-2 text-lg" data-testid="button-compare-cta" onClick={() => trackSignupClick()}>
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
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer" data-testid="footer-link-home-logo">
                <Cake className="h-6 w-6 text-primary" />
                <span className="font-semibold">BakerIQ</span>
              </div>
            </Link>
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <Link href="/compare">
                <span className="text-sm text-muted-foreground hover:text-foreground" data-testid="footer-link-compare">Compare</span>
              </Link>
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

function PriceLine({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
        highlight ? "border-primary/40 bg-primary/5" : "border-border"
      }`}
      data-testid={`price-line-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
    >
      <span className={`text-sm font-medium ${muted ? "text-muted-foreground" : "text-foreground"}`}>{label}</span>
      <span className={`text-base font-bold ${highlight ? "text-primary" : muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function FlowStep({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
        {icon}
      </span>
      <div>
        <p className="font-semibold leading-tight">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
