import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Copy, Check, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const copyCalculatorUrl = () => {
    navigator.clipboard.writeText(calculatorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied to clipboard" });
  };

  return (
    <DashboardLayout title="Settings">
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
      </div>
    </DashboardLayout>
  );
}
