import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/dashboard-layout";
import { formatCurrency } from "@/lib/calculator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_TAX_RATE, QUOTE_STATUSES, type Quote, type QuoteItem, type Customer } from "@shared/schema";

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
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isNew = id === "new";

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const { data: quote, isLoading: isLoadingQuote } = useQuery<QuoteWithItems>({
    queryKey: ["/api/quotes", id],
    enabled: !isNew && !!id,
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
      const res = await apiRequest("PATCH", `/api/quotes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Quote saved successfully" });
    },
  });

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
                          variant="link"
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
