import { useState, useEffect } from "react";
import { Link, Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Cake, Mail, Lock, Building2, Loader2, Gift, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";

const signupSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;

interface InvitationData {
  valid: boolean;
  email?: string;
  role?: string;
  giftedPlan?: string | null;
  giftedPlanDurationMonths?: number | null;
}

export default function SignupPage() {
  const { register, isRegistering, registerError, isAuthenticated, isLoading } = useAuth();
  const [inviteToken] = useState(() => new URLSearchParams(window.location.search).get("invite"));
  const [inviteData, setInviteData] = useState<InvitationData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      businessName: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!inviteToken) return;
    fetch(`/api/auth/invitation/${inviteToken}`)
      .then(res => res.json())
      .then((data: InvitationData) => {
        setInviteData(data);
        if (data.valid && data.email) {
          form.setValue("email", data.email);
        }
        setInviteLoading(false);
      })
      .catch(() => {
        setInviteData({ valid: false });
        setInviteLoading(false);
      });
  }, [inviteToken]);

  const onSubmit = (data: SignupForm) => {
    register({
      ...data,
      ...(inviteToken && inviteData?.valid ? { inviteToken } : {}),
    });
  };

  if (isLoading || inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  const hasValidInvite = inviteToken && inviteData?.valid;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
            <Cake className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">BakerIQ</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {hasValidInvite ? "Welcome to BakerIQ" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {hasValidInvite
                ? "Complete your registration below"
                : "Start managing leads and quotes for your bakery"}
            </CardDescription>
            {hasValidInvite && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <Badge variant="secondary" className="gap-1.5" data-testid="badge-invited">
                  <CheckCircle className="h-3.5 w-3.5" />
                  You've been invited!
                </Badge>
                {inviteData?.giftedPlan && inviteData?.giftedPlanDurationMonths && (
                  <Badge variant="outline" className="gap-1.5" data-testid="badge-gifted-plan">
                    <Gift className="h-3.5 w-3.5" />
                    {inviteData.giftedPlanDurationMonths} month{inviteData.giftedPlanDurationMonths > 1 ? "s" : ""} of {inviteData.giftedPlan.charAt(0).toUpperCase() + inviteData.giftedPlan.slice(1)} plan included
                  </Badge>
                )}
              </div>
            )}
            {inviteToken && !inviteData?.valid && (
              <p className="text-sm text-destructive pt-2" data-testid="text-invite-invalid">
                This invitation link is invalid or has expired. You can still create a regular account below.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-business-name">Business Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            id="signup-business-name"
                            placeholder="Sweet Dreams Bakery"
                            className="pl-10"
                            data-testid="input-business-name"
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
                      <FormLabel htmlFor="signup-email">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            className="pl-10"
                            disabled={!!hasValidInvite}
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-password">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            id="signup-password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            className="pl-10"
                            data-testid="input-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {registerError && (
                  <p className="text-sm text-destructive" data-testid="text-register-error">
                    {registerError.message || "Registration failed. Please try again."}
                  </p>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="text-primary hover:underline" data-testid="link-terms">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline" data-testid="link-privacy">
                    Privacy Policy
                  </Link>
                </p>

                <Button type="submit" className="w-full" disabled={isRegistering} data-testid="button-signup">
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline" data-testid="link-login">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
