import { describe, it, expect } from "vitest";
import {
  getCakeStartingPrice,
  getTreatStartingPrice,
  calculateTierPrice,
  getEffectiveShapePrice,
} from "./calculator";
import type { CalculatorConfig } from "@shared/schema";

describe("getCakeStartingPrice", () => {
  it("returns the cheapest default single-tier cake when no config is given", () => {
    // Cheapest size 6-round ($45) + round shape/vanilla/buttercream ($0) = $45.
    expect(getCakeStartingPrice()).toBe(45);
    expect(getCakeStartingPrice(undefined)).toBe(45);
  });

  it("honors custom size pricing overrides", () => {
    const config: CalculatorConfig = {
      sizes: [{ id: "6-round", label: '6" Round', servings: "10-12", basePrice: 30 }],
    };
    expect(getCakeStartingPrice(config)).toBe(30);
  });

  it("respects a disabled cheapest size and falls back to the next enabled one", () => {
    const config: CalculatorConfig = {
      sizes: [{ id: "6-round", label: '6" Round', servings: "10-12", basePrice: 45, enabled: false }],
    };
    // Next cheapest enabled size is quarter-sheet ($55).
    expect(getCakeStartingPrice(config)).toBe(55);
  });

  it("returns null when an entire required group is disabled", () => {
    const config: CalculatorConfig = {
      sizes: [
        { id: "6-round", label: '6" Round', servings: "10-12", basePrice: 45, enabled: false },
        { id: "8-round", label: '8" Round', servings: "20-24", basePrice: 65, enabled: false },
        { id: "10-round", label: '10" Round', servings: "35-40", basePrice: 95, enabled: false },
        { id: "12-round", label: '12" Round', servings: "50-56", basePrice: 125, enabled: false },
        { id: "quarter-sheet", label: "Quarter Sheet", servings: "20-24", basePrice: 55, enabled: false },
        { id: "half-sheet", label: "Half Sheet", servings: "40-48", basePrice: 85, enabled: false },
        { id: "full-sheet", label: "Full Sheet", servings: "80-96", basePrice: 145, enabled: false },
      ],
    };
    expect(getCakeStartingPrice(config)).toBeNull();
  });

  it("returns null when the cheapest reachable cake is unpriced (<= 0)", () => {
    const config: CalculatorConfig = {
      sizes: [{ id: "6-round", label: '6" Round', servings: "10-12", basePrice: 0 }],
    };
    // Only one enabled size at $0, cheapest shape/flavor/frosting are $0 → total 0 → null.
    expect(getCakeStartingPrice(config)).toBeNull();
  });

  it("adds custom shape pricing into the starting price", () => {
    const config: CalculatorConfig = {
      sizes: [{ id: "6-round", label: '6" Round', servings: "10-12", basePrice: 45 }],
      shapes: [
        // Disable the free Round shape so a priced shape is the cheapest enabled one.
        { id: "round", label: "Round", priceModifier: 0, enabled: false },
        { id: "square", label: "Square", priceModifier: 8 },
      ],
    };
    // Cheapest enabled shape is the custom square at $8 → 45 + 8 = 53.
    expect(getCakeStartingPrice(config)).toBe(53);
  });

  it("ignores a disabled default size and uses the next enabled one", () => {
    const config: CalculatorConfig = {
      // Disable only the cheapest default size ($45 6" round); all other defaults remain.
      sizes: [{ id: "6-round", label: '6" Round', servings: "10-12", basePrice: 45, enabled: false }],
    };
    // 6" disabled → next cheapest enabled default is the quarter sheet at $55
    // (plus $0 shape/flavor/frosting). Would be $45 if the disabled flag were ignored.
    expect(getCakeStartingPrice(config)).toBe(55);
  });
});

