import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAKE_SIZES, CAKE_FLAVORS, FROSTING_TYPES, DECORATIONS, type CalculatorConfig } from "@shared/schema";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PricingPage() {
  const { baker } = useAuth();
  const { toast } = useToast();
  const [pricingConfig, setPricingConfig] = useState<CalculatorConfig>({});

  useEffect(() => {
    if (baker?.calculatorConfig) {
      setPricingConfig(baker.calculatorConfig as CalculatorConfig);
    }
  }, [baker]);

  const updatePricingMutation = useMutation({
    mutationFn: async (config: CalculatorConfig) => {
      // Build complete config with defaults for any missing categories
      const completeConfig: CalculatorConfig = {
        sizes: config.sizes || CAKE_SIZES.map(s => ({
          id: s.id,
          label: s.label,
          servings: s.servings,
          basePrice: s.basePrice
        })),
        flavors: config.flavors || CAKE_FLAVORS.map(f => ({
          id: f.id,
          label: f.label,
          priceModifier: f.priceModifier
        })),
        frostings: config.frostings || FROSTING_TYPES.map(f => ({
          id: f.id,
          label: f.label,
          priceModifier: f.priceModifier
        })),
        decorations: config.decorations || DECORATIONS.map(d => ({
          id: d.id,
          label: d.label,
          price: d.price
        })),
      };
      const res = await apiRequest("PATCH", "/api/bakers/me", { calculatorConfig: completeConfig });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Calculator pricing updated successfully" });
    },
  });

  const getSizePrice = (sizeId: string) => {
    const customSize = pricingConfig.sizes?.find(s => s.id === sizeId);
    const defaultSize = CAKE_SIZES.find(s => s.id === sizeId);
    return customSize?.basePrice ?? defaultSize?.basePrice ?? 0;
  };

  const updateSizePrice = (sizeId: string, price: number) => {
    const defaultSizes = CAKE_SIZES.map(s => ({
      id: s.id,
      label: s.label,
      servings: s.servings,
      basePrice: pricingConfig.sizes?.find(x => x.id === s.id)?.basePrice ?? s.basePrice
    }));
    const updatedSizes = defaultSizes.map(s => 
      s.id === sizeId ? { ...s, basePrice: price } : s
    );
    setPricingConfig({ ...pricingConfig, sizes: updatedSizes });
  };

  const getFlavorPrice = (flavorId: string) => {
    const customFlavor = pricingConfig.flavors?.find(f => f.id === flavorId);
    const defaultFlavor = CAKE_FLAVORS.find(f => f.id === flavorId);
    return customFlavor?.priceModifier ?? defaultFlavor?.priceModifier ?? 0;
  };

  const updateFlavorPrice = (flavorId: string, price: number) => {
    const defaultFlavors = CAKE_FLAVORS.map(f => ({
      id: f.id,
      label: f.label,
      priceModifier: pricingConfig.flavors?.find(x => x.id === f.id)?.priceModifier ?? f.priceModifier
    }));
    const updatedFlavors = defaultFlavors.map(f => 
      f.id === flavorId ? { ...f, priceModifier: price } : f
    );
    setPricingConfig({ ...pricingConfig, flavors: updatedFlavors });
  };

  const getFrostingPrice = (frostingId: string) => {
    const customFrosting = pricingConfig.frostings?.find(f => f.id === frostingId);
    const defaultFrosting = FROSTING_TYPES.find(f => f.id === frostingId);
    return customFrosting?.priceModifier ?? defaultFrosting?.priceModifier ?? 0;
  };

  const updateFrostingPrice = (frostingId: string, price: number) => {
    const defaultFrostings = FROSTING_TYPES.map(f => ({
      id: f.id,
      label: f.label,
      priceModifier: pricingConfig.frostings?.find(x => x.id === f.id)?.priceModifier ?? f.priceModifier
    }));
    const updatedFrostings = defaultFrostings.map(f => 
      f.id === frostingId ? { ...f, priceModifier: price } : f
    );
    setPricingConfig({ ...pricingConfig, frostings: updatedFrostings });
  };

  const getDecorationPrice = (decorationId: string) => {
    const customDecoration = pricingConfig.decorations?.find(d => d.id === decorationId);
    const defaultDecoration = DECORATIONS.find(d => d.id === decorationId);
    return customDecoration?.price ?? defaultDecoration?.price ?? 0;
  };

  const updateDecorationPrice = (decorationId: string, price: number) => {
    const defaultDecorations = DECORATIONS.map(d => ({
      id: d.id,
      label: d.label,
      price: pricingConfig.decorations?.find(x => x.id === d.id)?.price ?? d.price
    }));
    const updatedDecorations = defaultDecorations.map(d => 
      d.id === decorationId ? { ...d, price } : d
    );
    setPricingConfig({ ...pricingConfig, decorations: updatedDecorations });
  };

  return (
    <DashboardLayout title="Calculator Pricing">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cake Sizes</CardTitle>
            <CardDescription>
              Set base prices for each cake size
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {CAKE_SIZES.map((size) => (
                <div key={size.id} className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{size.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">({size.servings} servings)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      className="w-20"
                      value={getSizePrice(size.id)}
                      onChange={(e) => updateSizePrice(size.id, Number(e.target.value))}
                      data-testid={`input-size-price-${size.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flavors</CardTitle>
            <CardDescription>
              Set add-on prices for each cake flavor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {CAKE_FLAVORS.map((flavor) => (
                <div key={flavor.id} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium flex-1">{flavor.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">+$</span>
                    <Input
                      type="number"
                      min={0}
                      className="w-20"
                      value={getFlavorPrice(flavor.id)}
                      onChange={(e) => updateFlavorPrice(flavor.id, Number(e.target.value))}
                      data-testid={`input-flavor-price-${flavor.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Frostings</CardTitle>
            <CardDescription>
              Set add-on prices for each frosting type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {FROSTING_TYPES.map((frosting) => (
                <div key={frosting.id} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium flex-1">{frosting.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">+$</span>
                    <Input
                      type="number"
                      min={0}
                      className="w-20"
                      value={getFrostingPrice(frosting.id)}
                      onChange={(e) => updateFrostingPrice(frosting.id, Number(e.target.value))}
                      data-testid={`input-frosting-price-${frosting.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decorations</CardTitle>
            <CardDescription>
              Set prices for each decoration option
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {DECORATIONS.map((decoration) => (
                <div key={decoration.id} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium flex-1">{decoration.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      className="w-20"
                      value={getDecorationPrice(decoration.id)}
                      onChange={(e) => updateDecorationPrice(decoration.id, Number(e.target.value))}
                      data-testid={`input-decoration-price-${decoration.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => updatePricingMutation.mutate(pricingConfig)}
          disabled={updatePricingMutation.isPending}
          className="w-full"
          data-testid="button-save-pricing"
        >
          {updatePricingMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save All Pricing"
          )}
        </Button>
      </div>
    </DashboardLayout>
  );
}
