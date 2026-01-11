import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Cake,
  Cookie,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Calendar,
  User,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiPinterest } from "react-icons/si";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  calculateTotal,
  calculateTierPrice,
  calculateTreatsPrice,
  formatCurrency,
  createDefaultTier,
} from "@/lib/calculator";
import { apiRequest } from "@/lib/queryClient";
import {
  CAKE_SIZES,
  CAKE_SHAPES,
  CAKE_FLAVORS,
  FROSTING_TYPES,
  DECORATIONS,
  DELIVERY_OPTIONS,
  ADDONS,
  TREATS,
  EVENT_TYPES,
  type CakeTier,
  type TreatSelection,
  type CalculatorPayload,
  type CalculatorConfig,
  type Baker,
} from "@shared/schema";
import heroImage from "@assets/generated_images/elegant_wedding_cake_hero.png";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  eventType: z.string().optional(),
  eventDate: z.string().optional(),
  guestCount: z.string().optional(),
  deliveryAddress: z.string().optional(),
  specialRequests: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

function formatSocialUrl(value: string, platform: "facebook" | "instagram" | "tiktok" | "pinterest"): string {
  const trimmed = value.trim();
  
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  
  const handle = trimmed.replace(/^@/, "");
  
  const baseUrls: Record<string, string> = {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/@",
    pinterest: "https://pinterest.com/",
  };
  
  return baseUrls[platform] + handle;
}

const CAKE_STEPS = ["Choose Category", "Build Your Cake", "Decorations", "Addons", "Event Details", "Contact Info", "Review"];
const TREAT_STEPS = ["Choose Category", "Select Treats", "Event Details", "Contact Info", "Review"];

