import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ClipboardList, Users, ArrowRight, Calendar, DollarSign, TrendingUp, CalendarCheck, Sparkles, AlertTriangle, Plus, UserPlus, Mail, BarChart3, AlertCircle, Shield, Copy, ExternalLink, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  trackDmReplyCopied,
  trackOrderLinkCopied,
  trackOrderPagePreviewed,
  trackStripeEnableClicked,
  trackPricingReviewClicked,
} from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/dashboard-layout";
import { OnboardingChecklist } from "@/components/onboarding-checklist";

import { StatusBadge } from "@/components/status-badge";
import { useFormatCurrency } from "@/hooks/use-baker-currency";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Lead, Quote, Order } from "@shared/schema";

interface SubscriptionStatus {
  plan: string;
  monthlyQuoteCount: number;
  quoteLimit: number | null;
  isAtLimit: boolean;
}

interface UpcomingOrder extends Order {
  customerName: string;
  eventType: string | null;
}

interface DashboardStats {
  newLeadsCount: number;
  pendingQuotesCount: number;
  totalCustomers: number;
  recentLeads: Lead[];
}

interface OrderStats {
  monthlyCount: number;
  monthlyRevenue: number;
  yearlyCount: number;
  yearlyRevenue: number;
}

export default function DashboardPage() {
  const { baker } = useAuth();
  const formatCurrency = useFormatCurrency();
  const { toast } = useToast();


  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: orderStats, isLoading: isLoadingOrders } = useQuery<OrderStats>({
    queryKey: ["/api/orders/stats"],
  });

  const { data: upcomingOrders, isLoading: isLoadingUpcoming } = useQuery<UpcomingOrder[]>({
    queryKey: ["/api/orders/upcoming"],
  });

  const { data: subscription } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/resend-verification");
      return res.json();
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string = "basic") => {
      const res = await apiRequest("POST", "/api/subscription/checkout", { plan });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
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

  const orderUrl = `${window.location.origin}/c/${baker?.slug ?? ""}`;
  const productMode = (baker as any)?.productMode as string | undefined;

  const getDmReply = () => {
    const intro =
      productMode === "cakes"
        ? "Thanks for reaching out! You can build your cake request and get an instant estimate here:"
        : productMode === "treats"
        ? "Thanks for reaching out! You can build your treat order and get an instant estimate here:"
        : "Thanks for reaching out! You can build your order and get an instant estimate here:";
    return `${intro}\n${orderUrl}\n\nOnce you submit the details, I'll review everything and confirm availability.`;
  };

  const handleCopyDmReply = async () => {
    try {
      await navigator.clipboard.writeText(getDmReply());
      trackDmReplyCopied();
      toast({ title: "DM reply copied. Send it to your next pricing inquiry." });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  const handleCopyOrderLink = async () => {
    try {
      await navigator.clipboard.writeText(orderUrl);
      trackOrderLinkCopied();
      toast({ title: "Order link copied!" });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  // Has the baker received any real request/quote activity yet?
  const hasActivity =
    (stats?.recentLeads?.length ?? 0) > 0 ||
    (stats?.pendingQuotesCount ?? 0) > 0 ||
    !!baker?.firstQuoteSentAt;

  const isBaker = !!baker && baker.role !== "super_admin" && baker.role !== "admin";
  const showFirstRequestCard = isBaker && !!baker?.onboardingCompleted && !hasActivity;

  // Revenue metrics stay hidden until the first quote has been sent.
  const isOnboarding = baker && baker.role !== "super_admin" && !baker.firstQuoteSentAt;

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {baker && !baker.emailVerified && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium" data-testid="text-verify-email-reminder">
                    Please verify your email address
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Check your inbox for a verification link to complete your account setup
                  </p>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={() => resendVerificationMutation.mutate()} 
                disabled={resendVerificationMutation.isPending || resendVerificationMutation.isSuccess}
                data-testid="button-resend-verification"
              >
                {resendVerificationMutation.isPending 
                  ? "Sending..." 
                  : resendVerificationMutation.isSuccess 
                    ? "Email Sent!" 
                    : "Resend Email"}
              </Button>
            </CardContent>
          </Card>
        )}

        {showFirstRequestCard && (
          <Card className="border-primary/30 bg-primary/5" data-testid="card-first-request">
            <CardContent className="py-5">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 shrink-0">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base" data-testid="text-first-request-title">
                    Get your first request
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Have someone asking "how much?" Send them your BakerIQ order link.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Button onClick={handleCopyDmReply} data-testid="button-copy-dm-reply">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy DM Reply
                    </Button>
                    <Button variant="outline" asChild data-testid="button-preview-order-page">
                      <a
                        href={orderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackOrderPagePreviewed()}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Preview Order Page
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyOrderLink}
                      data-testid="button-copy-order-link"
                    >
                      Copy link
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <OnboardingChecklist
          onConnectStripe={() => {
            trackStripeEnableClicked();
            connectMutation.mutate();
          }}
          isConnecting={connectMutation.isPending}
        />

        {baker && !baker.stripeConnectedAt && baker.role !== "super_admin" && baker.role !== "admin" && baker.onboardingCompleted && (
          <Card
            className={hasActivity ? "border-primary/30 bg-primary/5" : "border-muted"}
            data-testid="card-stripe-dashboard-nudge"
          >
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <Shield className={`h-5 w-5 shrink-0 ${hasActivity ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium text-sm" data-testid="text-enable-payments">Enable retainers</p>
                  <p className="text-xs text-muted-foreground">
                    {hasActivity
                      ? "You have quote activity. Enable retainers so customers can pay online."
                      : "Once customers approve quotes, they can pay retainers online."}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  trackStripeEnableClicked();
                  connectMutation.mutate();
                }}
                disabled={connectMutation.isPending}
                data-testid="button-dashboard-connect-stripe"
              >
                {connectMutation.isPending ? "Setting up..." : "Enable Retainers"}
              </Button>
            </CardContent>
          </Card>
        )}

        {baker && !baker.pricingReviewed && baker.onboardingCompleted && (
          <Card className="border-muted">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm" data-testid="text-pricing-not-reviewed">
                    Review your pricing
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fine-tune your calculator when you're ready. Your starter pricing is already live.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                data-testid="button-review-pricing"
              >
                <Link href="/pricing" onClick={() => trackPricingReviewClicked()}>Review Pricing</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isOnboarding ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-6">
              <BarChart3 className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                Your revenue metrics will appear after your first quote is sent.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <RevenueCard
              title="Monthly Revenue"
              subtitle={new Date().toLocaleDateString('en-US', { month: 'long' })}
              value={orderStats?.monthlyRevenue}
              count={orderStats?.monthlyCount}
              icon={DollarSign}
              isLoading={isLoadingOrders}
            />
            <RevenueCard
              title="Yearly Revenue"
              subtitle={new Date().getFullYear().toString()}
              value={orderStats?.yearlyRevenue}
              count={orderStats?.yearlyCount}
              icon={TrendingUp}
              isLoading={isLoadingOrders}
            />
            <MetricCard
              title="New Leads"
              subtitle="Last 7 days"
              value={stats?.newLeadsCount}
              icon={ClipboardList}
              isLoading={isLoading}
            />
            <MetricCard
              title="Total Customers"
              subtitle="All time"
              value={stats?.totalCustomers}
              icon={Users}
              isLoading={isLoading}
            />
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={handleCopyDmReply} data-testid="button-quick-copy-dm-reply">
              <Copy className="mr-2 h-4 w-4" />
              Copy Reply
            </Button>
            <Button variant="outline" asChild data-testid="button-quick-preview-order-page">
              <a
                href={orderUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOrderPagePreviewed()}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview Order Page
              </a>
            </Button>
            <Button variant="outline" asChild data-testid="button-quick-new-quote">
              <Link href="/quotes/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Quote
              </Link>
            </Button>
            <Button variant="outline" asChild data-testid="button-quick-new-customer">
              <Link href="/customers?new=true">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Customer
              </Link>
            </Button>
            <Button variant="outline" asChild data-testid="button-quick-calendar">
              <Link href="/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-lg">Pending Quotes</CardTitle>
                <CardDescription>{stats?.pendingQuotesCount || 0} awaiting response</CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link href="/quotes" data-testid="link-view-all-quotes">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5" />
                  Upcoming Orders
                </CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link href="/calendar" data-testid="link-view-calendar">
                  View Calendar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingUpcoming ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !upcomingOrders || upcomingOrders.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No orders this week</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md border"
                      data-testid={`upcoming-order-${order.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{order.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.customerName || "Unknown customer"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {order.eventDate
                            ? new Date(order.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })
                            : "No date"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(Number(order.amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg">Recent Leads</CardTitle>
              <CardDescription>Latest inquiries from your calculator</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/leads" data-testid="link-view-all-leads">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stats?.recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No leads yet</p>
                <p className="text-sm">Share Your Order Page to start receiving leads</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.recentLeads.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

interface MetricCardProps {
  title: string;
  subtitle: string;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  isLoading: boolean;
}

function MetricCard({ title, subtitle, value, icon: Icon, isLoading }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <p className="text-3xl font-bold" data-testid={`metric-${title.toLowerCase().replace(/\s/g, "-")}`}>
                {value ?? 0}
              </p>
            )}
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RevenueCardProps {
  title: string;
  subtitle: string;
  value?: number;
  count?: number;
  icon: React.ComponentType<{ className?: string }>;
  isLoading: boolean;
}

function RevenueCard({ title, subtitle, value, count, icon: Icon, isLoading }: RevenueCardProps) {
  const formatCurrency = useFormatCurrency();
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <p className="text-2xl font-bold" data-testid={`revenue-${title.toLowerCase().replace(/\s/g, "-")}`}>
                {formatCurrency(value ?? 0)}
              </p>
            )}
            <p className="text-sm font-medium text-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-3 w-16" />
            ) : (
              <p className="text-xs text-muted-foreground">{count ?? 0} orders - {subtitle}</p>
            )}
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const formatCurrency = useFormatCurrency();
  const eventDate = lead.eventDate ? new Date(lead.eventDate).toLocaleDateString() : null;

  return (
    <Link href={`/leads/${lead.id}`}>
      <div
        className="flex items-center justify-between gap-4 p-4 rounded-md border hover-elevate active-elevate-2 cursor-pointer transition-colors"
        data-testid={`lead-row-${lead.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <p className="font-medium truncate">{lead.customerName}</p>
            <StatusBadge status={lead.status} type="lead" />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {eventDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {eventDate}
              </span>
            )}
            {lead.eventType && (
              <span className="capitalize">{lead.eventType}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            {formatCurrency(Number(lead.estimatedTotal))}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(lead.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
