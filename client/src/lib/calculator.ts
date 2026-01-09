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
  type CalculatorConfig,
} from "@shared/schema";

// Get effective pricing based on custom config or default
function getEffectiveSizePrice(sizeId: string, config?: CalculatorConfig): number {
  const customSize = config?.sizes?.find(s => s.id === sizeId);
  if (customSize) return customSize.basePrice;
  const defaultSize = CAKE_SIZES.find(s => s.id === sizeId);
  return defaultSize?.basePrice || 0;
}

function getEffectiveFlavorPrice(flavorId: string, config?: CalculatorConfig): number {
  const customFlavor = config?.flavors?.find(f => f.id === flavorId);
  if (customFlavor) return customFlavor.priceModifier;
  const defaultFlavor = CAKE_FLAVORS.find(f => f.id === flavorId);
  return defaultFlavor?.priceModifier || 0;
}

function getEffectiveFrostingPrice(frostingId: string, config?: CalculatorConfig): number {
  const customFrosting = config?.frostings?.find(f => f.id === frostingId);
  if (customFrosting) return customFrosting.priceModifier;
  const defaultFrosting = FROSTING_TYPES.find(f => f.id === frostingId);
  return defaultFrosting?.priceModifier || 0;
}

function getEffectiveDecorationPrice(decorationId: string, config?: CalculatorConfig): number {
  const customDecoration = config?.decorations?.find(d => d.id === decorationId);
  if (customDecoration) return customDecoration.price;
  const defaultDecoration = DECORATIONS.find(d => d.id === decorationId);
  return defaultDecoration?.price || 0;
}

export function calculateTierPrice(tier: CakeTier, config?: CalculatorConfig): number {
  const shape = CAKE_SHAPES.find((s) => s.id === tier.shape);

  const basePrice = getEffectiveSizePrice(tier.size, config);
  const shapePrice = shape?.priceModifier || 0;
  const flavorPrice = getEffectiveFlavorPrice(tier.flavor, config);
  const frostingPrice = getEffectiveFrostingPrice(tier.frosting, config);

  return basePrice + shapePrice + flavorPrice + frostingPrice;
}

export function calculateDecorationsPrice(decorationIds: string[], config?: CalculatorConfig): number {
  return decorationIds.reduce((total, id) => {
    return total + getEffectiveDecorationPrice(id, config);
  }, 0);
}

export function calculateDeliveryPrice(deliveryOption: string, config?: CalculatorConfig): number {
  const customDelivery = config?.deliveryOptions?.find(d => d.id === deliveryOption);
  if (customDelivery) return customDelivery.price;
  const option = DELIVERY_OPTIONS.find((d) => d.id === deliveryOption);
  return option?.price || 0;
}

export function calculateTotal(payload: CalculatorPayload, config?: CalculatorConfig): {
  tiersTotal: number;
  decorationsTotal: number;
  deliveryTotal: number;
  subtotal: number;
  tax: number;
  total: number;
} {
  const tiersTotal = payload.tiers.reduce(
    (sum, tier) => sum + calculateTierPrice(tier, config),
    0
  );
  const decorationsTotal = calculateDecorationsPrice(payload.decorations, config);
  const deliveryTotal = calculateDeliveryPrice(payload.deliveryOption, config);

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
