import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Crown, 
  BarChart3, 
  Mail, 
  Activity,
  Ban,
  Key,
  Eye,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  FileText,
  UserPlus,
  Clock,
  Search,
  RotateCcw,
  Ticket,
  MessageSquare,
  Archive,
  Send,
  Share2,
  X,
  Calculator,
  Download,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Baker, BakerOnboardingEmail, SupportTicket, TicketMessage } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminAnalytics {
  totalBakers: number;
  bakersByPlan: { free: number; basic: number; pro: number };
  recentSignups: number;
  weeklySignups: number;
  verifiedBakers: number;
  suspendedBakers: number;
  admins: number;
  totalLeads: number;
  totalQuotes: number;
  totalOrders: number;
  platformRevenue: number;
  quotesThisMonth: number;
  leadsThisMonth: number;
}

interface BakerActivity {
  baker: Baker;
  stats: {
    totalLeads: number;
    totalQuotes: number;
    totalOrders: number;
    totalCustomers: number;
    sentQuotes: number;
    acceptedQuotes: number;
    totalRevenue: number;
  };
  recentLeads: any[];
  recentQuotes: any[];
  recentOrders: any[];
}

interface EmailLogWithBaker extends BakerOnboardingEmail {
  bakerEmail?: string;
  bakerName?: string;
}

interface SupportTicketWithBaker extends SupportTicket {
  baker: { businessName: string; email: string };
  messages?: TicketMessage[];
}

const EMAIL_DAY_LABELS: Record<number, string> = {
  0: "Day 0: Welcome + Connect Stripe",
  1: "Day 1: Pricing Calculator",
  2: "Day 2: Professional Quotes",
  3: "Day 3: Stripe Push / Connected",
  4: "Day 4: Deposits / Stripe Reminder",
  5: "Day 5: Pro Workflow",
  6: "Day 6: Habit / Final Stripe Push",
};

const SEGMENT_LABELS: Record<string, { label: string; description: string }> = {
  new_but_inactive: { label: "New but Inactive", description: "Signed up >7 days ago, no key actions" },
  configured_not_shared: { label: "Configured not Shared", description: "Calculator configured but link not shared" },
  leads_no_quotes: { label: "Leads no Quotes", description: "Has leads but no quotes created" },
  quotes_no_orders: { label: "Quotes no Orders", description: "Quotes sent but no orders" },
  active_power_user: { label: "Active Power User", description: "Consistent weekly actions" },
  at_risk: { label: "At Risk", description: "Previously active, no activity in 14 days" },
};

