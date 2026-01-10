import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Trash2, Plus } from "lucide-react";
import { InstructionModal } from "@/components/instruction-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CAKE_SIZES, CAKE_FLAVORS, FROSTING_TYPES, DECORATIONS, DELIVERY_OPTIONS, ADDONS, TREATS, type CalculatorConfig } from "@shared/schema";
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
          basePrice: s.basePrice,
          enabled: true
        })),
        flavors: config.flavors || CAKE_FLAVORS.map(f => ({
          id: f.id,
          label: f.label,
          priceModifier: f.priceModifier,
          enabled: true
        })),
        frostings: config.frostings || FROSTING_TYPES.map(f => ({
          id: f.id,
          label: f.label,
          priceModifier: f.priceModifier,
          enabled: true
        })),
        decorations: config.decorations || DECORATIONS.map(d => ({
          id: d.id,
          label: d.label,
          price: d.price,
          enabled: true
        })),
        deliveryOptions: config.deliveryOptions || DELIVERY_OPTIONS.map(d => ({
          id: d.id,
          label: d.label,
          price: d.price,
          enabled: true
        })),
        addons: config.addons || ADDONS.map(a => ({
          id: a.id,
          label: a.label,
          price: a.price,
          pricingType: a.pricingType,
          minAttendees: "minAttendees" in a ? a.minAttendees : undefined,
          enabled: true
        })),
        treats: config.treats || TREATS.map(t => ({
          id: t.id,
          label: t.label,
          description: t.description,
          unitPrice: t.unitPrice,
          minQuantity: t.minQuantity,
          enabled: true
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

  const getDeliveryPrice = (deliveryId: string) => {
    const customDelivery = pricingConfig.deliveryOptions?.find(d => d.id === deliveryId);
    const defaultDelivery = DELIVERY_OPTIONS.find(d => d.id === deliveryId);
    return customDelivery?.price ?? defaultDelivery?.price ?? 0;
  };

  const updateDeliveryPrice = (deliveryId: string, price: number) => {
    const defaultDeliveries = DELIVERY_OPTIONS.map(d => ({
      id: d.id,
      label: d.label,
      price: pricingConfig.deliveryOptions?.find(x => x.id === d.id)?.price ?? d.price
    }));
    const updatedDeliveries = defaultDeliveries.map(d => 
      d.id === deliveryId ? { ...d, price } : d
    );
    setPricingConfig({ ...pricingConfig, deliveryOptions: updatedDeliveries });
  };

  const getAddonPrice = (addonId: string) => {
    const customAddon = pricingConfig.addons?.find(a => a.id === addonId);
    const defaultAddon = ADDONS.find(a => a.id === addonId);
    return customAddon?.price ?? defaultAddon?.price ?? 0;
  };

  const updateAddonPrice = (addonId: string, price: number) => {
    const defaultAddons = ADDONS.map(a => ({
      id: a.id,
      label: a.label,
      price: pricingConfig.addons?.find(x => x.id === a.id)?.price ?? a.price,
      pricingType: a.pricingType,
      minAttendees: "minAttendees" in a ? a.minAttendees : undefined
    }));
    const updatedAddons = defaultAddons.map(a => 
      a.id === addonId ? { ...a, price } : a
    );
    setPricingConfig({ ...pricingConfig, addons: updatedAddons });
  };

  const defaultTreatIds: Set<string> = new Set(TREATS.map(t => t.id));

  const isDefaultTreat = (treatId: string) => {
    return defaultTreatIds.has(treatId);
  };

  const generateTreatId = () => {
    return `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const getAllTreats = () => {
    const defaultTreats = TREATS.map(t => ({
      id: t.id,
      label: t.label,
      description: t.description,
      unitPrice: t.unitPrice,
      minQuantity: t.minQuantity,
      enabled: true
    }));
    
    if (!pricingConfig.treats || pricingConfig.treats.length === 0) {
      return defaultTreats;
    }
    
    const customTreatsById = new Map(pricingConfig.treats.map(t => [t.id, t]));
    const mergedDefaults = defaultTreats.map(d => customTreatsById.get(d.id) || d);
    const customOnly = pricingConfig.treats.filter(t => !defaultTreatIds.has(t.id));
    
    return [...mergedDefaults, ...customOnly];
  };

  const updateTreat = (treatId: string, updates: Partial<{ label: string; description: string; unitPrice: number; enabled: boolean }>) => {
    const currentTreats = getAllTreats();
    const updatedTreats = currentTreats.map(t => 
      t.id === treatId ? { ...t, ...updates } : t
    );
    setPricingConfig({ ...pricingConfig, treats: updatedTreats });
  };

  const addTreat = () => {
    const currentTreats = getAllTreats();
    const newTreat = {
      id: generateTreatId(),
      label: "",
      description: "",
      unitPrice: 0,
      minQuantity: 1,
      enabled: true
    };
    setPricingConfig({ ...pricingConfig, treats: [...currentTreats, newTreat] });
  };

  const removeTreat = (treatId: string) => {
    const currentTreats = getAllTreats();
    const updatedTreats = currentTreats.filter(t => t.id !== treatId);
    setPricingConfig({ ...pricingConfig, treats: updatedTreats });
  };

  return (
    <DashboardLayout title="Calculator Pricing" actions={<InstructionModal page="pricing" />}>
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

        <Card>
          <CardHeader>
            <CardTitle>Addons</CardTitle>
            <CardDescription>
              Set prices for extra sweet treats and services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {ADDONS.map((addon) => (
                <div key={addon.id} className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{addon.label}</span>
                    {addon.pricingType === "per-attendee" && (
                      <span className="text-xs text-muted-foreground ml-2">(per attendee)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      className="w-20"
                      value={getAddonPrice(addon.id)}
                      onChange={(e) => updateAddonPrice(addon.id, Number(e.target.value))}
                      data-testid={`input-addon-price-${addon.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Treats</CardTitle>
                <CardDescription>
                  Manage standalone treat items for your calculator
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addTreat}
                data-testid="button-add-treat"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Treat
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {getAllTreats().map((treat) => {
                const isDefault = isDefaultTreat(treat.id);
                const isEnabled = treat.enabled !== false;
                return (
                  <div
                    key={treat.id}
                    className={`grid gap-3 p-3 rounded-lg border ${!isEnabled ? "opacity-50 bg-muted/30" : ""}`}
                    data-testid={`treat-row-${treat.id}`}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => updateTreat(treat.id, { enabled: checked })}
                        data-testid={`switch-treat-enabled-${treat.id}`}
                      />
                      <Input
                        placeholder="Product name"
                        className="flex-1 min-w-[140px]"
                        value={treat.label}
                        onChange={(e) => updateTreat(treat.id, { label: e.target.value })}
                        data-testid={`input-treat-label-${treat.id}`}
                      />
                      <Input
                        placeholder="Description"
                        className="flex-1 min-w-[120px]"
                        value={treat.description}
                        onChange={(e) => updateTreat(treat.id, { description: e.target.value })}
                        data-testid={`input-treat-description-${treat.id}`}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min={0}
                          className="w-20"
                          value={treat.unitPrice}
                          onChange={(e) => updateTreat(treat.id, { unitPrice: Number(e.target.value) })}
                          data-testid={`input-treat-price-${treat.id}`}
                        />
                      </div>
                      {!isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTreat(treat.id)}
                          data-testid={`button-delete-treat-${treat.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      {isDefault && <div className="w-9" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery & Setup</CardTitle>
            <CardDescription>
              Set prices for delivery and setup options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {DELIVERY_OPTIONS.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium flex-1">{delivery.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      className="w-20"
                      value={getDeliveryPrice(delivery.id)}
                      onChange={(e) => updateDeliveryPrice(delivery.id, Number(e.target.value))}
                      data-testid={`input-delivery-price-${delivery.id}`}
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
