import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Check, ChevronRight, ChevronLeft, Store, FileText, Share2, CreditCard, Copy, Loader2, ExternalLink, Upload, Image, Send, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";

const STEPS = [
  { label: "Your Bakery", icon: Store },
  { label: "Try a Quote", icon: FileText },
  { label: "Share Link", icon: Share2 },
  { label: "Get Paid", icon: CreditCard },
];

export default function OnboardingPage() {
  const { baker } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload({});

  const [currentStep, setCurrentStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [demoQuoteCreated, setDemoQuoteCreated] = useState(false);
  const [demoQuoteId, setDemoQuoteId] = useState<string | null>(null);
  const [demoQuoteItems, setDemoQuoteItems] = useState<Array<{ name: string; description: string; quantity: number; unitPrice: string; totalPrice: string }>>([]);
  const [demoQuoteTotal, setDemoQuoteTotal] = useState<string>("0");
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testQuoteSent, setTestQuoteSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (baker) {
      setBusinessName(baker.businessName || "");
      setSlug(baker.slug || "");
      setProfilePhoto(baker.profilePhoto || null);
      setHeaderImage(baker.calculatorHeaderImage || null);
      setTestEmailAddress(baker.email || "");
      if (baker.demoQuoteId) {
        setDemoQuoteId(baker.demoQuoteId);
        setDemoQuoteCreated(true);
      }
      if (baker.onboardingStep > 1) {
        setCurrentStep(baker.onboardingStep);
      }
      if (baker.onboardingCompleted && baker.onboardingStep < 4) {
        setLocation("/dashboard");
      }
    }
  }, [baker]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { businessName?: string; profilePhoto?: string | null; calculatorHeaderImage?: string | null }) => {
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

  const demoQuoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/baker/demo-quote");
      return res.json();
    },
    onSuccess: (data: any) => {
      setDemoQuoteCreated(true);
      setDemoQuoteId(data.quote?.id);
      setDemoQuoteTotal(data.quote?.total || "0.00");
      if (data.quote?.items && data.quote.items.length > 0) {
        setDemoQuoteItems(data.quote.items.map((item: any) => ({
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
    onError: () => {
      toast({ title: "Failed to create demo quote", variant: "destructive" });
    },
  });

  const sendTestQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      if (testEmailAddress && testEmailAddress !== baker?.email) {
        const quoteRes = await apiRequest("GET", `/api/quotes/${quoteId}`);
        const quoteData = await quoteRes.json();
        if (quoteData.customerId) {
          await apiRequest("PATCH", `/api/customers/${quoteData.customerId}`, { email: testEmailAddress });
        }
      }
      const res = await apiRequest("POST", `/api/quotes/${quoteId}/send`);
      return res.json();
    },
    onSuccess: () => {
      setTestQuoteSent(true);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Test quote sent!", description: `Check your inbox at ${testEmailAddress}` });
    },
    onError: () => {
      toast({ title: "Failed to send test quote", variant: "destructive" });
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

  const handleStep1Continue = async () => {
    if (!businessName.trim()) {
      toast({ title: "Please enter your business name", variant: "destructive" });
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({ businessName });
      if (slug && slug !== baker?.slug && slugAvailable !== false) {
        try {
          await updateSlugMutation.mutateAsync(slug);
        } catch {
          // slug update failed, continue anyway
        }
      }
      await saveStepMutation.mutateAsync(2);
      setCurrentStep(2);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const handleStep2Continue = async () => {
    await saveStepMutation.mutateAsync(3);
    setCurrentStep(3);
  };

  const handleStep3Continue = async () => {
    await completeMutation.mutateAsync();
    await saveStepMutation.mutateAsync(4);
    setCurrentStep(4);
  };

  const handleCopyLink = async () => {
    const calculatorUrl = `${window.location.origin}/c/${baker?.slug || slug}`;
    try {
      await navigator.clipboard.writeText(calculatorUrl);
      setLinkCopied(true);
      toast({ title: "Link copied!", description: "Share it on social media or your website." });
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const handleSkipStripe = () => {
    setLocation("/dashboard");
  };

  const calculatorUrl = `${window.location.origin}/c/${baker?.slug || slug}`;

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="page-onboarding">
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-onboarding-title">Set up your bakery</h1>
          <p className="text-muted-foreground mt-1">Just a few steps to get started</p>
        </div>

        <div className="flex items-center justify-center gap-1 mb-10">
          {STEPS.map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === currentStep;
            const isComplete = stepNum < currentStep;
            const StepIcon = step.icon;

            return (
              <div key={stepNum} className="flex items-center" data-testid={`stepper-step-${stepNum}`}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-full transition-colors ${
                    isComplete ? "bg-green-500 text-white" :
                    isActive ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isComplete ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-1 mb-5 ${stepNum < currentStep ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>

        {currentStep === 1 && (
          <Card data-testid="card-step-1">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Tell us about your bakery</h2>
                <p className="text-sm text-muted-foreground">This info appears on your public calculator page.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-name">Business Name *</Label>
                <Input
                  id="business-name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Sweet Creations by Jane"
                  data-testid="input-business-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Your Calculator URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{window.location.origin}/c/</span>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Profile Photo (optional)</Label>
                  <div className="flex flex-col items-center gap-2">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="h-20 w-20 rounded-full object-cover border" />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <span className="text-xs text-primary hover:underline">{profilePhoto ? "Change" : "Upload"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Header Image (optional)</Label>
                  <div className="flex flex-col items-center gap-2">
                    {headerImage ? (
                      <img src={headerImage} alt="Header" className="h-20 w-full rounded object-cover border" />
                    ) : (
                      <div className="h-20 w-full rounded bg-muted flex items-center justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <span className="text-xs text-primary hover:underline">{headerImage ? "Change" : "Upload"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleHeaderImageUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleStep1Continue} disabled={updateProfileMutation.isPending || !businessName.trim()} data-testid="button-step1-continue">
                  {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card data-testid="card-step-2">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">See how quotes work</h2>
                <p className="text-sm text-muted-foreground">Create a sample quote and send it to yourself to experience what your customers will see.</p>
              </div>

              {!demoQuoteCreated ? (
                <div className="bg-muted/50 border rounded-lg p-6 text-center space-y-4">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">Create a demo quote</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      We'll create a sample quote with a two-tier birthday cake so you can see how the quoting system works.
                    </p>
                  </div>
                  <Button
                    onClick={() => demoQuoteMutation.mutate()}
                    disabled={demoQuoteMutation.isPending}
                    data-testid="button-create-demo-quote"
                  >
                    {demoQuoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Demo Quote
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {testQuoteSent && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center space-y-2">
                      <p className="font-medium text-green-800 dark:text-green-200">
                        This is what your customers will see when you send quotes.
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Check your inbox at <span className="font-medium">{testEmailAddress}</span>
                      </p>
                    </div>
                  )}

                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
                      <span className="font-medium text-sm">Demo Quote Preview</span>
                      {demoQuoteId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/q/${demoQuoteId}`, "_blank")}
                          data-testid="button-view-demo-quote"
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Open Full View
                        </Button>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      {demoQuoteItems.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-4" data-testid={`quote-item-${idx}`}>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">${item.totalPrice}</span>
                        </div>
                      ))}
                      <div className="border-t pt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold">Total</span>
                        <span className="text-sm font-semibold">${demoQuoteTotal}</span>
                      </div>
                    </div>
                  </div>

                  {!testQuoteSent && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">Send this quote to yourself</p>
                      </div>
                      <p className="text-xs text-muted-foreground">See exactly what your customers will receive in their inbox.</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="email"
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value)}
                          placeholder="your@email.com"
                          className="flex-1"
                          data-testid="input-test-email"
                        />
                        <Button
                          onClick={() => demoQuoteId && sendTestQuoteMutation.mutate(demoQuoteId)}
                          disabled={sendTestQuoteMutation.isPending || !testEmailAddress}
                          data-testid="button-send-test-quote"
                        >
                          {sendTestQuoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                          Send
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" onClick={() => setCurrentStep(1)} data-testid="button-step2-back">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <div className="flex items-center gap-3">
                  {demoQuoteCreated && !testQuoteSent && (
                    <button
                      onClick={handleStep2Continue}
                      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                      data-testid="button-step2-skip"
                    >
                      Skip for now
                    </button>
                  )}
                  <Button
                    onClick={handleStep2Continue}
                    disabled={!demoQuoteCreated || (!testQuoteSent && demoQuoteCreated)}
                    data-testid="button-step2-continue"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card data-testid="card-step-3">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Share Your Order Page</h2>
                <p className="text-sm text-muted-foreground">This link replaces pricing back-and-forth in your DMs.</p>
              </div>

              <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Your Calculator Link</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background border rounded px-3 py-2 text-sm truncate" data-testid="text-calculator-url">
                    {calculatorUrl}
                  </code>
                  <Button size="sm" onClick={handleCopyLink} variant={linkCopied ? "outline" : "default"} data-testid="button-copy-link">
                    {linkCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {linkCopied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(calculatorUrl, "_blank")}
                  data-testid="button-preview-calculator"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview Calculator
                </Button>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium">Pro tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drop this link in your DMs, bio, and replies to pricing questions. Add it to your Instagram bio, Facebook page, or any link-in-bio tool so customers can get instant estimates 24/7.
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setCurrentStep(2)} data-testid="button-step3-back">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button onClick={handleStep3Continue} disabled={completeMutation.isPending} data-testid="button-step3-continue">
                  {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card data-testid="card-step-4">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Accept payments from customers</h2>
                <p className="text-sm text-muted-foreground">Connect Stripe to let customers pay deposits and invoices directly through your quotes.</p>
              </div>

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
                    {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Connect Stripe
                  </Button>
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                You can do this now or later. Quotes still work without payments enabled.
              </p>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setCurrentStep(3)} data-testid="button-step4-back">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button onClick={handleSkipStripe} data-testid="button-go-to-dashboard">
                  Go to Dashboard
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
