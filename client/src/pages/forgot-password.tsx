import { Link } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Cake, Mail, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      await apiRequest("POST", "/api/auth/forgot-password", { email: data.email });
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      setSubmitted(true);
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    mutation.mutate(data);
  };

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
            <CardTitle className="text-2xl font-bold">Forgot password</CardTitle>
            <CardDescription>Enter your email to receive a password reset link</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-sm text-muted-foreground" data-testid="text-forgot-password-success">
                  If an account exists with that email, we've sent a password reset link.
                </p>
                <Link href="/login" className="text-sm text-primary font-medium hover:underline" data-testid="link-back-to-login">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="forgot-email">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                id="forgot-email"
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

                    <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-forgot-password">
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send reset link"
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline" data-testid="link-back-to-login">
                    Sign in
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
