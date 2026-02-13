import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { Copy, MousePointerClick, UserPlus, DollarSign, Clock, Link2, Pencil, Check, X } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
}

interface Referral {
  id: string;
  businessName: string;
  plan: string;
  createdAt: string;
}

interface Commission {
  id: string;
  subscriptionAmount: string;
  commissionRate: string;
  commissionAmount: string;
  monthNumber: number;
  status: string;
  createdAt: string;
}

interface AffiliateData {
  isAffiliate: boolean;
  affiliateCode?: string;
  affiliateSlug?: string;
  commissionRate?: string;
  commissionMonths?: number;
  stats?: AffiliateStats;
  referrals?: Referral[];
  commissions?: Commission[];
}

export default function ReferralsPage() {
  const { toast } = useToast();
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugValue, setSlugValue] = useState("");

  const { data, isLoading } = useQuery<AffiliateData>({
    queryKey: ["/api/affiliate/stats"],
  });

  const slugMutation = useMutation({
    mutationFn: async (newSlug: string) => {
      const res = await apiRequest("PATCH", "/api/affiliate/slug", { slug: newSlug });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/stats"] });
      setEditingSlug(false);
      toast({ title: "Referral link updated!" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Failed to update link", variant: "destructive" });
    },
  });

  const handleCopyLink = async () => {
    const slug = data?.affiliateSlug || data?.affiliateCode;
    if (!slug) return;
    const refLink = `${window.location.origin}/join/${slug}`;
    try {
      await navigator.clipboard.writeText(refLink);
      toast({ title: "Referral link copied!" });
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleEditSlug = () => {
    setSlugValue(data?.affiliateSlug || data?.affiliateCode || "");
    setEditingSlug(true);
  };

  const handleSaveSlug = () => {
    const cleaned = slugValue.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
    if (cleaned.length < 3 || cleaned.length > 30) {
      toast({ title: "Link must be 3-30 characters", variant: "destructive" });
      return;
    }
    slugMutation.mutate(cleaned);
  };

  const formatUSD = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Affiliate Program">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data?.isAffiliate) {
    return (
      <DashboardLayout title="Affiliate Program">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2" data-testid="text-not-affiliate">Affiliate Program</h2>
            <p className="text-muted-foreground max-w-md">
              The affiliate program is invite-only. Contact the BakerIQ team if you're interested in becoming an affiliate partner and earning commission on referred subscriptions.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const stats = data.stats || { totalClicks: 0, totalConversions: 0, totalEarnings: 0, pendingEarnings: 0 };
  const displaySlug = data.affiliateSlug || data.affiliateCode;
  const refLink = `${window.location.origin}/join/${displaySlug}`;

  return (
    <DashboardLayout title="Affiliate Program">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-referral-link-title">Your Affiliate Link</CardTitle>
            <CardDescription>
              Share this link with other bakers. You earn {data.commissionRate}% of their subscription for the first {data.commissionMonths} months.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {editingSlug ? (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{window.location.origin}/join/</span>
                <Input
                  value={slugValue}
                  onChange={(e) => setSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="max-w-[200px]"
                  data-testid="input-affiliate-slug"
                  maxLength={30}
                />
                <Button size="icon" onClick={handleSaveSlug} disabled={slugMutation.isPending} data-testid="button-save-slug">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingSlug(false)} data-testid="button-cancel-slug">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm truncate" data-testid="text-referral-link">
                  {refLink}
                </code>
                <Button size="icon" variant="ghost" onClick={handleEditSlug} data-testid="button-edit-slug">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button onClick={handleCopyLink} data-testid="button-copy-referral-link">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950">
                  <MousePointerClick className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Link Clicks</p>
                  <p className="text-2xl font-semibold" data-testid="text-total-clicks">{stats.totalClicks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-50 dark:bg-green-950">
                  <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Signups</p>
                  <p className="text-2xl font-semibold" data-testid="text-total-conversions">{stats.totalConversions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-semibold" data-testid="text-total-earnings">{formatUSD(stats.totalEarnings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-semibold" data-testid="text-pending-earnings">{formatUSD(stats.pendingEarnings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {data.referrals && data.referrals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-referred-bakers-title">Referred Bakers</CardTitle>
              <CardDescription>{data.referrals.length} baker{data.referrals.length !== 1 ? "s" : ""} signed up through your link</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.referrals.map((r) => (
                    <TableRow key={r.id} data-testid={`row-referral-${r.id}`}>
                      <TableCell className="font-medium">{r.businessName}</TableCell>
                      <TableCell>
                        <Badge variant={r.plan === "pro" ? "default" : r.plan === "basic" ? "secondary" : "outline"}>
                          {r.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(r.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {data.commissions && data.commissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-commissions-title">Commission History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.commissions.map((c) => (
                    <TableRow key={c.id} data-testid={`row-commission-${c.id}`}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(c.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{formatUSD(c.subscriptionAmount)}</TableCell>
                      <TableCell>{c.commissionRate}%</TableCell>
                      <TableCell className="font-medium">{formatUSD(c.commissionAmount)}</TableCell>
                      <TableCell>{c.monthNumber}/{data.commissionMonths || 3}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "paid" ? "default" : c.status === "approved" ? "secondary" : "outline"}>
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
