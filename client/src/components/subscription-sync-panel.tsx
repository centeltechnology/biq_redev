import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, RefreshCw, ShieldAlert } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscriptionSyncAccounts } from "@/components/subscription-sync-accounts";
import { needsReview, type ReviewFilter, type SubscriptionSyncAccount } from "@/lib/subscription-diagnostics";

interface SubscriptionSyncData {
  enabled: boolean;
  accounts: SubscriptionSyncAccount[];
  paidSubscribers: number;
  basicPaid: number;
  proPaid: number;
  mrr: number;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

export function SubscriptionSyncPanel() {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [viewReset, setViewReset] = useState(0);
  const syncQuery = useQuery<SubscriptionSyncData>({
    queryKey: ["/api/admin/subscription-sync"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/subscription-sync");
      return response.json();
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      if (!syncQuery.data?.enabled || syncQuery.isError) throw new Error("Synchronization is disabled or diagnostics are stale");
      await apiRequest("POST", "/api/admin/subscription-sync/reconcile");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-sync"] });
    },
  });

  const data = syncQuery.data;
  const needsAttention = data?.accounts.filter(needsReview) ?? [];

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg">Subscription sync</CardTitle>
          <CardDescription>
            Read-only billing diagnostics. Reconciliation queues a bounded retry; it does not guarantee a billing fix.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncQuery.refetch()}
            disabled={syncQuery.isFetching}
            data-testid="button-refresh-subscription-sync"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => reconcileMutation.mutate()}
            disabled={!data?.enabled || syncQuery.isError || reconcileMutation.isPending}
            data-testid="button-queue-subscription-reconcile"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${reconcileMutation.isPending ? "animate-spin" : ""}`} />
            {reconcileMutation.isPending ? "Queueing…" : "Queue reconciliation"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {syncQuery.isLoading ? (
          <div className="space-y-3" aria-label="Loading subscription sync diagnostics">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-20" /><Skeleton className="h-20" />
              <Skeleton className="h-20" /><Skeleton className="h-20" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : syncQuery.isError && !data ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4" role="alert">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Diagnostics could not be loaded</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The sync service may be unavailable. No account or billing state has been changed.
                </p>
                <Button className="mt-3" variant="outline" size="sm" onClick={() => syncQuery.refetch()}>
                  Try again
                </Button>
              </div>
            </div>
          </div>
        ) : data ? (
          <>
            {syncQuery.isError && (
              <p role="alert" className="rounded-md border border-destructive/30 p-3 text-sm">
                Refresh failed. Showing the last available diagnostics; filters are preserved and reconciliation is unavailable until refresh succeeds.
              </p>
            )}
            {!data.enabled && (
              <div className="flex items-start gap-3 rounded-md border bg-muted/50 p-3" role="status">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Automatic subscription synchronization is disabled for this deployment</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Controlled by the server setting <code className="break-all">SUBSCRIPTION_SYNC_ENABLED</code>.
                    Opening this page, filtering, and refreshing do not change accounts or enable synchronization.
                  </p>
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer font-medium">What is required before production activation?</summary>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                      <li>Approve provider-signed webhook verification and review billing associations without guessing or rewriting them.</li>
                      <li>Approve reliable scheduling and a monitored first batch. Autoscale can stop the in-process worker when idle.</li>
                      <li>After explicit activation approval, the owner uses Replit: Secrets → Configurations → More → New published app configuration, then republishes. This page cannot change deployment settings.</li>
                    </ol>
                    <p className="mt-2 text-muted-foreground">Pending first-sync flags are expected while disabled; they are not proof of billing errors. Existing entitlements remain unchanged by diagnostics.</p>
                  </details>
                </div>
              </div>
            )}

            {reconcileMutation.isSuccess && (
              <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm" role="status">
                <Check className="h-4 w-4 text-primary" />
                Reconciliation request queued. Refresh later to review updated diagnostics.
              </div>
            )}
            {reconcileMutation.isError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Reconciliation could not be queued. The underlying billing state has not been confirmed as fixed.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Paid subscribers</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{data.paidSubscribers}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Basic / Pro paid</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{data.basicPaid} <span className="text-muted-foreground">/</span> {data.proPaid}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Reported MRR</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(data.mrr)}</p>
              </div>
              <button type="button"
                className={`rounded-md border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${filter === "review" ? "border-primary bg-primary/5" : ""}`}
                onClick={() => { setFilter("review"); setViewReset(value => value + 1); }} aria-pressed={filter === "review"}
                aria-label={`Needs review: ${needsAttention.length} accounts`}
                data-testid="button-filter-subscription-review">
                <p className="text-xs text-muted-foreground">Needs review</p>
                <p className="mt-1 flex items-center gap-2 text-xl font-semibold tabular-nums">
                  {needsAttention.length}
                  {needsAttention.length > 0 && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">View flagged accounts</p>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue figures reflect paid billing subscriptions only. Test, admin, gift, and trial entitlements are not revenue.
            </p>

            {/* Selecting a summary starts a fresh view; refetching keeps its state. */}
            <SubscriptionSyncAccounts key={viewReset} accounts={data.accounts} enabled={data.enabled} filter={filter} onFilterChange={setFilter} />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
