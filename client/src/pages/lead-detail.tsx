import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Mail, Phone, Users, FileText, Loader2, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, calculateTotal } from "@/lib/calculator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  LEAD_STATUSES,
  CAKE_SIZES,
  CAKE_SHAPES,
  CAKE_FLAVORS,
  FROSTING_TYPES,
  DECORATIONS,
  DELIVERY_OPTIONS,
  ADDONS,
  TREATS,
  type Lead,
  type CalculatorPayload,
} from "@shared/schema";
import { useState } from "react";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [hasNotesChanged, setHasNotesChanged] = useState(false);

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ["/api/leads", id],
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { status?: string; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/leads/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead updated successfully" });
      setHasNotesChanged(false);
    },
  });

  interface FastQuotePayload {
    fastQuote: true;
    featuredItemId: string;
    featuredItemName: string;
    featuredItemPrice: string;
  }

  const rawPayload = lead?.calculatorPayload;
  const isFastQuote = rawPayload && typeof rawPayload === 'object' && 'fastQuote' in rawPayload && rawPayload.fastQuote === true;
  const fastQuotePayload = isFastQuote ? rawPayload as FastQuotePayload : null;
  const payload = !isFastQuote ? rawPayload as CalculatorPayload | null : null;
  const totals = payload ? calculateTotal(payload) : null;

  if (isLoading) {
    return (
      <DashboardLayout title="Lead Details">
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout title="Lead Not Found">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">This lead could not be found.</p>
          <Button asChild>
            <Link href="/leads">Back to Leads</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const eventDate = lead.eventDate ? new Date(lead.eventDate).toLocaleDateString() : null;

  const quoteLink = fastQuotePayload 
    ? `/leads/${id}/quote?calcId=${fastQuotePayload.featuredItemId}`
    : `/leads/${id}/quote`;

  return (
    <DashboardLayout
      title="Lead Details"
      actions={
        <Button asChild data-testid="button-create-quote">
          <Link href={quoteLink}>
            {fastQuotePayload ? (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Quick Quote
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Create Quote
              </>
            )}
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/leads">
            <ArrowLeft className="h-4 w-4" />
            Back to Leads
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{lead.customerName}</CardTitle>
                  <CardDescription>
                    Submitted on {new Date(lead.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Select
                  value={lead.status}
                  onValueChange={(status) => updateMutation.mutate({ status })}
                >
                  <SelectTrigger className="w-[150px]" data-testid="select-lead-status">
                    <StatusBadge status={lead.status} type="lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{lead.customerEmail}</p>
                    </div>
                  </div>
                  {lead.customerPhone && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{lead.customerPhone}</p>
                      </div>
                    </div>
                  )}
                  {eventDate && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Event Date</p>
                        <p className="font-medium">{eventDate}</p>
                      </div>
                    </div>
                  )}
                  {lead.eventType && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Event Type</p>
                        <p className="font-medium capitalize">{lead.eventType}</p>
                      </div>
                    </div>
                  )}
                </div>

                {fastQuotePayload && (
                  <div className="border-t pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        <Zap className="h-3 w-3 mr-1" />
                        Quick Order
                      </Badge>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{fastQuotePayload.featuredItemName}</h4>
                          <p className="text-2xl font-bold text-primary mt-1">
                            {formatCurrency(parseFloat(fastQuotePayload.featuredItemPrice))}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This customer selected a featured item from your Quick Order options. 
                      Click "Quick Quote" above to create a quote with this item pre-filled.
                    </p>
                  </div>
                )}

                {payload && (
                  <div className="border-t pt-6 space-y-4">
                    <h3 className="font-semibold">{payload.category === "treat" ? "Treats" : "Cake Details"}</h3>
                    {payload.tiers && payload.tiers.length > 0 && (
                    <div className="space-y-3">
                      {payload.tiers.map((tier, index) => {
                        const size = CAKE_SIZES.find((s) => s.id === tier.size);
                        const shape = CAKE_SHAPES.find((s) => s.id === tier.shape);
                        const flavor = CAKE_FLAVORS.find((f) => f.id === tier.flavor);
                        const frosting = FROSTING_TYPES.find((f) => f.id === tier.frosting);

                        return (
                          <div key={index} className="p-4 rounded-md bg-muted/50">
                            <p className="font-medium mb-2">Tier {index + 1}</p>
                            <div className="grid gap-2 sm:grid-cols-2 text-sm">
                              <p>
                                <span className="text-muted-foreground">Size:</span>{" "}
                                {size?.label}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Shape:</span>{" "}
                                {shape?.label}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Flavor:</span>{" "}
                                {flavor?.label}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Frosting:</span>{" "}
                                {frosting?.label}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    )}

                    {payload.decorations && payload.decorations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Decorations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {payload.decorations.map((id) => {
                            const dec = DECORATIONS.find((d) => d.id === id);
                            return (
                              <span
                                key={id}
                                className="px-3 py-1 rounded-full bg-muted text-sm"
                              >
                                {dec?.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {payload.addons && payload.addons.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Addons
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {payload.addons.map((addon) => {
                            const addonInfo = ADDONS.find((a) => a.id === addon.id);
                            let label = addonInfo?.label || addon.id;
                            if (addon.attendees) {
                              label += ` (${addon.attendees} guests)`;
                            } else if (addon.quantity && addon.quantity !== 1) {
                              if (addon.quantity === 0.5) {
                                label += ` (Half Dozen)`;
                              } else {
                                label += ` (${addon.quantity} Dozen)`;
                              }
                            }
                            return (
                              <span
                                key={addon.id}
                                className="px-3 py-1 rounded-full bg-muted text-sm"
                              >
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {payload.treats && payload.treats.length > 0 && (
                      <div className="space-y-3">
                        {payload.treats.map((treat) => {
                          const treatInfo = TREATS.find((t) => t.id === treat.id);
                          return (
                            <div key={treat.id} className="p-4 rounded-md bg-muted/50">
                              <p className="font-medium">{treatInfo?.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {treatInfo?.description} × {treat.quantity}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {payload.deliveryOption && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Delivery
                        </h4>
                        <p className="text-sm">
                          {DELIVERY_OPTIONS.find((d) => d.id === payload.deliveryOption)?.label}
                        </p>
                        {payload.deliveryAddress && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {payload.deliveryAddress}
                          </p>
                        )}
                      </div>
                    )}

                    {payload.specialRequests && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Special Requests
                        </h4>
                        <p className="text-sm">{payload.specialRequests}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t pt-6">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about this lead..."
                    value={hasNotesChanged ? notes : lead.notes || ""}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setHasNotesChanged(true);
                    }}
                    className="mt-2"
                    rows={4}
                    data-testid="textarea-notes"
                  />
                  {hasNotesChanged && (
                    <Button
                      onClick={() => updateMutation.mutate({ notes })}
                      className="mt-3"
                      disabled={updateMutation.isPending}
                      data-testid="button-save-notes"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Notes"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {totals ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cake Tiers</span>
                      <span>{formatCurrency(totals.tiersTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Decorations</span>
                      <span>{formatCurrency(totals.decorationsTotal)}</span>
                    </div>
                    {totals.addonsTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Addons</span>
                        <span>{formatCurrency(totals.addonsTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span>{formatCurrency(totals.deliveryTotal)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (8%)</span>
                      <span>{formatCurrency(totals.tax)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span data-testid="text-lead-total">{formatCurrency(totals.total)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-2xl font-bold mb-1">
                      {formatCurrency(Number(lead.estimatedTotal))}
                    </p>
                    <p className="text-sm">Estimated Total</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