export default function CalculatorPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [category, setCategory] = useState<"cake" | "treat" | undefined>(undefined);
  const [tiers, setTiers] = useState<CakeTier[]>([createDefaultTier()]);
  const [openTierAccordion, setOpenTierAccordion] = useState<string>("tier-0");
  const [decorations, setDecorations] = useState<string[]>([]);
  const [addons, setAddons] = useState<{ id: string; quantity?: number; attendees?: number }[]>([]);
  const [treats, setTreats] = useState<TreatSelection[]>([]);
  const [deliveryOption, setDeliveryOption] = useState("pickup");
  const [submitted, setSubmitted] = useState(false);
  const [leadLimitReached, setLeadLimitReached] = useState(false);
  const [submittedPrice, setSubmittedPrice] = useState<string | null>(null);
  const [submittedItemName, setSubmittedItemName] = useState<string | null>(null);

  interface FeaturedItem {
    id: string;
    name: string;
    category: string;
    suggestedPrice: string;
    notes: string | null;
    featuredLabel: string | null;
    featuredDescription: string | null;
    featuredPrice: string;
    featuredImageUrl: string | null;
    depositType: string | null;
    depositPercent: number | null;
    depositAmount: string | null;
  }

  const [selectedFeaturedItem, setSelectedFeaturedItem] = useState<FeaturedItem | null>(null);
  const [fastQuoteMode, setFastQuoteMode] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const FAST_QUOTE_STEPS = ["Choose Category", "Contact Info", "Review"];
  
  const STEPS = useMemo(() => {
    if (fastQuoteMode && selectedFeaturedItem) return FAST_QUOTE_STEPS;
    if (!category) return ["Choose Category"];
    return category === "cake" ? CAKE_STEPS : TREAT_STEPS;
  }, [category, fastQuoteMode, selectedFeaturedItem]);

  const { data: baker, isLoading: isLoadingBaker, error } = useQuery<Baker>({
    queryKey: ["/api/public/baker", slug],
    enabled: !!slug,
  });

  const { data: featuredItems = [] } = useQuery<FeaturedItem[]>({
    queryKey: ["/api/public/featured-items", slug],
    enabled: !!slug,
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      eventType: "",
      eventDate: "",
      guestCount: "",
      deliveryAddress: "",
      specialRequests: "",
    },
  });

  const bakerConfig = baker?.calculatorConfig as CalculatorConfig | undefined;

  const payload: CalculatorPayload = useMemo(() => {
    if (category === "treat") {
      return {
        category: "treat",
        treats,
        deliveryOption,
      };
    }
    return {
      category: "cake",
      tiers,
      decorations,
      addons,
      deliveryOption,
    };
  }, [category, tiers, decorations, addons, treats, deliveryOption]);

  const totals = calculateTotal(payload, bakerConfig);

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      // Validate event date for Fast Quote
      if (fastQuoteMode && selectedFeaturedItem && !data.eventDate) {
        throw new Error("Please select your event date");
      }

      let submitPayload: CalculatorPayload | { 
        fastQuote: true; 
        featuredItemId: string; 
        featuredItemName: string; 
        featuredItemPrice: string;
        depositType: string | null;
        depositPercent: number | null;
        depositAmount: string | null;
      };
      let estimatedTotal: string;

      if (fastQuoteMode && selectedFeaturedItem) {
        submitPayload = {
          fastQuote: true,
          featuredItemId: selectedFeaturedItem.id,
          featuredItemName: selectedFeaturedItem.featuredLabel || selectedFeaturedItem.name,
          featuredItemPrice: selectedFeaturedItem.featuredPrice || selectedFeaturedItem.suggestedPrice,
          depositType: selectedFeaturedItem.depositType,
          depositPercent: selectedFeaturedItem.depositPercent,
          depositAmount: selectedFeaturedItem.depositAmount,
        };
        estimatedTotal = selectedFeaturedItem.featuredPrice || selectedFeaturedItem.suggestedPrice;
      } else {
        submitPayload = {
          ...payload,
          deliveryAddress: data.deliveryAddress,
          specialRequests: data.specialRequests,
        };
        const submitTotals = calculateTotal(submitPayload as CalculatorPayload, bakerConfig);
        estimatedTotal = submitTotals.total.toFixed(2);
      }

      const res = await apiRequest("POST", `/api/public/calculator/submit?tenant=${slug}`, {
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        eventType: data.eventType,
        eventDate: data.eventDate || null,
        guestCount: data.guestCount ? parseInt(data.guestCount) : null,
        calculatorPayload: submitPayload,
        estimatedTotal,
      });
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.limitReached) {
          setLeadLimitReached(true);
          throw new Error("limit_reached");
        }
        throw new Error(errorData.message || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      // Store the price for the confirmation screen
      if (fastQuoteMode && selectedFeaturedItem) {
        setSubmittedPrice(selectedFeaturedItem.featuredPrice || selectedFeaturedItem.suggestedPrice);
        setSubmittedItemName(selectedFeaturedItem.featuredLabel || selectedFeaturedItem.name);
      } else {
        setSubmittedPrice(totals.total.toFixed(2));
        setSubmittedItemName(null);
      }
      setSubmitted(true);
    },
    onError: (err: Error) => {
      if (err.message !== "limit_reached") {
        toast({
          title: "Error",
          description: err.message || "Failed to submit. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const addTier = () => {
    const newTierIndex = tiers.length;
    setTiers([...tiers, createDefaultTier()]);
    setOpenTierAccordion(`tier-${newTierIndex}`);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const updateTier = (index: number, field: keyof CakeTier, value: string) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  const toggleDecoration = (id: string) => {
    setDecorations((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleAddon = (id: string, attendees?: number) => {
    setAddons((prev) => {
      const existing = prev.find(a => a.id === id);
      if (existing) {
        return prev.filter(a => a.id !== id);
      }
      return [...prev, { id, quantity: 1, attendees }];
    });
  };

  const updateAddonAttendees = (id: string, attendees: number) => {
    setAddons((prev) => prev.map(a => a.id === id ? { ...a, attendees } : a));
  };

  const updateAddonQuantity = (id: string, quantity: number) => {
    setAddons((prev) => prev.map(a => a.id === id ? { ...a, quantity } : a));
  };

  const getMergedTreats = () => {
    const defaultTreats = TREATS.map(t => ({ ...t, enabled: true as boolean | undefined }));
    const defaultTreatIds = new Set(TREATS.map(t => t.id));
    
    if (!bakerConfig?.treats || bakerConfig.treats.length === 0) {
      return defaultTreats;
    }
    const customTreatsById = new Map(bakerConfig.treats.map(t => [t.id, t]));
    const mergedDefaults = defaultTreats.map(d => customTreatsById.get(d.id) || d);
    const customOnly = bakerConfig.treats.filter(t => !defaultTreatIds.has(t.id));
    return [...mergedDefaults, ...customOnly];
  };

  const updateTreatQuantity = (id: string, quantity: number) => {
    const allTreats = getMergedTreats();
    const treat = allTreats.find(t => t.id === id);
    const minQty = treat?.minQuantity || 1;
    
    if (quantity <= 0) {
      setTreats(prev => prev.filter(t => t.id !== id));
    } else {
      setTreats(prev => {
        const existing = prev.find(t => t.id === id);
        if (existing) {
          return prev.map(t => t.id === id ? { ...t, quantity: Math.max(minQty, quantity) } : t);
        }
        return [...prev, { id, quantity: Math.max(minQty, quantity) }];
      });
    }
  };

  const handleCategorySelect = (selectedCategory: "cake" | "treat") => {
    setFastQuoteMode(false);
    setSelectedFeaturedItem(null);
    setCategory(selectedCategory);
    setCurrentStep(1);
  };

  const handleFeaturedItemSelect = (item: FeaturedItem) => {
    setSelectedFeaturedItem(item);
    setFastQuoteMode(true);
    setCategory(undefined);
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      if (currentStep === 1) {
        setCategory(undefined);
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: ContactFormData) => {
    submitMutation.mutate(data);
  };

  const getCurrentStepName = () => {
    return STEPS[currentStep] || "Choose Category";
  };

  const renderCurrentStep = () => {
    const stepName = getCurrentStepName();
    
    switch (stepName) {
      case "Choose Category":
        return (
          <StepCategory 
            onSelect={handleCategorySelect} 
            featuredItems={featuredItems}
            onSelectFeaturedItem={handleFeaturedItemSelect}
          />
        );
      case "Build Your Cake":
        return (
          <StepCakeBuilder
            tiers={tiers}
            onUpdateTier={updateTier}
            onAddTier={addTier}
            onRemoveTier={removeTier}
            config={bakerConfig}
            openAccordion={openTierAccordion}
            onAccordionChange={setOpenTierAccordion}
          />
        );
      case "Select Treats":
        return (
          <StepTreats
            selected={treats}
            onUpdateQuantity={updateTreatQuantity}
            config={bakerConfig}
          />
        );
      case "Decorations":
        return (
          <StepDecorations
            selected={decorations}
            onToggle={toggleDecoration}
          />
        );
      case "Addons":
        return (
          <StepAddons
            selected={addons}
            onToggle={toggleAddon}
            onUpdateAttendees={updateAddonAttendees}
            onUpdateQuantity={updateAddonQuantity}
            guestCount={form.watch("guestCount")}
            config={bakerConfig}
          />
        );
      case "Event Details":
        return (
          <StepEventDetails
            form={form}
            deliveryOption={deliveryOption}
            onDeliveryChange={setDeliveryOption}
          />
        );
      case "Contact Info":
        return <StepContactInfo form={form} showEventDate={fastQuoteMode} />;
      case "Review":
        if (fastQuoteMode && selectedFeaturedItem) {
          return (
            <StepFastQuoteReview
              featuredItem={selectedFeaturedItem}
              form={form}
            />
          );
        }
        return (
          <StepReview
            category={category}
            tiers={tiers}
            decorations={decorations}
            addons={addons}
            treats={treats}
            deliveryOption={deliveryOption}
            totals={totals}
            form={form}
            config={bakerConfig}
          />
        );
      default:
        return null;
    }
  };

  if (isLoadingBaker) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-64 bg-muted animate-pulse" />
        <div className="max-w-4xl mx-auto p-6 -mt-20">
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !baker) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Cake className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Bakery Not Found</h1>
            <p className="text-muted-foreground">
              We couldn't find a bakery with that name. Please check the link and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (leadLimitReached) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
              <Cake className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">{baker?.businessName}</span>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex items-center justify-center min-h-[calc(100vh-73px)] p-6">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-6">
                <Mail className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3" data-testid="text-limit-title">
                Unable to Accept Inquiries
              </h1>
              <p className="text-muted-foreground mb-4">
                {baker?.businessName} is temporarily unable to accept new inquiries. Please try again later or contact them directly.
              </p>
              {baker?.email && (
                <Button variant="outline" asChild>
                  <a href={`mailto:${baker.email}`}>Contact {baker.businessName}</a>
                </Button>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (submitted) {
    const displayPrice = submittedPrice 
      ? parseFloat(submittedPrice) 
      : (totals?.total ?? 0);
    const isQuickOrder = submittedItemName !== null;
    
    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
              <Cake className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">{baker.businessName}</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex items-center justify-center min-h-[calc(100vh-73px)] p-6">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3" data-testid="text-success-title">
                {isQuickOrder ? "Order Received!" : "Thank You!"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isQuickOrder 
                  ? "Your order has been submitted! We'll send you an invoice with payment options via email shortly."
                  : "We've received your request and will be in touch within 24 hours with your custom quote."}
              </p>
              {isQuickOrder && submittedItemName && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">{submittedItemName}</span>
                  </div>
                </div>
              )}
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">
                  {isQuickOrder ? "Order total" : "Your estimated total"}
                </p>
                <p className="text-3xl font-bold">{formatCurrency(displayPrice)}</p>
              </div>
              {isQuickOrder && (
                <p className="text-xs text-muted-foreground mt-4">
                  Check your email for the invoice and payment instructions.
                </p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b sticky top-0 z-50 bg-background">
        <div className="flex items-center gap-3">
          {baker.profilePhoto ? (
            <Avatar className="h-10 w-10">
              <AvatarImage src={baker.profilePhoto} alt={baker.businessName} />
              <AvatarFallback>
                <Cake className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
              <Cake className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div>
            <span className="font-semibold">{baker.businessName}</span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {baker.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {baker.phone}
                </span>
              )}
              {baker.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {baker.address.split('\n')[0]}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(baker.socialFacebook || baker.socialInstagram || baker.socialTiktok || baker.socialPinterest) && (
            <div className="flex items-center gap-1">
              {baker.socialFacebook && (
                <a
                  href={formatSocialUrl(baker.socialFacebook, "facebook")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover-elevate text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-social-facebook"
                >
                  <SiFacebook className="h-4 w-4" />
                </a>
              )}
              {baker.socialInstagram && (
                <a
                  href={formatSocialUrl(baker.socialInstagram, "instagram")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover-elevate text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-social-instagram"
                >
                  <SiInstagram className="h-4 w-4" />
                </a>
              )}
              {baker.socialTiktok && (
                <a
                  href={formatSocialUrl(baker.socialTiktok, "tiktok")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover-elevate text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-social-tiktok"
                >
                  <SiTiktok className="h-4 w-4" />
                </a>
              )}
              {baker.socialPinterest && (
                <a
                  href={formatSocialUrl(baker.socialPinterest, "pinterest")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover-elevate text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-social-pinterest"
                >
                  <SiPinterest className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={heroImage}
          alt="Beautiful custom cake"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Custom Order Calculator
            </h1>
            <p className="text-white/80">
              Design your perfect order and get an instant estimate
            </p>
          </div>
        </div>
      </div>

      {baker.portfolioImages && baker.portfolioImages.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Our Work</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {baker.portfolioImages.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  setLightboxIndex(index);
                  setLightboxOpen(true);
                }}
                className="aspect-square overflow-hidden rounded-lg hover-elevate cursor-pointer border"
                data-testid={`button-portfolio-${index}`}
              >
                <img
                  src={image}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-0">
          {baker.portfolioImages && baker.portfolioImages.length > 0 && (
            <div className="relative">
              <img
                src={baker.portfolioImages[lightboxIndex]}
                alt={`Portfolio ${lightboxIndex + 1}`}
                className="w-full max-h-[80vh] object-contain"
              />
              {baker.portfolioImages.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIndex((prev) => 
                      prev === 0 ? (baker.portfolioImages?.length ?? 1) - 1 : prev - 1
                    )}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    data-testid="button-lightbox-prev"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setLightboxIndex((prev) => 
                      prev === (baker.portfolioImages?.length ?? 1) - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    data-testid="button-lightbox-next"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                {lightboxIndex + 1} / {baker.portfolioImages.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <main className={`max-w-4xl mx-auto p-6 relative z-10 ${baker.portfolioImages && baker.portfolioImages.length > 0 ? "mt-4" : "-mt-6"}`}>
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <CardTitle className="text-lg">{getCurrentStepName()}</CardTitle>
                <CardDescription>
                  Step {currentStep + 1} of {STEPS.length}
                </CardDescription>
              </div>
              {category && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Estimated Total</p>
                  <p className="text-2xl font-bold" data-testid="text-running-total">
                    {formatCurrency(totals.total)}
                  </p>
                </div>
              )}
            </div>
            <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />
          </CardHeader>

          <Form {...form}>
            <CardContent>
              {renderCurrentStep()}

              {currentStep > 0 && (
                <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    data-testid="button-prev-step"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>

                  {currentStep < STEPS.length - 1 ? (
                    <Button onClick={nextStep} data-testid="button-next-step">
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={submitMutation.isPending}
                      data-testid="button-submit"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Submit Request
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Form>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          This is an estimate only. Final pricing will be confirmed in your custom quote.
        </p>
      </main>
    </div>
  );
}

interface FeaturedItemType {
  id: string;
  name: string;
  category: string;
  suggestedPrice: string;
  notes: string | null;
  featuredLabel: string | null;
  featuredDescription: string | null;
  featuredPrice: string;
  featuredImageUrl: string | null;
  depositType: string | null;
  depositPercent: number | null;
  depositAmount: string | null;
}

interface StepCategoryProps {
  onSelect: (category: "cake" | "treat") => void;
  featuredItems?: FeaturedItemType[];
  onSelectFeaturedItem?: (item: FeaturedItemType) => void;
}

function StepCategory({ onSelect, featuredItems = [], onSelectFeaturedItem }: StepCategoryProps) {
  const formatCurrency = (value: string | null) => {
    const num = parseFloat(value || "0") || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      cake: "Cake",
      cupcakes: "Cupcakes",
      cake_pops: "Cake Pops",
      cookies: "Cookies",
      brownies: "Brownies",
      dipped_strawberries: "Dipped Strawberries",
      custom: "Custom Item",
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      {featuredItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-center">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Quick Order</h3>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            Select a popular item for a faster quote
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectFeaturedItem?.(item)}
                className="p-4 border rounded-lg text-left hover-elevate cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary bg-primary/5 border-primary/20"
                data-testid={`button-featured-${item.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {item.featuredLabel || item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground capitalize">
                      {getCategoryLabel(item.category)}
                    </p>
                    <p className="text-primary font-semibold mt-1">
                      {formatCurrency(item.featuredPrice || item.suggestedPrice)}
                    </p>
                    {item.depositType && item.depositType !== "full" && (
                      <p className="text-xs text-primary/80 mt-0.5">
                        {item.depositType === "percentage" && item.depositPercent
                          ? `${item.depositPercent}% deposit required`
                          : item.depositType === "fixed" && item.depositAmount
                          ? `${formatCurrency(item.depositAmount)} deposit required`
                          : null}
                      </p>
                    )}
                    {item.featuredDescription && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.featuredDescription}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or customize your order
              </span>
            </div>
          </div>
        </div>
      )}

      {!featuredItems.length && (
        <p className="text-center text-muted-foreground mb-6">
          What would you like to order today?
        </p>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onSelect("cake")}
          className="p-6 border rounded-lg text-left hover-elevate cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          data-testid="button-category-cake"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Cake className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Cakes</h3>
          <p className="text-muted-foreground">
            Custom cakes for any occasion
          </p>
        </button>

        <button
          onClick={() => onSelect("treat")}
          className="p-6 border rounded-lg text-left hover-elevate cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          data-testid="button-category-treat"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Cookie className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Treats</h3>
          <p className="text-muted-foreground">
            Cookies, cupcakes, cake pops & more
          </p>
        </button>
      </div>
    </div>
  );
}

interface StepTreatsProps {
  selected: TreatSelection[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  config?: CalculatorConfig;
}

function StepTreats({ selected, onUpdateQuantity, config }: StepTreatsProps) {
  const getTreatQuantity = (id: string) => {
    return selected.find(t => t.id === id)?.quantity || 0;
  };

  const defaultTreats = TREATS.map(t => ({ ...t, enabled: true as boolean | undefined }));
  const defaultTreatIds = new Set(TREATS.map(t => t.id));
  
  const mergedTreats = (() => {
    if (!config?.treats || config.treats.length === 0) {
      return defaultTreats;
    }
    const customTreatsById = new Map(config.treats.map(t => [t.id, t]));
    const mergedDefaults = defaultTreats.map(d => customTreatsById.get(d.id) || d);
    const customOnly = config.treats.filter(t => !defaultTreatIds.has(t.id));
    return [...mergedDefaults, ...customOnly];
  })();
  
  const effectiveTreats = mergedTreats.filter(t => t.enabled !== false);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground mb-4">
        Select your treats and quantities below.
      </p>
      <div className="space-y-3">
        {effectiveTreats.map((treat) => {
          const quantity = getTreatQuantity(treat.id);
          const isSelected = quantity > 0;
          
          return (
            <div
              key={treat.id}
              className={`p-4 border rounded-lg transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{treat.label}</p>
                  <p className="text-sm text-muted-foreground">{treat.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-right min-w-[70px]">
                    {formatCurrency(treat.unitPrice)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onUpdateQuantity(treat.id, quantity - 1)}
                      disabled={quantity === 0}
                      data-testid={`button-treat-minus-${treat.id}`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium" data-testid={`text-treat-quantity-${treat.id}`}>
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onUpdateQuantity(treat.id, quantity === 0 ? treat.minQuantity : quantity + 1)}
                      data-testid={`button-treat-plus-${treat.id}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {isSelected && (
                <div className="mt-2 pt-2 border-t flex justify-end">
                  <span className="text-sm text-muted-foreground">
                    Subtotal: <span className="font-medium text-foreground">{formatCurrency(treat.unitPrice * quantity)}</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {selected.length > 0 && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">Selected Treats Total</span>
            <span className="font-bold text-lg">
              {formatCurrency(calculateTreatsPrice(selected, config))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface StepCakeBuilderProps {
  tiers: CakeTier[];
  onUpdateTier: (index: number, field: keyof CakeTier, value: string) => void;
  onAddTier: () => void;
  onRemoveTier: (index: number) => void;
  config?: CalculatorConfig;
  openAccordion: string;
  onAccordionChange: (value: string) => void;
}

function StepCakeBuilder({ tiers, onUpdateTier, onAddTier, onRemoveTier, config, openAccordion, onAccordionChange }: StepCakeBuilderProps) {
  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible value={openAccordion} onValueChange={onAccordionChange} className="space-y-4">
        {tiers.map((tier, index) => (
          <AccordionItem key={index} value={`tier-${index}`} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between gap-4 w-full pr-4">
                <span className="font-medium">Tier {index + 1}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {CAKE_SIZES.find((s) => s.id === tier.size)?.label} - {formatCurrency(calculateTierPrice(tier, config))}
                  </span>
                  {tiers.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTier(index);
                      }}
                      data-testid={`button-remove-tier-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">Size</Label>
                <RadioGroup
                  value={tier.size}
                  onValueChange={(value) => onUpdateTier(index, "size", value)}
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {CAKE_SIZES.map((size) => (
                    <Label
                      key={size.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover-elevate has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem value={size.id} data-testid={`radio-size-${size.id}-${index}`} />
                      <div className="flex-1">
                        <p className="font-medium">{size.label}</p>
                        <p className="text-xs text-muted-foreground">{size.servings} servings</p>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(size.basePrice)}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Shape</Label>
                <RadioGroup
                  value={tier.shape}
                  onValueChange={(value) => onUpdateTier(index, "shape", value)}
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                >
                  {CAKE_SHAPES.map((shape) => (
                    <Label
                      key={shape.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover-elevate has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem value={shape.id} data-testid={`radio-shape-${shape.id}-${index}`} />
                      <span className="flex-1">{shape.label}</span>
                      {shape.priceModifier > 0 && (
                        <span className="text-xs text-muted-foreground">+{formatCurrency(shape.priceModifier)}</span>
                      )}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Flavor</Label>
                <RadioGroup
                  value={tier.flavor}
                  onValueChange={(value) => onUpdateTier(index, "flavor", value)}
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {CAKE_FLAVORS.map((flavor) => (
                    <Label
                      key={flavor.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover-elevate has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem value={flavor.id} data-testid={`radio-flavor-${flavor.id}-${index}`} />
                      <span className="flex-1">{flavor.label}</span>
                      {flavor.priceModifier > 0 && (
                        <span className="text-xs text-muted-foreground">+{formatCurrency(flavor.priceModifier)}</span>
                      )}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Frosting</Label>
                <RadioGroup
                  value={tier.frosting}
                  onValueChange={(value) => onUpdateTier(index, "frosting", value)}
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {FROSTING_TYPES.map((frosting) => (
                    <Label
                      key={frosting.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover-elevate has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem value={frosting.id} data-testid={`radio-frosting-${frosting.id}-${index}`} />
                      <span className="flex-1">{frosting.label}</span>
                      {frosting.priceModifier > 0 && (
                        <span className="text-xs text-muted-foreground">+{formatCurrency(frosting.priceModifier)}</span>
                      )}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button
        variant="outline"
        onClick={onAddTier}
        className="w-full"
        data-testid="button-add-tier"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Another Tier
      </Button>
    </div>
  );
}

interface StepDecorationsProps {
  selected: string[];
  onToggle: (id: string) => void;
}

function StepDecorations({ selected, onToggle }: StepDecorationsProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground mb-4">
        Select any decorations you'd like to add to your cake.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {DECORATIONS.map((dec) => (
          <Label
            key={dec.id}
            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover-elevate transition-colors ${
              selected.includes(dec.id) ? "border-primary bg-primary/5" : ""
            }`}
          >
            <Checkbox
              checked={selected.includes(dec.id)}
              onCheckedChange={() => onToggle(dec.id)}
              data-testid={`checkbox-decoration-${dec.id}`}
            />
            <span className="flex-1">{dec.label}</span>
            <span className="font-medium">{formatCurrency(dec.price)}</span>
          </Label>
        ))}
      </div>
    </div>
  );
}

interface StepAddonsProps {
  selected: { id: string; quantity?: number; attendees?: number }[];
  onToggle: (id: string, attendees?: number) => void;
  onUpdateAttendees: (id: string, attendees: number) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  guestCount?: string;
  config?: CalculatorConfig;
}

function StepAddons({ selected, onToggle, onUpdateAttendees, onUpdateQuantity, guestCount, config }: StepAddonsProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground mb-4">
        Add any extras to complement your order.
      </p>
      <div className="space-y-3">
        {ADDONS.map((addon) => {
          const isSelected = selected.some(a => a.id === addon.id);
          const selectedAddon = selected.find(a => a.id === addon.id);
          const isPerAttendee = addon.pricingType === "per-attendee";
          const minAttendees = "minAttendees" in addon ? addon.minAttendees : undefined;

          return (
            <div
              key={addon.id}
              className={`p-4 border rounded-lg transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}
            >
              <Label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => {
                    const defaultAttendees = guestCount ? parseInt(guestCount) : (minAttendees || 20);
                    onToggle(addon.id, isPerAttendee ? defaultAttendees : undefined);
                  }}
                  className="mt-1"
                  data-testid={`checkbox-addon-${addon.id}`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">{addon.label}</span>
                    <span className="font-medium">
                      {formatCurrency(addon.price)}
                      {isPerAttendee && <span className="text-muted-foreground font-normal">/person</span>}
                    </span>
                  </div>
                  {isPerAttendee && minAttendees && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Minimum {minAttendees} guests
                    </p>
                  )}
                </div>
              </Label>

              {isSelected && isPerAttendee && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-sm">Number of guests</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const currentAttendees = selectedAddon?.attendees || minAttendees || 20;
                          const newAttendees = Math.max(minAttendees || 1, currentAttendees - 1);
                          onUpdateAttendees(addon.id, newAttendees);
                        }}
                        data-testid={`button-addon-attendees-minus-${addon.id}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={selectedAddon?.attendees || minAttendees || 20}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || minAttendees || 1;
                          onUpdateAttendees(addon.id, Math.max(minAttendees || 1, value));
                        }}
                        className="w-20 text-center"
                        min={minAttendees || 1}
                        data-testid={`input-addon-attendees-${addon.id}`}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const currentAttendees = selectedAddon?.attendees || minAttendees || 20;
                          onUpdateAttendees(addon.id, currentAttendees + 1);
                        }}
                        data-testid={`button-addon-attendees-plus-${addon.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-right mt-2">
                    Subtotal: <span className="font-medium">{formatCurrency(addon.price * (selectedAddon?.attendees || minAttendees || 20))}</span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StepEventDetailsProps {
  form: ReturnType<typeof useForm<ContactFormData>>;
  deliveryOption: string;
  onDeliveryChange: (value: string) => void;
}

function StepEventDetails({ form, deliveryOption, onDeliveryChange }: StepEventDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="eventType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-event-type">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id} data-testid={`select-item-event-${type.id}`}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Date</FormLabel>
              <FormControl>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type="date"
                    className="pl-10"
                    data-testid="input-event-date"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="guestCount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Approximate Guest Count</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="number"
                placeholder="e.g., 50"
                data-testid="input-guest-count"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <Label className="text-sm font-medium mb-3 block">Delivery Option</Label>
        <RadioGroup
          value={deliveryOption}
          onValueChange={onDeliveryChange}
          className="space-y-3"
        >
          {DELIVERY_OPTIONS.map((option) => (
            <Label
              key={option.id}
              className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover-elevate has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <RadioGroupItem value={option.id} data-testid={`radio-delivery-${option.id}`} />
              <span className="flex-1">{option.label}</span>
              <span className="font-medium">
                {option.price > 0 ? formatCurrency(option.price) : "Free"}
              </span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {deliveryOption !== "pickup" && (
        <FormField
          control={form.control}
          name="deliveryAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    {...field}
                    placeholder="Enter your delivery address"
                    className="pl-10"
                    rows={2}
                    data-testid="textarea-delivery-address"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}

interface StepContactInfoProps {
  form: ReturnType<typeof useForm<ContactFormData>>;
  showEventDate?: boolean;
}

function StepContactInfo({ form, showEventDate = false }: StepContactInfoProps) {
  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    placeholder="John Smith"
                    className="pl-10"
                    data-testid="input-name"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    data-testid="input-email"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type="tel"
                    placeholder="(555) 123-4567"
                    className="pl-10"
                    data-testid="input-phone"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showEventDate && (
          <FormField
            control={form.control}
            name="eventDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Date</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      className="pl-10"
                      data-testid="input-event-date"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="specialRequests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Requests (optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    {...field}
                    placeholder="Any specific requirements or requests..."
                    className="pl-10"
                    rows={3}
                    data-testid="textarea-special-requests"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}

interface StepFastQuoteReviewProps {
  featuredItem: FeaturedItemType;
  form: ReturnType<typeof useForm<ContactFormData>>;
}

function StepFastQuoteReview({ featuredItem, form }: StepFastQuoteReviewProps) {
  const values = form.watch();
  
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      cake: "Cake",
      cupcakes: "Cupcakes",
      cake_pops: "Cake Pops",
      cookies: "Cookies",
      brownies: "Brownies",
      dipped_strawberries: "Dipped Strawberries",
      custom: "Custom Item",
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Quick Order Summary</h3>
        </div>
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-lg">{featuredItem.featuredLabel || featuredItem.name}</h4>
              <p className="text-sm text-muted-foreground capitalize">{getCategoryLabel(featuredItem.category)}</p>
              {featuredItem.featuredDescription && (
                <p className="text-sm text-muted-foreground mt-1">{featuredItem.featuredDescription}</p>
              )}
              {featuredItem.notes && !featuredItem.featuredDescription && (
                <p className="text-sm text-muted-foreground mt-1">{featuredItem.notes}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Contact Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span>{values.name}</span>
          </div>
          <div className="flex gap-2">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span>{values.email}</span>
          </div>
          <div className="flex gap-2">
            <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span>{values.phone}</span>
          </div>
          {values.eventType && (
            <div className="flex gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{values.eventType}{values.eventDate ? ` on ${values.eventDate}` : ""}</span>
            </div>
          )}
          {values.deliveryAddress && (
            <div className="flex gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{values.deliveryAddress}</span>
            </div>
          )}
          {values.specialRequests && (
            <div className="flex gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{values.specialRequests}</span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Estimated Total</span>
          <span className="text-primary">
            {formatCurrency(parseFloat(featuredItem.featuredPrice || featuredItem.suggestedPrice) || 0)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Final pricing will be confirmed in your custom quote
        </p>
      </div>

      <div className="bg-muted/50 border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">What happens next?</p>
            <p className="text-muted-foreground mt-1">
              After you submit this order, we'll send you an invoice with payment options via email. 
              Once payment is received, we'll confirm your order and get started!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StepReviewProps {
  category?: "cake" | "treat";
  tiers: CakeTier[];
  decorations: string[];
  addons: { id: string; quantity?: number; attendees?: number }[];
  treats: TreatSelection[];
  deliveryOption: string;
  totals: ReturnType<typeof calculateTotal>;
  form: ReturnType<typeof useForm<ContactFormData>>;
  config?: CalculatorConfig;
}

function StepReview({ category, tiers, decorations, addons, treats, deliveryOption, totals, form, config }: StepReviewProps) {
  const values = form.watch();
  
  const defaultTreats = TREATS.map(t => ({ ...t, enabled: true as boolean | undefined }));
  const defaultTreatIds = new Set(TREATS.map(t => t.id));
  
  const mergedTreats = (() => {
    if (!config?.treats || config.treats.length === 0) {
      return defaultTreats;
    }
    const customTreatsById = new Map(config.treats.map(t => [t.id, t]));
    const mergedDefaults = defaultTreats.map(d => customTreatsById.get(d.id) || d);
    const customOnly = config.treats.filter(t => !defaultTreatIds.has(t.id));
    return [...mergedDefaults, ...customOnly];
  })();
  
  const effectiveTreats = mergedTreats.filter(t => t.enabled !== false);

  return (
    <div className="space-y-6">
      {category === "cake" && (
        <>
          <div>
            <h3 className="font-semibold mb-3">Cake Details</h3>
            <div className="space-y-2">
              {tiers.map((tier, index) => {
                const size = CAKE_SIZES.find((s) => s.id === tier.size);
                const shape = CAKE_SHAPES.find((s) => s.id === tier.shape);
                const flavor = CAKE_FLAVORS.find((f) => f.id === tier.flavor);
                const frosting = FROSTING_TYPES.find((f) => f.id === tier.frosting);
                const price = calculateTierPrice(tier, config);

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Tier {index + 1}: {size?.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {shape?.label}, {flavor?.label}, {frosting?.label}
                      </p>
                    </div>
                    <span className="font-medium">{formatCurrency(price)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {decorations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Decorations</h3>
              <div className="space-y-2">
                {decorations.map((id) => {
                  const dec = DECORATIONS.find((d) => d.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between">
                      <span>{dec?.label}</span>
                      <span className="font-medium">{formatCurrency(dec?.price || 0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {addons.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Addons</h3>
              <div className="space-y-2">
                {addons.map((addon) => {
                  const addonInfo = ADDONS.find((a) => a.id === addon.id);
                  const isPerAttendee = addonInfo?.pricingType === "per-attendee";
                  const price = isPerAttendee
                    ? (addonInfo?.price || 0) * (addon.attendees || 0)
                    : addonInfo?.price || 0;
                  return (
                    <div key={addon.id} className="flex items-center justify-between">
                      <span>
                        {addonInfo?.label}
                        {isPerAttendee && addon.attendees && (
                          <span className="text-muted-foreground text-sm ml-1">
                            ({addon.attendees} guests)
                          </span>
                        )}
                      </span>
                      <span className="font-medium">{formatCurrency(price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {category === "treat" && treats.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Treats</h3>
          <div className="space-y-2">
            {treats.map((treat) => {
              const treatInfo = effectiveTreats.find((t) => t.id === treat.id);
              const price = (treatInfo?.unitPrice || 0) * treat.quantity;
              return (
                <div key={treat.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{treatInfo?.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {treatInfo?.description} × {treat.quantity}
                    </p>
                  </div>
                  <span className="font-medium">{formatCurrency(price)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-3">Delivery</h3>
        <div className="flex items-center justify-between">
          <span>{DELIVERY_OPTIONS.find((d) => d.id === deliveryOption)?.label}</span>
          <span className="font-medium">
            {totals.deliveryTotal > 0 ? formatCurrency(totals.deliveryTotal) : "Free"}
          </span>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Tax (8%)</span>
          <span>{formatCurrency(totals.tax)}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-bold pt-2 border-t">
          <span>Estimated Total</span>
          <span data-testid="text-final-total">{formatCurrency(totals.total)}</span>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Contact Information</h3>
        <div className="grid gap-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-20">Name:</span>
            <span>{values.name || "-"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-20">Email:</span>
            <span>{values.email || "-"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-20">Phone:</span>
            <span>{values.phone || "-"}</span>
          </div>
          {values.eventType && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20">Event:</span>
              <span className="capitalize">{values.eventType}</span>
            </div>
          )}
          {values.eventDate && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20">Date:</span>
              <span>{new Date(values.eventDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          This is an estimate. Final pricing will be confirmed in your custom quote.
        </p>
      </div>
    </div>
  );
}
