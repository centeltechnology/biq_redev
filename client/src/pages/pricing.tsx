import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Trash2, Plus } from "lucide-react";
import { InstructionModal } from "@/components/instruction-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CAKE_SIZES, CAKE_FLAVORS, FROSTING_TYPES, DECORATIONS, DELIVERY_OPTIONS, ADDONS, TREATS, type CalculatorConfig } from "@shared/schema";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Helper to generate unique IDs
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Default item sets for checking if item is a default (cast to string for flexible matching)
const defaultSizeIds = new Set<string>(CAKE_SIZES.map(s => s.id));
const defaultFlavorIds = new Set<string>(CAKE_FLAVORS.map(f => f.id));
const defaultFrostingIds = new Set<string>(FROSTING_TYPES.map(f => f.id));
const defaultDecorationIds = new Set<string>(DECORATIONS.map(d => d.id));
const defaultAddonIds = new Set<string>(ADDONS.map(a => a.id));
const defaultTreatIds = new Set<string>(TREATS.map(t => t.id));
const defaultDeliveryIds = new Set<string>(DELIVERY_OPTIONS.map(d => d.id));

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
      const res = await apiRequest("PATCH", "/api/bakers/me", { calculatorConfig: config });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Calculator pricing updated successfully" });
    },
  });

  // ============================================
  // SIZES - Get, Update, Add, Remove
  // ============================================
  const getAllSizes = () => {
    const defaults = CAKE_SIZES.map(s => ({
      id: s.id as string,
      label: s.label,
      servings: String(s.servings),
      basePrice: s.basePrice,
      enabled: true
    }));
    
    if (!pricingConfig.sizes || pricingConfig.sizes.length === 0) {
      return defaults;
    }
    
    const customById = new Map(pricingConfig.sizes.map(s => [s.id, s]));
    const merged = defaults.map(d => customById.get(d.id) || d);
    const customOnly = pricingConfig.sizes.filter(s => !defaultSizeIds.has(s.id));
    
    return [...merged, ...customOnly];
  };

  const updateSize = (sizeId: string, updates: Partial<{ label: string; servings: string; basePrice: number; enabled: boolean }>) => {
    const current = getAllSizes();
    const updated = current.map(s => s.id === sizeId ? { ...s, ...updates } : s);
    setPricingConfig({ ...pricingConfig, sizes: updated });
  };

  const addSize = () => {
    const current = getAllSizes();
    const newSize = {
      id: generateId("size"),
      label: "",
      servings: "0",
      basePrice: 0,
      enabled: true
    };
    setPricingConfig({ ...pricingConfig, sizes: [...current, newSize] });
  };

  const removeSize = (sizeId: string) => {
    const current = getAllSizes();
    const updated = current.filter(s => s.id !== sizeId);
    setPricingConfig({ ...pricingConfig, sizes: updated });
  };

  // ============================================
  // FLAVORS - Get, Update, Add, Remove
  // ============================================
  const getAllFlavors = () => {
    const defaults = CAKE_FLAVORS.map(f => ({
      id: f.id as string,
      label: f.label,
      priceModifier: f.priceModifier,
      enabled: true
    }));
    
    if (!pricingConfig.flavors || pricingConfig.flavors.length === 0) {
      return defaults;
    }
    
    const customById = new Map(pricingConfig.flavors.map(f => [f.id, f]));
    const merged = defaults.map(d => customById.get(d.id) || d);
    const customOnly = pricingConfig.flavors.filter(f => !defaultFlavorIds.has(f.id));
    
    return [...merged, ...customOnly];
  };

  const updateFlavor = (flavorId: string, updates: Partial<{ label: string; priceModifier: number; enabled: boolean }>) => {
    const current = getAllFlavors();
    const updated = current.map(f => f.id === flavorId ? { ...f, ...updates } : f);
    setPricingConfig({ ...pricingConfig, flavors: updated });
  };

  const addFlavor = () => {
    const current = getAllFlavors();
    const newFlavor = {
      id: generateId("flavor"),
      label: "",
      priceModifier: 0,
      enabled: true
    };
    setPricingConfig({ ...pricingConfig, flavors: [...current, newFlavor] });
  };

  const removeFlavor = (flavorId: string) => {
    const current = getAllFlavors();
    const updated = current.filter(f => f.id !== flavorId);
    setPricingConfig({ ...pricingConfig, flavors: updated });
  };

  // ============================================
  // FROSTINGS - Get, Update, Add, Remove
  // ============================================
  const getAllFrostings = () => {
    const defaults = FROSTING_TYPES.map(f => ({
      id: f.id as string,
      label: f.label,
      priceModifier: f.priceModifier,
      enabled: true
    }));
    
    if (!pricingConfig.frostings || pricingConfig.frostings.length === 0) {
      return defaults;
    }
    
    const customById = new Map(pricingConfig.frostings.map(f => [f.id, f]));
    const merged = defaults.map(d => customById.get(d.id) || d);
    const customOnly = pricingConfig.frostings.filter(f => !defaultFrostingIds.has(f.id));
    
    return [...merged, ...customOnly];
  };

  const updateFrosting = (frostingId: string, updates: Partial<{ label: string; priceModifier: number; enabled: boolean }>) => {
    const current = getAllFrostings();
    const updated = current.map(f => f.id === frostingId ? { ...f, ...updates } : f);
    setPricingConfig({ ...pricingConfig, frostings: updated });
  };

  const addFrosting = () => {
    const current = getAllFrostings();
    const newFrosting = {
      id: generateId("frosting"),
      label: "",
      priceModifier: 0,
      enabled: true
    };
    setPricingConfig({ ...pricingConfig, frostings: [...current, newFrosting] });
  };

  const removeFrosting = (frostingId: string) => {
    const current = getAllFrostings();
    const updated = current.filter(f => f.id !== frostingId);
    setPricingConfig({ ...pricingConfig, frostings: updated });
  };

  // ============================================
  // DECORATIONS - Get, Update, Add, Remove
  // ============================================
  const getAllDecorations = () => {
    const defaults = DECORATIONS.map(d => ({
      id: d.id as string,
      label: d.label,
      price: d.price,
      enabled: true
    }));
    
    if (!pricingConfig.decorations || pricingConfig.decorations.length === 0) {
      return defaults;
    }
    
    const customById = new Map(pricingConfig.decorations.map(d => [d.id, d]));
    const merged = defaults.map(d => customById.get(d.id) || d);
    const customOnly = pricingConfig.decorations.filter(d => !defaultDecorationIds.has(d.id));
    
    return [...merged, ...customOnly];
  };

  const updateDecoration = (decorationId: string, updates: Partial<{ label: string; price: number; enabled: boolean }>) => {
    const current = getAllDecorations();
    const updated = current.map(d => d.id === decorationId ? { ...d, ...updates } : d);
    setPricingConfig({ ...pricingConfig, decorations: updated });
  };

  const addDecoration = () => {
    const current = getAllDecorations();
    const newDecoration = {
      id: generateId("decoration"),
      label: "",
      price: 0,
      enabled: true
    };
    setPricingConfig({ ...pricingConfig, decorations: [...current, newDecoration] });
  };

  const removeDecoration = (decorationId: string) => {
    const current = getAllDecorations();
    const updated = current.filter(d => d.id !== decorationId);
    setPricingConfig({ ...pricingConfig, decorations: updated });
  };

  // ============================================
  // ADDONS - Get, Update, Add, Remove
  // ============================================
  const getAllAddons = () => {
    const defaults = ADDONS.map(a => ({
      id: a.id as string,
      label: a.label,
      price: a.price,
      pricingType: a.pricingType as "flat" | "per-attendee",
      minAttendees: "minAttendees" in a ? a.minAttendees : undefined,
      enabled: true
    }));
    
    if (!pricingConfig.addons || pricingConfig.addons.length === 0) {
      return defaults;
    }
    
    const customById = new Map(pricingConfig.addons.map(a => [a.id, a]));
    const merged = defaults.map(d => customById.get(d.id) || d);
    const customOnly = pricingConfig.addons.filter(a => !defaultAddonIds.has(a.id));
    
    return [...merged, ...customOnly];
  };

  const updateAddon = (addonId: string, updates: Partial<{ label: string; price: number; pricingType: "flat" | "per-attendee"; enabled: boolean }>) => {
    const current = getAllAddons();
    const updated = current.map(a => a.id === addonId ? { ...a, ...updates } : a);
    setPricingConfig({ ...pricingConfig, addons: updated });
  };

  const addAddon = () => {
    const current = getAllAddons();
    const newAddon = {
      id: generateId("addon"),
      label: "",
      price: 0,
      pricingType: "flat" as const,
      enabled: true
    };
    setPricingConfig({ ...pricingConfig, addons: [...current, newAddon] });
  };

  const removeAddon = (addonId: string) => {
    const current = getAllAddons();
    const updated = current.filter(a => a.id !== addonId);
    setPricingConfig({ ...pricingConfig, addons: updated });
  };

  // ============================================
  // DELIVERY - Get, Update, Add, Remove
  // ============================================
  const getAllDeliveryOptions = () => {
    const defaults = DELIVERY_OPTIONS.map(d => ({
      id: d.id as string,
      label: d.label,
      price: d.price,
      enabled: true
    }));
    
    if (!pricingConfig.deliveryOptions || pricingConfig.deliveryOptions.length === 0) {
      return defaults;
    }
    
    const customById = new Map(pricingConfig.deliveryOptions.map(d => [d.id, d]));
    const merged = defaults.map(d => customById.get(d.id) || d);
    const customOnly = pricingConfig.deliveryOptions.filter(d => !defaultDeliveryIds.has(d.id));
    
    return [...merged, ...customOnly];
  };

  const updateDeliveryOption = (deliveryId: string, updates: Partial<{ label: string; price: number; enabled: boolean }>) => {
    const current = getAllDeliveryOptions();
    const updated = current.map(d => d.id === deliveryId ? { ...d, ...updates } : d);
    setPricingConfig({ ...pricingConfig, deliveryOptions: updated });
  };

  const addDeliveryOption = () => {
    const current = getAllDeliveryOptions();
    const newDelivery = {
      id: generateId("delivery"),
      label: "",
      price: 0,
      enabled: true
    };
    setPricingConfig({ ...pricingConfig, deliveryOptions: [...current, newDelivery] });
  };

  const removeDeliveryOption = (deliveryId: string) => {
    const current = getAllDeliveryOptions();
    const updated = current.filter(d => d.id !== deliveryId);
    setPricingConfig({ ...pricingConfig, deliveryOptions: updated });
  };

  // ============================================
  // TREATS - Get, Update, Add, Remove
  // ============================================
  const getAllTreats = () => {
    const defaults = TREATS.map(t => ({
      id: t.id as string,
      label: t.label,
      description: t.description,
      unitPrice: t.unitPrice,
      minQuantity: t.minQuantity,
      enabled: true
    }));
    
    if (!pricingConfig.treats || pricingConfig.treats.length === 0) {
      return defaults;
    }
    
    const customById = new Map(pricingConfig.treats.map(t => [t.id, t]));
    const merged = defaults.map(d => customById.get(d.id) || d);
    const customOnly = pricingConfig.treats.filter(t => !defaultTreatIds.has(t.id));
    
    return [...merged, ...customOnly];
  };

  const updateTreat = (treatId: string, updates: Partial<{ label: string; description: string; unitPrice: number; enabled: boolean }>) => {
    const current = getAllTreats();
    const updated = current.map(t => t.id === treatId ? { ...t, ...updates } : t);
    setPricingConfig({ ...pricingConfig, treats: updated });
  };

  const addTreat = () => {
    const current = getAllTreats();
    const newTreat = {
      id: generateId("treat"),
      label: "",
      description: "",
      unitPrice: 0,
      minQuantity: 1,
      enabled: true
    };
    setPricingConfig({ ...pricingConfig, treats: [...current, newTreat] });
  };

  const removeTreat = (treatId: string) => {
    const current = getAllTreats();
    const updated = current.filter(t => t.id !== treatId);
    setPricingConfig({ ...pricingConfig, treats: updated });
  };

  return (
    <DashboardLayout title="Calculator Pricing" actions={<InstructionModal page="pricing" />}>
      <div className="max-w-2xl space-y-6">
        {/* CAKE SIZES */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Cake Sizes</CardTitle>
                <CardDescription>
                  Set base prices for each cake size
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addSize}
                data-testid="button-add-size"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Size
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {getAllSizes().map((size) => {
                const isDefault = defaultSizeIds.has(size.id);
                const isEnabled = size.enabled !== false;
                return (
                  <div 
                    key={size.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg border ${!isEnabled ? "opacity-50 bg-muted/30" : ""}`}
                  >
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => updateSize(size.id, { enabled: checked })}
                      data-testid={`switch-size-enabled-${size.id}`}
                    />
                    <Input
                      placeholder="Size name"
                      className="flex-1 min-w-[100px]"
                      value={size.label}
                      onChange={(e) => updateSize(size.id, { label: e.target.value })}
                      data-testid={`input-size-label-${size.id}`}
                    />
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        className="w-16"
                        value={size.servings}
                        onChange={(e) => updateSize(size.id, { servings: e.target.value })}
                        data-testid={`input-size-servings-${size.id}`}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">servings</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-20"
                        value={size.basePrice}
                        onChange={(e) => updateSize(size.id, { basePrice: Number(e.target.value) })}
                        data-testid={`input-size-price-${size.id}`}
                      />
                    </div>
                    {!isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSize(size.id)}
                        data-testid={`button-delete-size-${size.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {isDefault && <div className="w-9" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* FLAVORS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Flavors</CardTitle>
                <CardDescription>
                  Set add-on prices for each cake flavor
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addFlavor}
                data-testid="button-add-flavor"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Flavor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {getAllFlavors().map((flavor) => {
                const isDefault = defaultFlavorIds.has(flavor.id);
                const isEnabled = flavor.enabled !== false;
                return (
                  <div 
                    key={flavor.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg border ${!isEnabled ? "opacity-50 bg-muted/30" : ""}`}
                  >
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => updateFlavor(flavor.id, { enabled: checked })}
                      data-testid={`switch-flavor-enabled-${flavor.id}`}
                    />
                    <Input
                      placeholder="Flavor name"
                      className="flex-1"
                      value={flavor.label}
                      onChange={(e) => updateFlavor(flavor.id, { label: e.target.value })}
                      data-testid={`input-flavor-label-${flavor.id}`}
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">+$</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-20"
                        value={flavor.priceModifier}
                        onChange={(e) => updateFlavor(flavor.id, { priceModifier: Number(e.target.value) })}
                        data-testid={`input-flavor-price-${flavor.id}`}
                      />
                    </div>
                    {!isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFlavor(flavor.id)}
                        data-testid={`button-delete-flavor-${flavor.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {isDefault && <div className="w-9" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* FROSTINGS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Frostings</CardTitle>
                <CardDescription>
                  Set add-on prices for each frosting type
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addFrosting}
                data-testid="button-add-frosting"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Frosting
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {getAllFrostings().map((frosting) => {
                const isDefault = defaultFrostingIds.has(frosting.id);
                const isEnabled = frosting.enabled !== false;
                return (
                  <div 
                    key={frosting.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg border ${!isEnabled ? "opacity-50 bg-muted/30" : ""}`}
                  >
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => updateFrosting(frosting.id, { enabled: checked })}
                      data-testid={`switch-frosting-enabled-${frosting.id}`}
                    />
                    <Input
                      placeholder="Frosting name"
                      className="flex-1"
                      value={frosting.label}
                      onChange={(e) => updateFrosting(frosting.id, { label: e.target.value })}
                      data-testid={`input-frosting-label-${frosting.id}`}
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">+$</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-20"
                        value={frosting.priceModifier}
                        onChange={(e) => updateFrosting(frosting.id, { priceModifier: Number(e.target.value) })}
                        data-testid={`input-frosting-price-${frosting.id}`}
                      />
                    </div>
                    {!isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFrosting(frosting.id)}
                        data-testid={`button-delete-frosting-${frosting.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {isDefault && <div className="w-9" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* DECORATIONS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Decorations</CardTitle>
                <CardDescription>
                  Set prices for each decoration option
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addDecoration}
                data-testid="button-add-decoration"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Decoration
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {getAllDecorations().map((decoration) => {
                const isDefault = defaultDecorationIds.has(decoration.id);
                const isEnabled = decoration.enabled !== false;
                return (
                  <div 
                    key={decoration.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg border ${!isEnabled ? "opacity-50 bg-muted/30" : ""}`}
                  >
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => updateDecoration(decoration.id, { enabled: checked })}
                      data-testid={`switch-decoration-enabled-${decoration.id}`}
                    />
                    <Input
                      placeholder="Decoration name"
                      className="flex-1"
                      value={decoration.label}
                      onChange={(e) => updateDecoration(decoration.id, { label: e.target.value })}
                      data-testid={`input-decoration-label-${decoration.id}`}
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-20"
                        value={decoration.price}
                        onChange={(e) => updateDecoration(decoration.id, { price: Number(e.target.value) })}
                        data-testid={`input-decoration-price-${decoration.id}`}
                      />
                    </div>
                    {!isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDecoration(decoration.id)}
                        data-testid={`button-delete-decoration-${decoration.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {isDefault && <div className="w-9" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ADDONS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Addons</CardTitle>
                <CardDescription>
                  Set prices for extra sweet treats and services
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addAddon}
                data-testid="button-add-addon"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Addon
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {getAllAddons().map((addon) => {
                const isDefault = defaultAddonIds.has(addon.id);
                const isEnabled = addon.enabled !== false;
                return (
                  <div 
                    key={addon.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg border ${!isEnabled ? "opacity-50 bg-muted/30" : ""}`}
                  >
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => updateAddon(addon.id, { enabled: checked })}
                      data-testid={`switch-addon-enabled-${addon.id}`}
                    />
                    <Input
                      placeholder="Addon name"
                      className="flex-1"
                      value={addon.label}
                      onChange={(e) => updateAddon(addon.id, { label: e.target.value })}
                      data-testid={`input-addon-label-${addon.id}`}
                    />
                    {addon.pricingType === "per-attendee" && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">(per attendee)</span>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-20"
                        value={addon.price}
                        onChange={(e) => updateAddon(addon.id, { price: Number(e.target.value) })}
                        data-testid={`input-addon-price-${addon.id}`}
                      />
                    </div>
                    {!isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAddon(addon.id)}
                        data-testid={`button-delete-addon-${addon.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {isDefault && <div className="w-9" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* TREATS */}
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
                const isDefault = defaultTreatIds.has(treat.id);
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

        {/* DELIVERY & SETUP */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Delivery & Setup</CardTitle>
                <CardDescription>
                  Set prices for delivery and setup options (edit labels to set mile ranges)
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addDeliveryOption}
                data-testid="button-add-delivery"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {getAllDeliveryOptions().map((delivery) => {
                const isDefault = defaultDeliveryIds.has(delivery.id);
                const isEnabled = delivery.enabled !== false;
                return (
                  <div 
                    key={delivery.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg border ${!isEnabled ? "opacity-50 bg-muted/30" : ""}`}
                  >
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => updateDeliveryOption(delivery.id, { enabled: checked })}
                      data-testid={`switch-delivery-enabled-${delivery.id}`}
                    />
                    <Input
                      placeholder="e.g., Delivery (0-10 miles)"
                      className="flex-1"
                      value={delivery.label}
                      onChange={(e) => updateDeliveryOption(delivery.id, { label: e.target.value })}
                      data-testid={`input-delivery-label-${delivery.id}`}
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-20"
                        value={delivery.price}
                        onChange={(e) => updateDeliveryOption(delivery.id, { price: Number(e.target.value) })}
                        data-testid={`input-delivery-price-${delivery.id}`}
                      />
                    </div>
                    {!isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDeliveryOption(delivery.id)}
                        data-testid={`button-delete-delivery-${delivery.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {isDefault && <div className="w-9" />}
                  </div>
                );
              })}
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
