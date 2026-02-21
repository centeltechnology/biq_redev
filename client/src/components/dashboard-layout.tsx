import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sparkles, Bell, CreditCard, Clock, FileText, Share2, Copy, CheckCircle } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { SupportChat } from "@/components/support-chat";
import { StripeActivationModal } from "@/components/stripe-activation-modal";
import { StripeInterstitialModal } from "@/components/stripe-interstitial-modal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionStatus {
  plan: string;
  monthlyQuoteCount: number;
  quoteLimit: number | null;
  isAtLimit: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

function useStripeBannerSnooze() {
  const [snoozed, setSnoozed] = useState(() => {
    const snoozedUntil = localStorage.getItem("stripeBannerSnoozedUntil");
    if (!snoozedUntil) return false;
    return Date.now() < parseInt(snoozedUntil, 10);
  });

  const snooze = useCallback(() => {
    const snoozedUntil = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("stripeBannerSnoozedUntil", snoozedUntil.toString());
    setSnoozed(true);
  }, []);

  return { snoozed, snooze };
}

export function DashboardLayout({ children, title, actions }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading, baker } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { snoozed, snooze: snoozeBanner } = useStripeBannerSnooze();

  const [showStripeSuccessModal, setShowStripeSuccessModal] = useState(false);
  const [showSetupInterstitial, setShowSetupInterstitial] = useState(false);

  useEffect(() => {
    if (!baker) return;
    const params = new URLSearchParams(window.location.search);

    if (params.get("stripe_setup") === "1") {
      params.delete("stripe_setup");
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      if (!baker.stripeConnectedAt) {
        setShowSetupInterstitial(true);
      }
    }

    if (params.get("stripe") === "connected") {
      const alreadyShown = sessionStorage.getItem("stripeConnectSuccessShown");
      params.delete("stripe");
      params.delete("connect");
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      if (!alreadyShown && baker.stripeConnectedAt) {
        sessionStorage.setItem("stripeConnectSuccessShown", "true");
        setShowStripeSuccessModal(true);
      }
    }
  }, [baker]);

  const { data: subscription } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    enabled: isAuthenticated,
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/support/unread-count"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string = "basic") => {
      const res = await apiRequest("POST", "/api/subscription/checkout", { plan });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      let accountId = baker?.stripeConnectAccountId;
      if (!accountId) {
        const res = await apiRequest("POST", "/api/stripe-connect/create-account");
        const data = await res.json();
        accountId = data.accountId;
      }
      const linkRes = await apiRequest("POST", "/api/stripe-connect/onboarding-link");
      return linkRes.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const [activationBannerDismissed, setActivationBannerDismissed] = useState(() => {
    return sessionStorage.getItem("bakeriq_activation_banner_dismissed") === "true";
  });

  const handleDismissActivationBanner = useCallback(() => {
    sessionStorage.setItem("bakeriq_activation_banner_dismissed", "true");
    setActivationBannerDismissed(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full">
        <div className="w-64 border-r bg-sidebar p-4">
          <Skeleton className="h-10 w-full mb-6" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const needsStripeConnect = baker && !baker.stripeConnectedAt && baker.role !== "super_admin" && baker.role !== "admin";
  const justCompletedOnboarding = baker?.onboardingCompleted && !baker?.firstQuoteSentAt;
  const isDemoQuoteEditPage = baker?.demoQuoteId && window.location.pathname === `/quotes/${baker.demoQuoteId}`;
  const showStripeBanner = needsStripeConnect && !snoozed && !justCompletedOnboarding && !isDemoQuoteEditPage;

  const isNonAdmin = baker && baker.role !== "admin" && baker.role !== "super_admin";
  const needsFirstQuote = isNonAdmin && baker.stripeConnectedAt && !baker.firstQuoteSentAt;
  const showActivationBanner = needsFirstQuote && !activationBannerDismissed;

  useEffect(() => {
    if (showStripeBanner) {
      apiRequest("POST", "/api/activation/stripe-prompt-shown").catch(() => {});
    }
  }, [showStripeBanner]);

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-background sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              {title && <h1 className="text-lg font-semibold">{title}</h1>}
            </div>
            <div className="flex items-center gap-2">
              {subscription && (
                subscription.plan === "pro" ? (
                  <Badge variant="outline" className="gap-1" data-testid="badge-pro-plan">
                    <Sparkles className="h-3 w-3" />
                    Pro
                  </Badge>
                ) : subscription.plan === "basic" ? (
                  <Badge variant="secondary" className="gap-1" data-testid="badge-basic-plan">
                    Basic
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1" data-testid="badge-free-plan">
                      Free
                    </Badge>
                  </div>
                )
              )}
              {actions}
              {(unreadCount?.count ?? 0) > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => {
                    const supportBtn = document.querySelector('[data-testid="button-support-chat"]');
                    if (supportBtn) (supportBtn as HTMLButtonElement).click();
                  }}
                  data-testid="button-notification-bell"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {(unreadCount?.count ?? 0) > 9 ? "9+" : unreadCount?.count}
                  </span>
                </Button>
              )}
              <ThemeToggle />
            </div>
          </header>
          {showStripeBanner && (
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-primary/10 border-b" data-testid="banner-stripe-connect">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-primary shrink-0" />
                <span>Connect Stripe to collect deposits and payments.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={snoozeBanner}
                  className="text-muted-foreground"
                  data-testid="button-stripe-remind-later"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Remind me later
                </Button>
                <Button
                  size="sm"
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  data-testid="button-stripe-connect-banner"
                >
                  {connectMutation.isPending ? "Setting up..." : "Connect Stripe"}
                </Button>
              </div>
            </div>
          )}
          {showActivationBanner && (
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border-b" data-testid="banner-activation-quote">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                <span>Payments are ready. Send 1 quote to activate your system.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissActivationBanner}
                  className="text-muted-foreground"
                  data-testid="button-dismiss-activation-banner"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  asChild
                  data-testid="button-send-first-quote-banner"
                >
                  <Link href="/customers?new=true">Send First Quote</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const url = baker?.slug ? `${window.location.origin}/c/${baker.slug}` : "";
                    if (url) {
                      await navigator.clipboard.writeText(url);
                      toast({ title: "Calculator link copied!" });
                    }
                  }}
                  data-testid="button-copy-link-activation-banner"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Link
                </Button>
              </div>
            </div>
          )}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
          <SupportChat />
          <StripeActivationModal />

          <Dialog open={showStripeSuccessModal} onOpenChange={setShowStripeSuccessModal}>
            <DialogContent className="sm:max-w-md" data-testid="modal-stripe-success">
              <DialogHeader>
                <DialogTitle className="text-xl text-center" data-testid="text-stripe-success-title">
                  Payments Activated
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="flex justify-center">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Stripe is connected and ready to collect deposits from your customers automatically.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    onClick={() => {
                      setShowStripeSuccessModal(false);
                      setLocation("/settings?from=stripe_success");
                    }}
                    data-testid="button-review-calculator-pricing"
                  >
                    Review Pricing
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => setShowStripeSuccessModal(false)}
                    data-testid="button-stripe-success-dismiss"
                  >
                    I'll do this later
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <StripeInterstitialModal
            open={showSetupInterstitial}
            onOpenChange={setShowSetupInterstitial}
            onContinue={() => {
              setShowSetupInterstitial(false);
              connectMutation.mutate();
            }}
            onDismiss={() => setShowSetupInterstitial(false)}
            isLoading={connectMutation.isPending}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
