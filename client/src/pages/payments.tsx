import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, Receipt, Shield, Settings, Pencil } from "lucide-react";
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

function getDepositLabel(baker: any, formatCurrency: (n: number) => string): string {
  const type = baker?.defaultDepositType || "full";
  if (type === "percentage") {
    return `${baker?.depositPercentage || 50}% deposit`;
  }
  if (type === "fixed") {
    return `${formatCurrency(parseFloat(baker?.depositFixedAmount || "0"))} deposit`;
  }
  return "Full payment";
}

export default function PaymentsPage() {
  const { baker } = useAuth();
  const formatCurrency = useFormatCurrency();
  const stripeConnected = !!baker?.stripeConnectedAt;

  const { data, isLoading } = useQuery<PaymentData>({
    queryKey: ["/api/payments"],
  });

  const paymentTypeLabels: Record<string, string> = {
    deposit: "Deposit",
    full: "Full Payment",
    remaining: "Remaining Balance",
  };

  const depositLabel = getDepositLabel(baker, formatCurrency);

  return (
    <DashboardLayout title="Payments">
      <div className="space-y-6">
        {!stripeConnected && (
          <Card className="border-primary/30 bg-primary/5" data-testid="card-stripe-activation">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg" data-testid="text-activation-title">Start collecting payments</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p className="font-medium" data-testid="text-deposit-requirement">
                  Deposit requirement: {depositLabel}
                </p>
                <p className="text-muted-foreground">
                  Connect Stripe to accept deposits and payments online directly from your quotes. Until then, customers can accept quotes and you can collect payment manually.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild data-testid="button-secure-payouts">
                  <Link href="/settings">
                    <Shield className="h-4 w-4 mr-2" />
                    Secure Your Payouts
                  </Link>
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

        {stripeConnected && (
          <Card data-testid="card-deposit-settings">
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Deposit requirement:</span>
                <span className="font-medium" data-testid="text-deposit-summary">{depositLabel}</span>
              </div>
              <Button variant="ghost" size="sm" asChild data-testid="button-edit-deposit">
                <Link href="/settings">
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

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
