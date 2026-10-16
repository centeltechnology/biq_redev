import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, Clock3, RefreshCw, ShieldAlert } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SubscriptionSyncAccount {
  accountRef: string;
  entitlementSource: string;
  localPlan: string;
  effectivePlan: string;
  billingPlan: string | null;
  billingStatus: string | null;
  paidThrough: string | null;
  trialEnd: string | null;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  errorCode: string | null;
  needsReconcile: boolean;
  attempts: number;
  hasCustomer: boolean;
  hasSubscription: boolean;
  awardReviewCount: number;
}

interface SubscriptionSyncData {
  enabled: boolean;
  accounts: SubscriptionSyncAccount[];
  paidSubscribers: number;
  basicPaid: number;
  proPaid: number;
  mrr: number;
}

function privateAccountLabel(value: string): string {
  // A short, deterministic pseudonym avoids rendering account identifiers or PII.
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `acct-${(hash >>> 0).toString(16).slice(0, 6).toUpperCase()}`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

export function SubscriptionSyncPanel() {
  const syncQuery = useQuery<SubscriptionSyncData>({
    queryKey: ["/api/admin/subscription-sync"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/subscription-sync");
      return response.json();
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/subscription-sync/reconcile");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-sync"] });
    },
  });

  const data = syncQuery.data;
  const needsAttention = data?.accounts.filter(account => account.needsReconcile || !!account.errorCode) ?? [];

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
            disabled={!data?.enabled || reconcileMutation.isPending}
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
        ) : syncQuery.isError ? (
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
            {!data.enabled && (
              <div className="flex items-start gap-3 rounded-md border bg-muted/50 p-3" role="status">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Subscription sync is disabled</p>
                  <p className="text-sm text-muted-foreground">Diagnostics are shown as returned; reconciliation is unavailable.</p>
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
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Needs review</p>
                <p className="mt-1 flex items-center gap-2 text-xl font-semibold tabular-nums">
                  {needsAttention.length}
                  {needsAttention.length > 0 && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue figures reflect paid billing subscriptions only. Test, admin, gift, and trial entitlements are not revenue.
            </p>

            {data.accounts.length === 0 ? (
              <div className="rounded-md border border-dashed px-4 py-8 text-center">
                <p className="text-sm font-medium">No subscription sync records</p>
                <p className="mt-1 text-sm text-muted-foreground">There are no accounts to diagnose at this time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account ref</TableHead>
                      <TableHead>Entitlement</TableHead>
                      <TableHead>Plans · local / effective / billing</TableHead>
                      <TableHead>Billing state</TableHead>
                      <TableHead>Last attempt / success</TableHead>
                      <TableHead>Diagnostics</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.accounts.map(account => (
                      <TableRow key={account.accountRef}>
                        <TableCell className="font-mono text-xs">{privateAccountLabel(account.accountRef)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline">{account.entitlementSource || "unknown"}</Badge>
                            {(account.entitlementSource || "").toLowerCase().match(/test|admin|gift|trial/) && (
                              <p className="text-xs text-muted-foreground">Not revenue</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span>{account.localPlan}</span>
                          <span className="text-muted-foreground"> / {account.effectivePlan} / {account.billingPlan ?? "—"}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{account.billingStatus ?? "—"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Paid through {formatDate(account.paidThrough)}
                            {account.trialEnd && <span className="block">Trial ends {formatDate(account.trialEnd)}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1"><Clock3 className="h-3 w-3 text-muted-foreground" />{formatDate(account.lastAttemptAt)}</div>
                          <div className="mt-1 text-muted-foreground">Success: {formatDate(account.lastSuccessAt)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {account.needsReconcile && <Badge variant="secondary">Reconcile</Badge>}
                            {account.errorCode && <Badge variant="destructive">{account.errorCode}</Badge>}
                            {!account.needsReconcile && !account.errorCode && <Badge variant="outline">No error</Badge>}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {account.attempts} attempts · customer {account.hasCustomer ? "yes" : "no"} · subscription {account.hasSubscription ? "yes" : "no"}
                            {account.awardReviewCount > 0 && <span className="block">Award reviews: {account.awardReviewCount}</span>}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
