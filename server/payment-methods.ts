import type Stripe from "stripe";
import { getUncachableStripeClient } from "./stripeClient";
import type { Baker } from "@shared/schema";

// Curated, U.S.-relevant payment methods surfaced in BakerIQ.
// Availability is always verified against the platform's live Stripe
// payment method configuration — this list only controls what we
// surface and how we label/group it. (Checkout sessions are created on
// the platform account with transfer_data.destination, so the platform
// configuration governs which methods Stripe can offer.)
export interface CuratedMethodDef {
  key: string; // Stripe payment method configuration key
  label: string;
  category: "everyday" | "flexible";
  description: string;
  // card is required; apple_pay rides on card in Checkout and can't be
  // toggled via payment_method_types, so it is display-only here.
  locked?: boolean;
  lockedReason?: string;
  // The value used in checkout session payment_method_types (null when
  // the method cannot be controlled per-session, e.g. wallets).
  checkoutType: string | null;
}

export const CURATED_PAYMENT_METHODS: CuratedMethodDef[] = [
  {
    key: "card",
    label: "Credit & debit cards",
    category: "everyday",
    description: "Visa, Mastercard, Amex, Discover and more",
    locked: true,
    lockedReason: "Always on",
    checkoutType: "card",
  },
  {
    key: "apple_pay",
    label: "Apple Pay",
    category: "everyday",
    description: "One-tap checkout on Apple devices",
    locked: true,
    lockedReason: "Included with cards",
    checkoutType: null, // wallet — offered automatically with card
  },
  {
    key: "cashapp",
    label: "Cash App Pay",
    category: "everyday",
    description: "Pay from a Cash App balance or linked card",
    checkoutType: "cashapp",
  },
  {
    key: "link",
    label: "Link",
    category: "everyday",
    description: "Stripe's saved-details fast checkout",
    checkoutType: "link",
  },
  {
    key: "amazon_pay",
    label: "Amazon Pay",
    category: "everyday",
    description: "Pay with an Amazon account",
    checkoutType: "amazon_pay",
  },
  {
    key: "affirm",
    label: "Affirm",
    category: "flexible",
    description: "Buy now, pay later in installments",
    checkoutType: "affirm",
  },
  {
    key: "afterpay_clearpay",
    label: "Afterpay",
    category: "flexible",
    description: "Split purchases into 4 payments",
    checkoutType: "afterpay_clearpay",
  },
  {
    key: "klarna",
    label: "Klarna",
    category: "flexible",
    description: "Flexible pay-later options",
    checkoutType: "klarna",
  },
];

const TOGGLEABLE_KEYS = CURATED_PAYMENT_METHODS.filter((m) => !m.locked).map(
  (m) => m.key,
);

export function isToggleableMethod(key: string): boolean {
  return TOGGLEABLE_KEYS.includes(key);
}

interface PlatformMethodState {
  available: boolean;
  enabled: boolean; // display preference resolved to "on"
}

interface PlatformAvailability {
  fetchedAt: number;
  methods: Record<string, PlatformMethodState>;
}

let cache: PlatformAvailability | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Fetch the platform account's default payment method configuration and
 * resolve availability for our curated methods. Cached for 10 minutes.
 * Throws on Stripe API failure — callers must handle gracefully.
 */
export async function getPlatformMethodAvailability(
  forceRefresh = false,
): Promise<PlatformAvailability> {
  if (!forceRefresh && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache;
  }
  const stripe = await getUncachableStripeClient();
  const configs = await stripe.paymentMethodConfigurations.list({ limit: 10 });
  const defaultConfig =
    configs.data.find((c: any) => c.is_default && c.active) ?? configs.data[0];
  if (!defaultConfig) {
    throw new Error("No Stripe payment method configuration found");
  }

  const methods: Record<string, PlatformMethodState> = {};
  for (const def of CURATED_PAYMENT_METHODS) {
    const entry = (defaultConfig as any)[def.key] as
      | { available?: boolean; display_preference?: { value?: string } }
      | undefined;
    methods[def.key] = {
      available: !!entry?.available,
      enabled: entry?.display_preference?.value === "on",
    };
  }
  cache = { fetchedAt: Date.now(), methods };
  return cache;
}

