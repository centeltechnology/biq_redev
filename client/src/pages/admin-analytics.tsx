import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Link, Redirect } from "wouter";
import { Users, Eye, Calculator, MousePointerClick, UserPlus, TrendingUp, ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Summary {
  visitors: number;
  pageViews: number;
  calculatorUses: number;
  signupClicks: number;
  accountsCreated: number;
  conversionRate: number;
}

interface DayTrend {
  date: string;
  visitors: number;
  accounts: number;
}

interface PageBreakdown {
  page: string;
  views: number;
  conversions: number;
  rate: number;
}

function StatCard({ label, value, icon: Icon, suffix }: { label: string; value: number | string; icon: typeof Users; suffix?: string }) {
  return (
    <Card data-testid={`card-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}{suffix}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendChart({ data }: { data: DayTrend[] }) {
  const maxVisitors = Math.max(...data.map(d => d.visitors), 1);

  return (
    <Card data-testid="card-trend-chart">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          7-Day Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-40">
          {data.map((day) => {
            const height = maxVisitors > 0 ? (day.visitors / maxVisitors) * 100 : 0;
            const accountHeight = maxVisitors > 0 ? (day.accounts / maxVisitors) * 100 : 0;
            const label = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1" data-testid={`bar-day-${day.date}`}>
                <div className="w-full flex flex-col items-center justify-end h-32 relative">
                  <div
                    className="w-full max-w-8 rounded-t bg-primary/20 absolute bottom-0"
                    style={{ height: `${height}%` }}
                  />
                  <div
                    className="w-full max-w-8 rounded-t bg-primary absolute bottom-0"
                    style={{ height: `${accountHeight}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{label}</span>
                <span className="text-[10px] font-medium">{day.visitors}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/20" />
            Visitors
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary" />
            Accounts
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PageTable({ data }: { data: PageBreakdown[] }) {
  return (
    <Card data-testid="card-page-breakdown">
      <CardHeader>
        <CardTitle className="text-base">Landing Page Breakdown (7 days)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No page data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Page</th>
                  <th className="pb-2 font-medium text-right">Views</th>
                  <th className="pb-2 font-medium text-right">Clicks</th>
                  <th className="pb-2 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.page} className="border-b last:border-0" data-testid={`row-page-${row.page}`}>
                    <td className="py-2 font-mono text-xs">{row.page}</td>
                    <td className="py-2 text-right">{row.views}</td>
                    <td className="py-2 text-right">{row.conversions}</td>
                    <td className="py-2 text-right">{row.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const { baker } = useAuth();

  if (!baker || baker.role !== "super_admin") {
    return <Redirect to="/dashboard" />;
  }

  const { data: summary, isLoading: summaryLoading } = useQuery<Summary>({
    queryKey: ["/api/admin/analytics/internal"],
    refetchInterval: 30000,
  });

  const { data: trend, isLoading: trendLoading } = useQuery<DayTrend[]>({
    queryKey: ["/api/admin/analytics/internal/trend"],
    refetchInterval: 60000,
  });

  const { data: pages, isLoading: pagesLoading } = useQuery<PageBreakdown[]>({
    queryKey: ["/api/admin/analytics/internal/pages"],
    refetchInterval: 60000,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Site Analytics</h1>
        </div>

        {summaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard label="Visitors" value={summary.visitors} icon={Users} />
            <StatCard label="Page Views" value={summary.pageViews} icon={Eye} />
            <StatCard label="Calculator Uses" value={summary.calculatorUses} icon={Calculator} />
            <StatCard label="Signup Clicks" value={summary.signupClicks} icon={MousePointerClick} />
            <StatCard label="Accounts Created" value={summary.accountsCreated} icon={UserPlus} />
            <StatCard label="Conversion Rate" value={summary.conversionRate} icon={TrendingUp} suffix="%" />
          </div>
        ) : null}

        <div className="grid md:grid-cols-2 gap-6">
          {trendLoading ? (
            <Skeleton className="h-64" />
          ) : trend ? (
            <TrendChart data={trend} />
          ) : null}

          {pagesLoading ? (
            <Skeleton className="h-64" />
          ) : pages ? (
            <PageTable data={pages} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
