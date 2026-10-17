import { describe, expect, it } from "vitest";
import { diagnosticDetail, needsReview, selectAccounts, type SubscriptionSyncAccount } from "./subscription-diagnostics";

const account = (accountRef: string, fields: Partial<SubscriptionSyncAccount> = {}): SubscriptionSyncAccount => ({
  accountRef, entitlementSource: "free", localPlan: "free", effectivePlan: "free",
  billingPlan: null, billingStatus: null, paidThrough: null, trialEnd: null,
  lastSuccessAt: null, lastAttemptAt: null, errorCode: null, needsReconcile: false,
  attempts: 0, hasCustomer: false, hasSubscription: false, awardReviewCount: 0,
  ...fields,
});
const accounts = [
  account("baker-PENDING", { needsReconcile: true, hasCustomer: true }),
  account("baker-ERROR", { errorCode: "PRICE_CONFIGURATION" }),
  account("baker-BOTH", { needsReconcile: true, errorCode: "CHECKOUT_ASSOCIATION" }),
  account("baker-CLEAR"),
  account("baker-AWARD", { awardReviewCount: 1 }),
];

describe("read-only subscription diagnostic views", () => {
  it("uses exactly the summary definition, counts overlaps only once and excludes separate award reviews", () => {
    const view = selectAccounts(accounts, { filter: "review" });
    expect(view.count).toBe(accounts.filter(needsReview).length);
    expect(view.count).toBe(3);
    expect(view.rows.map(a => a.accountRef)).toEqual(["baker-PENDING", "baker-ERROR", "baker-BOTH"]);
  });
  it("clearing the review filter restores every account", () => {
    expect(selectAccounts(accounts, { filter: "all" }).rows).toEqual(accounts);
  });
  it("searches the safe displayed reference case-insensitively with whitespace trimmed", () => {
    expect(selectAccounts(accounts, { search: "  baker-pending  " }).rows).toEqual([accounts[0]]);
    expect(selectAccounts(accounts, { filter: "review", search: "CLEAR" }).count).toBe(0);
  });
  it("bounds rendering and keeps accurate counts and pagination", () => {
    const many = Array.from({ length: 23 }, (_, i) => account(`baker-${i}`));
    expect(selectAccounts(many, {}).rows).toHaveLength(10);
    const last = selectAccounts(many, { page: 3 });
    expect(last).toMatchObject({ count: 23, from: 21, to: 23, page: 3, pages: 3 });
    expect(last.rows).toHaveLength(3);
    expect(selectAccounts(many, { page: 99, search: "baker-22" })).toMatchObject({ count: 1, page: 1, pages: 1 });
  });
  it("returns a useful empty review view without inventing a record or page", () => {
    expect(selectAccounts([accounts[3]], { filter: "review" })).toMatchObject({ rows: [], count: 0, from: 0, to: 0, page: 1, pages: 1 });
    expect(selectAccounts([], {}).count).toBe(0);
  });
  it("separates pending checks, genuine verification failures and unflagged states", () => {
    expect(selectAccounts(accounts, { filter: "pending" }).rows).toEqual([accounts[0]]);
    expect(selectAccounts(accounts, { filter: "errors" }).rows).toEqual([accounts[1], accounts[2]]);
    expect(selectAccounts(accounts, { filter: "clear" }).rows).toEqual([accounts[3], accounts[4]]);
  });
  it("combines billing-state filters with diagnostic filters", () => {
    const rows = [...accounts, account("baker-ACTIVE", { billingStatus: "active" })];
    expect(selectAccounts(rows, { billing: "active" }).rows.map(a => a.accountRef)).toEqual(["baker-ACTIVE"]);
    expect(selectAccounts(rows, { billing: "unverified", filter: "review" }).count).toBe(3);
  });
  it("keeps a review selection consistent across refreshed snapshots", () => {
    const options = { filter: "review" as const, search: "baker" };
    expect(selectAccounts(accounts, options).count).toBe(3);
    const refreshed = accounts.map(a => ({ ...a, needsReconcile: false, errorCode: null }));
    expect(selectAccounts(refreshed, options).count).toBe(0);
    expect(options).toEqual({ filter: "review", search: "baker" });
  });
  it("explains the disabled first-sync case as informational, not as a failed payment", () => {
    expect(diagnosticDetail(accounts[0], false)).toMatchObject({ tone: "info", label: "Awaiting first sync" });
    expect(diagnosticDetail(accounts[0], false).nextStep).toContain("Expected while synchronization is disabled");
    expect(diagnosticDetail(accounts[0], false).nextStep).toContain("No plan or association correction");
    expect(diagnosticDetail(accounts[0], true).nextStep).toContain("approved worker");
  });
  it("does not call a recurring pending check a first sync", () => {
    expect(diagnosticDetail({ ...accounts[0], lastSuccessAt: "2026-10-16T00:00:00Z" }, false).label).toBe("Verification pending");
  });
  it("uses accurate known error reasons and does not guess an unknown failure cause", () => {
    expect(diagnosticDetail(accounts[1], false)).toMatchObject({ tone: "error", reason: "The approved Stripe price configuration could not be verified." });
    expect(diagnosticDetail(account("baker-X", { errorCode: "FUTURE_CODE" }), false).reason).toContain("could not complete");
  });
  it("does not claim a missing customer is an existing customer association", () => {
    expect(diagnosticDetail(account("baker-X", { needsReconcile: true }), false).tone).toBe("warning");
    expect(diagnosticDetail(accounts[3], false).nextStep).toContain("does not prove a paid subscription");
  });
  it("never mutates subscription data or input arrays for any view or diagnostic action", () => {
    const before = JSON.stringify(accounts);
    const frozen = Object.freeze(accounts.map(a => Object.freeze({ ...a })));
    for (const filter of ["all", "review", "errors", "pending", "clear"] as const) {
      selectAccounts(frozen, { filter, search: "baker", page: 2 });
      frozen.forEach(a => diagnosticDetail(a, false));
    }
    expect(JSON.stringify(accounts)).toBe(before);
    expect(JSON.stringify(frozen)).toBe(before);
  });
});