export type MethodStatus =
  | "on"
  | "off"
  | "unavailable"
  | "requires_verification";

export interface BakerMethodView {
  key: string;
  label: string;
  category: "everyday" | "flexible";
  description: string;
  status: MethodStatus;
  statusLabel: string;
  locked: boolean;
  lockedReason?: string;
}

/**
 * Resolve the effective payment-method view for a baker: platform
 * availability intersected with the baker's own disabled preferences.
 */
export function resolveBakerMethods(
  baker: Pick<Baker, "disabledPaymentMethods">,
  platform: PlatformAvailability,
): BakerMethodView[] {
  const disabled = new Set(baker.disabledPaymentMethods ?? []);
  return CURATED_PAYMENT_METHODS.map((def) => {
    const state = platform.methods[def.key];
    let status: MethodStatus;
    let statusLabel: string;
    if (!state?.available) {
      status = "unavailable";
      statusLabel = "Not currently available";
    } else if (!state.enabled) {
      status = "requires_verification";
      statusLabel = "Additional information required";
    } else if (!def.locked && disabled.has(def.key)) {
      status = "off";
      statusLabel = "Off";
    } else {
      status = "on";
      statusLabel = "On";
    }
    return {
      key: def.key,
      label: def.label,
      category: def.category,
      description: def.description,
      status,
      statusLabel,
      locked: !!def.locked || status === "unavailable" || status === "requires_verification",
      lockedReason: def.lockedReason,
    };
  });
}

/**
 * Compute the explicit payment_method_types list for a Checkout session,
 * or undefined to keep Stripe's dynamic payment methods (the default).
 *
 * Only returns an explicit list when the baker has actively customized
 * (disabled at least one otherwise-available method). Card is always
 * included. On any failure to resolve platform availability, returns
 * undefined so checkout falls back to dynamic methods — customization
 * must never break checkout.
 */
/**
 * Create a Checkout session; if Stripe rejects the explicit
 * payment_method_types list (e.g. a method was turned off in the Stripe
 * Dashboard after our availability cache was populated), refresh the
 * cache and retry once with dynamic payment methods. The retry keeps
 * every other parameter — including application_fee_amount and
 * transfer_data — identical, so the funds flow never changes.
 */
export async function createCheckoutSessionWithFallback(
  stripe: Stripe,
  params: Stripe.Checkout.SessionCreateParams,
): Promise<Stripe.Checkout.Session> {
  try {
    return await stripe.checkout.sessions.create(params);
  } catch (err: any) {
    if (params.payment_method_types && err?.type === "StripeInvalidRequestError") {
      console.warn(
        "[payment-methods] Checkout rejected explicit payment_method_types, retrying with dynamic methods:",
        err.message,
      );
      // Refresh availability cache in the background for future requests
      getPlatformMethodAvailability(true).catch(() => {});
      const { payment_method_types: _omit, ...dynamicParams } = params;
      return await stripe.checkout.sessions.create(dynamicParams);
    }
    throw err;
  }
}

export async function getCheckoutPaymentMethodTypes(
  baker: Pick<Baker, "disabledPaymentMethods">,
): Promise<string[] | undefined> {
  const disabled = baker.disabledPaymentMethods;
  if (!disabled || disabled.length === 0) return undefined;
  try {
    const platform = await getPlatformMethodAvailability();
    const disabledSet = new Set(disabled);
    const types = CURATED_PAYMENT_METHODS.filter((def) => {
      if (!def.checkoutType) return false; // wallets ride on card
      if (def.key === "card") return true;
      const state = platform.methods[def.key];
      if (!state?.available || !state.enabled) return false;
      return !disabledSet.has(def.key);
    }).map((def) => def.checkoutType!) as string[];
    // Safety: never produce a list without card
    if (!types.includes("card")) types.unshift("card");
    return types;
  } catch (err) {
    console.error(
      "[payment-methods] Failed to resolve checkout types, using dynamic:",
      (err as Error).message,
    );
    return undefined;
  }
}
