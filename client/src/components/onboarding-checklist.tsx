import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Check, CreditCard, FileText, Share2, ArrowRight, Copy, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingChecklistProps {
  onConnectStripe: () => void;
  isConnecting?: boolean;
}

export function OnboardingChecklist({ onConnectStripe, isConnecting }: OnboardingChecklistProps) {
  const { baker } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("bakeriq_checklist_dismissed") === "true";
  });
  const [linkShared, setLinkShared] = useState(() => {
    return localStorage.getItem("bakeriq_calculator_link_shared") === "true";
  });

  const stripeConnected = !!baker?.stripeConnectedAt;
  const firstQuoteSent = !!baker?.firstQuoteSentAt;
  const isAdmin = baker?.role === "super_admin";

  useEffect(() => {
    if (baker && !isAdmin && !dismissed) {
      apiRequest("POST", "/api/activity/track", { eventType: "onboarding_checklist_seen" }).catch(() => {});
    }
  }, [baker, isAdmin, dismissed]);

  if (!baker || isAdmin) return null;

  const allComplete = stripeConnected && firstQuoteSent && linkShared;
  if (allComplete || dismissed) return null;

  const currentStep = !stripeConnected ? 1 : !firstQuoteSent ? 2 : 3;

  const handleSendFirstQuote = () => {
    apiRequest("POST", "/api/activity/track", { eventType: "first_quote_cta_used" }).catch(() => {});
    setLocation(`/quotes/new?prefill=self`);
  };

  const handleCopyLink = async () => {
    if (!baker?.slug) return;
    const calculatorUrl = `${window.location.origin}/c/${baker.slug}`;
    try {
      await navigator.clipboard.writeText(calculatorUrl);
      localStorage.setItem("bakeriq_calculator_link_shared", "true");
      setLinkShared(true);
      apiRequest("POST", "/api/activity/track", { eventType: "quick_quote_link_copied" }).catch(() => {});
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
    localStorage.setItem("bakeriq_checklist_dismissed", "true");
    setDismissed(true);
  };

  const steps = [
    {
      step: 1,
      label: "Connect Stripe",
      description: "Required to collect deposits and payments",
      icon: CreditCard,
      complete: stripeConnected,
      action: onConnectStripe,
      actionLabel: isConnecting ? "Setting up..." : "Connect Stripe",
      actionDisabled: isConnecting,
    },
    {
      step: 2,
      label: "Send your first quote",
      description: "See what your customers will see",
      icon: FileText,
      complete: firstQuoteSent,
      action: handleSendFirstQuote,
      actionLabel: "Send a Quote",
      actionDisabled: false,
    },
    {
      step: 3,
      label: "Share your calculator link",
      description: "Start getting inbound requests",
      icon: Share2,
      complete: linkShared,
      action: handleCopyLink,
      actionLabel: "Copy Link",
      actionDisabled: false,
      actionIcon: Copy,
    },
  ];

  return (
    <Card className="border-primary/30 bg-primary/5" data-testid="card-onboarding-checklist">
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 className="font-semibold text-sm">Start Here</h3>
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
        <div className="space-y-2">
          {steps.map((s) => {
            const isActive = s.step === currentStep;
            const isPast = s.step < currentStep;
            const isFuture = s.step > currentStep;

            return (
              <div
                key={s.step}
                className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 transition-colors ${
                  isActive ? "bg-background border" : s.complete ? "opacity-70" : "opacity-50"
                }`}
                data-testid={`checklist-step-${s.step}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex items-center justify-center h-6 w-6 rounded-full shrink-0 ${
                    s.complete || isPast
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {s.complete || isPast ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className="text-xs font-medium">{s.step}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${s.complete ? "line-through text-muted-foreground" : ""}`}>
                      {s.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    )}
                  </div>
                </div>
                {isActive && (
                  <Button
                    size="sm"
                    onClick={s.action}
                    disabled={s.actionDisabled}
                    data-testid={`button-checklist-step-${s.step}`}
                  >
                    {s.actionLabel}
                    {!s.actionIcon && <ArrowRight className="ml-1 h-3.5 w-3.5" />}
                    {s.actionIcon && <s.actionIcon className="ml-1 h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
