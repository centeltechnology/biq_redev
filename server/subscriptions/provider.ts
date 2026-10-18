import type Stripe from "stripe";
import type { Billing, Plan, Subject } from "./policy";

export class SyncError extends Error {
  constructor(public code: string) { super(code); }
}
export interface PaidActivity { invoiceId: string; subscriptionId: string; plan: Plan }
export interface Snapshot { billing: Billing; activities: PaidActivity[] }
type Catalog = Map<string, "basic" | "pro">;
const defaultRequestOptions = { timeout: 10_000, maxNetworkRetries: 1 };
const ident = (value: any): string | undefined => typeof value === "string" ? value : value?.id;
function subscriptionOf(invoice: any) {
  return ident(invoice.parent?.subscription_details?.subscription ?? invoice.subscription);
}
export async function priceCatalog(
  stripe: Stripe,
  requestOptions = defaultRequestOptions,
): Promise<Catalog> {
  const prices = await stripe.prices.list({
    lookup_keys: ["bakeriq_basic_monthly", "bakeriq_pro_monthly"], active: true, limit: 100,
  }, requestOptions);
  const catalog: Catalog = new Map();
  for (const [key, plan, amount] of [
    ["bakeriq_basic_monthly", "basic", 499],
    ["bakeriq_pro_monthly", "pro", 999],
  ] as const) {
    const matching = prices.data.filter(p => p.lookup_key === key);
    if (matching.length !== 1) throw new SyncError("PRICE_CONFIGURATION");
    const p = matching[0];
    if (p.currency !== "usd" || p.unit_amount !== amount ||
      p.recurring?.interval !== "month" || p.recurring.interval_count !== 1)
      throw new SyncError("PRICE_CONFIGURATION");
    catalog.set(p.id, plan);
  }
  return catalog;
}
// All information here is fetched server-to-server. Webhook bodies are signals,
// never authority for status, customer identity, prices, or entitlement.
export async function currentBilling(
  stripe: Stripe, subject: Subject, previous: Billing | null, now: number,
  options: { budgetMs?: number; requestTimeoutMs?: number; maxNetworkRetries?: number } = {},
): Promise<Snapshot> {
  if (!subject.customerId) throw new SyncError("MISSING_CUSTOMER");
  const customerId = subject.customerId;
  const deadline = Date.now() + (options.budgetMs ?? 45_000);
  const requestOptions = {
    timeout: options.requestTimeoutMs ?? defaultRequestOptions.timeout,
    maxNetworkRetries: options.maxNetworkRetries ?? defaultRequestOptions.maxNetworkRetries,
  };
  let requests = 0;
  const request = async <T>(operation: () => Promise<T>): Promise<T> => {
    if (++requests > 40 || Date.now() > deadline) throw new SyncError("RECONCILIATION_BUDGET");
    return operation();
  };
  const catalog = await request(() => priceCatalog(stripe, requestOptions));
  const subscriptions = await request(() => stripe.subscriptions.list({
    customer: customerId, status: "all", limit: 100,
  }, requestOptions));
  if (subscriptions.has_more) throw new SyncError("RECONCILIATION_LIMIT");
  const candidates: Billing[] = [];
  const activities: PaidActivity[] = [];
  for (const sub of subscriptions.data) {
    if (ident(sub.customer) !== subject.customerId) throw new SyncError("CUSTOMER_MISMATCH");
    if (sub.items.has_more || sub.items.data.length !== 1) throw new SyncError("UNSUPPORTED_SUBSCRIPTION");
    const currentPlan = catalog.get(sub.items.data[0].price.id);
    if (!currentPlan) throw new SyncError("UNKNOWN_PRICE");
    // Cross-check the canonical Checkout session, not event metadata alone.
    const sessions = await request(() => stripe.checkout.sessions.list({ subscription: sub.id, limit: 100 }, requestOptions));
    if (sessions.has_more) throw new SyncError("RECONCILIATION_LIMIT");
    const matching = sessions.data.filter(s => s.mode === "subscription" &&
      s.status === "complete" && ident(s.customer) === subject.customerId &&
      ident(s.subscription) === sub.id && s.metadata?.bakerId === subject.id);
    if (matching.length !== 1) throw new SyncError("CHECKOUT_ASSOCIATION");
    const lines = await request(() => stripe.checkout.sessions.listLineItems(matching[0].id, { limit: 100 }, requestOptions));
    if (lines.has_more || lines.data.length !== 1 || !lines.data[0].price ||
      !catalog.has(lines.data[0].price.id)) throw new SyncError("CHECKOUT_PRICE");
    const invoices = await request(() => stripe.invoices.list({
      customer: customerId, subscription: sub.id, status: "paid", limit: 100,
    }, requestOptions));
    if (invoices.has_more) throw new SyncError("RECONCILIATION_LIMIT");
    const windows: Array<{ plan: Plan; start: number; end: number }> = [];
    for (const invoice of invoices.data) {
      if (ident(invoice.customer) !== subject.customerId || subscriptionOf(invoice) !== sub.id)
        throw new SyncError("INVOICE_ASSOCIATION");
      if (invoice.status !== "paid" || invoice.amount_paid <= 0 ||
        invoice.amount_remaining !== 0 || invoice.currency !== "usd") continue;
      const invoiceLines = await request(() => stripe.invoices.listLineItems(invoice.id, { limit: 100 }, requestOptions));
      if (invoiceLines.has_more) throw new SyncError("RECONCILIATION_LIMIT");
      for (const line of invoiceLines.data) {
        const raw = line as any;
        const priceId = ident(raw.pricing?.price_details?.price ?? raw.price);
        const plan = priceId && catalog.get(priceId);
        if (!plan || line.amount <= 0) continue;
        const lineSub = ident(raw.parent?.subscription_item_details?.subscription ?? raw.subscription);
        // Reject one-off invoice lines; a subscription invoice alone isn't proof
        // that an arbitrary charge purchased a subscription period.
        if (lineSub !== sub.id) continue;
        if (!Number.isSafeInteger(line.period?.start) || !Number.isSafeInteger(line.period?.end) ||
          line.period.end <= line.period.start) throw new SyncError("INVOICE_PERIOD");
        windows.push({ plan, start: line.period.start * 1000, end: line.period.end * 1000 });
        activities.push({ invoiceId: invoice.id, subscriptionId: sub.id, plan });
      }
    }
    // Preserve a paid higher tier until its purchased period ends, even when
    // the canonical subscription was scheduled/downgraded/canceled in between.
    const covering = windows.filter(w => w.start <= now && w.end > now)
      .sort((a, b) => (b.plan === "pro" ? 1 : 0) - (a.plan === "pro" ? 1 : 0) || b.end - a.end);
    const chosen = covering[0];
    let paidThrough: number | null = chosen?.end ?? (Math.max(0, ...windows.filter(w => w.start <= now).map(w => w.end)) || null);
    let paidPlan: Plan = chosen?.plan ?? currentPlan;
    if (previous?.subscriptionId === sub.id && (previous.paidThrough ?? 0) > now &&
      (previous.paidThrough! > (paidThrough ?? 0) || previous.plan === "pro" && paidPlan === "basic")) {
      // A missing/eventually-consistent invoice response cannot erase evidence
      // of an already verified, still-unexpired paid period.
      paidThrough = previous.paidThrough;
      paidPlan = previous.plan;
    }
    candidates.push({
      subscriptionId: sub.id, status: sub.status,
      plan: paidPlan, paidThrough,
      trialEnd: sub.trial_end ? sub.trial_end * 1000 : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  }
  if (subject.subscriptionId && !subscriptions.data.some(s => s.id === subject.subscriptionId))
    throw new SyncError("SUBSCRIPTION_ASSOCIATION");
  if (!candidates.length) {
    // Absence of subscriptions isn't authority to cut short saved paid access.
    return { billing: {
      subscriptionId: previous?.subscriptionId ?? null, status: "none",
      plan: previous?.plan ?? "free", paidThrough: previous?.paidThrough ?? null,
      trialEnd: null, cancelAtPeriodEnd: false,
    }, activities: [] };
  }
  const accessRank = (b: Billing) =>
    ((b.paidThrough ?? 0) > now || b.status === "trialing" && (b.trialEnd ?? 0) > now)
      ? b.plan === "pro" ? 2 : 1 : 0;
  candidates.sort((a, b) => accessRank(b) - accessRank(a) ||
    (b.paidThrough ?? b.trialEnd ?? 0) - (a.paidThrough ?? a.trialEnd ?? 0) ||
    (a.subscriptionId ?? "").localeCompare(b.subscriptionId ?? ""));
  return { billing: candidates[0], activities };
}