describe("getTreatStartingPrice", () => {
  it("returns the lowest reachable subtotal across default treats", () => {
    // Candied apples ($6 x minQty 3 = $18) and pretzel rods ($18 x 1) tie at $18.
    expect(getTreatStartingPrice()).toBe(18);
  });

  it("multiplies unit price by minQuantity", () => {
    // Custom treat $4 x minQty 3 = $12, cheaper than the cheapest default ($18),
    // so it is selected and proves minQuantity is applied (unit price alone is $4).
    const config: CalculatorConfig = {
      treats: [
        { id: "mini", label: "Mini", description: "each", unitPrice: 4, minQuantity: 3 },
      ],
    };
    expect(getTreatStartingPrice(config)).toBe(12);
  });

  it("includes custom-only treats not present in defaults", () => {
    const config: CalculatorConfig = {
      treats: [
        { id: "macaron-tower", label: "Macaron Tower", description: "each", unitPrice: 3, minQuantity: 2 },
      ],
    };
    // Custom treat $3 x 2 = $6, cheaper than any default ($18).
    expect(getTreatStartingPrice(config)).toBe(6);
  });

  it("excludes disabled treats", () => {
    const config: CalculatorConfig = {
      treats: [
        { id: "candied-apples", label: "Candied Apples", description: "Per apple", unitPrice: 6, minQuantity: 3, enabled: false },
        { id: "pretzel-rods", label: "Chocolate Pretzel Rods", description: "Per dozen", unitPrice: 18, minQuantity: 1, enabled: false },
      ],
    };
    // Both $18 treats disabled → next lowest default is the half-dozen
    // dipped strawberries at $20 x 1.
    expect(getTreatStartingPrice(config)).toBe(20);
  });

  it("ignores zero/unpriced treats", () => {
    const config: CalculatorConfig = {
      treats: [
        { id: "freebie", label: "Free Sample", description: "each", unitPrice: 0, minQuantity: 1 },
      ],
    };
    // The custom $0 treat is ignored; defaults still yield $18.
    expect(getTreatStartingPrice(config)).toBe(18);
  });

  it("returns null when no enabled, priced treats remain", () => {
    const config: CalculatorConfig = {
      treats: [
        { id: "freebie", label: "Free Sample", description: "each", unitPrice: 0, minQuantity: 1 },
        { id: "candied-apples", label: "Candied Apples", description: "Per apple", unitPrice: 6, minQuantity: 3, enabled: false },
      ],
    };
    // Build a config that disables every default treat too.
    const allDisabled: CalculatorConfig = {
      treats: [
        "dipped-strawberries-dozen", "dipped-strawberries-half", "chocolate-apples",
        "candied-apples", "cake-pops", "cupcakes-standard", "cupcakes-gourmet",
        "cookies-decorated", "cookies-plain", "brownies", "rice-treats", "pretzel-rods",
      ].map((id) => ({ id, label: id, description: "", unitPrice: 6, minQuantity: 1, enabled: false })),
    };
    expect(getTreatStartingPrice(allDisabled)).toBeNull();
    // The first config still has priced defaults, so it is not null.
    expect(getTreatStartingPrice(config)).not.toBeNull();
  });
});

describe("calculateTierPrice", () => {
  it("applies custom shape price modifiers", () => {
    const config: CalculatorConfig = {
      shapes: [{ id: "square", label: "Square", priceModifier: 40 }],
    };
    const base = calculateTierPrice({ size: "8-round", shape: "round", flavor: "vanilla", frosting: "buttercream" });
    const withCustomSquare = calculateTierPrice(
      { size: "8-round", shape: "square", flavor: "vanilla", frosting: "buttercream" },
      config,
    );
    // 8-round base $65 + round $0 = $65; custom square adds $40 → $105.
    expect(base).toBe(65);
    expect(withCustomSquare).toBe(105);
  });
});

describe("getEffectiveShapePrice", () => {
  it("prefers config override over default", () => {
    expect(getEffectiveShapePrice("square")).toBe(10);
    expect(
      getEffectiveShapePrice("square", { shapes: [{ id: "square", label: "Square", priceModifier: 99 }] }),
    ).toBe(99);
  });
});
