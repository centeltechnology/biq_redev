import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  diagnosticDetail, needsReview, reviewFilters, selectAccounts,
  type ReviewFilter, type SubscriptionSyncAccount,
} from "@/lib/subscription-diagnostics";

function formatDate(value: string | null) {
  const date = value ? new Date(value) : null;
  return !date || Number.isNaN(date.getTime()) ? "—" :
    date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const selectClass = "h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm";

export function SubscriptionSyncAccounts({ accounts, enabled, filter, onFilterChange }: {
  accounts: SubscriptionSyncAccount[]; enabled: boolean;
  filter: ReviewFilter; onFilterChange: (filter: ReviewFilter) => void;
}) {
  const [search, setSearch] = useState("");
  const [billing, setBilling] = useState("all");
  const [page, setPage] = useState(1);
  // A card selection changes the view, but refreshing diagnostics keeps it.
  useEffect(() => setPage(1), [filter]);
  const view = selectAccounts(accounts, { filter, search, billing, page });
  const active = filter !== "all" || Boolean(search.trim()) || billing !== "all";
  const statuses = Array.from(new Set([
    ...accounts.map(a => a.billingStatus ?? "unverified"),
    ...(billing === "all" ? [] : [billing]),
  ])).sort();
  const clear = () => { onFilterChange("all"); setSearch(""); setBilling("all"); setPage(1); };
  const emptyReview = filter === "review" && !accounts.some(needsReview) && !search.trim() && billing === "all";

  return (
    <section aria-label="Subscription account diagnostics" className="min-w-0 space-y-3">
      <div className="grid gap-2 md:grid-cols-[minmax(180px,1fr)_auto_auto]">
        <Input
          aria-label="Search safe account reference" placeholder="Search safe account reference…"
          value={search} onChange={event => { setSearch(event.target.value); setPage(1); }}
          data-testid="input-subscription-account-search"
        />
        <select aria-label="Diagnostic status" className={selectClass} value={filter}
          onChange={event => { onFilterChange(event.target.value as ReviewFilter); setPage(1); }}>
          {Object.entries(reviewFilters).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select aria-label="Billing status" className={selectClass} value={billing}
          onChange={event => { setBilling(event.target.value); setPage(1); }}>
          <option value="all">All billing states</option>
          {statuses.map(status => <option key={status} value={status}>{status === "unverified" ? "Not yet verified" : status.replaceAll("_", " ")}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p role="status" data-testid="subscription-account-count">
          {view.count} of {accounts.length} accounts
          {view.count > 0 && <span className="text-muted-foreground"> · showing {view.from}–{view.to}</span>}
        </p>
        {active && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{filter !== "all" ? reviewFilters[filter] : "Filtered view"}</Badge>
            <Button variant="outline" size="sm" onClick={clear} data-testid="button-clear-subscription-filter">Clear filters / Show all</Button>
          </div>
        )}
      </div>
      {view.count === 0 ? (
        <div className="rounded-md border border-dashed px-4 py-8 text-center">
          <p className="text-sm font-medium">{emptyReview ? "No accounts need review" : accounts.length ? "No matching accounts" : "No accounts to diagnose"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {emptyReview ? "No reconciliation or verification-error flags are recorded." :
              accounts.length ? "Try another account reference or clear the filters." : "Refresh when account diagnostics are available."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[1000px]" data-testid="table-subscription-accounts">
              <TableHeader><TableRow>
                <TableHead>Safe account ref</TableHead><TableHead>Entitlement</TableHead>
                <TableHead>Billing / association</TableHead><TableHead>Verification</TableHead>
                <TableHead className="w-[340px]">Reason / next step</TableHead>
              </TableRow></TableHeader>
              <TableBody>{view.rows.map(account => {
                const detail = diagnosticDetail(account, enabled);
                return <TableRow key={account.accountRef}>
                  <TableCell className="align-top font-mono text-xs">{account.accountRef}</TableCell>
                  <TableCell className="align-top">
                    <Badge variant="outline">{account.entitlementSource.replaceAll("_", " ") || "unknown"}</Badge>
                    <p className="mt-1 text-xs">Effective: {account.effectivePlan}</p>
                    <p className="text-xs text-muted-foreground">Stored: {account.localPlan}</p>
                    {/test|admin|gift|trial/i.test(account.entitlementSource) && <p className="mt-1 text-xs text-muted-foreground">Not revenue</p>}
                  </TableCell>
                  <TableCell className="align-top text-xs">
                    <p>{account.billingStatus?.replaceAll("_", " ") ?? "Not yet verified"} · {account.billingPlan ?? "no verified plan"}</p>
                    <p className="mt-1 text-muted-foreground">Customer {account.hasCustomer ? "linked" : "not linked"}<br />Subscription {account.hasSubscription ? "linked" : "not linked"}</p>
                    <p className="mt-1 text-muted-foreground">Paid through: {formatDate(account.paidThrough)}</p>
                    {account.trialEnd && <p className="text-muted-foreground">Trial ends: {formatDate(account.trialEnd)}</p>}
                  </TableCell>
                  <TableCell className="align-top text-xs">
                    <p>Attempt: {formatDate(account.lastAttemptAt)}</p>
                    <p className="mt-1 text-muted-foreground">Success: {formatDate(account.lastSuccessAt)}</p>
                    <p className="mt-1 text-muted-foreground">{account.attempts} attempts</p>
                  </TableCell>
                  <TableCell className="align-top text-xs">
                    <Badge variant={detail.tone === "error" ? "destructive" : detail.tone === "warning" ? "secondary" : "outline"}>
                      {detail.tone === "info" ? "Info · " : detail.tone === "warning" ? "Warning · " : ""}{detail.label}
                    </Badge>
                    <p className="mt-2">{detail.reason}</p>
                    {account.errorCode && <p className="mt-1 break-words font-mono text-muted-foreground">{account.errorCode}</p>}
                    <p className="mt-1 text-muted-foreground">{detail.nextStep}</p>
                    {account.awardReviewCount > 0 && <p className="mt-1 text-muted-foreground">Separate award-policy reviews: {account.awardReviewCount}</p>}
                  </TableCell>
                </TableRow>;
              })}</TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Page {view.page} of {view.pages} · 10 accounts per page</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={view.page <= 1} onClick={() => setPage(view.page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={view.page >= view.pages} onClick={() => setPage(view.page + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
