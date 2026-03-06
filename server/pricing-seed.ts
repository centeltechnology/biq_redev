import type { CalculatorConfig } from "@shared/schema";
import {
  CAKE_SIZES,
  CAKE_SHAPES,
  CAKE_FLAVORS,
  FROSTING_TYPES,
  DECORATIONS,
  DELIVERY_OPTIONS,
  TREATS,
} from "@shared/schema";

const CAKE_TIER_MULTIPLIERS: Record<string, number> = {
  simple: 1.0,
  detailed: 1.44,
  luxury: 1.78,
};

const TREAT_TIER_MULTIPLIERS: Record<string, number> = {
  starter: 0.83,
  popular: 1.0,
  premium: 1.33,
};

function scaleCakeSizes(tier: string) {
  const multiplier = CAKE_TIER_MULTIPLIERS[tier] || 1.0;
  return CAKE_SIZES.map((size) => ({
    ...size,
    basePrice: Math.round(size.basePrice * multiplier),
    enabled: true,
  }));
}

function scaleTreats(tier: string) {
  const multiplier = TREAT_TIER_MULTIPLIERS[tier] || 1.0;
  return TREATS.map((treat) => ({
    ...treat,
    unitPrice: Math.round(treat.unitPrice * multiplier),
    enabled: true,
  }));
}

export function generateSeededPricing(
  productMode: string,
  cakePricingTier?: string | null,
  treatPricingTier?: string | null
): CalculatorConfig {
  const config: CalculatorConfig = {};

  const includeCakes = productMode === "cakes" || productMode === "both";
  const includeTreats = productMode === "treats" || productMode === "both";

  if (includeCakes) {
    config.sizes = scaleCakeSizes(cakePricingTier || "simple");
    config.shapes = CAKE_SHAPES.map((s) => ({ ...s, enabled: true }));
    config.flavors = CAKE_FLAVORS.map((f) => ({ ...f, enabled: true }));
    config.frostings = FROSTING_TYPES.map((f) => ({ ...f, enabled: true }));
    config.decorations = DECORATIONS.map((d) => ({ ...d, enabled: true }));
  }

  if (includeTreats) {
    config.treats = scaleTreats(treatPricingTier || "popular");
  }

  config.deliveryOptions = DELIVERY_OPTIONS.map((d) => ({
    ...d,
    enabled: true,
  }));

  return config;
}
