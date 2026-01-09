import {
  CAKE_SIZES,
  CAKE_SHAPES,
  CAKE_FLAVORS,
  FROSTING_TYPES,
  DECORATIONS,
  DELIVERY_OPTIONS,
  ADDONS,
  TREATS,
  DEFAULT_TAX_RATE,
  type CakeTier,
  type CalculatorPayload,
  type CalculatorConfig,
  type TreatSelection,
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

function getEffectiveAddonPrice(addonId: string, config?: CalculatorConfig): { price: number; pricingType: "flat" | "per-attendee"; minAttendees?: number } {
  const customAddon = config?.addons?.find(a => a.id === addonId);
  if (customAddon) return { price: customAddon.price, pricingType: customAddon.pricingType, minAttendees: customAddon.minAttendees };
  const defaultAddon = ADDONS.find(a => a.id === addonId);
  if (defaultAddon) return { price: defaultAddon.price, pricingType: defaultAddon.pricingType, minAttendees: "minAttendees" in defaultAddon ? defaultAddon.minAttendees : undefined };
  return { price: 0, pricingType: "flat" };
}

export function calculateAddonsPrice(addons: { id: string; quantity?: number; attendees?: number }[], config?: CalculatorConfig): number {
  return addons.reduce((total, addon) => {
    const addonInfo = getEffectiveAddonPrice(addon.id, config);
    if (addonInfo.pricingType === "per-attendee") {
      const attendees = addon.attendees || addonInfo.minAttendees || 0;
      return total + (addonInfo.price * attendees);
    }
    const qty = addon.quantity || 1;
    return total + (addonInfo.price * qty);
  }, 0);
}

// Get effective treat price from custom config or default
function getEffectiveTreatPrice(treatId: string, config?: CalculatorConfig): number {
  const customTreat = config?.treats?.find(t => t.id === treatId);
  if (customTreat) return customTreat.unitPrice;
  const defaultTreat = TREATS.find(t => t.id === treatId);
  return defaultTreat?.unitPrice || 0;
}

export function calculateTreatsPrice(treats: TreatSelection[], config?: CalculatorConfig): number {
  return treats.reduce((total, treat) => {
    const price = getEffectiveTreatPrice(treat.id, config);
    return total + (price * treat.quantity);
  }, 0);
}

export function calculateTotal(payload: CalculatorPayload, config?: CalculatorConfig): {
  tiersTotal: number;
  decorationsTotal: number;
  addonsTotal: number;
  treatsTotal: number;
  deliveryTotal: number;
  subtotal: number;
  tax: number;
  total: number;
} {
  // Handle cake calculations
  const tiersTotal = payload.category === "cake" && payload.tiers 
    ? payload.tiers.reduce((sum, tier) => sum + calculateTierPrice(tier, config), 0)
    : 0;
  const decorationsTotal = payload.category === "cake" && payload.decorations
    ? calculateDecorationsPrice(payload.decorations, config)
    : 0;
  const addonsTotal = payload.category === "cake" && payload.addons
    ? calculateAddonsPrice(payload.addons, config)
    : 0;

  // Handle treats calculations
  const treatsTotal = payload.category === "treat" && payload.treats
    ? calculateTreatsPrice(payload.treats, config)
    : 0;

  const deliveryTotal = calculateDeliveryPrice(payload.deliveryOption, config);

  const subtotal = tiersTotal + decorationsTotal + addonsTotal + treatsTotal + deliveryTotal;
  const tax = subtotal * DEFAULT_TAX_RATE;
  const total = subtotal + tax;

  return {
    tiersTotal,
    decorationsTotal,
    addonsTotal,
    treatsTotal,
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
  if (payload.category === "treat") {
    if (!payload.treats || payload.treats.length === 0) return "No treats selected";
    const treatNames = payload.treats.map(t => {
      const treat = TREATS.find(tr => tr.id === t.id);
      return `${treat?.label || t.id} x${t.quantity}`;
    });
    return treatNames.slice(0, 3).join(", ") + (treatNames.length > 3 ? "..." : "");
  }
  
  if (!payload.tiers || payload.tiers.length === 0) return "No tiers selected";
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
