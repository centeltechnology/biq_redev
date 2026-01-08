import {
  CAKE_SIZES,
  CAKE_SHAPES,
  CAKE_FLAVORS,
  FROSTING_TYPES,
  DECORATIONS,
  DELIVERY_OPTIONS,
  DEFAULT_TAX_RATE,
  type CakeTier,
  type CalculatorPayload,
} from "@shared/schema";

export function calculateTierPrice(tier: CakeTier): number {
  const size = CAKE_SIZES.find((s) => s.id === tier.size);
  const shape = CAKE_SHAPES.find((s) => s.id === tier.shape);
  const flavor = CAKE_FLAVORS.find((f) => f.id === tier.flavor);
  const frosting = FROSTING_TYPES.find((f) => f.id === tier.frosting);

  const basePrice = size?.basePrice || 0;
  const shapePrice = shape?.priceModifier || 0;
  const flavorPrice = flavor?.priceModifier || 0;
  const frostingPrice = frosting?.priceModifier || 0;

  return basePrice + shapePrice + flavorPrice + frostingPrice;
}

export function calculateDecorationsPrice(decorationIds: string[]): number {
  return decorationIds.reduce((total, id) => {
    const decoration = DECORATIONS.find((d) => d.id === id);
    return total + (decoration?.price || 0);
  }, 0);
}

export function calculateDeliveryPrice(deliveryOption: string): number {
  const option = DELIVERY_OPTIONS.find((d) => d.id === deliveryOption);
  return option?.price || 0;
}

export function calculateTotal(payload: CalculatorPayload): {
  tiersTotal: number;
  decorationsTotal: number;
  deliveryTotal: number;
  subtotal: number;
  tax: number;
  total: number;
} {
  const tiersTotal = payload.tiers.reduce(
    (sum, tier) => sum + calculateTierPrice(tier),
    0
  );
  const decorationsTotal = calculateDecorationsPrice(payload.decorations);
  const deliveryTotal = calculateDeliveryPrice(payload.deliveryOption);

  const subtotal = tiersTotal + decorationsTotal + deliveryTotal;
  const tax = subtotal * DEFAULT_TAX_RATE;
  const total = subtotal + tax;

  return {
    tiersTotal,
    decorationsTotal,
    deliveryTotal,
    subtotal,
    tax,
    total,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getTierSummary(tier: CakeTier): string {
  const size = CAKE_SIZES.find((s) => s.id === tier.size);
  const flavor = CAKE_FLAVORS.find((f) => f.id === tier.flavor);
  return `${size?.label || tier.size}, ${flavor?.label || tier.flavor}`;
}

export function getPayloadSummary(payload: CalculatorPayload): string {
  if (payload.tiers.length === 0) return "No tiers selected";
  if (payload.tiers.length === 1) {
    return getTierSummary(payload.tiers[0]);
  }
  const sizes = payload.tiers.map((t) => {
    const size = CAKE_SIZES.find((s) => s.id === t.size);
    return size?.label || t.size;
  });
  return `${payload.tiers.length}-tier: ${sizes.join(" + ")}`;
}

export function createDefaultTier(): CakeTier {
  return {
    size: "8-round",
    shape: "round",
    flavor: "vanilla",
    frosting: "buttercream",
  };
}
