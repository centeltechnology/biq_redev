import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { CheckCircle, Calendar, DollarSign, FileText, Cake } from "lucide-react";
import type { Quote, QuoteItem } from "@shared/schema";

interface PublicBaker {
  id: string;
  businessName: string;
  tagline?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  depositPercentage?: number | null;
  acceptedPayments?: string[] | null;
  zelleEmail?: string | null;
  paypalEmail?: string | null;
  venmoHandle?: string | null;
  cashappHandle?: string | null;
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
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export default function QuoteViewPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<PublicQuoteData>({
    queryKey: ["/api/public/quote", id],
    queryFn: async () => {
      const res = await fetch(`/api/public/quote/${id}`);
      if (!res.ok) throw new Error("Quote not found");
      return res.json();
    },
    enabled: !!id,
  });

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
  const depositAmount = baker.depositPercentage ? total * (baker.depositPercentage / 100) : 0;

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
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-background dark:from-pink-950/20 dark:to-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-3xl mx-auto p-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">{baker.businessName}</h1>
          {baker.tagline && <p className="text-muted-foreground">{baker.tagline}</p>}
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
                      <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
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
                      <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
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
                      <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
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
                      <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
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
                      <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({(parseFloat(quote.taxRate) * 100).toFixed(1)}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
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

        {baker.depositPercentage && baker.depositPercentage > 0 && (
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
                  <span>Deposit Required ({baker.depositPercentage}%)</span>
                  <span className="font-bold text-primary">{formatCurrency(depositAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Balance Due</span>
                  <span>{formatCurrency(total - depositAmount)}</span>
                </div>
                <Separator />
                <div className="text-sm">
                  <p className="font-medium mb-2">Accepted Payment Methods:</p>
                  <div className="flex flex-wrap gap-2">
                    {baker.acceptedPayments && (baker.acceptedPayments as string[]).length > 0 ? (
                      (baker.acceptedPayments as string[]).map((method) => (
                        <Badge key={method} variant="secondary" className="capitalize">
                          {method}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Contact baker for payment options</span>
                    )}
                  </div>
                </div>
                {(baker.zelleEmail || baker.paypalEmail || baker.venmoHandle || baker.cashappHandle) && (
                  <div className="text-sm space-y-1 pt-2">
                    {baker.zelleEmail && (
                      <p><span className="text-muted-foreground">Zelle:</span> {baker.zelleEmail}</p>
                    )}
                    {baker.paypalEmail && (
                      <p><span className="text-muted-foreground">PayPal:</span> {baker.paypalEmail}</p>
                    )}
                    {baker.venmoHandle && (
                      <p><span className="text-muted-foreground">Venmo:</span> @{baker.venmoHandle}</p>
                    )}
                    {baker.cashappHandle && (
                      <p><span className="text-muted-foreground">Cash App:</span> ${baker.cashappHandle}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Ready to Confirm?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                To accept this quote and proceed with your order, please contact us:
              </p>
              <div className="space-y-1">
                {baker.address && (
                  <p className="text-sm text-muted-foreground">{baker.address}</p>
                )}
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

        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by BakerIQ
        </p>
      </div>
    </div>
  );
}
