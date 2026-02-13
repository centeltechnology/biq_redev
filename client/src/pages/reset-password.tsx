import { Link, useSearch } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Cake, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const token = searchParams.get("token");

  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      await apiRequest("POST", "/api/auth/reset-password", {
        token,
        password: data.password,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      setErrorMessage(null);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || "Failed to reset password. The link may be invalid or expired.");
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
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
            <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
            <CardDescription>Enter your new password</CardDescription>
          </CardHeader>
          <CardContent>
            {!token ? (
              <div className="space-y-4 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <p className="text-sm text-destructive" data-testid="text-no-token-error">
                  Invalid reset link. Please request a new password reset.
                </p>
                <Link href="/forgot-password" className="text-sm text-primary font-medium hover:underline" data-testid="link-request-new-reset">
                  Request new reset link
                </Link>
              </div>
            ) : success ? (
              <div className="space-y-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-sm text-muted-foreground" data-testid="text-reset-success">
                  Your password has been reset successfully.
                </p>
                <Link href="/login" className="text-sm text-primary font-medium hover:underline" data-testid="link-back-to-login">
                  Sign in with your new password
                </Link>
              </div>
            ) : (
              <>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="reset-password">New password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                id="reset-password"
                                type="password"
                                placeholder="At least 8 characters"
                                className="pl-10"
                                data-testid="input-password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="reset-confirm-password">Confirm password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                id="reset-confirm-password"
                                type="password"
                                placeholder="Confirm your password"
                                className="pl-10"
                                data-testid="input-confirm-password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {errorMessage && (
                      <p className="text-sm text-destructive" data-testid="text-reset-error">
                        {errorMessage}
                      </p>
                    )}

                    <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-reset-password">
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        "Reset password"
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
