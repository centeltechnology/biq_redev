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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Baker, BakerOnboardingEmail } from "@shared/schema";

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

export default function AdminDashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBaker, setSelectedBaker] = useState<Baker | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [resendEmailDialogOpen, setResendEmailDialogOpen] = useState(false);
  const [selectedEmailDay, setSelectedEmailDay] = useState<number>(0);

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AdminAnalytics>({
    queryKey: ["/api/admin/analytics"],
  });

  const { data: bakers, isLoading: bakersLoading } = useQuery<Baker[]>({
    queryKey: ["/api/admin/bakers"],
  });

  const { data: emailLogs, isLoading: emailLogsLoading } = useQuery<EmailLogWithBaker[]>({
    queryKey: ["/api/admin/email-logs"],
  });

  const { data: bakerActivity, isLoading: activityLoading } = useQuery<BakerActivity>({
    queryKey: ["/api/admin/bakers", selectedBaker?.id, "activity"],
    enabled: !!selectedBaker && activityDialogOpen,
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
      setTempPassword(data.tempPassword);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bakers"] });
      toast({ title: "Password reset successfully" });
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
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="accounts" className="gap-2" data-testid="tab-accounts">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
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
                                  setTempPassword(null);
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
                <div className="grid gap-2 md:grid-cols-2">
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
        </TabsContent>

        {/* SYSTEM TAB */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Delivery Log</CardTitle>
              <CardDescription>Recent onboarding email activity</CardDescription>
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
              )}
            </CardContent>
          </Card>

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
              Generate a temporary password for {selectedBaker?.businessName}.
            </DialogDescription>
          </DialogHeader>
          {tempPassword ? (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Temporary Password</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Share this password securely with the baker. They should change it after logging in.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg font-mono text-center text-lg">
                {tempPassword}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                This password will not be shown again.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click the button below to generate a new temporary password. The baker will need to use this to log in.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              {tempPassword ? "Close" : "Cancel"}
            </Button>
            {!tempPassword && (
              <Button
                onClick={() => selectedBaker && resetPasswordMutation.mutate(selectedBaker.id)}
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Generate Password"}
              </Button>
            )}
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
