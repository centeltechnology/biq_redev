import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Link, Redirect } from "wouter";
import { Users, Eye, Calculator, MousePointerClick, UserPlus, TrendingUp, ArrowLeft, BarChart3, Zap, Target, ScanEye, Activity, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type TimeRange = "today" | "yesterday" | "7d" | "14d" | "30d" | "90d" | "180d" | "365d" | "all";

const RANGE_LABELS: Record<TimeRange, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "7 Days",
  "14d": "14 Days",
  "30d": "30 Days",
  "90d": "90 Days",
  "180d": "180 Days",
  "365d": "1 Year",
  all: "All Time",
};

interface Summary {
  visitors: number;
  pageViews: number;
  calculatorUses: number;
  calculatorVisible: number;
  calculatorInteractions: number;
  ctaClicks: number;
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
  calculatorVisible: number;
  calculatorUses: number;
  signupClicks: number;
  accountsCreated: number;
  conversionRate: number;
}

interface FeedEvent {
  eventType: string;
  pagePath: string | null;
  createdAt: string;
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

function FunnelMetrics({ summary }: { summary: Summary }) {
  const pct = (num: number, den: number) => den > 0 ? Math.round((num / den) * 1000) / 10 : 0;
  const metrics = [
    { label: "Visitor → Calculator", value: pct(summary.calculatorVisible, summary.visitors) },
    { label: "Calculator Engagement", value: pct(summary.calculatorUses, summary.calculatorVisible) },
    { label: "Signup Intent", value: pct(summary.signupClicks, summary.calculatorUses) },
    { label: "Visitor → Signup", value: pct(summary.accountsCreated, summary.visitors) },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" data-testid="funnel-metrics">
      {metrics.map((m) => (
        <Card key={m.label} className="border-dashed">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-lg font-semibold">{m.value}%</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function VisualFunnel({ summary }: { summary: Summary }) {
  const stages = [
    { label: "Visitors", value: summary.visitors },
    { label: "Calc Visible", value: summary.calculatorVisible },
    { label: "Calc Uses", value: summary.calculatorUses },
    { label: "Signup Clicks", value: summary.signupClicks },
    { label: "Accounts", value: summary.accountsCreated },
  ];
  const maxVal = Math.max(...stages.map(s => s.value), 1);

  return (
    <Card data-testid="card-visual-funnel">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stages.map((stage, i) => {
          const prevValue = i > 0 ? stages[i - 1].value : 0;
          const dropOff = i > 0 && prevValue > 0 ? Math.round((stage.value / prevValue) * 1000) / 10 : null;
          const barWidth = maxVal > 0 ? Math.max((stage.value / maxVal) * 100, 2) : 2;
          return (
            <div key={stage.label}>
              {i > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground pl-2 py-0.5">
                  <ChevronRight className="h-3 w-3" />
                  {dropOff !== null ? `${dropOff}% of previous` : "—"}
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 text-right flex-shrink-0">{stage.label}</span>
                <div className="flex-1 h-7 bg-muted rounded overflow-hidden relative">
                  <div
                    className="h-full bg-primary/60 rounded transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                  <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium">
                    {stage.value.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function TrendChart({ data, range }: { data: DayTrend[]; range: TimeRange }) {
  const maxVisitors = Math.max(...data.map(d => d.visitors), 1);
  const rangeLabel = RANGE_LABELS[range];

  return (
    <Card data-testid="card-trend-chart">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          {rangeLabel} Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-[2px] h-40">
          {data.map((day) => {
            const height = maxVisitors > 0 ? (day.visitors / maxVisitors) * 100 : 0;
            const accountHeight = maxVisitors > 0 ? (day.accounts / maxVisitors) * 100 : 0;
            const showLabel = data.length <= 14;
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
                {showLabel && <span className="text-[10px] text-muted-foreground">{label}</span>}
                {showLabel && <span className="text-[10px] font-medium">{day.visitors}</span>}
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
        <CardTitle className="text-base">Landing Page Breakdown</CardTitle>
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
                  <th className="pb-2 font-medium text-right">Calc Visible</th>
                  <th className="pb-2 font-medium text-right">Calc Uses</th>
                  <th className="pb-2 font-medium text-right">Signup Clicks</th>
                  <th className="pb-2 font-medium text-right">Accounts</th>
                  <th className="pb-2 font-medium text-right">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.page} className="border-b last:border-0" data-testid={`row-page-${row.page}`}>
                    <td className="py-2 font-mono text-xs">{row.page}</td>
                    <td className="py-2 text-right">{row.views}</td>
                    <td className="py-2 text-right">{row.calculatorVisible}</td>
                    <td className="py-2 text-right">{row.calculatorUses}</td>
                    <td className="py-2 text-right">{row.signupClicks}</td>
                    <td className="py-2 text-right">{row.accountsCreated}</td>
                    <td className="py-2 text-right">{row.conversionRate}%</td>
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

const EVENT_DESCRIPTIONS: Record<string, string> = {
  page_view: "A visitor viewed",
  calculator_used: "Someone used the calculator on",
  calculator_visible: "Calculator entered viewport on",
  servings_changed: "Someone adjusted servings on",
  design_level_changed: "Someone changed design level on",
  signup_click: "A signup button was clicked on",
  cta_click: "A CTA was clicked on",
  account_created: "Someone created an account",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ActivityFeed({ events }: { events: FeedEvent[] }) {
  return (
    <Card data-testid="card-activity-feed">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event, i) => {
              const desc = EVENT_DESCRIPTIONS[event.eventType] || event.eventType;
              const page = event.pagePath ? ` ${event.pagePath}` : "";
              return (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0" data-testid={`feed-event-${i}`}>
                  <span className="text-muted-foreground">{desc}{page}</span>
                  <span className="text-xs text-muted-foreground/60 flex-shrink-0 ml-3">{relativeTime(event.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const { baker } = useAuth();
  const [range, setRange] = useState<TimeRange>("7d");

  if (!baker || baker.role !== "super_admin") {
    return <Redirect to="/dashboard" />;
  }

  const { data: summary, isLoading: summaryLoading } = useQuery<Summary>({
    queryKey: [`/api/admin/analytics/internal?range=${range}`],
    refetchInterval: 30000,
  });

  const { data: trend, isLoading: trendLoading } = useQuery<DayTrend[]>({
    queryKey: [`/api/admin/analytics/internal/trend?range=${range}`],
    refetchInterval: 60000,
  });

  const { data: pages, isLoading: pagesLoading } = useQuery<PageBreakdown[]>({
    queryKey: [`/api/admin/analytics/internal/pages?range=${range}`],
    refetchInterval: 60000,
  });

  const { data: feed, isLoading: feedLoading } = useQuery<FeedEvent[]>({
    queryKey: ["/api/admin/analytics/internal/feed"],
    refetchInterval: 15000,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" data-testid="button-back-admin">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Admin
              </Button>
            </Link>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Landing Page Analytics</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4 ml-[88px]">Landing page traffic, calculator usage, and signup funnel</p>

        <div className="flex flex-wrap gap-1 mb-6" data-testid="range-filter">
          {(Object.keys(RANGE_LABELS) as TimeRange[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(r)}
              data-testid={`button-range-${r}`}
            >
              {RANGE_LABELS[r]}
            </Button>
          ))}
        </div>

        {summaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              <StatCard label="Visitors" value={summary.visitors} icon={Users} />
              <StatCard label="Page Views" value={summary.pageViews} icon={Eye} />
              <StatCard label="Calc Visible" value={summary.calculatorVisible} icon={ScanEye} />
              <StatCard label="Calc Uses" value={summary.calculatorUses} icon={Calculator} />
              <StatCard label="Calc Interactions" value={summary.calculatorInteractions} icon={Zap} />
              <StatCard label="CTA Clicks" value={summary.ctaClicks} icon={Target} />
              <StatCard label="Signup Clicks" value={summary.signupClicks} icon={MousePointerClick} />
              <StatCard label="Accounts Created" value={summary.accountsCreated} icon={UserPlus} />
              <StatCard label="Conversion Rate" value={summary.conversionRate} icon={TrendingUp} suffix="%" />
            </div>
            <FunnelMetrics summary={summary} />
          </>
        ) : null}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {trendLoading ? (
            <Skeleton className="h-64" />
          ) : trend ? (
            <TrendChart data={trend} range={range} />
          ) : null}

          {summary ? (
            <VisualFunnel summary={summary} />
          ) : (
            <Skeleton className="h-64" />
          )}
        </div>

        {pagesLoading ? (
          <div className="mb-6"><Skeleton className="h-64" /></div>
        ) : pages ? (
          <div className="mb-6"><PageTable data={pages} /></div>
        ) : null}

        {feedLoading ? (
          <Skeleton className="h-48" />
        ) : feed ? (
          <ActivityFeed events={feed} />
        ) : null}
      </div>
    </div>
  );
}
