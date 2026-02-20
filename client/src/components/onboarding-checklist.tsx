import { useState } from "react";
import { Link } from "wouter";
import { Check, Store, FileText, Share2, CreditCard, ArrowRight, Copy, X, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface ActivationChecklistProps {
  onConnectStripe: () => void;
  isConnecting?: boolean;
}

export function OnboardingChecklist({ onConnectStripe, isConnecting }: ActivationChecklistProps) {
  const { baker } = useAuth();
  const { toast } = useToast();
  if (!baker || baker.role === "super_admin") return null;

  const bakerId = baker.id;
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(`bakeriq_activation_dismissed_${bakerId}`) === "true";
  });
  const [linkCopied, setLinkCopied] = useState(() => {
    return localStorage.getItem(`bakeriq_calculator_link_shared_${bakerId}`) === "true";
  });

  const hasBranding = !!(baker.businessName && baker.businessName.length > 0);
  const hasQuote = !!baker.firstQuoteSentAt;
  const hasSharedLink = linkCopied;
  const hasStripe = !!baker.stripeConnectedAt;

  const weightedProgress = (hasBranding ? 25 : 0) + (hasQuote ? 25 : 0) + (hasSharedLink ? 25 : 0) + (hasStripe ? 25 : 0);
  const justFinishedOnboarding = baker.onboardingCompleted && !hasStripe;
  const progressPercent = justFinishedOnboarding ? Math.max(weightedProgress, 75) : weightedProgress;

  if (progressPercent === 100 || dismissed) return null;

  const handleCopyLink = async () => {
    if (!baker?.slug) return;
    const calculatorUrl = `${window.location.origin}/c/${baker.slug}`;
    try {
      await navigator.clipboard.writeText(calculatorUrl);
      localStorage.setItem(`bakeriq_calculator_link_shared_${bakerId}`, "true");
      setLinkCopied(true);
      toast({
        title: "Link copied!",
        description: "Share it on social media, your website, or directly with customers.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(`bakeriq_activation_dismissed_${bakerId}`, "true");
    setDismissed(true);
  };

  const contextMessage = hasQuote && !hasStripe
    ? "You're almost ready to collect deposits."
    : !baker.onboardingCompleted
      ? "Complete setup to start getting orders."
      : null;

  const steps = [
    {
      label: "Add bakery branding",
      icon: Store,
      complete: hasBranding,
      href: "/settings",
      actionLabel: "Settings",
    },
    {
      label: "Send your first test quote",
      icon: FileText,
      complete: hasQuote,
      href: baker.demoQuoteId ? `/quotes/${baker.demoQuoteId}` : "/quotes/new",
      actionLabel: baker.demoQuoteId ? "View Quote" : "Create Quote",
    },
    {
      label: "Share your calculator link",
      icon: Share2,
      complete: hasSharedLink,
      action: handleCopyLink,
      actionLabel: "Copy Link",
      actionIcon: Copy,
    },
    {
      label: "Activate secure payments",
      icon: CreditCard,
      complete: hasStripe,
      action: onConnectStripe,
      actionLabel: isConnecting ? "Setting up..." : "Connect Stripe",
      actionDisabled: isConnecting,
    },
  ];

  return (
    <Card className="border-primary/30 bg-primary/5" data-testid="card-activation-checklist">
      <CardContent className="py-5">
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-base" data-testid="text-checklist-title">Launch Your Bakery</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6"
            data-testid="button-dismiss-checklist"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-3" data-testid="text-checklist-progress">
          You're {progressPercent}% ready to take orders.
        </p>

        <Progress value={progressPercent} className="h-2 mb-4" />

        {contextMessage && (
          <p className="text-xs text-primary font-medium mb-3" data-testid="text-checklist-context">{contextMessage}</p>
        )}

        <div className="space-y-1.5">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 transition-colors ${
                s.complete ? "opacity-60" : "bg-background border"
              }`}
              data-testid={`checklist-item-${idx}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex items-center justify-center h-6 w-6 rounded-full shrink-0 ${
                  s.complete ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {s.complete ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                </div>
                <p className={`text-sm font-medium ${s.complete ? "line-through text-muted-foreground" : ""}`}>
                  {s.label}
                </p>
              </div>
              {!s.complete && (
                s.href ? (
                  <Button size="sm" variant="ghost" asChild data-testid={`button-checklist-action-${idx}`}>
                    <Link href={s.href}>
                      {s.actionLabel}
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={s.action}
                    disabled={s.actionDisabled}
                    data-testid={`button-checklist-action-${idx}`}
                  >
                    {s.actionIcon ? <s.actionIcon className="mr-1 h-3.5 w-3.5" /> : null}
                    {s.actionLabel}
                    {!s.actionIcon && <ArrowRight className="ml-1 h-3.5 w-3.5" />}
                  </Button>
                )
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
