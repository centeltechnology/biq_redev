import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  Check, ChevronRight, ChevronLeft, Store, FileText, CreditCard,
  Copy, Loader2, ExternalLink, Upload, Image, Cake, Cookie,
  Layers, DollarSign, MessageCircle, Camera
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";

const STEPS = [
  { label: "Products", icon: Layers },
  { label: "Bakery", icon: Store },
  { label: "Portfolio", icon: Camera },
  { label: "Pricing", icon: DollarSign },
  { label: "Preview", icon: FileText },
  { label: "Share", icon: MessageCircle },
  { label: "Get Paid", icon: CreditCard },
];

type ProductMode = "cakes" | "treats" | "both";

export default function OnboardingPage() {
  const { baker } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload({});

  const [currentStep, setCurrentStep] = useState(1);
  const [productMode, setProductMode] = useState<ProductMode | null>(null);
  const [cakeTier, setCakeTier] = useState<string | null>(null);
  const [treatTier, setTreatTier] = useState<string | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [dmOption, setDmOption] = useState<string | null>(null);
  const [dmCopied, setDmCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [headerImage, setHeaderImage] = useState<string | null>(null);

  useEffect(() => {
    if (baker) {
      setBusinessName(baker.businessName || "");
      setSlug(baker.slug || "");
      setProfilePhoto(baker.profilePhoto || null);
      setHeaderImage(baker.calculatorHeaderImage || null);
      if ((baker as any).productMode) setProductMode((baker as any).productMode as ProductMode);
      if ((baker as any).cakePricingTier) setCakeTier((baker as any).cakePricingTier);
      if ((baker as any).treatPricingTier) setTreatTier((baker as any).treatPricingTier);
      if (baker.portfolioImages?.length) setPortfolioImages(baker.portfolioImages);
      if (baker.onboardingStep > 1) {
        const resumeStep = baker.onboardingStep;
        if (resumeStep >= 3 && !(baker as any).productMode) {
          setCurrentStep(1);
        } else {
          setCurrentStep(resumeStep);
        }
      }
      if (baker.onboardingCompleted && baker.onboardingStep < 6) {
        setLocation("/dashboard");
      }
    }
  }, [baker]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiRequest("PATCH", "/api/bakers/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
  });

  const updateSlugMutation = useMutation({
    mutationFn: async (newSlug: string) => {
      const res = await apiRequest("PATCH", "/api/bakers/me/slug", { slug: newSlug });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
  });

  const saveStepMutation = useMutation({
    mutationFn: async (step: number) => {
      await apiRequest("PATCH", "/api/baker/onboarding-step", { step });
    },
  });

  const seedPricingMutation = useMutation({
    mutationFn: async (data: { productMode: string; cakePricingTier?: string | null; treatPricingTier?: string | null }) => {
      const res = await apiRequest("POST", "/api/baker/seed-pricing", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/baker/onboarding-complete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      let accountId = baker?.stripeConnectAccountId;
      if (!accountId) {
        const res = await apiRequest("POST", "/api/stripe-connect/create-account");
        const data = await res.json();
        accountId = data.accountId;
      }
      const linkRes = await apiRequest("POST", "/api/stripe-connect/onboarding-link");
      return linkRes.json();
    },
    onSuccess: (data: any) => {
      if (data.url) window.location.href = data.url;
    },
    onError: () => {
      toast({ title: "Failed to start Stripe setup", variant: "destructive" });
    },
  });

  const checkSlug = async (value: string) => {
    if (value.length < 3) {
      setSlugAvailable(null);
      return;
    }
    setSlugChecking(true);
    try {
      const res = await fetch(`/api/bakers/check-slug/${value}`);
      const data = await res.json();
      setSlugAvailable(data.available);
    } catch {
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  };

  const handleSlugChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(cleaned);
    setSlugAvailable(null);
    if (cleaned.length >= 3) {
      const timeout = setTimeout(() => checkSlug(cleaned), 400);
      return () => clearTimeout(timeout);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadFile(file);
    if (result) {
      setProfilePhoto(result.objectPath);
      await updateProfileMutation.mutateAsync({ profilePhoto: result.objectPath });
    }
  };

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadFile(file);
    if (result) {
      setHeaderImage(result.objectPath);
      await updateProfileMutation.mutateAsync({ calculatorHeaderImage: result.objectPath });
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (portfolioImages.length >= 6) {
      toast({ title: "Maximum 6 images", variant: "destructive" });
      return;
    }
    const result = await uploadFile(file);
    if (result) {
      const updated = [...portfolioImages, result.objectPath];
      setPortfolioImages(updated);
      await updateProfileMutation.mutateAsync({ portfolioImages: updated });
    }
  };

  const removePortfolioImage = async (index: number) => {
    const updated = portfolioImages.filter((_, i) => i !== index);
    setPortfolioImages(updated);
    await updateProfileMutation.mutateAsync({ portfolioImages: updated });
  };

  const goToStep = async (step: number) => {
    await saveStepMutation.mutateAsync(step);
    setCurrentStep(step);
  };

  const handleStep1Continue = async () => {
    if (!productMode) {
      toast({ title: "Please select what you sell", variant: "destructive" });
      return;
    }
    await updateProfileMutation.mutateAsync({
      productMode,
      enableCakes: productMode === "cakes" || productMode === "both",
      enableTreats: productMode === "treats" || productMode === "both",
    });
    await goToStep(2);
  };

  const handleStep2Continue = async () => {
    if (!businessName.trim()) {
      toast({ title: "Please enter your business name", variant: "destructive" });
      return;
    }
    await updateProfileMutation.mutateAsync({ businessName });
    if (slug && slug !== baker?.slug && slugAvailable !== false) {
      try {
        await updateSlugMutation.mutateAsync(slug);
      } catch {
      }
    }
    await goToStep(3);
  };

  const handleStep3Continue = async () => {
    await goToStep(4);
  };

  const handleStep4Continue = async () => {
    const needsCake = productMode === "cakes" || productMode === "both";
    const needsTreat = productMode === "treats" || productMode === "both";
    if (needsCake && !cakeTier) {
      toast({ title: "Please select a cake pricing style", variant: "destructive" });
      return;
    }
    if (needsTreat && !treatTier) {
      toast({ title: "Please select a treat pricing style", variant: "destructive" });
      return;
    }
    await seedPricingMutation.mutateAsync({
      productMode: productMode!,
      cakePricingTier: cakeTier,
      treatPricingTier: treatTier,
    });
    await goToStep(5);
  };

  const handleStep5Continue = async () => {
    await goToStep(6);
  };

  const handleStep6Continue = async () => {
    await completeMutation.mutateAsync();
    if (!sessionStorage.getItem("fbq_complete_reg_fired") && (window as any).fbq) {
      (window as any).fbq("track", "CompleteRegistration");
      sessionStorage.setItem("fbq_complete_reg_fired", "1");
    }
    await goToStep(7);
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/c/${baker?.slug || slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast({ title: "Link copied!" });
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const handleCopyDmMessage = async () => {
    const url = `${window.location.origin}/c/${baker?.slug || slug}`;
    const message = `Thanks for reaching out! You can build your order and get an instant estimate here: ${url}`;
    try {
      await navigator.clipboard.writeText(message);
      setDmCopied(true);
      toast({ title: "Message copied!" });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  const handleSkipStripe = () => {
    setLocation("/dashboard");
  };

  const calculatorUrl = `${window.location.origin}/c/${baker?.slug || slug}`;

  const getEstimatedPrice = () => {
    if (productMode === "treats") {
      const tierPrices: Record<string, number> = { starter: 35, popular: 45, premium: 60 };
      return tierPrices[treatTier || "popular"] || 45;
    }
    const tierPrices: Record<string, number> = { simple: 120, detailed: 156, luxury: 192 };
    return tierPrices[cakeTier || "simple"] || 120;
  };

  const getDmHelperCopy = () => {
    if (dmOption === "yes_now") return "Send this reply right now.";
    if (dmOption === "yes_often") return "Next time someone asks \"How much?\", send them this.";
    if (dmOption === "exploring") return "When customers start asking for quotes, send them this link.";
    return "Copy this message and send it when someone asks for pricing.";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="page-onboarding">
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold" data-testid="text-onboarding-title">Set up your bakery</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Step {currentStep} of {STEPS.length}</p>
        </div>

        <div className="flex items-center justify-center gap-0.5 mb-6">
          {STEPS.map((_, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === currentStep;
            const isComplete = stepNum < currentStep;
            return (
              <div
                key={stepNum}
                className={`h-1.5 flex-1 max-w-8 rounded-full transition-colors ${
                  isComplete ? "bg-green-500" : isActive ? "bg-primary" : "bg-muted"
                }`}
                data-testid={`stepper-bar-${stepNum}`}
              />
            );
          })}
        </div>

        <div className="flex-1 flex flex-col">

          {currentStep === 1 && (
            <div className="flex-1 flex flex-col" data-testid="card-step-1">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold">What do you sell most?</h2>
                <p className="text-sm text-muted-foreground mt-1">This helps us set up your pricing and order page</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-auto">
                {([
                  { value: "cakes" as ProductMode, label: "Custom Cakes", icon: Cake, desc: "Layer cakes, sheet cakes" },
                  { value: "treats" as ProductMode, label: "Treats", icon: Cookie, desc: "Cupcakes, cookies, pops" },
                  { value: "both" as ProductMode, label: "Both", icon: Layers, desc: "Cakes and treats" },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setProductMode(opt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      productMode === opt.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                    data-testid={`button-product-${opt.value}`}
                  >
                    <opt.icon className={`h-8 w-8 ${productMode === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-muted-foreground text-center">{opt.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4 mt-auto">
                <Button onClick={handleStep1Continue} disabled={!productMode || updateProfileMutation.isPending} data-testid="button-step1-continue">
                  {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex-1 flex flex-col" data-testid="card-step-2">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Your bakery details</h2>
                <p className="text-sm text-muted-foreground mt-1">This info appears on your order page</p>
              </div>

              <div className="space-y-4 mb-auto">
                <div className="space-y-1.5">
                  <Label htmlFor="business-name">Business Name *</Label>
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Sweet Creations by Jane"
                    data-testid="input-business-name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="slug">Your Order Page URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/c/</span>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="your-bakery"
                      className="flex-1"
                      data-testid="input-slug"
                    />
                  </div>
                  {slugChecking && <p className="text-xs text-muted-foreground">Checking...</p>}
                  {slugAvailable === true && <p className="text-xs text-green-600">Available!</p>}
                  {slugAvailable === false && <p className="text-xs text-red-600">Not available</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Profile Photo</Label>
                    <div className="flex flex-col items-center gap-1.5">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="h-16 w-16 rounded-full object-cover border" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <span className="text-xs text-primary hover:underline">{profilePhoto ? "Change" : "Upload"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Header Image</Label>
                    <div className="flex flex-col items-center gap-1.5">
                      {headerImage ? (
                        <img src={headerImage} alt="Header" className="h-16 w-full rounded object-cover border" />
                      ) : (
                        <div className="h-16 w-full rounded bg-muted flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <span className="text-xs text-primary hover:underline">{headerImage ? "Change" : "Upload"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleHeaderImageUpload} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 mt-auto">
                <Button variant="ghost" onClick={() => goToStep(1)} data-testid="button-step2-back">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={handleStep2Continue}
                  disabled={updateProfileMutation.isPending || !businessName.trim()}
                  data-testid="button-step2-continue"
                >
                  {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex-1 flex flex-col" data-testid="card-step-3">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold">
                  {productMode === "cakes" ? "Upload cakes you've made recently" :
                   productMode === "treats" ? "Upload treats customers love ordering" :
                   "Upload a mix of cakes and treats"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {productMode === "cakes" ? "Customers trust bakers when they can see real cake designs." :
                   productMode === "treats" ? "These will appear on your order page." :
                   "These will appear on your order page. Add up to 6 photos."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-auto">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg border-2 border-dashed border-border overflow-hidden relative">
                    {portfolioImages[i] ? (
                      <>
                        <img src={portfolioImages[i]} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePortfolioImage(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                          data-testid={`button-remove-portfolio-${i}`}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Add</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePortfolioUpload}
                          disabled={isUploading}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>

              {isUploading && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 mt-auto">
                <Button variant="ghost" onClick={() => goToStep(2)} data-testid="button-step3-back">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <div className="flex items-center gap-3">
                  {portfolioImages.length === 0 && (
                    <button
                      onClick={handleStep3Continue}
                      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                      data-testid="button-step3-skip"
                    >
                      Skip for now
                    </button>
                  )}
                  <Button onClick={handleStep3Continue} data-testid="button-step3-continue">
                    Continue
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex-1 flex flex-col" data-testid="card-step-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold">Choose your pricing style</h2>
                <p className="text-sm text-muted-foreground mt-1">Pick a starting point — you can adjust all prices later</p>
              </div>

              <div className="space-y-4 mb-auto">
                {(productMode === "cakes" || productMode === "both") && (
                  <div>
                    {productMode === "both" && <p className="text-sm font-medium mb-2">Cake Pricing</p>}
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: "simple", label: "Simple", price: "$5/serving", desc: '6" from $45' },
                        { value: "detailed", label: "Detailed", price: "$6.50/serving", desc: '6" from $65' },
                        { value: "luxury", label: "Luxury", price: "$8/serving", desc: '6" from $80' },
                      ]).map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setCakeTier(t.value)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            cakeTier === t.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                          data-testid={`button-cake-tier-${t.value}`}
                        >
                          <p className="text-sm font-medium">{t.label}</p>
                          <p className="text-xs text-primary font-semibold mt-0.5">{t.price}</p>
                          <p className="text-xs text-muted-foreground">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(productMode === "treats" || productMode === "both") && (
                  <div>
                    {productMode === "both" && <p className="text-sm font-medium mb-2">Treat Pricing</p>}
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: "starter", label: "Starter", price: "Cupcakes $30/doz", desc: "Budget-friendly" },
                        { value: "popular", label: "Popular", price: "Cupcakes $36/doz", desc: "Market average" },
                        { value: "premium", label: "Premium", price: "Cupcakes $48/doz", desc: "High-end" },
                      ]).map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setTreatTier(t.value)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            treatTier === t.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                          data-testid={`button-treat-tier-${t.value}`}
                        >
                          <p className="text-sm font-medium">{t.label}</p>
                          <p className="text-xs text-primary font-semibold mt-0.5">{t.price}</p>
                          <p className="text-xs text-muted-foreground">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 mt-auto">
                <Button variant="ghost" onClick={() => goToStep(3)} data-testid="button-step4-back">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={handleStep4Continue}
                  disabled={seedPricingMutation.isPending}
                  data-testid="button-step4-continue"
                >
                  {seedPricingMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="flex-1 flex flex-col" data-testid="card-step-5">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold">Here's what a quote looks like</h2>
                <p className="text-sm text-muted-foreground mt-1">Customers see this estimate before submitting a quote request</p>
              </div>

              <Card className="mb-auto">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mx-auto">
                      <DollarSign className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {productMode === "treats" ? "1 dozen Chocolate Dipped Strawberries" : "24 serving custom cake"}
                      </p>
                      <p className="text-3xl font-bold mt-1" data-testid="text-estimated-price">
                        ${getEstimatedPrice()}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground border-t pt-3">
                      Estimated based on your pricing style. Customers submit this as a quote request — you review and finalize before sending.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center pt-4 mt-auto">
                <Button variant="ghost" onClick={() => goToStep(4)} data-testid="button-step5-back">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button onClick={handleStep5Continue} data-testid="button-step5-continue">
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="flex-1 flex flex-col" data-testid="card-step-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold">Do you get quote requests in your DMs?</h2>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {([
                  { value: "yes_now", label: "Yes — I have one now" },
                  { value: "yes_often", label: "I get them often" },
                  { value: "exploring", label: "Just exploring" },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDmOption(opt.value)}
                    className={`p-3 rounded-lg border-2 text-center transition-all text-sm ${
                      dmOption === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                    data-testid={`button-dm-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="bg-muted/50 border rounded-lg p-3 space-y-2 mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{getDmHelperCopy()}</p>
                <p className="text-sm" data-testid="text-dm-message">
                  Thanks for reaching out! You can build your order and get an instant estimate here: {calculatorUrl}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={dmCopied ? "outline" : "default"}
                    onClick={handleCopyDmMessage}
                    data-testid="button-copy-dm"
                  >
                    {dmCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {dmCopied ? "Copied" : "Copy Message"}
                  </Button>
                  <Button
                    size="sm"
                    variant={linkCopied ? "outline" : "secondary"}
                    onClick={handleCopyLink}
                    data-testid="button-copy-link"
                  >
                    {linkCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {linkCopied ? "Copied" : "Copy Link"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(calculatorUrl, "_blank")}
                    data-testid="button-preview-calculator"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-auto">
                <p className="text-sm font-medium mb-1">Where to add it</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Instagram bio or Linktree</li>
                  <li>• Facebook page button</li>
                  <li>• Pinned post or story highlight</li>
                </ul>
              </div>

              <div className="flex justify-between items-center pt-4 mt-auto">
                <Button variant="ghost" onClick={() => goToStep(5)} data-testid="button-step6-back">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button onClick={handleStep6Continue} disabled={completeMutation.isPending} data-testid="button-step6-continue">
                  {completeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="flex-1 flex flex-col" data-testid="card-step-7">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold">Accept deposits automatically</h2>
                <p className="text-sm text-muted-foreground mt-1">When customers approve quotes, they can pay deposits directly through Stripe</p>
              </div>

              <div className="mb-auto">
                {baker?.stripeConnectOnboarded ? (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center space-y-3">
                    <Check className="h-12 w-12 text-green-500 mx-auto" />
                    <p className="font-medium text-green-800 dark:text-green-200">Stripe is connected!</p>
                    <p className="text-sm text-green-700 dark:text-green-300">You're ready to accept payments.</p>
                  </div>
                ) : (
                  <div className="bg-muted/50 border rounded-lg p-6 text-center space-y-4">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium">Connect Stripe</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Stripe handles all payment processing securely. You'll receive payouts directly to your bank account.
                      </p>
                    </div>
                    <Button
                      onClick={() => connectMutation.mutate()}
                      disabled={connectMutation.isPending}
                      data-testid="button-connect-stripe"
                    >
                      {connectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Connect Stripe
                    </Button>
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground mt-3">
                  You can do this now or later. Quotes still work without payments enabled.
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 mt-auto">
                <Button variant="ghost" onClick={() => goToStep(6)} data-testid="button-step7-back">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button onClick={handleSkipStripe} data-testid="button-go-to-dashboard">
                  Go to Dashboard
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
