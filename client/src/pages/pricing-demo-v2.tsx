import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ChevronDown, Cake } from "lucide-react";
import { trackSignupClick, trackCalculatorUsed, trackServingsChanged, trackDesignLevelChanged, trackCalculatorVisible, trackCtaClick, trackExampleButtonUsed, trackPriceRecalculated } from "@/lib/analytics";
import { ActivityToast } from "@/components/activity-toast";

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

export default function PricingDemoV2Page() {
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
      if ((window as any).fbq) {
        (window as any).fbq("track", "ViewContent", {
          content_name: "Pricing Demo V2 Calculator",
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
    trackCtaClick("Check My Price");
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

      <section className="py-16 md:py-24" data-testid="section-hero">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight" data-testid="text-headline">
            I charged $120 for a cake that should've been $185.
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed" data-testid="text-subheadline">
            Most custom bakers undercharge without realizing it. Try the free calculator and see what your next cake should really cost.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/80" data-testid="text-no-login-note">
            No login required.
          </p>
          <Button
            size="lg"
            className="mt-8"
            onClick={scrollToCalculator}
            data-testid="button-check-price"
          >
            Check My Price
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="pb-16 md:pb-20" data-testid="section-before-after">
        <div className="container max-w-xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border/60" data-testid="card-before">
              <CardContent className="p-6 text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground">What I Charged</p>
                <p className="text-4xl font-bold tracking-tight">$120</p>
                <p className="text-xs text-muted-foreground">Looked fair… until I did the math.</p>
              </CardContent>
            </Card>
            <Card className="border-primary/40 ring-1 ring-primary/20" data-testid="card-after">
              <CardContent className="p-6 text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground">What It Should've Been</p>
                <p className="text-4xl font-bold tracking-tight text-primary">$185</p>
                <p className="text-xs text-muted-foreground">Pricing for servings + design complexity.</p>
              </CardContent>
            </Card>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-6 font-medium" data-testid="text-punchline">
            If you're pricing in DMs, you're probably undercharging.
          </p>
          <p className="text-xs text-muted-foreground text-center mt-2" data-testid="text-try-below">
            Now try your own numbers below.
          </p>
        </div>
      </section>

      <section ref={calculatorRef} className="pb-16 md:pb-20" data-testid="section-calculator">
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
                  <Label htmlFor="servings-v2" className="text-sm font-medium">
                    Servings
                  </Label>
                  <Input
                    id="servings-v2"
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
          <p className="text-base font-medium" data-testid="text-cta-line">
            Turn this into a branded quote and get paid.
          </p>
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto" data-testid="button-create-account" onClick={() => { trackSignupClick("/pricing-demo-v2"); trackCtaClick("Create Free Account"); }}>
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
                onClick={() => { trackSignupClick("/pricing-demo-v2"); trackCtaClick("Sticky Mobile CTA"); }}
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
