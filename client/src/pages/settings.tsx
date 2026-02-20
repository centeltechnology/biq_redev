import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, Check, Loader2, ExternalLink, CreditCard, Sparkles, Bell, HelpCircle, Zap, Camera, Upload, X, Image as ImageIcon, Plus, Trash2, Globe, Pencil, AlertCircle, CheckCircle2, QrCode } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { InstructionModal } from "@/components/instruction-modal";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AVAILABLE_CURRENCIES } from "@/lib/calculator";
import { downloadCalculatorQR } from "@/lib/qr-download";


const profileSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  socialFacebook: z.string().optional(),
  socialInstagram: z.string().optional(),
  socialTiktok: z.string().optional(),
  socialPinterest: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const paymentSchema = z.object({
  depositPercentage: z.number().min(0).max(100),
  defaultDepositType: z.enum(["full", "percentage", "fixed"]),
  depositFixedAmount: z.string().optional(),
}).refine((data) => {
  if (data.defaultDepositType === "fixed") {
    const amount = parseFloat(data.depositFixedAmount || "0");
    return amount > 0;
  }
  return true;
}, {
  message: "Fixed deposit amount must be greater than 0",
  path: ["depositFixedAmount"],
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

function SlugEditor({ currentSlug }: { currentSlug: string }) {
  const [editing, setEditing] = useState(false);
  const [slug, setSlug] = useState(currentSlug);
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { toast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setSlug(currentSlug);
  }, [currentSlug]);

  const checkAvailability = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.length < 3) {
      setStatus("unavailable");
      setErrorMsg("Must be at least 3 characters");
      return;
    }
    if (value === currentSlug) {
      setStatus("idle");
      setErrorMsg("");
      return;
    }

    setStatus("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bakers/check-slug/${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.available) {
          setStatus("available");
          setErrorMsg("");
        } else {
          setStatus("unavailable");
          setErrorMsg(data.reason || "Not available");
        }
      } catch {
        setStatus("unavailable");
        setErrorMsg("Could not check availability");
      }
    }, 400);
  }, [currentSlug]);

  const updateSlugMutation = useMutation({
    mutationFn: async (newSlug: string) => {
      const res = await apiRequest("PATCH", "/api/bakers/me/slug", { slug: newSlug });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update URL");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Calculator URL updated" });
      setEditing(false);
      setStatus("idle");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update URL", description: error.message, variant: "destructive" });
    },
  });

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
    setSlug(sanitized);
    checkAvailability(sanitized);
  };

  const handleSave = () => {
    if (status === "available" && slug !== currentSlug) {
      updateSlugMutation.mutate(slug);
    }
  };

  const handleCancel = () => {
    setSlug(currentSlug);
    setEditing(false);
    setStatus("idle");
    setErrorMsg("");
  };

  if (!editing) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Custom URL:</span>
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/c/{currentSlug}</code>
        <Button variant="ghost" size="icon" onClick={() => setEditing(true)} data-testid="button-edit-slug">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <Label className="text-sm text-muted-foreground">Customize your calculator URL</Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">/c/</span>
        <div className="relative flex-1">
          <Input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="your-bakery-name"
            className="font-mono text-sm pr-8"
            data-testid="input-slug"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {status === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {status === "available" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {status === "unavailable" && <AlertCircle className="h-4 w-4 text-destructive" />}
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={status !== "available" || updateSlugMutation.isPending}
          data-testid="button-save-slug"
        >
          {updateSlugMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCancel} data-testid="button-cancel-slug">
          Cancel
        </Button>
      </div>
      {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
      {status === "available" && <p className="text-xs text-green-600">This URL is available</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { baker } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [fromStripeSuccess] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") === "stripe_success") {
      params.delete("from");
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      return true;
    }
    return false;
  });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const profileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUpload({});

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: "",
      email: "",
      phone: "",
      address: "",
      socialFacebook: "",
      socialInstagram: "",
      socialTiktok: "",
      socialPinterest: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      depositPercentage: 50,
      defaultDepositType: "full",
      depositFixedAmount: "",
    },
  });

  useEffect(() => {
    if (baker) {
      profileForm.reset({
        businessName: baker.businessName,
        email: baker.email,
        phone: baker.phone || "",
        address: baker.address || "",
        socialFacebook: baker.socialFacebook || "",
        socialInstagram: baker.socialInstagram || "",
        socialTiktok: baker.socialTiktok || "",
        socialPinterest: baker.socialPinterest || "",
      });
      paymentForm.reset({
        depositPercentage: baker.depositPercentage ?? 50,
        defaultDepositType: (baker.defaultDepositType as "full" | "percentage" | "fixed") || "full",
        depositFixedAmount: baker.depositFixedAmount || "",
      });
      setProfilePhoto(baker.profilePhoto || null);
      setPortfolioImages((baker.portfolioImages || []).slice(0, 6));
      setHeaderImage(baker.calculatorHeaderImage || null);
      setCurrency(baker.currency || "USD");
    }
  }, [baker, profileForm, paymentForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("PATCH", "/api/bakers/me", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: Error) => {
      console.error("Profile update error:", error);
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const res = await apiRequest("PATCH", "/api/bakers/me", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update payment options");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Payment options updated successfully" });
    },
    onError: (error: Error) => {
      console.error("Payment options update error:", error);
      toast({ title: "Failed to update payment options", description: error.message, variant: "destructive" });
    },
  });

  // Stripe Connect
  const { data: connectStatus, isLoading: connectLoading } = useQuery<{
    connected: boolean;
    onboarded: boolean;
    payoutsEnabled: boolean;
    accountId?: string;
  }>({
    queryKey: ["/api/stripe-connect/status"],
  });

  const createConnectAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe-connect/create-account");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stripe-connect/status"] });
      generateOnboardingLinkMutation.mutate();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to set up Stripe", description: error.message, variant: "destructive" });
    },
  });

  const generateOnboardingLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe-connect/onboarding-link");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error: Error) => {
      toast({ title: "Failed to generate onboarding link", description: error.message, variant: "destructive" });
    },
  });

  const openStripeDashboardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe-connect/dashboard-link");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error: Error) => {
      toast({ title: "Failed to open Stripe Dashboard", description: error.message, variant: "destructive" });
    },
  });

  // Check for connect return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connect") === "complete") {
      queryClient.invalidateQueries({ queryKey: ["/api/stripe-connect/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      const alreadyShown = sessionStorage.getItem("stripeConnectToastShown");
      if (!alreadyShown) {
        toast({
          title: "Stripe connected",
          description: "You can now collect deposits and payments.",
        });
        sessionStorage.setItem("stripeConnectToastShown", "true");
      }
      const cleanParams = new URLSearchParams(window.location.search);
      cleanParams.delete("connect");
      cleanParams.delete("stripe");
      const cleanUrl = cleanParams.toString()
        ? `${window.location.pathname}?${cleanParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    } else if (params.get("connect") === "refresh") {
      generateOnboardingLinkMutation.mutate();
    }
  }, []);

  const updateCurrencyMutation = useMutation({
    mutationFn: async (newCurrency: string) => {
      const res = await apiRequest("PATCH", "/api/bakers/me", { currency: newCurrency });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update currency");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Currency updated successfully" });
    },
    onError: (error: Error) => {
      console.error("Currency update error:", error);
      toast({ title: "Failed to update currency", description: error.message, variant: "destructive" });
    },
  });

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    updateCurrencyMutation.mutate(newCurrency);
  };


  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const res = await apiRequest("POST", "/api/auth/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: "Password changed successfully" });
    },
  });

  const calculatorUrl = baker?.slug
    ? `${window.location.origin}/c/${baker.slug}`
    : "";

  const { data: subscription } = useQuery<{
    plan: string;
    monthlyQuoteCount: number;
    quoteLimit: number | null;
    isAtLimit: boolean;
  }>({
    queryKey: ["/api/subscription/status"],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string = "pro") => {
      const res = await apiRequest("POST", "/api/subscription/checkout", { plan });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscription/portal");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: { notifyNewLead?: number; notifyQuoteViewed?: number; notifyQuoteAccepted?: number }) => {
      const res = await apiRequest("PATCH", "/api/bakers/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Notification preferences updated" });
    },
  });

  const updateQuickOrderLimitMutation = useMutation({
    mutationFn: async (data: { limit: number | null }) => {
      const res = await apiRequest("PATCH", "/api/bakers/me", { quickOrderItemLimit: data.limit });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Quick Order settings updated" });
    },
  });

  const restartTourMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/baker/onboarding-tour", { status: "pending" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Tour reset! Refresh the page to start the tour." });
    },
  });

  const updatePhotosMutation = useMutation({
    mutationFn: async (data: { profilePhoto?: string | null; portfolioImages?: string[] | null; calculatorHeaderImage?: string | null }) => {
      const res = await apiRequest("PATCH", "/api/bakers/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Photos updated successfully" });
    },
  });

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    
    setUploadingProfile(true);
    try {
      const result = await uploadFile(file);
      if (result) {
        const newProfilePhoto = result.objectPath;
        setProfilePhoto(newProfilePhoto);
        await updatePhotosMutation.mutateAsync({ profilePhoto: newProfilePhoto });
      }
    } catch (error) {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploadingProfile(false);
      if (profileInputRef.current) profileInputRef.current.value = "";
    }
  };

  const handleRemoveProfilePhoto = async () => {
    setProfilePhoto(null);
    await updatePhotosMutation.mutateAsync({ profilePhoto: null });
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = 6 - portfolioImages.length;
    if (remainingSlots <= 0) {
      toast({ title: "Portfolio is full (max 6 images)", variant: "destructive" });
      return;
    }
    
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    setUploadingPortfolio(true);
    try {
      const uploadedPaths: string[] = [];
      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) continue;
        const result = await uploadFile(file);
        if (result) {
          uploadedPaths.push(result.objectPath);
        }
      }
      
      if (uploadedPaths.length > 0) {
        const newPortfolioImages = [...portfolioImages, ...uploadedPaths];
        setPortfolioImages(newPortfolioImages);
        await updatePhotosMutation.mutateAsync({ portfolioImages: newPortfolioImages });
      }
    } catch (error) {
      toast({ title: "Failed to upload images", variant: "destructive" });
    } finally {
      setUploadingPortfolio(false);
      if (portfolioInputRef.current) portfolioInputRef.current.value = "";
    }
  };

  const handleRemovePortfolioImage = async (index: number) => {
    const newPortfolioImages = portfolioImages.filter((_, i) => i !== index);
    setPortfolioImages(newPortfolioImages);
    await updatePhotosMutation.mutateAsync({ portfolioImages: newPortfolioImages });
  };

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    
    setUploadingHeader(true);
    try {
      const result = await uploadFile(file);
      if (result) {
        const newHeaderImage = result.objectPath;
        setHeaderImage(newHeaderImage);
        await updatePhotosMutation.mutateAsync({ calculatorHeaderImage: newHeaderImage });
      }
    } catch (error) {
      toast({ title: "Failed to upload header image", variant: "destructive" });
    } finally {
      setUploadingHeader(false);
      if (headerInputRef.current) headerInputRef.current.value = "";
    }
  };

  const handleRemoveHeaderImage = async () => {
    setHeaderImage(null);
    await updatePhotosMutation.mutateAsync({ calculatorHeaderImage: null });
  };

  const copyCalculatorUrl = async () => {
    navigator.clipboard.writeText(calculatorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied to clipboard" });
    
    // Track event for retention segmentation
    try {
      await fetch("/api/track-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ eventType: "quick_quote_link_copied" }),
      });
    } catch {
      // Silent fail - tracking is not critical
    }
  };

  return (
    <DashboardLayout title="Settings" actions={<InstructionModal page="settings" />}>
      <div className="max-w-2xl space-y-6">
        {fromStripeSuccess && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20" data-testid="banner-calculator-guidance">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Payments are live</p>
              <p className="text-xs text-muted-foreground">
                Customers will use this page to request quotes. Make sure your pricing reflects what you want to sell.
              </p>
            </div>
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Public Calculator Link</CardTitle>
            <CardDescription>
              Share this link with customers to receive cake estimates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={calculatorUrl}
                readOnly
                className="font-mono text-sm"
                data-testid="input-calculator-url"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyCalculatorUrl}
                data-testid="button-copy-url"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a
                  href={calculatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-open-calculator"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  try {
                    await downloadCalculatorQR(calculatorUrl, baker?.businessName || undefined);
                    toast({
                      title: "QR code downloaded",
                      description: "Tip: Add this QR to your packaging, pop-up booth, or business cards to get more orders.",
                    });
                  } catch {
                    toast({
                      title: "Download failed",
                      description: "Could not generate QR code.",
                      variant: "destructive",
                    });
                  }
                }}
                data-testid="button-download-qr"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
            <SlugEditor currentSlug={baker?.slug || ""} />

            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium">Calculator Header Image</Label>
              <p className="text-xs text-muted-foreground">This image appears at the top of your public calculator page and in social media previews.</p>
              <div className="mt-2">
                {headerImage ? (
                  <div className="relative rounded-md overflow-hidden border">
                    <img
                      src={headerImage}
                      alt="Calculator header"
                      className="w-full h-40 object-cover"
                      data-testid="img-header-preview"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 rounded-md border border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/50">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs">No header image set</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={headerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleHeaderImageUpload}
                  data-testid="input-header-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => headerInputRef.current?.click()}
                  disabled={uploadingHeader}
                  data-testid="button-upload-header"
                >
                  {uploadingHeader ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploadingHeader ? "Uploading..." : "Upload Image"}
                </Button>
                {headerImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveHeaderImage}
                    disabled={updatePhotosMutation.isPending}
                    data-testid="button-remove-header"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>
                Manage your BakerIQ subscription
              </CardDescription>
            </div>
            {subscription?.plan === "pro" ? (
              <Badge variant="default" className="bg-primary">Pro</Badge>
            ) : subscription?.plan === "basic" ? (
              <Badge variant="secondary">Basic</Badge>
            ) : (
              <Badge variant="outline">Free</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription?.plan === "pro" ? (
              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited quotes per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Quick Order items</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  data-testid="button-manage-subscription"
                >
                  {portalMutation.isPending ? "Loading..." : "Manage Subscription"}
                </Button>
              </div>
            ) : subscription?.plan === "basic" ? (
              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited quotes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <span>Up to 5 Quick Order items</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => portalMutation.mutate()}
                    disabled={portalMutation.isPending}
                    data-testid="button-manage-subscription"
                  >
                    {portalMutation.isPending ? "Loading..." : "Manage Subscription"}
                  </Button>
                  <Button 
                    onClick={() => upgradeMutation.mutate("pro")}
                    disabled={upgradeMutation.isPending}
                    data-testid="button-upgrade-to-pro"
                  >
                    {upgradeMutation.isPending ? "Loading..." : "Upgrade to Pro"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>You're on the free plan with <strong>{subscription?.monthlyQuoteCount || 0}/{subscription?.quoteLimit || 15}</strong> quotes sent this month.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 border rounded-lg p-4">
                    <h4 className="font-medium">Basic - $4.99/month</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>Unlimited quotes</li>
                      <li>Up to 5 Quick Order items</li>
                      <li>5% platform fee (vs 7% free)</li>
                      <li>Cancel anytime</li>
                    </ul>
                    <Button 
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => upgradeMutation.mutate("basic")}
                      disabled={upgradeMutation.isPending}
                      data-testid="button-upgrade-basic"
                    >
                      {upgradeMutation.isPending ? "Loading..." : "Get Basic"}
                    </Button>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Pro - $9.99/month
                    </h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>Unlimited quotes</li>
                      <li>Unlimited Quick Order items</li>
                      <li>Lowest 3% platform fee</li>
                      <li>Cancel anytime</li>
                    </ul>
                    <Button 
                      className="mt-4 w-full"
                      onClick={() => upgradeMutation.mutate("pro")}
                      disabled={upgradeMutation.isPending}
                      data-testid="button-upgrade-pro"
                    >
                      {upgradeMutation.isPending ? "Loading..." : "Get Pro"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>
              Update your business information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit((data) =>
                  updateProfileMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={profileForm.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-business-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="textarea-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-4">Social Media</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="socialFacebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="@yourbakery" data-testid="input-social-facebook" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="socialInstagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="@yourbakery" data-testid="input-social-instagram" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="socialTiktok"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TikTok</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="@yourbakery" data-testid="input-social-tiktok" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="socialPinterest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pinterest</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="@yourbakery" data-testid="input-social-pinterest" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Photo & Portfolio</CardTitle>
            <CardDescription>
              Upload your profile photo and showcase your work on your public calculator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Profile Photo</Label>
              <p className="text-sm text-muted-foreground mb-3">
                This photo appears next to your business name on the calculator
              </p>
              <div className="flex items-center gap-4">
                {profilePhoto ? (
                  <div className="relative">
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover border"
                      data-testid="img-profile-photo"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemoveProfilePhoto}
                      data-testid="button-remove-profile-photo"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePhotoUpload}
                    data-testid="input-profile-photo"
                  />
                  <Button
                    variant="outline"
                    onClick={() => profileInputRef.current?.click()}
                    disabled={uploadingProfile}
                    data-testid="button-upload-profile-photo"
                  >
                    {uploadingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {profilePhoto ? "Change Photo" : "Upload Photo"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <Label className="text-sm font-medium">Portfolio ({portfolioImages.length}/6)</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Showcase your best work - customers see this gallery on your calculator page
              </p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {portfolioImages.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image}
                      alt={`Portfolio ${index + 1}`}
                      className="h-full w-full object-cover rounded-lg border"
                      data-testid={`img-portfolio-${index}`}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => handleRemovePortfolioImage(index)}
                      data-testid={`button-remove-portfolio-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {portfolioImages.length < 6 && (
                  <button 
                    type="button"
                    className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => portfolioInputRef.current?.click()}
                    data-testid="button-add-portfolio-tile"
                  >
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
                      <span className="text-xs text-muted-foreground">Add</span>
                    </div>
                  </button>
                )}
              </div>
              <input
                ref={portfolioInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePortfolioUpload}
                data-testid="input-portfolio-images"
              />
              <Button
                variant="outline"
                onClick={() => portfolioInputRef.current?.click()}
                disabled={uploadingPortfolio || portfolioImages.length >= 6}
                data-testid="button-upload-portfolio"
              >
                {uploadingPortfolio ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Images
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Currency & Region
            </CardTitle>
            <CardDescription>
              Choose the currency for all prices in your quotes and calculator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="w-full mt-1.5" data-testid="select-currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code} data-testid={`currency-option-${curr.code}`}>
                        {curr.code} - {curr.name} ({curr.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1.5">
                  This currency will be used for all prices displayed to your customers
                </p>
              </div>
              {updateCurrencyMutation.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Online Payments</CardTitle>
            <CardDescription>
              Accept payments directly from customers through your quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking payment status...</span>
              </div>
            ) : connectStatus?.onboarded && connectStatus?.payoutsEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-md">
                  <Check className="h-4 w-4" />
                  <span>Stripe account connected and ready to accept payments</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openStripeDashboardMutation.mutate()}
                    disabled={openStripeDashboardMutation.isPending}
                    data-testid="button-stripe-dashboard"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {openStripeDashboardMutation.isPending ? "Opening..." : "Stripe Dashboard"}
                  </Button>
                </div>
              </div>
            ) : connectStatus?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-3 rounded-md">
                  <HelpCircle className="h-4 w-4" />
                  <span>Stripe account created but onboarding is not complete</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateOnboardingLinkMutation.mutate()}
                  disabled={generateOnboardingLinkMutation.isPending}
                  data-testid="button-complete-stripe-onboarding"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {generateOnboardingLinkMutation.isPending ? "Loading..." : "Complete Stripe Setup"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your Stripe account to accept deposits and payments directly from customers when they view their quotes. A small platform fee ({baker?.platformFeePercent || "3.00"}%) applies per transaction.
                </p>
                <Button
                  onClick={() => createConnectAccountMutation.mutate()}
                  disabled={createConnectAccountMutation.isPending}
                  data-testid="button-connect-stripe"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  {createConnectAccountMutation.isPending ? "Setting up..." : "Connect Stripe Account"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deposit Settings</CardTitle>
            <CardDescription>
              Configure deposit requirements for your quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!connectStatus?.onboarded && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-3 rounded-md mb-4" data-testid="notice-stripe-required-deposits">
                <CreditCard className="h-4 w-4 shrink-0" />
                <span>Connect Stripe above to collect deposits and payments from customers.</span>
              </div>
            )}
            <Form {...paymentForm}>
              <form
                onSubmit={paymentForm.handleSubmit((data) =>
                  updatePaymentMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Set how much deposit is required when customers accept quotes
                  </p>
                  
                  <FormField
                    control={paymentForm.control}
                    name="defaultDepositType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-deposit-type">
                              <SelectValue placeholder="Select deposit type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full">Full Payment Required</SelectItem>
                            <SelectItem value="percentage">Percentage of Total</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose whether to require full payment, a percentage, or a fixed deposit amount
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {paymentForm.watch("defaultDepositType") === "percentage" && (
                    <FormField
                      control={paymentForm.control}
                      name="depositPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deposit Percentage</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                {...field}
                                type="number"
                                min={0}
                                max={100}
                                className="w-24"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-deposit-percentage"
                              />
                              <span className="text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Percentage of quote total required as deposit
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {paymentForm.watch("defaultDepositType") === "fixed" && (
                    <FormField
                      control={paymentForm.control}
                      name="depositFixedAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fixed Deposit Amount</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">$</span>
                              <Input
                                {...field}
                                type="number"
                                min={0}
                                step="0.01"
                                className="w-32"
                                placeholder="0.00"
                                data-testid="input-deposit-fixed"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Fixed dollar amount required as deposit
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={updatePaymentMutation.isPending}
                  data-testid="button-save-payment"
                >
                  {updatePaymentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Payment Options"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit((data) =>
                  updatePasswordMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          data-testid="input-current-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          data-testid="input-new-password"
                        />
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          data-testid="input-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={updatePasswordMutation.isPending}
                  data-testid="button-change-password"
                >
                  {updatePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Choose which emails you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Lead Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when someone submits the calculator</p>
              </div>
              <Switch
                checked={baker?.notifyNewLead === 1}
                onCheckedChange={(checked) => {
                  updateNotificationsMutation.mutate({ notifyNewLead: checked ? 1 : 0 });
                }}
                disabled={updateNotificationsMutation.isPending}
                data-testid="switch-notify-new-lead"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Quote Viewed</p>
                <p className="text-sm text-muted-foreground">Get notified when a customer views their quote</p>
              </div>
              <Switch
                checked={baker?.notifyQuoteViewed === 1}
                onCheckedChange={(checked) => {
                  updateNotificationsMutation.mutate({ notifyQuoteViewed: checked ? 1 : 0 });
                }}
                disabled={updateNotificationsMutation.isPending}
                data-testid="switch-notify-quote-viewed"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Quote Accepted</p>
                <p className="text-sm text-muted-foreground">Get notified when a customer accepts a quote</p>
              </div>
              <Switch
                checked={baker?.notifyQuoteAccepted === 1}
                onCheckedChange={(checked) => {
                  updateNotificationsMutation.mutate({ notifyQuoteAccepted: checked ? 1 : 0 });
                }}
                disabled={updateNotificationsMutation.isPending}
                data-testid="switch-notify-quote-accepted"
              />
            </div>
            <div className="border-t pt-4 mt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Marketing & Tips</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Onboarding Tips</p>
                    <p className="text-sm text-muted-foreground">Helpful tips to get started with BakerIQ</p>
                  </div>
                  <Switch
                    checked={baker?.notifyOnboarding === 1}
                    onCheckedChange={(checked) => {
                      updateNotificationsMutation.mutate({ notifyOnboarding: checked ? 1 : 0 });
                    }}
                    disabled={updateNotificationsMutation.isPending}
                    data-testid="switch-notify-onboarding"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Engagement Reminders</p>
                    <p className="text-sm text-muted-foreground">Periodic reminders and tips to grow your business</p>
                  </div>
                  <Switch
                    checked={baker?.notifyRetention === 1}
                    onCheckedChange={(checked) => {
                      updateNotificationsMutation.mutate({ notifyRetention: checked ? 1 : 0 });
                    }}
                    disabled={updateNotificationsMutation.isPending}
                    data-testid="switch-notify-retention"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Announcements & Updates</p>
                    <p className="text-sm text-muted-foreground">New features, updates, and platform news</p>
                  </div>
                  <Switch
                    checked={baker?.notifyAnnouncements === 1}
                    onCheckedChange={(checked) => {
                      updateNotificationsMutation.mutate({ notifyAnnouncements: checked ? 1 : 0 });
                    }}
                    disabled={updateNotificationsMutation.isPending}
                    data-testid="switch-notify-announcements"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Order Settings
            </CardTitle>
            <CardDescription>
              Control Quick Order display. You can also toggle visibility for each item in the Pricing Calculator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Item Display Limit</p>
                <p className="text-sm text-muted-foreground">
                  Control how many Quick Order items are shown to customers
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={baker?.quickOrderItemLimit === null || baker?.quickOrderItemLimit === undefined}
                  onCheckedChange={(checked) => {
                    updateQuickOrderLimitMutation.mutate({ limit: checked ? null : 8 });
                  }}
                  disabled={updateQuickOrderLimitMutation.isPending}
                  data-testid="switch-quick-order-unlimited"
                />
                <span className="text-sm text-muted-foreground">Unlimited</span>
              </div>
            </div>
            {baker?.quickOrderItemLimit !== null && baker?.quickOrderItemLimit !== undefined && (
              <div className="flex items-center gap-4 pl-4 border-l-2 border-muted">
                <Label htmlFor="quick-order-limit" className="text-sm">Show up to:</Label>
                <Select
                  value={String(baker.quickOrderItemLimit)}
                  onValueChange={(value) => {
                    updateQuickOrderLimitMutation.mutate({ limit: parseInt(value) });
                  }}
                >
                  <SelectTrigger className="w-24" data-testid="select-quick-order-limit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[4, 6, 8, 10, 12, 15, 20].map((num) => (
                      <SelectItem key={num} value={String(num)}>{num} items</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              This sets a global limit. You can also control visibility per-item from the Pricing Calculator page using the eye icon.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Help & Tour
            </CardTitle>
            <CardDescription>
              Get help using BakerIQ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Restart Onboarding Tour</p>
                <p className="text-sm text-muted-foreground">Take a guided tour of the dashboard features</p>
              </div>
              <Button
                variant="outline"
                onClick={() => restartTourMutation.mutate()}
                disabled={restartTourMutation.isPending}
                data-testid="button-restart-tour"
              >
                {restartTourMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Restart Tour"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
