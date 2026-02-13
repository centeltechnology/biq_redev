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
  0: "Welcome Email",
  1: "Day 1: Set Up Pricing",
  2: "Day 2: First Quote",
  3: "Day 3: Lead Management",
  4: "Day 4: Calendar",
  5: "Day 5: Treats Menu",
  6: "Day 6: Plans & Upgrade",
  7: "Day 7: Success Tips",
};

const SEGMENT_LABELS: Record<string, { label: string; description: string }> = {
  new_but_inactive: { label: "New but Inactive", description: "Signed up >7 days ago, no key actions" },
  configured_not_shared: { label: "Configured not Shared", description: "Calculator configured but link not shared" },
  leads_no_quotes: { label: "Leads no Quotes", description: "Has leads but no quotes created" },
  quotes_no_orders: { label: "Quotes no Orders", description: "Quotes sent but no orders" },
  active_power_user: { label: "Active Power User", description: "Consistent weekly actions" },
  at_risk: { label: "At Risk", description: "Previously active, no activity in 14 days" },
};

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
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="accounts" className="gap-2" data-testid="tab-accounts">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
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
                        <span className="text-sm">Basic ($9.97/mo)</span>
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
                          Pro ($29.97/mo)
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
