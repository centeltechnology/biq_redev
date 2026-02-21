import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useFormatCurrency } from "@/hooks/use-baker-currency";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AVAILABLE_CURRENCIES } from "@/lib/calculator";
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, Receipt, Shield, Globe, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface PaymentRecord {
  id: string;
  quoteId: string;
  amount: string;
  platformFee: string;
  status: string;
  paymentType: string;
  createdAt: string;
  quoteTitle: string;
  quoteNumber: string;
  customerName: string;
}

interface PaymentStats {
  totalReceived: number;
  totalFees: number;
  netEarnings: number;
  totalTransactions: number;
  monthlyReceived: number;
}

interface PaymentData {
  payments: PaymentRecord[];
  stats: PaymentStats;
}

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

export default function PaymentsPage() {
  const { baker } = useAuth();
  const { toast } = useToast();
  const formatCurrency = useFormatCurrency();
  const stripeConnected = !!baker?.stripeConnectedAt;
  const [currency, setCurrency] = useState("USD");

  const { data, isLoading } = useQuery<PaymentData>({
    queryKey: ["/api/payments"],
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
      paymentForm.reset({
        depositPercentage: baker.depositPercentage ?? 50,
        defaultDepositType: (baker.defaultDepositType as "full" | "percentage" | "fixed") || "full",
        depositFixedAmount: baker.depositFixedAmount || "",
      });
      setCurrency(baker.currency || "USD");
    }
  }, [baker, paymentForm]);

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
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    updateCurrencyMutation.mutate(newCurrency);
  };

  const paymentTypeLabels: Record<string, string> = {
    deposit: "Deposit",
    full: "Full Payment",
    remaining: "Remaining Balance",
  };

  return (
    <DashboardLayout title="Payments">
      <div className="space-y-6">
        {!stripeConnected && (
          <Card className="border-primary/30 bg-primary/5" data-testid="card-stripe-activation">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg" data-testid="text-activation-title">Enable online payments</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect Stripe to start collecting deposits automatically from your quotes.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  data-testid="button-secure-payouts"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {connectMutation.isPending ? "Setting up..." : "Secure Your Payouts"}
                </Button>
                <Button variant="ghost" size="sm" asChild data-testid="link-learn-payments">
                  <Link href="/faq">
                    Learn how payments work
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Deposit Settings</CardTitle>
            <CardDescription>
              Configure deposit requirements for your quotes
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

        <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${!stripeConnected ? "opacity-60" : ""}`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Received</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-total-received">
                  {formatCurrency(data?.stats.totalReceived || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-net-earnings">
                  {formatCurrency(data?.stats.netEarnings || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-monthly-received">
                  {formatCurrency(data?.stats.monthlyReceived || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-total-transactions">
                  {data?.stats.totalTransactions || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {!stripeConnected && (
          <p className="text-xs text-muted-foreground text-center" data-testid="text-payments-helper">
            Payments will appear here once Stripe is connected.
          </p>
        )}

        {data?.stats.totalFees ? (
          <p className="text-xs text-muted-foreground">
            Platform fees: {formatCurrency(data.stats.totalFees)} total
          </p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Payments received from customers via online checkout</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !data?.payments?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No payments yet</p>
                <p className="text-sm">
                  Payments will appear here when customers pay through your quotes
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Quote</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.payments.map((payment) => (
                      <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(payment.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{payment.quoteTitle}</p>
                            <p className="text-xs text-muted-foreground">#{payment.quoteNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{payment.customerName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {paymentTypeLabels[payment.paymentType] || payment.paymentType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(parseFloat(payment.amount))}
                        </TableCell>
                        <TableCell>
                          {payment.status === "succeeded" ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Paid
                            </Badge>
                          ) : payment.status === "pending" ? (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{payment.status}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
