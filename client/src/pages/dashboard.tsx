import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FileText, Users, ArrowRight, Calendar, DollarSign, TrendingUp, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/calculator";
import type { Lead, Quote } from "@shared/schema";

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
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: orderStats, isLoading: isLoadingOrders } = useQuery<OrderStats>({
    queryKey: ["/api/orders/stats"],
  });

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
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
                <CardDescription>View your order calendar</CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link href="/calendar" data-testid="link-view-calendar">
                  View Calendar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
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
                <p className="text-sm">Share your calculator link to start receiving leads</p>
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
