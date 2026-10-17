// Presentation-only selectors. These never infer or change subscription access.
export interface SubscriptionSyncAccount {
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

export type ReviewFilter = "all" | "review" | "pending" | "errors" | "clear";

export const reviewFilters: Record<ReviewFilter, string> = {
  all: "All diagnostic states",
  review: "Needs review",
  pending: "Pending sync · no error",
  errors: "Verification errors",
  clear: "No review flags",
};

// Keep the summary card and table on exactly the same diagnostic definition.
export const needsReview = (account: SubscriptionSyncAccount) =>
  account.needsReconcile || Boolean(account.errorCode);

export function selectAccounts(
  accounts: readonly SubscriptionSyncAccount[],
  { filter = "all", search = "", billing = "all", page = 1, pageSize = 10 }:
    { filter?: ReviewFilter; search?: string; billing?: string; page?: number; pageSize?: number },
) {
  const query = search.trim().toLowerCase();
  const matches = accounts.filter(account => {
    const stateMatches = filter === "review" ? needsReview(account) :
      filter === "errors" ? Boolean(account.errorCode) :
      filter === "pending" ? account.needsReconcile && !account.errorCode :
      filter === "clear" ? !needsReview(account) : true;
    return stateMatches && account.accountRef.toLowerCase().includes(query) &&
      (billing === "all" || (account.billingStatus ?? "unverified") === billing);
  });
  const size = Math.max(1, Math.floor(pageSize));
  const pages = Math.max(1, Math.ceil(matches.length / size));
  const currentPage = Math.min(pages, Math.max(1, Math.floor(page)));
  const start = (currentPage - 1) * size;
  return {
    rows: matches.slice(start, start + size), count: matches.length,
    page: currentPage, pages, from: matches.length ? start + 1 : 0,
    to: Math.min(start + size, matches.length),
  };
}

const errorReasons: Record<string, string> = {
  PRICE_CONFIGURATION: "The approved Stripe price configuration could not be verified.",
  MISSING_CUSTOMER: "There is no stored Stripe customer association to verify.",
  CUSTOMER_MISMATCH: "The provider subscription does not match the stored customer association.",
  CHECKOUT_ASSOCIATION: "A unique, completed Checkout association could not be verified.",
  CHECKOUT_PRICE: "The Checkout price could not be matched to an approved plan.",
  UNKNOWN_PRICE: "The subscription uses an unrecognized price.",
  UNSUPPORTED_SUBSCRIPTION: "The subscription structure is not supported by this verifier.",
  RECONCILIATION_LIMIT: "The provider returned more records than this bounded verification can process.",
  RECONCILIATION_BUDGET: "Verification reached its request or time budget.",
  PROVIDER_OR_STORAGE_UNAVAILABLE: "Provider lookup or database persistence failed; the precise cause is not confirmed here.",
};

export function diagnosticDetail(account: SubscriptionSyncAccount, enabled: boolean) {
  if (account.errorCode) {
    return {
      tone: "error" as const, label: "Verification failed",
      reason: errorReasons[account.errorCode] ?? "Verification could not complete. Consult restricted server diagnostics for the recorded code.",
      nextStep: "Review the configuration or association before an authorized retry. Do not infer a downgrade from this failure.",
    };
  }
  if (account.needsReconcile) {
    if (!account.hasCustomer) {
      return {
        tone: "warning" as const, label: "Association needs review",
        reason: "Verification is pending, but no customer association is stored.",
        nextStep: "Investigate the association before an authorized retry; do not create or guess billing identifiers.",
      };
    }
    return {
      tone: "info" as const,
      label: account.lastSuccessAt ? "Verification pending" : "Awaiting first sync",
      reason: account.lastSuccessAt
        ? "The stored billing association is awaiting another verification."
        : "A customer association is stored, but no successful billing verification has been recorded.",
      nextStep: enabled
        ? "Wait for the approved worker, then refresh. A pending check is not evidence of a billing error."
        : "Expected while synchronization is disabled. No plan or association correction is indicated by this flag alone; verify after activation is approved.",
    };
  }
  return {
    tone: "clear" as const, label: "No review flags",
    reason: account.hasCustomer ? "No reconciliation or error flag is recorded." : "No customer association is waiting for reconciliation.",
    nextStep: "No corrective action indicated. This status alone does not prove a paid subscription.",
  };
}
