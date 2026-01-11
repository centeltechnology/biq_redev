import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, Check, Loader2, ExternalLink, CreditCard, Sparkles, Bell, HelpCircle, Zap } from "lucide-react";
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
      });
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
      const res = await apiRequest("PATCH", "/api/bakers/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Payment options updated successfully" });
    },
  });

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

                <FormField
                  control={paymentForm.control}
                  name="depositPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Deposit (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          max={100}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-deposit-percentage"
                        />
                      </FormControl>
                      <FormDescription>
                        Percentage of total required as deposit to confirm order
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
