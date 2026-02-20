import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Calendar, DollarSign, FileText, Cake, Printer, XCircle, Loader2, CreditCard } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Quote, QuoteItem } from "@shared/schema";
import { formatCurrency } from "@/lib/calculator";

interface PublicBaker {
  id: string;
  businessName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  depositPercentage?: number | null;
  defaultDepositType?: string | null;
  depositFixedAmount?: string | null;



  currency?: string | null;
  onlinePaymentsEnabled?: boolean;
}

interface PublicCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface PublicQuoteData {
  quote: Quote & { items: QuoteItem[] };
  baker: PublicBaker;
  customer: PublicCustomer;
  isDemoQuote?: boolean;
}

export default function QuoteViewPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [demoAccepted, setDemoAccepted] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<PublicQuoteData>({
    queryKey: ["/api/public/quote", id],
    queryFn: async () => {
      const res = await fetch(`/api/public/quote/${id}`);
      if (!res.ok) throw new Error("Quote not found");
      return res.json();
    },
    enabled: !!id,
  });

  const respondMutation = useMutation({
    mutationFn: async (action: "accept" | "decline") => {
      const res = await fetch(`/api/public/quote/${id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to respond to quote" }));
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: async (data) => {
      await refetch();
      toast({
        title: data.status === "approved" ? "Quote Accepted" : "Quote Declined",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to quote",
        variant: "destructive",
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (type: "deposit" | "full") => {
      const res = await fetch(`/api/stripe-connect/create-payment-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: id, paymentType: type }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to create payment session" }));
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast({ title: "Payment Successful!", description: "Your payment has been received. Thank you!" });
      window.history.replaceState({}, "", `/quote/${id}`);
      refetch();
    } else if (params.get("payment") === "cancelled") {
      toast({ title: "Payment Cancelled", description: "Your payment was not completed.", variant: "destructive" });
      window.history.replaceState({}, "", `/quote/${id}`);
    }
  }, []);

  usePageTitle(data?.quote?.title ? `Quote: ${data.quote.title}` : "Your Quote");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Quote Not Found</h2>
            <p className="text-muted-foreground">
              This quote may have expired or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { quote, baker, customer } = data;
  const subtotal = parseFloat(quote.subtotal);
  const taxAmount = parseFloat(quote.taxAmount);
  const total = parseFloat(quote.total);
  
  // Calculate deposit using baker's deposit settings
  let depositAmount = 0;
  let depositLabel = "";
  if (baker.defaultDepositType && baker.defaultDepositType !== "full") {
    if (baker.defaultDepositType === "percentage" && baker.depositPercentage) {
      depositAmount = total * (baker.depositPercentage / 100);
      depositLabel = `(${baker.depositPercentage}%)`;
    } else if (baker.defaultDepositType === "fixed" && baker.depositFixedAmount) {
      depositAmount = parseFloat(baker.depositFixedAmount);
      depositLabel = "";
    }
  }

  // Helper function to format currency with baker's currency
  const fmt = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return formatCurrency(num, baker.currency || "USD");
  };

  const cakeItems = quote.items.filter(i => i.category === "cake");
  const decorationItems = quote.items.filter(i => i.category === "decoration");
  const addonItems = quote.items.filter(i => i.category === "addon");
  const deliveryItems = quote.items.filter(i => i.category === "delivery");
  const otherItems = quote.items.filter(i => i.category === "other" && i.name);

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-background dark:from-pink-950/20 dark:to-background print:bg-white print:from-white">
      <div className="absolute top-4 right-4 flex gap-2 print:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => window.print()}
          data-testid="button-print-quote"
        >
          <Printer className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>

      <div className="max-w-3xl mx-auto p-6 py-12 quote-view-container">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">{baker.businessName}</h1>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">Quote #{quote.quoteNumber}</p>
                <CardTitle className="text-xl">{quote.title}</CardTitle>
              </div>
              <Badge className={statusColors[quote.status] || statusColors.draft}>
                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p className="text-muted-foreground">Prepared for</p>
                <p className="font-medium">{customer.name}</p>
                <p className="text-muted-foreground">{customer.email}</p>
              </div>
              {quote.eventDate && (
                <div>
                  <p className="text-muted-foreground">Event Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(quote.eventDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {cakeItems.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Cake className="h-4 w-4" /> Cake
                </h3>
                <div className="space-y-2">
                  {cakeItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && <p className="text-muted-foreground text-xs">{item.description}</p>}
                      </div>
                      <p className="font-medium">{fmt(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {decorationItems.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Decorations</h3>
                <div className="space-y-2">
                  {decorationItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <p>{item.name}</p>
                      <p className="font-medium">{fmt(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {addonItems.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Extras</h3>
                <div className="space-y-2">
                  {addonItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <p>{item.name}</p>
                        {item.description && <p className="text-muted-foreground text-xs">{item.description}</p>}
                      </div>
                      <p className="font-medium">{fmt(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deliveryItems.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Delivery</h3>
                <div className="space-y-2">
                  {deliveryItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <p>{item.name}</p>
                      <p className="font-medium">{fmt(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {otherItems.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Other</h3>
                <div className="space-y-2">
                  {otherItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <p>{item.name}</p>
                        {item.description && <p className="text-muted-foreground text-xs">{item.description}</p>}
                      </div>
                      <p className="font-medium">{fmt(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({(parseFloat(quote.taxRate) * 100).toFixed(1)}%)</span>
                <span>{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{fmt(total)}</span>
              </div>
            </div>

            {quote.notes && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{quote.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {depositAmount > 0 && (
          <Card className="mb-6 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Deposit Required {depositLabel}</span>
                  <span className="font-bold text-primary">{fmt(depositAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Balance Due</span>
                  <span>{fmt(total - depositAmount)}</span>
                </div>
                <Separator />
              </div>
            </CardContent>
          </Card>
        )}

        {demoAccepted ? (
          <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">Demo Quote Accepted</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Deposit would be collected here once payments are activated.
                </p>
                <p className="text-xs text-muted-foreground">
                  This is a preview of what your customers will experience.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : quote.status === "sent" ? (
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Ready to lock in your date?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Review the quote above and let us know if you'd like to proceed.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      if (data?.isDemoQuote) {
                        setDemoAccepted(true);
                        toast({ title: "Demo quote accepted", description: "This is a preview of the customer experience." });
                      } else {
                        setShowAcceptDialog(true);
                      }
                    }}
                    disabled={respondMutation.isPending}
                    data-testid="button-accept-quote"
                  >
                    {respondMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Accept & Pay Deposit
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeclineDialog(true)}
                    disabled={respondMutation.isPending}
                    data-testid="button-decline-quote"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline Quote
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Questions? Contact {baker.businessName}{baker.phone ? ` at ${baker.phone}` : ""}{baker.email ? ` or ${baker.email}` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : quote.status === "approved" ? (
          <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">Quote Accepted!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Thank you for accepting this quote. {baker.businessName} will be in touch to finalize your order details.
                </p>
                {baker.onlinePaymentsEnabled && quote.paymentStatus !== "paid" && (
                  <div className="mb-4 space-y-3">
                    <Separator />
                    <p className="text-sm font-medium mt-3">Pay Online</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {depositAmount > 0 && quote.paymentStatus !== "deposit_paid" && (
                        <Button
                          onClick={() => paymentMutation.mutate("deposit")}
                          disabled={paymentMutation.isPending}
                          data-testid="button-pay-deposit"
                        >
                          {paymentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          Pay Deposit ({fmt(depositAmount)})
                        </Button>
                      )}
                      <Button
                        variant={depositAmount > 0 && quote.paymentStatus !== "deposit_paid" ? "outline" : "default"}
                        onClick={() => paymentMutation.mutate("full")}
                        disabled={paymentMutation.isPending}
                        data-testid="button-pay-full"
                      >
                        {paymentMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        {quote.paymentStatus === "deposit_paid"
                          ? `Pay Remaining (${fmt(total - (parseFloat(quote.amountPaid || "0")))})`
                          : `Pay Full Amount (${fmt(total)})`}
                      </Button>
                    </div>
                  </div>
                )}
                {quote.paymentStatus === "paid" && (
                  <div className="mb-4">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" /> Paid in Full
                    </Badge>
                  </div>
                )}
                {quote.paymentStatus === "deposit_paid" && (
                  <div className="mb-4">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      <CheckCircle className="h-3 w-3 mr-1" /> Deposit Paid
                    </Badge>
                  </div>
                )}
                <div className="space-y-1">
                  {baker.phone && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      <a href={`tel:${baker.phone}`} className="text-primary hover:underline">{baker.phone}</a>
                    </p>
                  )}
                  {baker.email && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <a href={`mailto:${baker.email}`} className="text-primary hover:underline">{baker.email}</a>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : quote.status === "rejected" ? (
          <Card className="border-red-500/30 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Quote Declined</h3>
                <p className="text-sm text-muted-foreground">
                  This quote has been declined. If you'd like to discuss alternatives, please contact {baker.businessName}.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Quote Pending</h3>
                <p className="text-sm text-muted-foreground">
                  This quote is being prepared. You'll be able to accept or decline once it's finalized.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accept Confirmation Dialog */}
        <AlertDialog open={showAcceptDialog} onOpenChange={(open) => !respondMutation.isPending && setShowAcceptDialog(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Accept This Quote?</AlertDialogTitle>
              <AlertDialogDescription>
                By accepting this quote, you're confirming your interest in proceeding with this order for{" "}
                <strong>{fmt(total)}</strong>. {baker.businessName} will be notified and will reach out to confirm details and payment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={respondMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-green-600 hover:bg-green-700"
                disabled={respondMutation.isPending}
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    await respondMutation.mutateAsync("accept");
                    setShowAcceptDialog(false);
                  } catch {
                    // Error handled by onError callback
                  }
                }}
                data-testid="button-confirm-accept"
              >
                {respondMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  "Yes, Accept & Pay Deposit"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Decline Confirmation Dialog */}
        <AlertDialog open={showDeclineDialog} onOpenChange={(open) => !respondMutation.isPending && setShowDeclineDialog(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Decline This Quote?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to decline this quote? {baker.businessName} will be notified. You can always reach out to them if you change your mind.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={respondMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                disabled={respondMutation.isPending}
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    await respondMutation.mutateAsync("decline");
                    setShowDeclineDialog(false);
                  } catch {
                    // Error handled by onError callback
                  }
                }}
                data-testid="button-confirm-decline"
              >
                {respondMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  "Yes, Decline Quote"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by{" "}
          <a 
            href="https://bakeriq.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            BakerIQ
          </a>
        </p>
      </div>
    </div>
  );
}
