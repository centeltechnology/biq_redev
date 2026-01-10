import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { OnboardingTour } from "@/components/onboarding-tour";
import { useAuth } from "@/hooks/use-auth";
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

export function DashboardLayout({ children, title, actions }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading, baker } = useAuth();
  const [, setLocation] = useLocation();

  const { data: subscription } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    enabled: isAuthenticated,
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

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          {baker?.onboardingTourStatus && (
            <OnboardingTour tourStatus={baker.onboardingTourStatus} />
          )}
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
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
