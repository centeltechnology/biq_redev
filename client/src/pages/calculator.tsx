import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Cake,
  Plus,
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
} from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiPinterest } from "react-icons/si";
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
  EVENT_TYPES,
  type CakeTier,
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

const STEPS = ["Build Your Cake", "Decorations", "Addons", "Event Details", "Contact Info", "Review"];

export default function CalculatorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [tiers, setTiers] = useState<CakeTier[]>([createDefaultTier()]);
  const [openTierAccordion, setOpenTierAccordion] = useState<string>("tier-0");
  const [decorations, setDecorations] = useState<string[]>([]);
  const [addons, setAddons] = useState<{ id: string; quantity?: number; attendees?: number }[]>([]);
  const [deliveryOption, setDeliveryOption] = useState("pickup");
  const [submitted, setSubmitted] = useState(false);
  const [leadLimitReached, setLeadLimitReached] = useState(false);

  const { data: baker, isLoading: isLoadingBaker, error } = useQuery<Baker>({
    queryKey: ["/api/public/baker", slug],
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

  // Get baker's custom pricing config
  const bakerConfig = baker?.calculatorConfig as CalculatorConfig | undefined;

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const payload: CalculatorPayload = {
        tiers,
        decorations,
        addons,
        deliveryOption,
        deliveryAddress: data.deliveryAddress,
        specialRequests: data.specialRequests,
      };
      const totals = calculateTotal(payload, bakerConfig);

      const res = await apiRequest("POST", `/api/public/calculator/submit?tenant=${slug}`, {
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        eventType: data.eventType,
        eventDate: data.eventDate || null,
        guestCount: data.guestCount ? parseInt(data.guestCount) : null,
        calculatorPayload: payload,
        estimatedTotal: totals.total.toFixed(2),
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
      setSubmitted(true);
    },
    onError: (err: Error) => {
      if (err.message !== "limit_reached") {
        console.error("Submission error:", err);
      }
    },
  });

  const payload: CalculatorPayload = {
    tiers,
    decorations,
    addons,
    deliveryOption,
  };
  const totals = calculateTotal(payload, bakerConfig);

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

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: ContactFormData) => {
    submitMutation.mutate(data);
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
                Thank You!
              </h1>
              <p className="text-muted-foreground mb-6">
                We've received your request and will be in touch within 24 hours with your custom quote.
              </p>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Your estimated total</p>
                <p className="text-3xl font-bold">{formatCurrency(totals.total)}</p>
              </div>
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
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
            <Cake className="h-5 w-5 text-primary-foreground" />
          </div>
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
              Custom Cake Calculator
            </h1>
            <p className="text-white/80">
              Design your perfect cake and get an instant estimate
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-6 -mt-6 relative z-10">
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <CardTitle className="text-lg">{STEPS[currentStep]}</CardTitle>
                <CardDescription>
                  Step {currentStep + 1} of {STEPS.length}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold" data-testid="text-running-total">
                  {formatCurrency(totals.total)}
                </p>
              </div>
            </div>
            <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />
          </CardHeader>

          <Form {...form}>
            <CardContent>
              {currentStep === 0 && (
                <StepCakeBuilder
                  tiers={tiers}
                  onUpdateTier={updateTier}
                  onAddTier={addTier}
                  onRemoveTier={removeTier}
                  config={bakerConfig}
                  openAccordion={openTierAccordion}
                  onAccordionChange={setOpenTierAccordion}
                />
              )}

              {currentStep === 1 && (
                <StepDecorations
                  selected={decorations}
                  onToggle={toggleDecoration}
                />
              )}

              {currentStep === 2 && (
                <StepAddons
                  selected={addons}
                  onToggle={toggleAddon}
                  onUpdateAttendees={updateAddonAttendees}
                  onUpdateQuantity={updateAddonQuantity}
                  guestCount={form.watch("guestCount")}
                  config={bakerConfig}
                />
              )}

              {currentStep === 3 && (
                <StepEventDetails
                  form={form}
                  deliveryOption={deliveryOption}
                  onDeliveryChange={setDeliveryOption}
                />
              )}

              {currentStep === 4 && <StepContactInfo form={form} />}

              {currentStep === 5 && (
                <StepReview
                  tiers={tiers}
                  decorations={decorations}
                  addons={addons}
                  deliveryOption={deliveryOption}
                  totals={totals}
                  form={form}
                  config={bakerConfig}
                />
              )}

              <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
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
                      <span className="font-medium">{formatCurrency(size.basePrice)}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Shape</Label>
                <RadioGroup
                  value={tier.shape}
                  onValueChange={(value) => onUpdateTier(index, "shape", value)}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {CAKE_SHAPES.map((shape) => (
                    <Label
                      key={shape.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover-elevate has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem value={shape.id} data-testid={`radio-shape-${shape.id}-${index}`} />
                      <span className="flex-1">{shape.label}</span>
                      <span className="text-muted-foreground">
                        {shape.priceModifier > 0 ? `+${formatCurrency(shape.priceModifier)}` : "Included"}
                      </span>
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
                      <span className="text-muted-foreground">
                        {flavor.priceModifier > 0 ? `+${formatCurrency(flavor.priceModifier)}` : "Included"}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Frosting</Label>
                <RadioGroup
                  value={tier.frosting}
                  onValueChange={(value) => onUpdateTier(index, "frosting", value)}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {FROSTING_TYPES.map((frosting) => (
                    <Label
                      key={frosting.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover-elevate has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem value={frosting.id} data-testid={`radio-frosting-${frosting.id}-${index}`} />
                      <span className="flex-1">{frosting.label}</span>
                      <span className="text-muted-foreground">
                        {frosting.priceModifier > 0 ? `+${formatCurrency(frosting.priceModifier)}` : "Included"}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button variant="outline" onClick={onAddTier} className="w-full" data-testid="button-add-tier">
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
    <div className="grid gap-3 sm:grid-cols-2">
      {DECORATIONS.map((decoration) => (
        <Label
          key={decoration.id}
          className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover-elevate has-[:checked]:border-primary has-[:checked]:bg-primary/5"
        >
          <Checkbox
            checked={selected.includes(decoration.id)}
            onCheckedChange={() => onToggle(decoration.id)}
            data-testid={`checkbox-decoration-${decoration.id}`}
          />
          <span className="flex-1">{decoration.label}</span>
          <span className="font-medium">{formatCurrency(decoration.price)}</span>
        </Label>
      ))}
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

const QUANTITY_OPTIONS = [
  { value: 0.5, label: "Half Dozen (6)" },
  { value: 1, label: "1 Dozen (12)" },
  { value: 2, label: "2 Dozen (24)" },
  { value: 3, label: "3 Dozen (36)" },
  { value: 4, label: "4 Dozen (48)" },
  { value: 5, label: "5 Dozen (60)" },
  { value: 6, label: "6 Dozen (72)" },
  { value: 7, label: "7 Dozen (84)" },
  { value: 8, label: "8 Dozen (96)" },
  { value: 9, label: "9 Dozen (108)" },
  { value: 10, label: "10 Dozen (120)" },
  { value: 11, label: "11 Dozen (132)" },
  { value: 12, label: "12 Dozen (144)" },
  { value: -1, label: "Custom amount..." },
];

function StepAddons({ selected, onToggle, onUpdateAttendees, onUpdateQuantity, guestCount, config }: StepAddonsProps) {
  const defaultAttendees = guestCount ? parseInt(guestCount) : 50;
  const addonHasQuantity = (addonId: string) => {
    return ["dipped-strawberries", "chocolate-apples", "candied-apples"].includes(addonId);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add extra treats and services to your order
      </p>
      <div className="grid gap-3">
        {ADDONS.map((addon) => {
          const isSelected = selected.some(a => a.id === addon.id);
          const selectedAddon = selected.find(a => a.id === addon.id);
          const isPerAttendee = addon.pricingType === "per-attendee";
          const minAttendees = "minAttendees" in addon ? addon.minAttendees : 0;
          const hasQuantitySelector = addonHasQuantity(addon.id);
          const customAddon = config?.addons?.find(a => a.id === addon.id);
          const addonPrice = customAddon?.price ?? addon.price;

          return (
            <div key={addon.id} className="space-y-2">
              <Label
                className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover-elevate has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggle(addon.id, isPerAttendee ? defaultAttendees : undefined)}
                  data-testid={`checkbox-addon-${addon.id}`}
                />
                <div className="flex-1">
                  <span>{addon.label}</span>
                  {isPerAttendee && (
                    <p className="text-xs text-muted-foreground">
                      ${addonPrice}/person (min {minAttendees} guests)
                    </p>
                  )}
                  {hasQuantitySelector && !isPerAttendee && (
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(addonPrice)} per dozen
                    </p>
                  )}
                </div>
                <span className="font-medium">
                  {isPerAttendee ? `$${addonPrice}/person` : formatCurrency(addonPrice)}
                </span>
              </Label>
              {isSelected && isPerAttendee && (
                <div className="ml-8 flex items-center gap-3">
                  <Label htmlFor={`attendees-${addon.id}`} className="text-sm">
                    Number of guests:
                  </Label>
                  <Input
                    id={`attendees-${addon.id}`}
                    type="number"
                    min={minAttendees}
                    className="w-24"
                    value={selectedAddon?.attendees || defaultAttendees}
                    onChange={(e) => onUpdateAttendees(addon.id, parseInt(e.target.value) || minAttendees!)}
                    data-testid={`input-addon-attendees-${addon.id}`}
                  />
                  <span className="text-sm text-muted-foreground">
                    = {formatCurrency(addonPrice * (selectedAddon?.attendees || defaultAttendees))}
                  </span>
                </div>
              )}
              {isSelected && hasQuantitySelector && !isPerAttendee && (
                <div className="ml-8 flex items-center gap-3 flex-wrap">
                  <Label htmlFor={`quantity-${addon.id}`} className="text-sm">
                    Quantity:
                  </Label>
                  {(selectedAddon?.quantity || 1) > 12 ? (
                    <div className="flex items-center gap-2">
                      <Input
                        id={`quantity-${addon.id}`}
                        type="number"
                        min={1}
                        step={0.5}
                        className="w-24"
                        value={selectedAddon?.quantity || 1}
                        onChange={(e) => onUpdateQuantity(addon.id, parseFloat(e.target.value) || 1)}
                        data-testid={`input-addon-quantity-custom-${addon.id}`}
                      />
                      <span className="text-xs text-muted-foreground">dozen</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateQuantity(addon.id, 1)}
                        className="text-xs"
                      >
                        Use dropdown
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={String(selectedAddon?.quantity || 1)}
                      onValueChange={(v) => {
                        const val = parseFloat(v);
                        if (val === -1) {
                          onUpdateQuantity(addon.id, 13);
                        } else {
                          onUpdateQuantity(addon.id, val);
                        }
                      }}
                    >
                      <SelectTrigger className="w-44" data-testid={`select-addon-quantity-${addon.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUANTITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <span className="text-sm text-muted-foreground">
                    = {formatCurrency(addonPrice * (selectedAddon?.quantity || 1))}
                  </span>
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
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-testid="select-event-type">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
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

        <FormField
          control={form.control}
          name="guestCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Guest Count (optional)</FormLabel>
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
      </div>

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
}

function StepContactInfo({ form }: StepContactInfoProps) {
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

interface StepReviewProps {
  tiers: CakeTier[];
  decorations: string[];
  addons: { id: string; quantity?: number; attendees?: number }[];
  deliveryOption: string;
  totals: ReturnType<typeof calculateTotal>;
  form: ReturnType<typeof useForm<ContactFormData>>;
  config?: CalculatorConfig;
}

function StepReview({ tiers, decorations, addons, deliveryOption, totals, form, config }: StepReviewProps) {
  const values = form.watch();

  return (
    <div className="space-y-6">
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
