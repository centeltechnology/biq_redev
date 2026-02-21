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
import { useFormatCurrency, useBakerCurrency } from "@/hooks/use-baker-currency";
import { formatCurrency as formatCurrencyFn } from "@/lib/calculator";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AVAILABLE_CURRENCIES } from "@/lib/calculator";
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, Receipt, Shield, Globe, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface PaymentRecord {
  id: string;
  quoteId: string;
  amount: string;
  platformFee: string;
  status: string;
  paymentType: string;
  currencyCode: string | null;
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

  const depositType = paymentForm.watch("defaultDepositType");

  return (
    <DashboardLayout title="Payments">
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card className={stripeConnected ? "border-green-200 dark:border-green-800" : "border-primary/30 bg-primary/5"} data-testid="card-stripe-activation">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                {stripeConnected ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Shield className="h-4 w-4 text-primary" />
                )}
                <CardTitle className="text-sm font-medium" data-testid="text-activation-title">
                  {stripeConnected ? "Online Payments" : "Enable Online Payments"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-1">
              {stripeConnected ? (
                <div className="space-y-1">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs" data-testid="badge-stripe-connected">
                    Stripe Connected
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Collecting deposits automatically from quotes.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Connect Stripe to collect deposits automatically.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => connectMutation.mutate()}
                    disabled={connectMutation.isPending}
                    className="w-full"
                    data-testid="button-secure-payouts"
                  >
                    {connectMutation.isPending ? "Setting up..." : "Secure Your Payouts"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-deposit-settings">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium">Deposit Settings</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-1">
              <Form {...paymentForm}>
                <form
                  onSubmit={paymentForm.handleSubmit((data) =>
                    updatePaymentMutation.mutate(data)
                  )}
                  className="space-y-2"
                >
                  <FormField
                    control={paymentForm.control}
                    name="defaultDepositType"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs">Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs" data-testid="select-deposit-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full">Full Payment</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {depositType === "percentage" && (
                    <FormField
                      control={paymentForm.control}
                      name="depositPercentage"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs">Percentage</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-1">
                              <Input
                                {...field}
                                type="number"
                                min={0}
                                max={100}
                                className="h-8 text-xs w-20"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-deposit-percentage"
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {depositType === "fixed" && (
                    <FormField
                      control={paymentForm.control}
                      name="depositFixedAmount"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs">Amount</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">$</span>
                              <Input
                                {...field}
                                type="number"
                                min={0}
                                step="0.01"
                                className="h-8 text-xs w-24"
                                placeholder="0.00"
                                data-testid="input-deposit-fixed"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="submit"
                    size="sm"
                    className="w-full h-8 text-xs"
                    disabled={updatePaymentMutation.isPending}
                    data-testid="button-save-payment"
                  >
                    {updatePaymentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card data-testid="card-currency-region">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Currency & Region</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-1">
              <div className="space-y-2">
                <div>
                  <Label htmlFor="currency" className="text-xs">Currency</Label>
                  <Select value={currency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger className="h-8 text-xs mt-1" data-testid="select-currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code} data-testid={`currency-option-${curr.code}`}>
                          {curr.code} ({curr.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground leading-tight">
                  Changes apply to future quotes. Past quotes keep their original currency.
                </p>
                {updateCurrencyMutation.isPending && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

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
                          {formatCurrencyFn(parseFloat(payment.amount), payment.currencyCode || baker?.currency || "USD")}
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
