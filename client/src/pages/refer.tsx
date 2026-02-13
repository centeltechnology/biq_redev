import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Users, Clock } from "lucide-react";
import { format } from "date-fns";

interface BakerReferralData {
  referralCode: string | null;
  referralCredits: number;
  quickQuoteCredits: number;
  totalCreditsEarned: number;
  plan: string;
  referrals: Array<{
    id: string;
    businessName: string;
    plan: string;
    creditAwarded: boolean;
    creditType: string | null;
    createdAt: string;
  }>;
}

export default function ReferPage() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<BakerReferralData>({
    queryKey: ["/api/referral/stats"],
  });

  const handleCopyLink = async () => {
    if (!data?.referralCode) return;
    const refLink = `${window.location.origin}/join/r/${data.referralCode}`;
    try {
      await navigator.clipboard.writeText(refLink);
      toast({ title: "Referral link copied!" });
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Refer a Friend">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="Refer a Friend">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Gift className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2" data-testid="text-loading-error">Loading referral data</h2>
            <p className="text-muted-foreground max-w-md">
              Please try again in a moment.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const isPaidPlan = data.plan !== "free";
  const referralLink = data.referralCode 
    ? `${window.location.origin}/join/r/${data.referralCode}` 
    : null;
  const creditsRemaining = data.referralCredits + data.quickQuoteCredits;

  return (
    <DashboardLayout title="Refer a Friend">
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-background to-muted border">
          <CardHeader>
            <CardTitle data-testid="text-hero-title">Refer a Friend, Earn Rewards</CardTitle>
            <CardDescription className="mt-2">
              {isPaidPlan
                ? "Invite fellow bakers to join BakerIQ. For every friend who signs up and subscribes, you earn a free month on your current plan. Stack up to 12 free months!"
                : "Invite fellow bakers to join BakerIQ. For every friend who signs up and subscribes, you earn a month of Quick Quote access. Stack up to 12 months!"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referralLink ? (
              <div className="flex gap-2 items-center">
                <code 
                  className="flex-1 bg-muted px-3 py-2 rounded-md text-sm truncate" 
                  data-testid="text-referral-link"
                >
                  {referralLink}
                </code>
                <Button 
                  onClick={handleCopyLink} 
                  data-testid="button-copy-referral-link"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            ) : (
              <div className="bg-muted px-3 py-2 rounded-md text-sm text-muted-foreground">
                Your referral code is being generated. Please refresh the page in a moment.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Friends Invited</p>
                  <p className="text-2xl font-semibold" data-testid="text-friends-count">
                    {data.referrals.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950">
                  <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits Earned</p>
                  <p className="text-2xl font-semibold" data-testid="text-credits-earned">
                    {data.totalCreditsEarned}
                  </p>
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
                  <p className="text-sm text-muted-foreground">Credits Remaining</p>
                  <p className="text-2xl font-semibold" data-testid="text-credits-remaining">
                    {creditsRemaining}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {data.referrals && data.referrals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-referred-friends-title">Referred Friends</CardTitle>
              <CardDescription>
                {data.referrals.length} baker{data.referrals.length !== 1 ? "s" : ""} referred through your link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.referrals.map((r) => (
                    <TableRow key={r.id} data-testid={`row-referral-${r.id}`}>
                      <TableCell className="font-medium" data-testid={`text-referral-name-${r.id}`}>
                        {r.businessName}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            r.plan === "pro" 
                              ? "default" 
                              : r.plan === "basic" 
                              ? "secondary" 
                              : "outline"
                          }
                          data-testid={`badge-plan-${r.id}`}
                        >
                          {r.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={r.creditAwarded ? "default" : "outline"}
                          data-testid={`badge-status-${r.id}`}
                        >
                          {r.creditAwarded ? "Credited" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-date-${r.id}`}>
                        {format(new Date(r.createdAt), "MMM d, yyyy")}
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
