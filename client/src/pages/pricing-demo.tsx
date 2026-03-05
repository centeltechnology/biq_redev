import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ChevronDown, Cake } from "lucide-react";
import { trackSignupClick, trackCalculatorUsed, trackServingsChanged, trackDesignLevelChanged, trackCalculatorVisible, trackCtaClick, trackExampleButtonUsed, trackPriceRecalculated } from "@/lib/analytics";
import { ActivityToast } from "@/components/activity-toast";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const COMPLEXITY_OPTIONS = [
  { id: "simple", label: "Simple", multiplier: 1.0, description: "Solid colors, minimal decoration" },
  { id: "detailed", label: "Detailed", multiplier: 1.3, description: "Custom piping, multi-color, toppers" },
  { id: "luxury", label: "Luxury", multiplier: 1.6, description: "Fondant, sculpted, hand-painted" },
] as const;

const EXAMPLE_PRESETS = [
  { label: "Birthday (24 + Simple)", servings: 24, complexity: "simple" },
  { label: "Detailed (36 + Detailed)", servings: 36, complexity: "detailed" },
  { label: "Luxury (48 + Luxury)", servings: 48, complexity: "luxury" },
];

const BASE_PRICE_PER_SERVING = 5;

export default function PricingDemoPage() {
  const [servings, setServings] = useState(24);
  const [complexity, setComplexity] = useState<string>("simple");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [exampleLoaded, setExampleLoaded] = useState(false);
  const hasTrackedRef = useRef(false);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const servingsInputRef = useRef<HTMLInputElement>(null);
  const prevPriceRef = useRef<number | null>(null);

  const multiplier = COMPLEXITY_OPTIONS.find(c => c.id === complexity)?.multiplier ?? 1.0;
  const suggestedPrice = Math.round(servings * BASE_PRICE_PER_SERVING * multiplier);

  useEffect(() => {
    if (prevPriceRef.current !== null && prevPriceRef.current !== suggestedPrice) {
      trackPriceRecalculated();
    }
    prevPriceRef.current = suggestedPrice;
  }, [suggestedPrice]);

  const trackInteraction = useCallback(() => {
    if (!hasTrackedRef.current) {
      if (window.fbq) {
        window.fbq("track", "ViewContent", {
          content_name: "Pricing Demo Calculator",
          content_category: "Demo",
        });
      }
      trackCalculatorUsed();
      hasTrackedRef.current = true;
      setHasInteracted(true);
    }
  }, []);

  const handleServingsChange = (value: number) => {
    trackInteraction();
    trackServingsChanged();
    setServings(Math.max(1, value));
  };

  const handleComplexityChange = (value: string) => {
    trackInteraction();
    trackDesignLevelChanged();
    setComplexity(value);
  };

  const handleExampleClick = (preset: typeof EXAMPLE_PRESETS[number]) => {
    trackInteraction();
    trackExampleButtonUsed(preset.label);
    setServings(preset.servings);
    setComplexity(preset.complexity);
    setExampleLoaded(true);
    setTimeout(() => setExampleLoaded(false), 1500);
  };

  const scrollToCalculator = () => {
    trackCtaClick("Try the Demo Calculator");
    calculatorRef.current?.scrollIntoView({ behavior: "smooth" });
    if (window.innerWidth >= 768) {
      setTimeout(() => servingsInputRef.current?.focus(), 500);
    }
  };

  useEffect(() => {
    const el = calculatorRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        trackCalculatorVisible();
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`min-h-screen bg-background ${hasInteracted ? "pb-16 md:pb-0" : ""}`}>
      <div className="border-b border-border/40">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center gap-2">
          <Cake className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg tracking-tight" data-testid="text-brand">BakerIQ</span>
        </div>
      </div>

      <section className="py-20 md:py-28" data-testid="section-hero">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight" data-testid="text-headline">
            Still pricing cakes in DMs?
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto" data-testid="text-subheadline">
            If you're guessing your pricing, you're probably leaving money on the table.
          </p>
          <Button
            size="lg"
            className="mt-8"
            onClick={scrollToCalculator}
            data-testid="button-try-demo"
          >
            Try the Demo Calculator
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section ref={calculatorRef} className="pb-20 md:pb-28" data-testid="section-calculator">
        <div className="container max-w-lg mx-auto px-4">
          <div className="text-center mb-4" data-testid="section-guided-instruction">
            <p className="text-sm font-bold" data-testid="text-guided-title">Quick test (10 seconds):</p>
            <p className="text-sm text-muted-foreground" data-testid="text-guided-step">Set servings to 36, then tap Luxury.</p>
          </div>
          <Card className="shadow-lg border-border/60" data-testid="card-calculator">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-semibold tracking-tight" data-testid="text-calculator-title">
                  Demo Price Calculator
                </h2>
                <p className="text-sm text-muted-foreground">
                  See what you should be charging.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center" data-testid="group-example-pills">
                {EXAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleExampleClick(preset)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
                    data-testid={`button-example-${preset.complexity}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {exampleLoaded && (
                <p className="text-xs text-primary text-center -mt-3 animate-in fade-in duration-300" data-testid="text-example-loaded">
                  Example loaded.
                </p>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="servings" className="text-sm font-medium">
                    Servings
                  </Label>
                  <Input
                    id="servings"
                    ref={servingsInputRef}
                    type="number"
                    min={1}
                    value={servings}
                    onChange={(e) => handleServingsChange(parseInt(e.target.value) || 1)}
                    className="text-base"
                    data-testid="input-servings"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Design Complexity</Label>
                  <div className="grid grid-cols-3 gap-2" data-testid="group-complexity">
                    {COMPLEXITY_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleComplexityChange(option.id)}
                        className={`rounded-lg border p-3 text-center transition-all ${
                          complexity === option.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/40"
                        }`}
                        data-testid={`button-complexity-${option.id}`}
                      >
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{option.multiplier}×</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {COMPLEXITY_OPTIONS.find(c => c.id === complexity)?.description}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-5 text-center space-y-1" data-testid="section-result">
                <p className="text-sm text-muted-foreground font-medium">Suggested Price</p>
                <p className="text-4xl font-bold tracking-tight text-primary" data-testid="text-suggested-price">
                  ${suggestedPrice}
                </p>
                <p className="text-sm text-muted-foreground font-medium pt-1" data-testid="text-challenge-line">
                  Are you charging this?
                </p>
                <p className="text-xs text-muted-foreground pt-1" data-testid="text-baseline-note">
                  Based on a $5 per serving professional baseline.
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center" data-testid="text-undercharging">
                Most custom bakers undercharge by $50–$100 per order.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="pb-20 md:pb-28" data-testid="section-cta">
        <div className="container max-w-lg mx-auto px-4 text-center space-y-4">
          <p className="text-base text-muted-foreground" data-testid="text-cta-line">
            Turn this into a branded quote and get paid.
          </p>
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto" data-testid="button-create-account" onClick={() => { trackSignupClick("/pricing-demo"); trackCtaClick("Create Free Account"); }}>
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1" data-testid="section-trust-lines">
            <p className="text-sm text-muted-foreground">Free to start.</p>
            <p className="text-sm text-muted-foreground">No credit card required.</p>
            <p className="text-sm text-muted-foreground">Takes 60 seconds.</p>
          </div>
        </div>
      </section>

      {hasInteracted && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300"
          data-testid="section-sticky-mobile-cta"
        >
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <p className="text-xs text-muted-foreground leading-tight">Want a branded quote + payment link?</p>
            <Link href="/signup">
              <Button
                size="sm"
                className="whitespace-nowrap shrink-0"
                data-testid="button-sticky-cta"
                onClick={() => { trackSignupClick("/pricing-demo"); trackCtaClick("Sticky Mobile CTA"); }}
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      )}
      <ActivityToast />
    </div>
  );
}
