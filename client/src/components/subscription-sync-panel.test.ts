import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { SubscriptionSyncPanel } from "./subscription-sync-panel";
import { SubscriptionSyncAccounts } from "./subscription-sync-accounts";
import { apiRequest } from "@/lib/queryClient";
import type { SubscriptionSyncAccount } from "@/lib/subscription-diagnostics";

vi.mock("@/lib/queryClient", () => ({ apiRequest: vi.fn(), queryClient: { invalidateQueries: vi.fn() } }));
// Vitest's Node JSX transform, unlike the web build, does not install the React runtime.
vi.stubGlobal("React", React);
afterEach(() => vi.clearAllMocks());

const accounts: SubscriptionSyncAccount[] = [{
  accountRef: "baker-safe-pseudonym", entitlementSource: "free", localPlan: "free", effectivePlan: "free",
  billingPlan: null, billingStatus: null, paidThrough: null, trialEnd: null, lastSuccessAt: null,
  lastAttemptAt: null, errorCode: null, needsReconcile: true, attempts: 0,
  hasCustomer: true, hasSubscription: false, awardReviewCount: 0,
}];

it("renders an actionable review card, disabled server-gated controls and activation guidance without making requests", () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(["/api/admin/subscription-sync"], {
    enabled: false, accounts, paidSubscribers: 0, basicPaid: 0, proPaid: 0, mrr: 0,
  });
  const html = renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(SubscriptionSyncPanel)));
  expect(html).toContain('aria-label="Needs review: 1 accounts"');
  expect(html).toContain('aria-pressed="false"');
  const control = html.match(/<button[^>]*data-testid="button-queue-subscription-reconcile"[^>]*>/)?.[0];
  expect(control).toContain('disabled=""');
  expect(html).toContain("SUBSCRIPTION_SYNC_ENABLED");
  expect(html).toContain("Autoscale");
  expect(html).not.toContain('type="checkbox"');
  expect(apiRequest).not.toHaveBeenCalled();
  client.clear();
});

it("renders the active review filter with its count and a show-all action", () => {
  const html = renderToStaticMarkup(createElement(SubscriptionSyncAccounts, {
    accounts, enabled: false, filter: "review", onFilterChange: vi.fn(),
  }));
  expect(html).toContain("Clear filters / Show all");
  expect(html).toContain("1 of 1 accounts");
  expect(html).toContain("Expected while synchronization is disabled");
  expect(apiRequest).not.toHaveBeenCalled();
});

it("renders the empty review state without suggesting billing repair", () => {
  const html = renderToStaticMarkup(createElement(SubscriptionSyncAccounts, {
    accounts: accounts.map(a => ({ ...a, needsReconcile: false })), enabled: false,
    filter: "review", onFilterChange: vi.fn(),
  }));
  expect(html).toContain("No accounts need review");
  expect(html).toContain("0 of 1 accounts");
  expect(html).toContain("Clear filters / Show all");
});
