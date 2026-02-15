import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sparkles, Bell, CreditCard, Clock, FileText, Share2, Copy } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { SupportChat } from "@/components/support-chat";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  useEffect(() => {
    if (!baker) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe") === "connected") {
      const alreadyShown = sessionStorage.getItem("stripeConnectToastShown");
      if (alreadyShown) {
        params.delete("stripe");
        params.delete("connect");
        const newUrl = params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      } else if (baker.stripeConnectedAt) {
        toast({
          title: "Stripe connected",
          description: "You're ready to send your first quote.",
        });
        sessionStorage.setItem("stripeConnectToastShown", "true");
        params.delete("stripe");
        params.delete("connect");
        const newUrl = params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [baker, toast]);

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

  const needsStripeConnect = baker && !baker.stripeConnectedAt && baker.role !== "super_admin";
  const showStripeBanner = needsStripeConnect && !snoozed;

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
                    Unlimited Quotes
                  </Badge>
                ) : subscription.plan === "basic" ? (
                  <Badge variant="secondary" className="gap-1" data-testid="badge-basic-plan">
                    Basic: {subscription.monthlyQuoteCount}/{subscription.quoteLimit}
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground" data-testid="text-quote-count">
                      {subscription.monthlyQuoteCount}/{subscription.quoteLimit} quotes
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => upgradeMutation.mutate("basic")}
                      disabled={upgradeMutation.isPending}
                      data-testid="button-header-upgrade"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Upgrade
                    </Button>
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
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
          <SupportChat />
        </div>
      </div>
    </SidebarProvider>
  );
}
