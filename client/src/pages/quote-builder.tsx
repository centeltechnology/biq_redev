import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Loader2, Save, CreditCard, CheckCircle, Calendar, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/dashboard-layout";
import { formatCurrency, calculateTierPrice } from "@/lib/calculator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  DEFAULT_TAX_RATE,
  QUOTE_STATUSES,
  CAKE_SIZES,
  CAKE_SHAPES,
  CAKE_FLAVORS,
  FROSTING_TYPES,
  DECORATIONS,
  DELIVERY_OPTIONS,
  ADDONS,
  TREATS,
  ORDER_PAYMENT_METHODS,
  type Quote,
  type QuoteItem,
  type Customer,
  type Lead,
  type CakeTier,
} from "@shared/schema";

const quoteFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  customerId: z.string().min(1, "Customer is required"),
  eventDate: z.string().optional(),
  status: z.string(),
  taxRate: z.number().min(0).max(1),
  notes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

interface LineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  category: string;
}

interface QuoteWithItems extends Quote {
  items: QuoteItem[];
}

export default function QuoteBuilderPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { baker } = useAuth();
  
  // Detect if we're on quote edit route (/quotes/:id)
  const [isQuoteRoute, quoteRouteParams] = useRoute("/quotes/:id");
  const quoteId = isQuoteRoute && quoteRouteParams ? quoteRouteParams.id : null;
  
  // Detect if we're coming from a lead (/leads/:leadId/quote)
  const [isLeadRoute, leadRouteParams] = useRoute("/leads/:leadId/quote");
  const leadId = isLeadRoute && leadRouteParams ? leadRouteParams.leadId : null;
  
  // Determine if this is a new quote or editing an existing one
  const isNew = quoteId === "new" || isLeadRoute || !quoteId;
  const editingQuoteId = !isNew && quoteId && quoteId !== "new" ? quoteId : null;
  
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [leadPopulated, setLeadPopulated] = useState(false);
  const [customerFromLead, setCustomerFromLead] = useState<string | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");

  const { data: quote, isLoading: isLoadingQuote } = useQuery<QuoteWithItems>({
    queryKey: ["/api/quotes", editingQuoteId],
    enabled: !!editingQuoteId,
  });

  const { data: lead, isLoading: isLoadingLead } = useQuery<Lead>({
    queryKey: ["/api/leads", leadId],
    enabled: !!leadId,
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      title: "",
      customerId: "",
      eventDate: "",
      status: "draft",
      taxRate: DEFAULT_TAX_RATE,
      notes: "",
    },
  });

  useEffect(() => {
    if (quote) {
      form.reset({
        title: quote.title,
        customerId: quote.customerId,
        eventDate: quote.eventDate || "",
        status: quote.status,
        taxRate: Number(quote.taxRate),
        notes: quote.notes || "",
      });
      setLineItems(
        quote.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          category: item.category,
        }))
      );
    }
  }, [quote, form]);

  // Auto-populate from lead data
  useEffect(() => {
    if (lead && customers && !leadPopulated) {
      const payload = lead.calculatorPayload as {
        category?: "cake" | "treat";
        tiers?: CakeTier[];
        decorations?: string[];
        addons?: { id: string; quantity?: number; attendees?: number }[];
        treats?: { id: string; quantity: number }[];
        deliveryOption?: string;
        deliveryAddress?: string;
        specialRequests?: string;
      } | null;

      // Try to find an existing customer by email
      let matchedCustomerId = lead.customerId || "";
      if (!matchedCustomerId && lead.customerEmail) {
        const existingCustomer = customers.find(
          (c) => c.email?.toLowerCase() === lead.customerEmail?.toLowerCase()
        );
        if (existingCustomer) {
          matchedCustomerId = existingCustomer.id;
        }
      }
      
      // Store customer name from lead for display if no match
      if (!matchedCustomerId) {
        setCustomerFromLead(lead.customerName);
      }

      // Set form fields
      form.reset({
        title: `${lead.eventType || "Custom"} Cake - ${lead.customerName}`,
        customerId: matchedCustomerId,
        eventDate: lead.eventDate || "",
        status: "draft",
        taxRate: DEFAULT_TAX_RATE,
        notes: payload?.specialRequests || "",
      });

      // Build line items from calculator payload
      const items: LineItem[] = [];

      // Add cake tiers
      if (payload?.tiers) {
        payload.tiers.forEach((tier, index) => {
          const size = CAKE_SIZES.find((s) => s.id === tier.size);
          const shape = CAKE_SHAPES.find((s) => s.id === tier.shape);
          const flavor = CAKE_FLAVORS.find((f) => f.id === tier.flavor);
          const frosting = FROSTING_TYPES.find((f) => f.id === tier.frosting);
          
          const tierPrice = calculateTierPrice(tier);
          
          items.push({
            id: `tier-${index}-${Date.now()}`,
            name: `Tier ${index + 1}: ${size?.label || tier.size} ${shape?.label || tier.shape} Cake`,
            description: `${flavor?.label || tier.flavor} with ${frosting?.label || tier.frosting}`,
            quantity: 1,
            unitPrice: tierPrice,
            category: "cake",
          });
        });
      }

      // Add decorations
      if (payload?.decorations) {
        payload.decorations.forEach((decId) => {
          const dec = DECORATIONS.find((d) => d.id === decId);
          if (dec) {
            items.push({
              id: `dec-${decId}-${Date.now()}`,
              name: dec.label,
              description: "Decoration",
              quantity: 1,
              unitPrice: dec.price,
              category: "decoration",
            });
          }
        });
      }

      // Add addons
      if (payload?.addons) {
        payload.addons.forEach((addonData) => {
          const addon = ADDONS.find((a) => a.id === addonData.id);
          if (addon) {
            let description = "";
            let quantity = 1;
            let unitPrice = addon.price;
            
            if (addon.pricingType === "per-attendee" && addonData.attendees) {
              description = `${addonData.attendees} guests @ $${addon.price}/person`;
              unitPrice = addon.price * addonData.attendees;
            } else if (addonData.quantity) {
              if (addonData.quantity === 0.5) {
                description = "Half Dozen";
              } else if (addonData.quantity > 1) {
                description = `${addonData.quantity} Dozen`;
              } else {
                description = "1 Dozen";
              }
              unitPrice = addon.price * addonData.quantity;
            }
            
            items.push({
              id: `addon-${addonData.id}-${Date.now()}`,
              name: addon.label,
              description,
              quantity: 1,
              unitPrice,
              category: "addon",
            });
          }
        });
      }

      // Add treats
      if (payload?.treats) {
        payload.treats.forEach((treatData) => {
          const treat = TREATS.find((t) => t.id === treatData.id);
          if (treat) {
            items.push({
              id: `treat-${treatData.id}-${Date.now()}`,
              name: treat.label,
              description: `${treat.description} × ${treatData.quantity}`,
              quantity: treatData.quantity,
              unitPrice: treat.unitPrice,
              category: "treat",
            });
          }
        });
      }

      // Add delivery
      if (payload?.deliveryOption && payload.deliveryOption !== "pickup") {
        const delivery = DELIVERY_OPTIONS.find((d) => d.id === payload.deliveryOption);
        if (delivery) {
          items.push({
            id: `delivery-${Date.now()}`,
            name: delivery.label,
            description: payload.deliveryAddress || "",
            quantity: 1,
            unitPrice: delivery.price,
            category: "delivery",
          });
        }
      }

      setLineItems(items);
      setLeadPopulated(true);
    }
  }, [lead, customers, leadPopulated, form]);

  // Mutation to create a customer from lead data
  const createCustomerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone?: string }) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return res.json();
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      form.setValue("customerId", newCustomer.id);
      setCustomerFromLead(null);
      toast({ title: `Customer "${newCustomer.name}" created` });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: QuoteFormData & { items: LineItem[] }) => {
      const res = await apiRequest("POST", "/api/quotes", data);
      return res.json();
    },
    onSuccess: (newQuote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Quote created successfully" });
      setLocation(`/quotes/${newQuote.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: QuoteFormData & { items: LineItem[] }) => {
      if (!editingQuoteId) throw new Error("No quote ID to update");
      const res = await apiRequest("PATCH", `/api/quotes/${editingQuoteId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes", editingQuoteId] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Quote saved successfully" });
    },
  });

  const convertToOrderMutation = useMutation({
    mutationFn: async (data: { quoteId: string; paymentMethod: string }) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes", editingQuoteId] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setConvertDialogOpen(false);
      toast({ 
        title: "Order created",
        description: "The quote has been converted to an order and added to your calendar.",
      });
      setLocation("/calendar");
    },
  });

  const sendQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await apiRequest("POST", `/api/quotes/${quoteId}/send`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes", editingQuoteId] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ 
        title: "Quote sent",
        description: "The quote has been emailed to the customer.",
      });
    },
    onError: () => {
      toast({ 
        title: "Failed to send",
        description: "Could not send the quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConvertToOrder = () => {
    if (!editingQuoteId) return;
    convertToOrderMutation.mutate({
      quoteId: editingQuoteId,
      paymentMethod: selectedPaymentMethod,
    });
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: `temp-${Date.now()}`,
        name: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        category: "other",
      },
    ]);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxRate = form.watch("taxRate") || DEFAULT_TAX_RATE;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const onSubmit = (data: QuoteFormData) => {
    const payload = { ...data, items: lineItems };
    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isNew && isLoadingQuote) {
    return (
      <DashboardLayout title="Quote Builder">
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isNew ? "New Quote" : "Edit Quote"}>
      <div className="space-y-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/quotes">
            <ArrowLeft className="h-4 w-4" />
            Back to Quotes
          </Link>
        </Button>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quote Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Quote Title</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., Wedding Cake - Smith/Jones"
                                data-testid="input-quote-title"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer</FormLabel>
                            <div className="space-y-2">
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-customer">
                                    <SelectValue placeholder="Select customer" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {customers?.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                      {customer.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {customerFromLead && lead && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    createCustomerMutation.mutate({
                                      name: lead.customerName,
                                      email: lead.customerEmail || "",
                                      phone: lead.customerPhone || undefined,
                                    });
                                  }}
                                  disabled={createCustomerMutation.isPending}
                                  data-testid="button-create-customer-from-lead"
                                >
                                  {createCustomerMutation.isPending ? (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  ) : (
                                    <Plus className="mr-2 h-3 w-3" />
                                  )}
                                  Create "{customerFromLead}" as customer
                                </Button>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="eventDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Date</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                data-testid="input-event-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger data-testid="select-quote-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {QUOTE_STATUSES.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="taxRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={(field.value * 100).toFixed(2)}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) / 100 || 0)
                                }
                                data-testid="input-tax-rate"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle>Line Items</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLineItem}
                      data-testid="button-add-item"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {lineItems.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No items added yet</p>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={addLineItem}
                          className="mt-2"
                        >
                          Add your first item
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Item</TableHead>
                              <TableHead className="w-[100px]">Qty</TableHead>
                              <TableHead className="w-[120px]">Unit Price</TableHead>
                              <TableHead className="w-[120px]">Total</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lineItems.map((item, index) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <Input
                                    value={item.name}
                                    onChange={(e) =>
                                      updateLineItem(index, "name", e.target.value)
                                    }
                                    placeholder="Item name"
                                    className="mb-2"
                                    data-testid={`input-item-name-${index}`}
                                  />
                                  <Input
                                    value={item.description}
                                    onChange={(e) =>
                                      updateLineItem(index, "description", e.target.value)
                                    }
                                    placeholder="Description (optional)"
                                    className="text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateLineItem(
                                        index,
                                        "quantity",
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    data-testid={`input-item-qty-${index}`}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.unitPrice}
                                    onChange={(e) =>
                                      updateLineItem(
                                        index,
                                        "unitPrice",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    data-testid={`input-item-price-${index}`}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(item.quantity * item.unitPrice)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeLineItem(index)}
                                    data-testid={`button-remove-item-${index}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Add any additional notes for this quote..."
                              rows={4}
                              data-testid="textarea-quote-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="sticky top-20">
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tax ({(taxRate * 100).toFixed(0)}%)
                      </span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="border-t pt-4 flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span data-testid="text-quote-total">{formatCurrency(total)}</span>
                    </div>

                    {baker?.depositPercentage && baker.depositPercentage > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Deposit Required ({baker.depositPercentage}%)
                        </span>
                        <span className="font-medium" data-testid="text-deposit-amount">
                          {formatCurrency(total * (baker.depositPercentage / 100))}
                        </span>
                      </div>
                    )}

                    <div className="border-t pt-4 space-y-3">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending}
                        data-testid="button-save-quote"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {isNew ? "Create Quote" : "Save Quote"}
                          </>
                        )}
                      </Button>

                      {!isNew && quote && quote.status !== "sent" && quote.status !== "approved" && (
                        <Button
                          type="button"
                          variant="default"
                          className="w-full"
                          disabled={sendQuoteMutation.isPending}
                          onClick={() => editingQuoteId && sendQuoteMutation.mutate(editingQuoteId)}
                          data-testid="button-send-quote"
                        >
                          {sendQuoteMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Quote to Customer
                            </>
                          )}
                        </Button>
                      )}

                      {!isNew && quote && quote.status === "sent" && (
                        <div className="text-center text-sm text-muted-foreground py-2">
                          <CheckCircle className="inline-block mr-1 h-4 w-4 text-green-500" />
                          Quote sent to customer
                        </div>
                      )}
                      
                      {!isNew && quote && quote.status !== "approved" && (
                        <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              data-testid="button-convert-to-order"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Convert to Order
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Convert Quote to Order
                              </DialogTitle>
                              <DialogDescription>
                                Mark this quote as accepted and add it to your calendar. 
                                Select how the customer paid below.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="payment-method">Payment Method</Label>
                                <Select
                                  value={selectedPaymentMethod}
                                  onValueChange={setSelectedPaymentMethod}
                                >
                                  <SelectTrigger id="payment-method" data-testid="select-payment-method">
                                    <SelectValue placeholder="Select payment method" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ORDER_PAYMENT_METHODS.map((method) => (
                                      <SelectItem key={method.id} value={method.id}>
                                        {method.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="rounded-md bg-muted p-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Quote Total</span>
                                  <span className="font-medium">{formatCurrency(total)}</span>
                                </div>
                                {quote.eventDate && (
                                  <div className="flex justify-between mt-1">
                                    <span className="text-muted-foreground">Event Date</span>
                                    <span className="font-medium">
                                      {new Date(quote.eventDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setConvertDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={handleConvertToOrder}
                                disabled={convertToOrderMutation.isPending}
                                data-testid="button-confirm-convert"
                              >
                                {convertToOrderMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Converting...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Create Order
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Options Card */}
                {(baker?.paymentZelle || baker?.paymentPaypal || baker?.paymentCashapp || baker?.paymentVenmo) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CreditCard className="h-4 w-4" />
                        Payment Options
                      </CardTitle>
                      <CardDescription>
                        Accepted payment methods
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {baker.paymentZelle && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Zelle</span>
                          <span className="font-medium" data-testid="text-payment-zelle">{baker.paymentZelle}</span>
                        </div>
                      )}
                      {baker.paymentPaypal && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">PayPal</span>
                          <span className="font-medium" data-testid="text-payment-paypal">{baker.paymentPaypal}</span>
                        </div>
                      )}
                      {baker.paymentCashapp && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cash App</span>
                          <span className="font-medium" data-testid="text-payment-cashapp">{baker.paymentCashapp}</span>
                        </div>
                      )}
                      {baker.paymentVenmo && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Venmo</span>
                          <span className="font-medium" data-testid="text-payment-venmo">{baker.paymentVenmo}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
