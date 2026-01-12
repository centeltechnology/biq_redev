import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, Check, Loader2, ExternalLink, CreditCard, Sparkles, Bell, HelpCircle, Zap, Camera, Upload, X, Image as ImageIcon, Plus, Trash2, Globe } from "lucide-react";
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

type CustomPaymentOption = { id: string; name: string; details: string };

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
  paymentZelle: z.string().optional(),
  paymentPaypal: z.string().optional(),
  paymentCashapp: z.string().optional(),
  paymentVenmo: z.string().optional(),
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

export default function SettingsPage() {
  const { baker } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [customPaymentOptions, setCustomPaymentOptions] = useState<CustomPaymentOption[]>([]);
  const [newPaymentName, setNewPaymentName] = useState("");
  const [newPaymentDetails, setNewPaymentDetails] = useState("");
  const profileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
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
      paymentZelle: "",
      paymentPaypal: "",
      paymentCashapp: "",
      paymentVenmo: "",
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
        paymentZelle: baker.paymentZelle || "",
        paymentPaypal: baker.paymentPaypal || "",
        paymentCashapp: baker.paymentCashapp || "",
        paymentVenmo: baker.paymentVenmo || "",
        depositPercentage: baker.depositPercentage ?? 50,
        defaultDepositType: (baker.defaultDepositType as "full" | "percentage" | "fixed") || "full",
        depositFixedAmount: baker.depositFixedAmount || "",
      });
      setProfilePhoto(baker.profilePhoto || null);
      setPortfolioImages((baker.portfolioImages || []).slice(0, 6));
      setCurrency(baker.currency || "USD");
      setCustomPaymentOptions((baker.customPaymentOptions as CustomPaymentOption[]) || []);
    }
  }, [baker, profileForm, paymentForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("PATCH", "/api/bakers/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Profile updated successfully" });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const res = await apiRequest("PATCH", "/api/bakers/me", { ...data, customPaymentOptions });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Payment options updated successfully" });
    },
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: async (newCurrency: string) => {
      const res = await apiRequest("PATCH", "/api/bakers/me", { currency: newCurrency });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Currency updated successfully" });
    },
  });

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    updateCurrencyMutation.mutate(newCurrency);
  };

  const addCustomPaymentOption = () => {
    if (!newPaymentName.trim() || !newPaymentDetails.trim()) {
      toast({ title: "Please enter both name and details", variant: "destructive" });
      return;
    }
    const newOption: CustomPaymentOption = {
      id: crypto.randomUUID(),
      name: newPaymentName.trim(),
      details: newPaymentDetails.trim(),
    };
    setCustomPaymentOptions([...customPaymentOptions, newOption]);
    setNewPaymentName("");
    setNewPaymentDetails("");
  };

  const removeCustomPaymentOption = (id: string) => {
    setCustomPaymentOptions(customPaymentOptions.filter(opt => opt.id !== id));
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
    mutationFn: async (data: { profilePhoto?: string | null; portfolioImages?: string[] | null }) => {
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

  const copyCalculatorUrl = () => {
    navigator.clipboard.writeText(calculatorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied to clipboard" });
  };

  return (
    <DashboardLayout title="Settings" actions={<InstructionModal page="settings" />}>
      <div className="max-w-2xl space-y-6">
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
                    <span>15 quotes per month</span>
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
                  <p>You're on the free plan with <strong>{subscription?.monthlyQuoteCount || 0}/{subscription?.quoteLimit || 5}</strong> quotes sent this month.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 border rounded-lg p-4">
                    <h4 className="font-medium">Basic - $9.97/month</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>15 quotes per month</li>
                      <li>Up to 5 Quick Order items</li>
                      <li>Unlimited leads</li>
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
                      Pro - $29.97/month
                    </h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>Unlimited quotes</li>
                      <li>Unlimited Quick Order items</li>
                      <li>Unlimited leads</li>
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
            <CardTitle>Payment Options</CardTitle>
            <CardDescription>
              Add your payment details to display on quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...paymentForm}>
              <form
                onSubmit={paymentForm.handleSubmit((data) =>
                  updatePaymentMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={paymentForm.control}
                  name="paymentZelle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zelle</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Email or phone for Zelle"
                          data-testid="input-payment-zelle"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="paymentPaypal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PayPal</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="PayPal email or @username"
                          data-testid="input-payment-paypal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="paymentCashapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cash App</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="$cashtag"
                          data-testid="input-payment-cashapp"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="paymentVenmo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venmo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="@username"
                          data-testid="input-payment-venmo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-sm">Custom Payment Methods</h4>
                  <p className="text-sm text-muted-foreground">
                    Add additional payment options for your region (e.g., OXXO, SPEI, bank transfer)
                  </p>
                  
                  {customPaymentOptions.length > 0 && (
                    <div className="space-y-2">
                      {customPaymentOptions.map((option) => (
                        <div 
                          key={option.id} 
                          className="flex items-center justify-between gap-2 p-3 bg-muted rounded-md"
                          data-testid={`custom-payment-${option.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{option.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{option.details}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCustomPaymentOption(option.id)}
                            data-testid={`button-remove-custom-payment-${option.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Payment name (e.g., OXXO)"
                        value={newPaymentName}
                        onChange={(e) => setNewPaymentName(e.target.value)}
                        data-testid="input-custom-payment-name"
                      />
                      <Input
                        placeholder="Details (reference # or link)"
                        value={newPaymentDetails}
                        onChange={(e) => setNewPaymentDetails(e.target.value)}
                        data-testid="input-custom-payment-details"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCustomPaymentOption}
                      className="w-fit"
                      data-testid="button-add-custom-payment"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-sm">Quote Deposit Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Set the deposit percentage required when customers accept quotes
                  </p>
                  
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
                          Percentage of quote total required as deposit (0 = no deposit required)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
