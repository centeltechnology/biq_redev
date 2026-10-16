import { createHash } from "node:crypto";

export type Plan = "free" | "basic" | "pro";
export const fees: Record<Plan, number> = { free: 7, basic: 5, pro: 3 };
// Owner-confirmed intentional test entitlements. No historical account rewrite.
// IDs are server-generated; callers cannot choose or grant these identities.
const testAccounts = new Set([
  "0d83f7d8a4e55d80ac498a563107d2ba",
  "040ba5dce1f4c024327165b554107a89",
]);
export const isTestAccount = (id: string) =>
  testAccounts.has(createHash("md5").update(id).digest("hex"));
export const accountRef = (id: string) =>
  `baker-${createHash("sha256").update(id).digest("hex").slice(0, 12)}`;
export const asPlan = (p: unknown): Plan => p === "pro" || p === "basic" ? p : "free";
export interface Subject {
  id: string;
  plan: Plan;
  customerId: string | null;
  subscriptionId: string | null;
  surveyTrialEnd: number | null;
  giftedPlan: Plan;
  giftEnd: number | null;
  administrativePlan?: Plan | null;
}
export interface Billing {
  subscriptionId: string | null;
  status: string;
  plan: Plan;
  paidThrough: number | null;
  trialEnd: number | null;
  cancelAtPeriodEnd: boolean;
}
export function effective(subject: Subject, billingPlan: Plan, now: number, protectedTest = isTestAccount(subject.id)) {
  if (protectedTest) return { plan: "pro" as Plan, source: "test" };
  if (subject.surveyTrialEnd && subject.surveyTrialEnd > now)
    return { plan: "pro" as Plan, source: "survey_trial" };
  // An unlinked non-Free assignment is an existing administrative entitlement,
  // not evidence of payment. Never migrate it implicitly into billing ownership.
  const administrative = subject.administrativePlan ??
    (!subject.customerId && subject.plan !== "free" ? subject.plan : "free");
  if (administrative === "pro") return { plan: "pro" as Plan, source: "administrative" };
  if (subject.giftEnd && subject.giftEnd > now && subject.giftedPlan !== "free") {
    const plan = subject.giftedPlan === "pro" || billingPlan === "pro" ? "pro" : "basic";
    return { plan: plan as Plan, source: "gift" };
  }
  if (administrative === "basic" && billingPlan !== "pro")
    return { plan: "basic" as Plan, source: "administrative" };
  return { plan: billingPlan, source: billingPlan === "free" ? "free" : "subscription" };
}
export function billingAccess(billing: Billing, now: number): Plan {
  if (billing.paidThrough && billing.paidThrough > now) return billing.plan;
  if (billing.status === "trialing" && billing.trialEnd && billing.trialEnd > now) return billing.plan;
  return "free";
}
export function paying(subject: Subject, billing: Billing | null, now: number) {
  return !!billing && !isTestAccount(subject.id) && billing.plan !== "free" &&
    !!billing.paidThrough && billing.paidThrough > now &&
    ["active", "past_due"].includes(billing.status);
}