function AnnouncementEmailTab() {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);

  const { data: preview, isLoading: previewLoading } = useQuery<{ html: string }>({
    queryKey: ["/api/admin/announcement/preview"],
    enabled: showPreview,
  });

  const { data: analytics } = useQuery<AdminAnalytics>({
    queryKey: ["/api/admin/analytics"],
  });

  const sendTestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/announcement/test");
      return res.json();
    },
    onSuccess: (data: { success: boolean; sentTo: string }) => {
      toast({
        title: data.success ? "Test email sent" : "Test email failed",
        description: data.success ? `Sent to ${data.sentTo}` : "Check your AWS SES configuration",
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({ title: "Failed to send test email", variant: "destructive" });
    },
  });

  const sendAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/announcement/send");
      return res.json();
    },
    onSuccess: (data: { total: number; sent: number; failed: number }) => {
      toast({
        title: "Announcement emails sent",
        description: `${data.sent} of ${data.total} emails delivered successfully${data.failed > 0 ? `, ${data.failed} failed` : ""}`,
      });
      setConfirmSend(false);
    },
    onError: () => {
      toast({ title: "Failed to send emails", variant: "destructive" });
      setConfirmSend(false);
    },
  });

  const totalActive = analytics ? analytics.totalBakers - (analytics.suspendedBakers || 0) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Feature Announcement Email
          </CardTitle>
          <CardDescription>
            Send a branded email to all active bakers announcing new features, pricing updates, and Stripe payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="text-sm font-medium" data-testid="text-email-recipients">
                Recipients: {totalActive} active baker{totalActive !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Subject: What's New at BakerIQ: Stripe Payments, More Quotes & New Features
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                data-testid="button-toggle-preview"
              >
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? "Hide Preview" : "Preview Email"}
              </Button>
              <Button
                variant="outline"
                onClick={() => sendTestMutation.mutate()}
                disabled={sendTestMutation.isPending}
                data-testid="button-send-test"
              >
                {sendTestMutation.isPending ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Mail className="mr-2 h-4 w-4" /> Send Test to Me</>
                )}
              </Button>
            </div>
          </div>

          {showPreview && (
            <div className="border rounded-md overflow-hidden bg-white">
              {previewLoading ? (
                <div className="p-8 flex justify-content-center">
                  <Skeleton className="h-96 w-full" />
                </div>
              ) : preview?.html ? (
                <iframe
                  srcDoc={preview.html}
                  title="Email Preview"
                  className="w-full border-0"
                  style={{ height: "800px" }}
                  data-testid="iframe-email-preview"
                />
              ) : (
                <p className="p-8 text-center text-muted-foreground">Failed to load preview</p>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            {!confirmSend ? (
              <Button
                onClick={() => setConfirmSend(true)}
                data-testid="button-send-all"
              >
                <Send className="mr-2 h-4 w-4" />
                Send to All Bakers ({totalActive})
              </Button>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm font-medium text-destructive">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  This will send an email to {totalActive} baker{totalActive !== 1 ? "s" : ""}. Are you sure?
                </p>
                <Button
                  variant="destructive"
                  onClick={() => sendAllMutation.mutate()}
                  disabled={sendAllMutation.isPending}
                  data-testid="button-confirm-send-all"
                >
                  {sendAllMutation.isPending ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    "Yes, Send Now"
                  )}
                </Button>
                <Button variant="ghost" onClick={() => setConfirmSend(false)} data-testid="button-cancel-send">
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RetentionEmailAdmin() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalSent: number;
    sentLast7Days: number;
    sentLast30Days: number;
    openRate: number;
    clickRate: number;
    bySegment: Record<string, { sent: number; opened: number; clicked: number }>;
  }>({
    queryKey: ["/api/admin/retention/stats"],
  });

  const { data: segments, isLoading: segmentsLoading } = useQuery<Record<string, number>>({
    queryKey: ["/api/admin/retention/segments"],
  });

  const runSchedulerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/retention/run");
      return response.json();
    },
    onSuccess: (data: { processed: number; sent: number; failed: number; skipped: number }) => {
      toast({
        title: "Retention emails sent",
        description: `Processed ${data.processed} users: ${data.sent} sent, ${data.failed} failed, ${data.skipped} skipped`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/retention/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to run retention scheduler",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Retention Emails</CardTitle>
            <CardDescription>Weekly activation and retention email program</CardDescription>
          </div>
          <Button
            onClick={() => runSchedulerMutation.mutate()}
            disabled={runSchedulerMutation.isPending}
            size="sm"
            data-testid="button-run-retention"
          >
            {runSchedulerMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Run Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.totalSent || 0}</div>
            <div className="text-sm text-muted-foreground">Total Sent</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.sentLast7Days || 0}</div>
            <div className="text-sm text-muted-foreground">Last 7 Days</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{statsLoading ? "..." : `${stats?.openRate?.toFixed(1) || 0}%`}</div>
            <div className="text-sm text-muted-foreground">Open Rate</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{statsLoading ? "..." : `${stats?.clickRate?.toFixed(1) || 0}%`}</div>
            <div className="text-sm text-muted-foreground">Click Rate</div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3">User Segments</h4>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {segmentsLoading ? (
              <Skeleton className="h-16 w-full col-span-full" />
            ) : (
              Object.entries(SEGMENT_LABELS).map(([key, { label, description }]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                  <Badge variant="secondary">{segments?.[key] || 0}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {stats?.bySegment && Object.keys(stats.bySegment).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Performance by Segment</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Opened</TableHead>
                  <TableHead className="text-right">Clicked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(stats.bySegment).map(([segment, data]) => (
                  <TableRow key={segment}>
                    <TableCell>{SEGMENT_LABELS[segment]?.label || segment}</TableCell>
                    <TableCell className="text-right">{data.sent}</TableCell>
                    <TableCell className="text-right">{data.opened}</TableCell>
                    <TableCell className="text-right">{data.clicked}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FinancialData {
  liveMetrics: {
    totalBakers: number;
    bakersByPlan: { free: number; basic: number; pro: number };
    totalGMV: number;
    monthlyGMV: number;
    platformFeeRevenue: number;
    monthlyPlatformFees: number;
    subscriptionRevenue: { monthly: number; annual: number };
    affiliateCosts: { totalPaid: number; totalPending: number; totalAll: number };
    netRevenue: { monthly: number; total: number };
    arpu: number;
    monthlyArpu: number;
    stripeConnectAdoption: number;
    monthlyTrends: Array<{
      month: string;
      gmv: number;
      platformFees: number;
      subscriptionRevenue: number;
      newBakers: number;
      totalBakers: number;
    }>;
  };
}

const DEFAULT_ASSUMPTIONS = {
  freePct: 65,
  basicPct: 22,
  proPct: 13,
  avgGmvPerBaker: 1800,
  avgTransactions: 4,
  affiliateRate: 25,
  stripeFee: 2.9,
};

function FinancialsTab() {
  const { data: financials, isLoading } = useQuery<FinancialData>({
    queryKey: ["/api/admin/financials"],
  });

  const [freePct, setFreePct] = useState(DEFAULT_ASSUMPTIONS.freePct);
  const [basicPct, setBasicPct] = useState(DEFAULT_ASSUMPTIONS.basicPct);
  const [proPct, setProPct] = useState(DEFAULT_ASSUMPTIONS.proPct);
  const [avgGmvPerBaker, setAvgGmvPerBaker] = useState(DEFAULT_ASSUMPTIONS.avgGmvPerBaker);
  const [avgTransactions, setAvgTransactions] = useState(DEFAULT_ASSUMPTIONS.avgTransactions);
  const [affiliateRate, setAffiliateRate] = useState(DEFAULT_ASSUMPTIONS.affiliateRate);
  const [stripeFee, setStripeFee] = useState(DEFAULT_ASSUMPTIONS.stripeFee);

  const resetDefaults = () => {
    setFreePct(DEFAULT_ASSUMPTIONS.freePct);
    setBasicPct(DEFAULT_ASSUMPTIONS.basicPct);
    setProPct(DEFAULT_ASSUMPTIONS.proPct);
    setAvgGmvPerBaker(DEFAULT_ASSUMPTIONS.avgGmvPerBaker);
    setAvgTransactions(DEFAULT_ASSUMPTIONS.avgTransactions);
    setAffiliateRate(DEFAULT_ASSUMPTIONS.affiliateRate);
    setStripeFee(DEFAULT_ASSUMPTIONS.stripeFee);
  };

  const tierSum = freePct + basicPct + proPct;

  const scenarios = [500, 1000, 10000, 50000];

  const computeScenario = (totalUsers: number) => {
    const freeUsers = Math.round(totalUsers * (freePct / 100));
    const basicUsers = Math.round(totalUsers * (basicPct / 100));
    const proUsers = totalUsers - freeUsers - basicUsers;

    const monthlyGMV = totalUsers * avgGmvPerBaker;
    const avgGmvPerUser = avgGmvPerBaker;
    const platformFees =
      freeUsers * avgGmvPerUser * 0.07 +
      basicUsers * avgGmvPerUser * 0.05 +
      proUsers * avgGmvPerUser * 0.03;
    const subscriptionRevenue = basicUsers * 4.99 + proUsers * 9.99;
    const grossRevenue = platformFees + subscriptionRevenue;
    const affiliateCosts = subscriptionRevenue * (affiliateRate / 100) * (3 / 12) * 0.20;
    const transactions = totalUsers * avgTransactions;
    const stripeProcessingCosts = monthlyGMV * (stripeFee / 100) + transactions * 0.30;
    const netRevenue = grossRevenue - affiliateCosts - stripeProcessingCosts;
    const revenuePerUser = totalUsers > 0 ? netRevenue / totalUsers : 0;
    const arpuWeighted = totalUsers > 0 ? grossRevenue / totalUsers : 0;

    return {
      totalUsers,
      freeUsers,
      basicUsers,
      proUsers,
      monthlyGMV,
      platformFees,
      subscriptionRevenue,
      grossRevenue,
      affiliateCosts,
      stripeProcessingCosts,
      netRevenue,
      revenuePerUser,
      arpuWeighted,
      arr: subscriptionRevenue * 12,
      annualGMV: monthlyGMV * 12,
      annualGrossRevenue: grossRevenue * 12,
      annualNetRevenue: netRevenue * 12,
    };
  };

  const projections = scenarios.map(computeScenario);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
  const fmtCurrencyDecimal = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
  const fmtNumber = (v: number) => new Intl.NumberFormat("en-US").format(Math.round(v));

  const lm = financials?.liveMetrics;

  const exportLiveMetrics = () => {
    if (!lm) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Bakers", lm.totalBakers],
      ["Free Bakers", lm.bakersByPlan.free],
      ["Basic Bakers", lm.bakersByPlan.basic],
      ["Pro Bakers", lm.bakersByPlan.pro],
      ["Total GMV", lm.totalGMV.toFixed(2)],
      ["Monthly GMV", lm.monthlyGMV.toFixed(2)],
      ["Platform Fee Revenue", lm.platformFeeRevenue.toFixed(2)],
      ["Monthly Platform Fees", lm.monthlyPlatformFees.toFixed(2)],
      ["Monthly Subscription Revenue", lm.subscriptionRevenue.monthly.toFixed(2)],
      ["Annual Subscription Revenue", lm.subscriptionRevenue.annual.toFixed(2)],
      ["ARR (Annual Recurring Revenue)", lm.subscriptionRevenue.annual.toFixed(2)],
      ["Affiliate Costs (Paid)", lm.affiliateCosts.totalPaid.toFixed(2)],
      ["Affiliate Costs (Pending)", lm.affiliateCosts.totalPending.toFixed(2)],
      ["Monthly Net Revenue", lm.netRevenue.monthly.toFixed(2)],
      ["Total Net Revenue", lm.netRevenue.total.toFixed(2)],
      ["ARPU", lm.arpu.toFixed(2)],
      ["Monthly ARPU", lm.monthlyArpu.toFixed(2)],
      ["Stripe Connect Adoption %", lm.stripeConnectAdoption.toFixed(1)],
    ];
    if (lm.monthlyTrends.length > 0) {
      rows.push([]);
      rows.push(["Month", "New Bakers", "Total Bakers", "GMV", "Platform Fees", "Sub Revenue"]);
      lm.monthlyTrends.forEach(t => {
        rows.push([t.month, t.newBakers, t.totalBakers, t.gmv.toFixed(2), t.platformFees.toFixed(2), t.subscriptionRevenue.toFixed(2)]);
      });
    }
    const csv = rows.map(r => (r as any[]).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bakeriq-live-metrics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportProjections = () => {
    const headers = ["Metric", ...scenarios.map(s => `${fmtNumber(s)} Users`)];
    const rows: any[][] = [headers];
    const addRow = (label: string, getter: (p: ReturnType<typeof computeScenario>) => string) => {
      rows.push([label, ...projections.map(getter)]);
    };
    const addSectionHeader = (label: string) => {
      rows.push([label, ...scenarios.map(() => "")]);
    };

    addSectionHeader("--- Users ---");
    addRow("Total Users", p => fmtNumber(p.totalUsers));
    addRow("Free Tier", p => fmtNumber(p.freeUsers));
    addRow("Basic Tier", p => fmtNumber(p.basicUsers));
    addRow("Pro Tier", p => fmtNumber(p.proUsers));
    addSectionHeader("--- Monthly Revenue ---");
    addRow("Monthly GMV", p => p.monthlyGMV.toFixed(2));
    addRow("Platform Fees", p => p.platformFees.toFixed(2));
    addRow("Subscription Revenue", p => p.subscriptionRevenue.toFixed(2));
    addRow("Gross Revenue", p => p.grossRevenue.toFixed(2));
    addSectionHeader("--- Monthly Costs ---");
    addRow("Affiliate Commissions", p => p.affiliateCosts.toFixed(2));
    addRow("Stripe Processing", p => p.stripeProcessingCosts.toFixed(2));
    addSectionHeader("--- Monthly Net ---");
    addRow("Net Revenue", p => p.netRevenue.toFixed(2));
    addRow("ARPU", p => p.arpuWeighted.toFixed(2));
    addRow("Revenue Per User", p => p.revenuePerUser.toFixed(2));
    addSectionHeader("--- ARR ---");
    addRow("ARR (Subscriptions Only)", p => p.arr.toFixed(2));
    addSectionHeader("--- Annual Projections ---");
    addRow("Annual GMV", p => p.annualGMV.toFixed(2));
    addRow("Annual Gross Revenue", p => p.annualGrossRevenue.toFixed(2));
    addRow("Annual Net Revenue", p => p.annualNetRevenue.toFixed(2));

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bakeriq-revenue-projections.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(7)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bakers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-fin-total-bakers">{lm?.totalBakers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Free: {lm?.bakersByPlan.free || 0} / Basic: {lm?.bakersByPlan.basic || 0} / Pro: {lm?.bakersByPlan.pro || 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly GMV</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-fin-monthly-gmv">{fmtCurrencyDecimal(lm?.monthlyGMV || 0)}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total GMV</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-fin-total-gmv">{fmtCurrencyDecimal(lm?.totalGMV || 0)}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Platform Fees</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-fin-monthly-fees">{fmtCurrencyDecimal(lm?.monthlyPlatformFees || 0)}</div>
                <p className="text-xs text-muted-foreground">Total: {fmtCurrencyDecimal(lm?.platformFeeRevenue || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscription Revenue</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-fin-subscription-rev">{fmtCurrencyDecimal(lm?.subscriptionRevenue.monthly || 0)}</div>
                <p className="text-xs text-muted-foreground">{fmtCurrencyDecimal(lm?.subscriptionRevenue.annual || 0)}/yr</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ARR</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-fin-arr">{fmtCurrencyDecimal(lm?.subscriptionRevenue.annual || 0)}</div>
                <p className="text-xs text-muted-foreground">Annual Recurring Revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Net Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-fin-net-revenue">{fmtCurrencyDecimal(lm?.netRevenue.monthly || 0)}</div>
                <p className="text-xs text-muted-foreground">ARPU: {fmtCurrencyDecimal(lm?.monthlyArpu || 0)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Trends</CardTitle>
          <CardDescription>Last 6 months performance</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">New Bakers</TableHead>
                    <TableHead className="text-right">Total Bakers</TableHead>
                    <TableHead className="text-right">GMV</TableHead>
                    <TableHead className="text-right">Platform Fees</TableHead>
                    <TableHead className="text-right">Sub Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(lm?.monthlyTrends || []).map((t) => (
                    <TableRow key={t.month}>
                      <TableCell className="font-medium" data-testid={`text-trend-month-${t.month}`}>{t.month}</TableCell>
                      <TableCell className="text-right" data-testid={`text-trend-new-${t.month}`}>{t.newBakers}</TableCell>
                      <TableCell className="text-right">{t.totalBakers}</TableCell>
                      <TableCell className="text-right">{fmtCurrencyDecimal(t.gmv)}</TableCell>
                      <TableCell className="text-right">{fmtCurrencyDecimal(t.platformFees)}</TableCell>
                      <TableCell className="text-right">{fmtCurrencyDecimal(t.subscriptionRevenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue Projections</CardTitle>
          <CardDescription>Model revenue at different user scales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h4 className="text-sm font-medium">Assumptions</h4>
              <Button variant="outline" size="sm" onClick={resetDefaults} data-testid="button-reset-defaults">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Defaults
              </Button>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Free Tier %</label>
                <Input
                  type="number"
                  value={freePct}
                  onChange={(e) => setFreePct(Number(e.target.value))}
                  data-testid="input-free-pct"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Basic Tier %</label>
                <Input
                  type="number"
                  value={basicPct}
                  onChange={(e) => setBasicPct(Number(e.target.value))}
                  data-testid="input-basic-pct"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Pro Tier %</label>
                <Input
                  type="number"
                  value={proPct}
                  onChange={(e) => setProPct(Number(e.target.value))}
                  data-testid="input-pro-pct"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Tier Sum {tierSum !== 100 && <span className="text-destructive">({tierSum}%)</span>}
                </label>
                <div className={`text-sm font-medium p-2 rounded ${tierSum === 100 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                  {tierSum === 100 ? "Valid (100%)" : `Must equal 100%`}
                </div>
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Avg Monthly GMV/Baker ($)</label>
                <Input
                  type="number"
                  value={avgGmvPerBaker}
                  onChange={(e) => setAvgGmvPerBaker(Number(e.target.value))}
                  data-testid="input-avg-gmv"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Avg Transactions/Month</label>
                <Input
                  type="number"
                  value={avgTransactions}
                  onChange={(e) => setAvgTransactions(Number(e.target.value))}
                  data-testid="input-avg-transactions"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Affiliate Acq. Rate (%)</label>
                <Input
                  type="number"
                  value={affiliateRate}
                  onChange={(e) => setAffiliateRate(Number(e.target.value))}
                  data-testid="input-affiliate-rate"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Stripe Processing (%)</label>
                <Input
                  type="number"
                  value={stripeFee}
                  onChange={(e) => setStripeFee(Number(e.target.value))}
                  step="0.1"
                  data-testid="input-stripe-fee"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Metric</TableHead>
                  {scenarios.map(s => (
                    <TableHead key={s} className="text-right min-w-[120px]" data-testid={`text-scenario-header-${s}`}>
                      {fmtNumber(s)} Users
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5} className="font-semibold text-xs uppercase tracking-wider">Users</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Users</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right" data-testid={`text-proj-total-users-${scenarios[i]}`}>{fmtNumber(p.totalUsers)}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Free Tier</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right">{fmtNumber(p.freeUsers)}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Basic Tier</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right">{fmtNumber(p.basicUsers)}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Pro Tier</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right">{fmtNumber(p.proUsers)}</TableCell>)}
                </TableRow>

                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5} className="font-semibold text-xs uppercase tracking-wider">Monthly Revenue</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Monthly GMV</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right">{fmtCurrency(p.monthlyGMV)}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell>Platform Fees (7%/5%/3%)</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right">{fmtCurrency(p.platformFees)}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell>Subscription Revenue</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right">{fmtCurrency(p.subscriptionRevenue)}</TableCell>)}
                </TableRow>
                <TableRow className="font-medium">
                  <TableCell>Gross Revenue</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right text-green-600 dark:text-green-400" data-testid={`text-proj-gross-${scenarios[i]}`}>{fmtCurrency(p.grossRevenue)}</TableCell>)}
                </TableRow>

                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5} className="font-semibold text-xs uppercase tracking-wider">Monthly Costs</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Affiliate Commissions</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right text-red-600 dark:text-red-400">{fmtCurrency(p.affiliateCosts)}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell>Stripe Processing</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right text-red-600 dark:text-red-400">{fmtCurrency(p.stripeProcessingCosts)}</TableCell>)}
                </TableRow>

                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5} className="font-semibold text-xs uppercase tracking-wider">Monthly Net</TableCell>
                </TableRow>
                <TableRow className="font-medium">
                  <TableCell>Net Revenue</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right" data-testid={`text-proj-net-${scenarios[i]}`}>{fmtCurrency(p.netRevenue)}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell>ARPU</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right">{fmtCurrencyDecimal(p.arpuWeighted)}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell>Revenue Per User</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right">{fmtCurrencyDecimal(p.revenuePerUser)}</TableCell>)}
                </TableRow>

                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5} className="font-semibold text-xs uppercase tracking-wider">Annual Recurring Revenue</TableCell>
                </TableRow>
                <TableRow className="font-bold">
                  <TableCell>ARR (Subscriptions Only)</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right text-green-600 dark:text-green-400" data-testid={`text-proj-arr-${scenarios[i]}`}>{fmtCurrency(p.arr)}</TableCell>)}
                </TableRow>

                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5} className="font-semibold text-xs uppercase tracking-wider">Annual Projections</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Annual GMV</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right">{fmtCurrency(p.annualGMV)}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell>Annual Gross Revenue</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right text-green-600 dark:text-green-400">{fmtCurrency(p.annualGrossRevenue)}</TableCell>)}
                </TableRow>
                <TableRow className="font-bold">
                  <TableCell>Annual Net Revenue</TableCell>
                  {projections.map((p, i) => <TableCell key={i} className="text-right" data-testid={`text-proj-annual-net-${scenarios[i]}`}>{fmtCurrency(p.annualNetRevenue)}</TableCell>)}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" onClick={exportLiveMetrics} disabled={isLoading || !lm} data-testid="button-export-live-metrics">
          <Download className="h-4 w-4 mr-2" />
          Export Live Metrics
        </Button>
        <Button variant="outline" onClick={exportProjections} data-testid="button-export-projections">
          <Download className="h-4 w-4 mr-2" />
          Export Projections
        </Button>
      </div>
    </div>
  );
}

function AffiliatesTab() {
  const { toast } = useToast();
  const [selectedBakerId, setSelectedBakerId] = useState("");
  const [selectedBakerLabel, setSelectedBakerLabel] = useState("");
  const [bakerSearchQuery, setBakerSearchQuery] = useState("");
  const [commissionRate, setCommissionRate] = useState("20");
  const [commissionMonths, setCommissionMonths] = useState("3");
  const [affiliateSearch, setAffiliateSearch] = useState("");

  const { data: affiliates, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/affiliates"],
  });

  const { data: allBakers } = useQuery<any[]>({
    queryKey: ["/api/admin/bakers"],
  });

  const { data: allCommissions } = useQuery<any[]>({
    queryKey: ["/api/admin/affiliates/commissions"],
  });

  const enableMutation = useMutation({
    mutationFn: async ({ bakerId, rate, months }: { bakerId: string; rate: string; months: number }) => {
      const res = await apiRequest("POST", `/api/admin/affiliates/${bakerId}/enable`, {
        commissionRate: rate,
        commissionMonths: months,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bakers"] });
      toast({ title: "Affiliate enabled" });
      setSelectedBakerId("");
      setSelectedBakerLabel("");
      setBakerSearchQuery("");
    },
    onError: () => {
      toast({ title: "Failed to enable affiliate", variant: "destructive" });
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (bakerId: string) => {
      const res = await apiRequest("POST", `/api/admin/affiliates/${bakerId}/disable`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
      toast({ title: "Affiliate disabled" });
    },
  });

  const payoutMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      const res = await apiRequest("POST", `/api/admin/affiliates/commissions/${commissionId}/payout`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates/commissions"] });
      toast({ title: "Commission marked as paid" });
    },
    onError: () => {
      toast({ title: "Failed to process payout", variant: "destructive" });
    },
  });

  const nonAffiliates = allBakers?.filter((b: any) => !b.isAffiliate) || [];
  const filteredNonAffiliates = bakerSearchQuery.trim()
    ? nonAffiliates.filter((b: any) => {
        const q = bakerSearchQuery.toLowerCase();
        return (
          b.businessName?.toLowerCase().includes(q) ||
          b.email?.toLowerCase().includes(q) ||
          b.firstName?.toLowerCase().includes(q) ||
          b.lastName?.toLowerCase().includes(q)
        );
      })
    : [];

  const filteredAffiliates = affiliates?.filter((a: any) => {
    if (!affiliateSearch) return true;
    const q = affiliateSearch.toLowerCase();
    return (
      a.businessName?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.affiliateCode?.toLowerCase().includes(q) ||
      a.affiliateSlug?.toLowerCase().includes(q)
    );
  }) || [];

  const pendingCommissions = allCommissions?.filter((c: any) => c.status === "pending") || [];

  const formatUSD = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-enable-affiliate-title">Enable New Affiliate</CardTitle>
          <CardDescription>Select a baker to make them an affiliate partner</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <label className="text-sm font-medium mb-1 block">Search for a baker</label>
              {selectedBakerId ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm py-1 px-3">
                    {selectedBakerLabel}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setSelectedBakerId(""); setSelectedBakerLabel(""); setBakerSearchQuery(""); }}
                    data-testid="button-clear-baker-selection"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Type a name or email to find a baker..."
                      value={bakerSearchQuery}
                      onChange={(e) => setBakerSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-baker-for-affiliate"
                    />
                  </div>
                  {bakerSearchQuery.trim() && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {filteredNonAffiliates.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">No bakers found matching "{bakerSearchQuery}"</p>
                      ) : (
                        filteredNonAffiliates.slice(0, 20).map((b: any) => (
                          <button
                            key={b.id}
                            className="w-full text-left px-3 py-2 hover-elevate flex items-center justify-between gap-2"
                            onClick={() => {
                              setSelectedBakerId(b.id);
                              setSelectedBakerLabel(`${b.businessName} (${b.email})`);
                              setBakerSearchQuery("");
                            }}
                            data-testid={`button-select-baker-${b.id}`}
                          >
                            <div>
                              <p className="font-medium text-sm">{b.businessName}</p>
                              <p className="text-xs text-muted-foreground">{b.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">{b.plan || "free"}</Badge>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-32">
                <label className="text-sm font-medium mb-1 block">Rate (%)</label>
                <Input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  data-testid="input-commission-rate"
                />
              </div>
              <div className="w-32">
                <label className="text-sm font-medium mb-1 block">Months</label>
                <Input
                  type="number"
                  value={commissionMonths}
                  onChange={(e) => setCommissionMonths(e.target.value)}
                  data-testid="input-commission-months"
                />
              </div>
              <Button
                onClick={() => enableMutation.mutate({
                  bakerId: selectedBakerId,
                  rate: commissionRate,
                  months: parseInt(commissionMonths),
                })}
                disabled={!selectedBakerId || enableMutation.isPending}
                data-testid="button-enable-affiliate"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Enable Affiliate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle data-testid="text-affiliates-title">Affiliate Partners</CardTitle>
            <CardDescription>{affiliates?.length || 0} affiliates</CardDescription>
          </div>
          <div className="w-64">
            <Input
              placeholder="Search affiliates..."
              value={affiliateSearch}
              onChange={(e) => setAffiliateSearch(e.target.value)}
              data-testid="input-search-affiliates"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !filteredAffiliates.length ? (
            <p className="text-muted-foreground text-center py-8">
              {affiliateSearch ? "No affiliates match your search." : "No affiliates yet. Enable a baker as an affiliate above."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Baker</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Months</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Signups</TableHead>
                  <TableHead>Earned</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates.map((a: any) => (
                  <TableRow key={a.id} data-testid={`row-affiliate-${a.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{a.businessName}</p>
                        <p className="text-sm text-muted-foreground">{a.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">/join/{a.affiliateSlug || a.affiliateCode}</Badge>
                    </TableCell>
                    <TableCell>{a.affiliateCommissionRate}%</TableCell>
                    <TableCell>{a.affiliateCommissionMonths}</TableCell>
                    <TableCell>{a.stats?.totalClicks || 0}</TableCell>
                    <TableCell>{a.stats?.totalConversions || 0}</TableCell>
                    <TableCell>{formatUSD(a.stats?.totalEarnings || 0)}</TableCell>
                    <TableCell>{formatUSD(a.stats?.pendingEarnings || 0)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disableMutation.mutate(a.id)}
                        disabled={disableMutation.isPending}
                        data-testid={`button-disable-affiliate-${a.id}`}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Disable
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pendingCommissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-pending-payouts-title">Pending Payouts</CardTitle>
            <CardDescription>{pendingCommissions.length} commission{pendingCommissions.length !== 1 ? "s" : ""} awaiting payout</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingCommissions.map((c: any) => (
                  <TableRow key={c.id} data-testid={`row-payout-${c.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{c.affiliateName}</p>
                        <Badge variant="outline" className="text-xs">{c.affiliateCode}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatUSD(parseFloat(c.commissionAmount))}</TableCell>
                    <TableCell>{c.commissionRate}%</TableCell>
                    <TableCell>{c.monthNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy") : ""}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => payoutMutation.mutate(c.id)}
                        disabled={payoutMutation.isPending}
                        data-testid={`button-payout-${c.id}`}
                      >
                        Mark Paid
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AffiliateRequestsSection />
    </div>
  );
}

function AffiliateRequestsSection() {
  const { toast } = useToast();
  const { data: requests, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/affiliate-requests"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/affiliate-requests/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliate-requests"] });
      toast({ title: "Request approved" });
    },
  });

  const denyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/affiliate-requests/${id}/deny`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliate-requests"] });
      toast({ title: "Request denied" });
    },
  });

  const pendingRequests = requests?.filter((r: any) => r.status === "pending") || [];
  const reviewedRequests = requests?.filter((r: any) => r.status !== "pending") || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-affiliate-requests-title">Affiliate Applications</CardTitle>
        <CardDescription>
          {pendingRequests.length} pending {pendingRequests.length === 1 ? "application" : "applications"}
          {reviewedRequests.length > 0 && ` · ${reviewedRequests.length} reviewed`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !requests?.length ? (
          <p className="text-muted-foreground text-center py-8">
            No affiliate applications yet. Share your <span className="font-medium">/partners</span> page to receive applications.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Social Media</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Niche</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r: any) => (
                <TableRow key={r.id} data-testid={`row-affiliate-request-${r.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={r.socialMedia.startsWith("http") ? r.socialMedia : `https://${r.socialMedia}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                      data-testid={`link-social-${r.id}`}
                    >
                      {r.socialMedia.replace(/^https?:\/\//, "").slice(0, 30)}
                    </a>
                  </TableCell>
                  <TableCell className="text-sm">{r.followers || "—"}</TableCell>
                  <TableCell className="text-sm">{r.niche || "—"}</TableCell>
                  <TableCell>
                    <p className="text-sm max-w-[200px] truncate" title={r.message || ""}>
                      {r.message || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.createdAt ? format(new Date(r.createdAt), "MMM d, yyyy") : ""}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={r.status === "approved" ? "default" : r.status === "denied" ? "destructive" : "secondary"}
                      data-testid={`badge-request-status-${r.id}`}
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.status === "pending" ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(r.id)}
                          disabled={approveMutation.isPending}
                          data-testid={`button-approve-request-${r.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => denyMutation.mutate(r.id)}
                          disabled={denyMutation.isPending}
                          data-testid={`button-deny-request-${r.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Deny
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {r.reviewedAt ? format(new Date(r.reviewedAt), "MMM d") : ""}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBaker, setSelectedBaker] = useState<Baker | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [resendEmailDialogOpen, setResendEmailDialogOpen] = useState(false);
  const [selectedEmailDay, setSelectedEmailDay] = useState<number>(0);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithBaker | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "in_progress" | "resolved">("open");

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AdminAnalytics>({
    queryKey: ["/api/admin/analytics"],
  });

  const { data: bakers, isLoading: bakersLoading } = useQuery<Baker[]>({
    queryKey: ["/api/admin/bakers"],
  });

  const { data: supportTickets, isLoading: ticketsLoading } = useQuery<SupportTicketWithBaker[]>({
    queryKey: ["/api/admin/support-tickets"],
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  const { data: emailLogs, isLoading: emailLogsLoading } = useQuery<EmailLogWithBaker[]>({
    queryKey: ["/api/admin/email-logs"],
  });

  const { data: onboardingStats } = useQuery<{
    totalBakers: number;
    stripeConnectedWithin7Days: number;
    stripeAdoptionRate: string;
    emailsSentByKey: Record<string, number>;
    activationMilestones: {
      stripeConnected: number;
      firstProductCreated: number;
      firstQuoteSent: number;
      firstInvoiceCreated: number;
      firstPaymentProcessed: number;
    };
    conversionWindows: {
      stripeConnected24h: number;
      stripeConnected72h: number;
      stripeConnected7d: number;
      firstQuoteSent7d: number;
      firstPayment14d: number;
    };
    featureFlagEnabled: boolean;
  }>({
    queryKey: ["/api/admin/onboarding-stats"],
  });

  const { data: bakerActivity, isLoading: activityLoading } = useQuery<BakerActivity>({
    queryKey: ["/api/admin/bakers", selectedBaker?.id, "activity"],
    enabled: !!selectedBaker && activityDialogOpen,
  });

  const { data: adminPayments, isLoading: paymentsLoading } = useQuery<{
    payments: Array<{
      id: string;
      quoteId: string;
      amount: string;
      platformFee: string;
      status: string;
      paymentType: string;
      createdAt: string;
      quoteTitle: string;
      quoteNumber: string;
      bakerName: string;
      customerName: string;
    }>;
    stats: {
      totalVolume: number;
      totalPlatformFees: number;
      totalTransactions: number;
      monthlyVolume: number;
      monthlyFees: number;
      monthlyTransactions: number;
      connectAccountsTotal: number;
      connectAccountsOnboarded: number;
      connectAccountsActive: number;
    };
    connectHealth: Array<{
      businessName: string;
      email: string;
      plan: string;
      hasConnectAccount: boolean;
      onboarded: boolean;
      payoutsEnabled: boolean;
    }>;
    revenueByPlan: Record<string, {
      volume: number;
      fees: number;
      transactions: number;
      feePercent: number;
    }>;
  }>({
    queryKey: ["/api/admin/payments"],
  });

  const filteredBakers = bakers?.filter((baker) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      baker.businessName.toLowerCase().includes(query) ||
      baker.email.toLowerCase().includes(query) ||
      baker.slug.toLowerCase().includes(query)
    );
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return apiRequest("PATCH", `/api/admin/bakers/${id}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      toast({ title: "Role updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, plan }: { id: string; plan: string }) => {
      return apiRequest("PATCH", `/api/admin/bakers/${id}`, { plan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Plan updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update plan", variant: "destructive" });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiRequest("POST", `/api/admin/bakers/${id}/suspend`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      setSuspendDialogOpen(false);
      setSuspendReason("");
      setSelectedBaker(null);
      toast({ title: "Baker account suspended" });
    },
    onError: () => {
      toast({ title: "Failed to suspend account", variant: "destructive" });
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/bakers/${id}/unsuspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      toast({ title: "Baker account reactivated" });
    },
    onError: () => {
      toast({ title: "Failed to reactivate account", variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/bakers/${id}/reset-password`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bakers"] });
      toast({ title: data.message || "Password reset successfully" });
      setResetPasswordDialogOpen(false);
      setSelectedBaker(null);
    },
    onError: () => {
      toast({ title: "Failed to reset password", variant: "destructive" });
    },
  });

  const resetQuoteLimitMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/bakers/${id}/reset-quote-limit`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bakers"] });
      toast({ title: "Quote limit reset successfully" });
    },
    onError: () => {
      toast({ title: "Failed to reset quote limit", variant: "destructive" });
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/bakers/${id}/impersonate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Now viewing as this baker. Go to dashboard to see their view." });
    },
    onError: () => {
      toast({ title: "Failed to impersonate baker", variant: "destructive" });
    },
  });

  const resendEmailMutation = useMutation({
    mutationFn: async ({ id, emailDay }: { id: string; emailDay: number }) => {
      return apiRequest("POST", `/api/admin/bakers/${id}/resend-email`, { emailDay });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-logs"] });
      setResendEmailDialogOpen(false);
      setSelectedBaker(null);
      toast({ title: "Email sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send email", variant: "destructive" });
    },
  });

  const replyToTicketMutation = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      return apiRequest("POST", `/api/admin/support-tickets/${ticketId}/reply`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      setTicketReply("");
      toast({ title: "Reply sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send reply", variant: "destructive" });
    },
  });

  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/support-tickets/${ticketId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      toast({ title: "Ticket status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update ticket", variant: "destructive" });
    },
  });

  const archiveTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return apiRequest("PATCH", `/api/admin/support-tickets/${ticketId}`, { status: "archived" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      setSelectedTicket(null);
      toast({ title: "Ticket archived" });
    },
    onError: () => {
      toast({ title: "Failed to archive ticket", variant: "destructive" });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-admin-title">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform management and oversight</p>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:inline-flex">
          <TabsTrigger value="accounts" className="gap-2" data-testid="tab-accounts">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="email-blast" className="gap-2" data-testid="tab-email-blast">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2" data-testid="tab-payments">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-2" data-testid="tab-support">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Support</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2" data-testid="tab-system">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="gap-2" data-testid="tab-affiliates">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Affiliates</span>
          </TabsTrigger>
          <TabsTrigger value="financials" className="gap-2" data-testid="tab-financials">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Financials</span>
          </TabsTrigger>
        </TabsList>

        {/* ACCOUNTS TAB */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-bakers"
              />
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{bakers?.length || 0} total</Badge>
              <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                {bakers?.filter(b => !b.suspended).length || 0} active
              </Badge>
              <Badge variant="outline" className="bg-red-50 dark:bg-red-950">
                {bakers?.filter(b => b.suspended).length || 0} suspended
              </Badge>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {bakersLoading ? (
                <div className="p-8 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !filteredBakers?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No bakers match your search" : "No bakers found"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBakers.map((baker) => (
                        <TableRow key={baker.id} data-testid={`row-baker-${baker.id}`} className={baker.suspended ? "opacity-60" : ""}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{baker.businessName}</div>
                              <code className="text-xs text-muted-foreground">{baker.slug}</code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {baker.email}
                              {baker.emailVerified ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <XCircle className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {baker.suspended ? (
                              <Badge variant="destructive" className="gap-1">
                                <Ban className="h-3 w-3" />
                                Suspended
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={baker.plan || "free"}
                              onValueChange={(value) => updatePlanMutation.mutate({ id: baker.id, plan: value })}
                              disabled={updatePlanMutation.isPending}
                            >
                              <SelectTrigger className="w-24" data-testid={`select-plan-${baker.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="pro">
                                  <span className="flex items-center gap-1">
                                    <Crown className="h-3 w-3 text-primary" />
                                    Pro
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={baker.role || "baker"}
                              onValueChange={(value) => updateRoleMutation.mutate({ id: baker.id, role: value })}
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-28" data-testid={`select-role-${baker.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="baker">Baker</SelectItem>
                                <SelectItem value="super_admin">
                                  <span className="flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    Admin
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {baker.createdAt ? format(new Date(baker.createdAt), "MMM d, yyyy") : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedBaker(baker);
                                  setActivityDialogOpen(true);
                                }}
                                title="View Activity"
                                data-testid={`button-activity-${baker.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => window.open(`/c/${baker.slug}`, "_blank")}
                                title="View Calculator"
                                data-testid={`button-calculator-${baker.id}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => impersonateMutation.mutate(baker.id)}
                                title="Impersonate"
                                disabled={impersonateMutation.isPending}
                                data-testid={`button-impersonate-${baker.id}`}
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedBaker(baker);
                                  setResetPasswordDialogOpen(true);
                                }}
                                title="Reset Password"
                                data-testid={`button-reset-password-${baker.id}`}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => resetQuoteLimitMutation.mutate(baker.id)}
                                title="Reset Quote Limit"
                                disabled={resetQuoteLimitMutation.isPending}
                                data-testid={`button-reset-quota-${baker.id}`}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              {baker.suspended ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => unsuspendMutation.mutate(baker.id)}
                                  title="Reactivate"
                                  disabled={unsuspendMutation.isPending}
                                  className="text-green-600 hover:text-green-700"
                                  data-testid={`button-unsuspend-${baker.id}`}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedBaker(baker);
                                    setSuspendDialogOpen(true);
                                  }}
                                  title="Suspend"
                                  className="text-red-600 hover:text-red-700"
                                  data-testid={`button-suspend-${baker.id}`}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-4">
          {analyticsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bakers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalBakers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{analytics?.weeklySignups || 0} this week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analytics?.platformRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground">
                      From {analytics?.totalOrders || 0} orders
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalLeads || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{analytics?.leadsThisMonth || 0} this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalQuotes || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{analytics?.quotesThisMonth || 0} this month
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bakers by Plan</CardTitle>
                    <CardDescription>Distribution across subscription tiers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Free</span>
                        <span className="font-medium">{analytics?.bakersByPlan?.free || 0}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-muted-foreground/40 rounded-full" 
                          style={{ width: `${((analytics?.bakersByPlan?.free || 0) / (analytics?.totalBakers || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Basic ($4.99/mo)</span>
                        <span className="font-medium">{analytics?.bakersByPlan?.basic || 0}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${((analytics?.bakersByPlan?.basic || 0) / (analytics?.totalBakers || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-1">
                          <Crown className="h-3 w-3 text-primary" />
                          Pro ($9.99/mo)
                        </span>
                        <span className="font-medium">{analytics?.bakersByPlan?.pro || 0}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${((analytics?.bakersByPlan?.pro || 0) / (analytics?.totalBakers || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Health</CardTitle>
                    <CardDescription>Email verification and account status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Verified Emails</span>
                      </div>
                      <span className="font-medium">{analytics?.verifiedBakers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Unverified Emails</span>
                      </div>
                      <span className="font-medium">{(analytics?.totalBakers || 0) - (analytics?.verifiedBakers || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Ban className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Suspended</span>
                      </div>
                      <span className="font-medium">{analytics?.suspendedBakers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Admins</span>
                      </div>
                      <span className="font-medium">{analytics?.admins || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Signups (30 days)</CardTitle>
                  <CardDescription>New bakers who joined in the last month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-3xl font-bold">{analytics?.recentSignups || 0}</div>
                      <p className="text-sm text-muted-foreground">new bakers in the last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* EMAIL BLAST TAB */}
        <TabsContent value="email-blast" className="space-y-4">
          <AnnouncementEmailTab />
        </TabsContent>

        {/* SUPPORT TAB */}
        <TabsContent value="support" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Support Tickets */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ticket className="h-5 w-5" />
                      Support Tickets
                    </CardTitle>
                    <CardDescription>Manage escalated support requests from bakers</CardDescription>
                  </div>
                  <Select
                    value={ticketFilter}
                    onValueChange={(v) => setTicketFilter(v as typeof ticketFilter)}
                  >
                    <SelectTrigger className="w-[150px]" data-testid="select-ticket-filter">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tickets</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : !supportTickets?.length ? (
                  <p className="text-center py-8 text-muted-foreground">No support tickets yet</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Ticket List */}
                    <div className="space-y-2">
                      {supportTickets
                        .filter(t => ticketFilter === "all" || t.status === ticketFilter)
                        .map((ticket) => (
                          <div
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-3 border rounded-lg cursor-pointer hover-elevate ${
                              selectedTicket?.id === ticket.id ? "border-primary bg-muted" : ""
                            }`}
                            data-testid={`ticket-item-${ticket.id}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{ticket.subject}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {ticket.baker?.businessName || "Unknown Baker"}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge
                                  variant={
                                    ticket.status === "open"
                                      ? "destructive"
                                      : ticket.status === "in_progress"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {ticket.status.replace("_", " ")}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {ticket.priority}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        ))}
                      {supportTickets.filter(t => ticketFilter === "all" || t.status === ticketFilter).length === 0 && (
                        <p className="text-center py-4 text-muted-foreground text-sm">
                          No tickets match the filter
                        </p>
                      )}
                    </div>

                    {/* Ticket Detail */}
                    <div className="border rounded-lg p-4">
                      {selectedTicket ? (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold">{selectedTicket.subject}</h3>
                              <p className="text-sm text-muted-foreground">
                                {selectedTicket.baker?.businessName} ({selectedTicket.baker?.email})
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Select
                                value={selectedTicket.status}
                                onValueChange={(status) => {
                                  updateTicketStatusMutation.mutate({
                                    ticketId: selectedTicket.id,
                                    status,
                                  });
                                }}
                              >
                                <SelectTrigger className="w-[120px]" data-testid="select-ticket-status">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => archiveTicketMutation.mutate(selectedTicket.id)}
                                data-testid="button-archive-ticket"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Messages */}
                          <ScrollArea className="h-[300px] border rounded-md p-3">
                            {selectedTicket.messages?.length ? (
                              <div className="space-y-3">
                                {selectedTicket.messages.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`p-3 rounded-lg ${
                                      msg.senderType === "admin"
                                        ? "bg-primary/10 ml-4"
                                        : msg.senderType === "ai"
                                        ? "bg-muted mr-4 border-l-2 border-blue-500"
                                        : "bg-muted mr-4"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {msg.senderType === "admin"
                                          ? "Admin"
                                          : msg.senderType === "ai"
                                          ? "AI Assistant"
                                          : "Baker"}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                                      </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-center text-muted-foreground py-8">No messages yet</p>
                            )}
                          </ScrollArea>

                          {/* Reply Form */}
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Type your reply..."
                              value={ticketReply}
                              onChange={(e) => setTicketReply(e.target.value)}
                              className="flex-1"
                              data-testid="textarea-ticket-reply"
                            />
                            <Button
                              onClick={() => {
                                if (ticketReply.trim()) {
                                  replyToTicketMutation.mutate({
                                    ticketId: selectedTicket.id,
                                    content: ticketReply,
                                  });
                                }
                              }}
                              disabled={!ticketReply.trim() || replyToTicketMutation.isPending}
                              data-testid="button-send-ticket-reply"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                          <p>Select a ticket to view details</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activation & Onboarding Stats */}
            {onboardingStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activation Funnel</CardTitle>
                  <CardDescription>
                    User activation milestones
                    {onboardingStats.featureFlagEnabled ? (
                      <Badge variant="outline" className="ml-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400">Conditional emails ON</Badge>
                    ) : (
                      <Badge variant="outline" className="ml-2">Conditional emails OFF</Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Revenue Pipeline (time-windowed conversion)</p>
                    <div className="space-y-2">
                      {[
                        { label: "Stripe Connected within 24h", count: onboardingStats.conversionWindows.stripeConnected24h },
                        { label: "Stripe Connected within 72h", count: onboardingStats.conversionWindows.stripeConnected72h },
                        { label: "Stripe Connected within 7d", count: onboardingStats.conversionWindows.stripeConnected7d },
                        { label: "First Quote Sent within 7d", count: onboardingStats.conversionWindows.firstQuoteSent7d },
                        { label: "First Payment within 14d", count: onboardingStats.conversionWindows.firstPayment14d },
                      ].map(({ label, count }) => {
                        const rate = onboardingStats.totalBakers > 0 ? ((count / onboardingStats.totalBakers) * 100).toFixed(1) : "0";
                        return (
                          <div key={label} className="flex items-center justify-between gap-2 p-3 bg-muted rounded-lg">
                            <span className="text-sm">{label}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" data-testid={`badge-${label.replace(/\s+/g, "-").toLowerCase()}`}>{count} / {onboardingStats.totalBakers}</Badge>
                              <span className="text-sm font-medium w-14 text-right">{rate}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">All-time Milestones</p>
                    <div className="space-y-2">
                      {[
                        { label: "Stripe Connected", count: onboardingStats.activationMilestones.stripeConnected },
                        { label: "First Product Created", count: onboardingStats.activationMilestones.firstProductCreated },
                        { label: "First Quote Sent", count: onboardingStats.activationMilestones.firstQuoteSent },
                        { label: "First Invoice Created", count: onboardingStats.activationMilestones.firstInvoiceCreated },
                        { label: "First Payment Processed", count: onboardingStats.activationMilestones.firstPaymentProcessed },
                      ].map(({ label, count }) => (
                        <div key={label} className="flex items-center justify-between gap-2 p-3 bg-muted rounded-lg">
                          <span className="text-sm">{label}</span>
                          <Badge data-testid={`badge-milestone-${label.replace(/\s+/g, "-").toLowerCase()}`}>{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  {Object.keys(onboardingStats.emailsSentByKey).length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Emails Sent by Template</p>
                      <div className="grid gap-1">
                        {Object.entries(onboardingStats.emailsSentByKey).sort().map(([key, count]) => (
                          <div key={key} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded text-sm">
                            <span className="text-muted-foreground">{key}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Manual Email Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manual Email Tools</CardTitle>
                <CardDescription>Resend onboarding emails to bakers</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a baker from the Accounts tab and click the activity icon to view their details and resend emails.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Onboarding Email Schedule:</p>
                  <div className="grid gap-2">
                    {Object.entries(EMAIL_DAY_LABELS).map(([day, label]) => (
                      <div key={day} className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
                        <Badge variant="outline">{day}</Badge>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Stats</CardTitle>
                <CardDescription>Support ticket overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Open Tickets</span>
                  <Badge variant="destructive">
                    {supportTickets?.filter(t => t.status === "open").length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">In Progress</span>
                  <Badge>
                    {supportTickets?.filter(t => t.status === "in_progress").length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Resolved</span>
                  <Badge variant="secondary">
                    {supportTickets?.filter(t => t.status === "resolved").length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">High Priority</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    {supportTickets?.filter(t => t.priority === "high" && t.status !== "resolved" && t.status !== "archived").length || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SYSTEM TAB */}
        <TabsContent value="system" className="space-y-4">
          {/* Stats and Status - moved above log for visibility */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Total Emails Sent</span>
                  <span className="font-medium">{emailLogs?.filter(l => l.status === "sent").length || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Failed Emails</span>
                  <span className="font-medium text-red-600">{emailLogs?.filter(l => l.status === "failed").length || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm">API Server</span>
                  </div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Operational</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm">Database</span>
                  </div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Connected</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm">Email Service (AWS SES)</span>
                  </div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Active</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <RetentionEmailAdmin />

          {/* Email Log - Limited to 10 entries */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Email Delivery Log</CardTitle>
                  <CardDescription>Recent onboarding email activity (last 10)</CardDescription>
                </div>
                {emailLogs && emailLogs.length > 10 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-view-all-logs">
                        View All ({emailLogs.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle>All Email Delivery Logs</DialogTitle>
                        <DialogDescription>Complete onboarding email history</DialogDescription>
                      </DialogHeader>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Baker ID</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Sent At</TableHead>
                              <TableHead>Error</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {emailLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="font-mono text-xs">{log.bakerId.slice(0, 8)}...</TableCell>
                                <TableCell>{EMAIL_DAY_LABELS[log.emailDay] || `Day ${log.emailDay}`}</TableCell>
                                <TableCell>
                                  {log.status === "sent" ? (
                                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Sent
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Failed
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {log.sentAt ? format(new Date(log.sentAt), "MMM d, yyyy h:mm a") : "—"}
                                </TableCell>
                                <TableCell className="text-sm text-red-600 max-w-[200px] truncate">
                                  {log.error || "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {emailLogsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !emailLogs?.length ? (
                <p className="text-center py-8 text-muted-foreground">No email logs yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Baker ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailLogs.slice(0, 10).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">{log.bakerId.slice(0, 8)}...</TableCell>
                          <TableCell>{EMAIL_DAY_LABELS[log.emailDay] || `Day ${log.emailDay}`}</TableCell>
                          <TableCell>
                            {log.status === "sent" ? (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Sent
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.sentAt ? format(new Date(log.sentAt), "MMM d, yyyy h:mm a") : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-red-600 max-w-[200px] truncate">
                            {log.error || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {paymentsLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold" data-testid="text-admin-total-volume">
                    ${(adminPayments?.stats.totalVolume || 0).toFixed(2)}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {paymentsLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-admin-platform-fees">
                    ${(adminPayments?.stats.totalPlatformFees || 0).toFixed(2)}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {paymentsLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-admin-monthly-volume">
                      ${(adminPayments?.stats.monthlyVolume || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {adminPayments?.stats.monthlyTransactions || 0} transactions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connect Accounts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {paymentsLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-admin-connect-accounts">
                      {adminPayments?.stats.connectAccountsActive || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {adminPayments?.stats.connectAccountsOnboarded || 0} onboarded / {adminPayments?.stats.connectAccountsTotal || 0} total
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["free", "basic", "pro"] as const).map((plan) => {
              const data = adminPayments?.revenueByPlan?.[plan];
              const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
              return (
                <Card key={plan} data-testid={`card-revenue-${plan}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{planLabel} Plan</CardTitle>
                    <CardDescription>{data?.feePercent ?? 0}% platform fee</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {paymentsLoading ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold" data-testid={`text-revenue-volume-${plan}`}>
                          ${(data?.volume ?? 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium" data-testid={`text-revenue-fees-${plan}`}>
                          ${(data?.fees ?? 0).toFixed(2)} earned
                        </div>
                        <div className="text-xs text-muted-foreground" data-testid={`text-revenue-txns-${plan}`}>
                          {data?.transactions ?? 0} transactions
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>All customer payments across the platform</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !adminPayments?.payments?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No payments recorded yet</p>
                  <p className="text-sm">Payments will appear here when customers pay through quotes</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Baker</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Quote</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Fee</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminPayments.payments.map((payment) => (
                        <TableRow key={payment.id} data-testid={`admin-payment-row-${payment.id}`}>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(payment.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-medium text-sm">{payment.bakerName}</TableCell>
                          <TableCell className="text-sm">{payment.customerName}</TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">#{payment.quoteNumber}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {payment.paymentType === "deposit" ? "Deposit" : payment.paymentType === "full" ? "Full" : payment.paymentType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">${parseFloat(payment.amount).toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">${parseFloat(payment.platformFee).toFixed(2)}</TableCell>
                          <TableCell>
                            {payment.status === "succeeded" ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle className="h-3 w-3 mr-1" /> Paid
                              </Badge>
                            ) : (
                              <Badge variant="secondary">{payment.status}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-connect-health">
            <CardHeader>
              <CardTitle>Stripe Connect Health</CardTitle>
              <CardDescription>Connect account status for all bakers</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !adminPayments?.connectHealth?.length ? (
                <div className="text-center py-8 text-muted-foreground">No bakers found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Baker Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Connect Account</TableHead>
                        <TableHead>Onboarded</TableHead>
                        <TableHead>Payouts Enabled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminPayments.connectHealth.map((baker, index) => (
                        <TableRow key={index} data-testid={`row-connect-health-${index}`}>
                          <TableCell className="font-medium">{baker.businessName}</TableCell>
                          <TableCell className="text-sm">{baker.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs capitalize" data-testid={`badge-plan-${index}`}>
                              {baker.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {baker.hasConnectAccount ? (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 gap-1" data-testid={`badge-connect-${index}`}>
                                <CheckCircle className="h-3 w-3" /> Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground gap-1" data-testid={`badge-connect-${index}`}>
                                <XCircle className="h-3 w-3" /> No
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {baker.onboarded ? (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 gap-1" data-testid={`badge-onboarded-${index}`}>
                                <CheckCircle className="h-3 w-3" /> Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground gap-1" data-testid={`badge-onboarded-${index}`}>
                                <XCircle className="h-3 w-3" /> No
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {baker.payoutsEnabled ? (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 gap-1" data-testid={`badge-payouts-${index}`}>
                                <CheckCircle className="h-3 w-3" /> Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground gap-1" data-testid={`badge-payouts-${index}`}>
                                <XCircle className="h-3 w-3" /> No
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AFFILIATES TAB */}
        <TabsContent value="affiliates" className="space-y-4">
          <AffiliatesTab />
        </TabsContent>

        {/* FINANCIALS TAB */}
        <TabsContent value="financials" className="space-y-4">
          <FinancialsTab />
        </TabsContent>

      </Tabs>

      {/* SUSPEND DIALOG */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Account</DialogTitle>
            <DialogDescription>
              Suspending {selectedBaker?.businessName} will prevent them from accessing their dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedBaker && suspendMutation.mutate({ id: selectedBaker.id, reason: suspendReason })}
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending ? "Suspending..." : "Suspend Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESET PASSWORD DIALOG */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedBaker?.businessName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Password will be emailed</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    A temporary password will be generated and emailed directly to {selectedBaker?.email}. The baker should change it after logging in.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedBaker && resetPasswordMutation.mutate(selectedBaker.id)}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Sending..." : "Reset & Email Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ACTIVITY DIALOG */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Baker Activity: {selectedBaker?.businessName}</DialogTitle>
            <DialogDescription>
              {selectedBaker?.email} • Joined {selectedBaker?.createdAt ? format(new Date(selectedBaker.createdAt), "MMM d, yyyy") : "—"}
            </DialogDescription>
          </DialogHeader>
          {activityLoading ? (
            <div className="space-y-4 py-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : bakerActivity ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{bakerActivity.stats.totalLeads}</div>
                  <div className="text-xs text-muted-foreground">Leads</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{bakerActivity.stats.totalQuotes}</div>
                  <div className="text-xs text-muted-foreground">Quotes</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{bakerActivity.stats.totalOrders}</div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{formatCurrency(bakerActivity.stats.totalRevenue)}</div>
                  <div className="text-xs text-muted-foreground">Revenue</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResendEmailDialogOpen(true);
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/c/${selectedBaker?.slug}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Calculator
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No activity data available</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESEND EMAIL DIALOG */}
      <Dialog open={resendEmailDialogOpen} onOpenChange={setResendEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Onboarding Email</DialogTitle>
            <DialogDescription>
              Select which email to resend to {selectedBaker?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={String(selectedEmailDay)} onValueChange={(v) => setSelectedEmailDay(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select email" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EMAIL_DAY_LABELS).map(([day, label]) => (
                  <SelectItem key={day} value={day}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResendEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedBaker && resendEmailMutation.mutate({ id: selectedBaker.id, emailDay: selectedEmailDay })}
              disabled={resendEmailMutation.isPending}
            >
              {resendEmailMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
