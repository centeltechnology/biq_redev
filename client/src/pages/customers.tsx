import { useState, useEffect } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Mail, Phone, FileText, Calendar, ChevronDown, ChevronRight, DollarSign, ArrowRight, Plus, Loader2, Trash2, Cake, Archive, ArchiveRestore, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateTotal, createDefaultTier } from "@/lib/calculator";
import {
  CAKE_SIZES,
  CAKE_SHAPES,
  CAKE_FLAVORS,
  FROSTING_TYPES,
  DECORATIONS,
  DELIVERY_OPTIONS,
  ADDONS,
  EVENT_TYPES,
  type CakeTier,
  type CalculatorPayload,
} from "@shared/schema";

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
import type { Customer, Quote } from "@shared/schema";

const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  eventType: z.string().optional(),
  eventDate: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerWithQuotes extends Customer {
  quotes: Quote[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const formatCurrency = useFormatCurrency();
  const searchParams = useSearch();

  const [tiers, setTiers] = useState<CakeTier[]>([createDefaultTier()]);
  const [decorations, setDecorations] = useState<string[]>([]);
  const [addons, setAddons] = useState<{ id: string; quantity?: number }[]>([]);
  const [deliveryOption, setDeliveryOption] = useState("pickup");
  const [includeCakeDetails, setIncludeCakeDetails] = useState(false);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", email: "", phone: "", eventType: "", eventDate: "" },
  });

  useEffect(() => {
    if (searchParams.includes("new=true")) {
      setShowAddDialog(true);
    }
  }, [searchParams]);

  const resetDialog = () => {
    setDialogStep(1);
    form.reset();
    setTiers([createDefaultTier()]);
    setDecorations([]);
    setAddons([]);
    setDeliveryOption("pickup");
    setIncludeCakeDetails(false);
  };

  const includeArchived = archiveFilter !== "active";
  const { data: customers, isLoading } = useQuery<CustomerWithQuotes[]>({
    queryKey: [includeArchived ? "/api/customers?includeArchived=true" : "/api/customers"],
  });

  const createCustomerWithLeadMutation = useMutation({
    mutationFn: async (data: { customer: CustomerFormData; cakeDetails?: CalculatorPayload }) => {
      const res = await apiRequest("POST", "/api/customers/with-lead", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setShowAddDialog(false);
      resetDialog();
      if (data.leadId) {
        toast({ 
          title: "Customer added with cake details",
          description: "Ready to create a quote",
        });
        setLocation(`/leads/${data.leadId}/quote`);
      } else {
        toast({ title: "Customer added successfully" });
      }
    },
  });

  const archiveCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const res = await apiRequest("PATCH", `/api/customers/${customerId}/archive`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"], exact: false });
      toast({ title: "Customer archived successfully" });
    },
  });

  const restoreCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const res = await apiRequest("PATCH", `/api/customers/${customerId}/unarchive`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"], exact: false });
      toast({ title: "Customer restored successfully" });
    },
  });

  const updateTier = (index: number, field: keyof CakeTier, value: string) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  const addTier = () => setTiers([...tiers, createDefaultTier()]);
  const removeTier = (index: number) => tiers.length > 1 && setTiers(tiers.filter((_, i) => i !== index));

  const toggleDecoration = (id: string) => {
    setDecorations(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const toggleAddon = (id: string) => {
    setAddons(prev => {
      const existing = prev.find(a => a.id === id);
      if (existing) return prev.filter(a => a.id !== id);
      return [...prev, { id, quantity: 1 }];
    });
  };

  const payload: CalculatorPayload = { category: "cake", tiers, decorations, addons, deliveryOption };
  const totals = calculateTotal(payload);

  const handleSubmit = () => {
    const customerData = form.getValues();
    const cakeDetails = includeCakeDetails ? payload : undefined;
    createCustomerWithLeadMutation.mutate({ customer: customerData, cakeDetails });
  };

  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch =
      searchQuery === "" ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const isArchived = !!customer.archivedAt;
    const matchesArchive =
      archiveFilter === "all" ||
      (archiveFilter === "active" && !isArchived) ||
      (archiveFilter === "archived" && isArchived);
    return matchesSearch && matchesArchive;
  });

  const toggleExpanded = (customerId: string) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  return (
    <DashboardLayout 
      title="Customers"
      actions={
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-customer">
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      }
    >
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogStep === 1 ? "Add New Customer" : "Cake Details (Optional)"}</DialogTitle>
            <DialogDescription>
              {dialogStep === 1 ? "Enter customer information" : "Add cake configuration to create a lead"}
            </DialogDescription>
          </DialogHeader>

          {dialogStep === 1 ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(() => {
                if (includeCakeDetails) setDialogStep(2);
                else handleSubmit();
              })} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Customer name" data-testid="input-customer-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@example.com" data-testid="input-customer-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(555) 123-4567" data-testid="input-customer-phone" />
                        </FormControl>
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
                          <Input {...field} type="date" data-testid="input-event-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-event-type">
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EVENT_TYPES.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="include-cake" 
                    checked={includeCakeDetails}
                    onCheckedChange={(checked) => {
                      setIncludeCakeDetails(!!checked);
                      if (!checked) {
                        setTiers([createDefaultTier()]);
                        setDecorations([]);
                        setAddons([]);
                        setDeliveryOption("pickup");
                      }
                    }}
                    data-testid="checkbox-include-cake"
                  />
                  <Label htmlFor="include-cake" className="flex items-center gap-2 cursor-pointer">
                    <Cake className="h-4 w-4" />
                    Add cake details now
                  </Label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); resetDialog(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCustomerWithLeadMutation.isPending} data-testid="button-next-step">
                    {createCustomerWithLeadMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                    ) : includeCakeDetails ? "Next: Cake Details" : "Add Customer"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Cake Tiers</h4>
                {tiers.map((tier, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tier {index + 1}</span>
                      {tiers.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeTier(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={tier.size} onValueChange={(v) => updateTier(index, "size", v)}>
                        <SelectTrigger><SelectValue placeholder="Size" /></SelectTrigger>
                        <SelectContent>
                          {CAKE_SIZES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={tier.shape} onValueChange={(v) => updateTier(index, "shape", v)}>
                        <SelectTrigger><SelectValue placeholder="Shape" /></SelectTrigger>
                        <SelectContent>
                          {CAKE_SHAPES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={tier.flavor} onValueChange={(v) => updateTier(index, "flavor", v)}>
                        <SelectTrigger><SelectValue placeholder="Flavor" /></SelectTrigger>
                        <SelectContent>
                          {CAKE_FLAVORS.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={tier.frosting} onValueChange={(v) => updateTier(index, "frosting", v)}>
                        <SelectTrigger><SelectValue placeholder="Frosting" /></SelectTrigger>
                        <SelectContent>
                          {FROSTING_TYPES.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addTier}>
                  <Plus className="mr-1 h-4 w-4" /> Add Tier
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Decorations</h4>
                <div className="grid grid-cols-2 gap-2">
                  {DECORATIONS.map(dec => (
                    <div key={dec.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`dec-${dec.id}`} 
                        checked={decorations.includes(dec.id)}
                        onCheckedChange={() => toggleDecoration(dec.id)}
                      />
                      <Label htmlFor={`dec-${dec.id}`} className="text-sm cursor-pointer">
                        {dec.label} (+{formatCurrency(dec.price)})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Addons</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ADDONS.filter(a => a.pricingType === "flat").map(addon => (
                    <div key={addon.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`addon-${addon.id}`} 
                        checked={addons.some(a => a.id === addon.id)}
                        onCheckedChange={() => toggleAddon(addon.id)}
                      />
                      <Label htmlFor={`addon-${addon.id}`} className="text-sm cursor-pointer">
                        {addon.label} (+{formatCurrency(addon.price)})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Delivery</h4>
                <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption}>
                  {DELIVERY_OPTIONS.map(opt => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.id} id={`del-${opt.id}`} />
                      <Label htmlFor={`del-${opt.id}`} className="cursor-pointer">
                        {opt.label} {opt.price > 0 && `(+${formatCurrency(opt.price)})`}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="border-t pt-3 flex items-center justify-between">
                <div className="text-lg font-semibold">
                  Estimated Total: {formatCurrency(totals.total)}
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogStep(1)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={createCustomerWithLeadMutation.isPending} data-testid="button-save-customer">
                  {createCustomerWithLeadMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                  ) : "Add Customer & Create Lead"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-customers"
            />
          </div>
          <Select value={archiveFilter} onValueChange={setArchiveFilter}>
            <SelectTrigger className="w-40" data-testid="select-customer-archive-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredCustomers?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="font-medium">No customers found</p>
                <p className="text-sm">
                  {customers?.length === 0
                    ? "Customers are created when you receive leads or create quotes"
                    : "Try adjusting your search"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="hidden md:table-cell">Quotes</TableHead>
                      <TableHead className="hidden lg:table-cell">Last Activity</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers?.map((customer) => (
                      <CustomerTableRow 
                        key={customer.id} 
                        customer={customer} 
                        isExpanded={expandedCustomer === customer.id}
                        onToggle={() => toggleExpanded(customer.id)}
                        onArchive={() => archiveCustomerMutation.mutate(customer.id)}
                        onRestore={() => restoreCustomerMutation.mutate(customer.id)}
                        isArchiving={archiveCustomerMutation.isPending}
                        isRestoring={restoreCustomerMutation.isPending}
                      />
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

function CustomerTableRow({ 
  customer, 
  isExpanded, 
  onToggle,
  onArchive,
  onRestore,
  isArchiving,
  isRestoring,
}: { 
  customer: CustomerWithQuotes;
  isExpanded: boolean;
  onToggle: () => void;
  onArchive: () => void;
  onRestore: () => void;
  isArchiving: boolean;
  isRestoring: boolean;
}) {
  const formatCurrency = useFormatCurrency();
  const quoteCount = customer.quotes?.length || 0;
  const lastActivity = customer.quotes?.[0]?.createdAt
    ? new Date(customer.quotes[0].createdAt).toLocaleDateString()
    : new Date(customer.createdAt).toLocaleDateString();

  return (
    <>
      <TableRow 
        data-testid={`customer-row-${customer.id}`} 
        className="cursor-pointer hover-elevate"
        onClick={onToggle}
      >
        <TableCell className="w-[40px]">
          {quoteCount > 0 && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <p className="font-medium">{customer.name}</p>
            {customer.archivedAt && (
              <Badge data-testid={`badge-archived-customer-${customer.id}`}>Archived</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {customer.email}
            </p>
            {customer.phone && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {customer.phone}
              </p>
            )}
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {quoteCount} {quoteCount === 1 ? "quote" : "quotes"}
          </span>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {lastActivity}
          </span>
        </TableCell>
        <TableCell className="w-[40px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={(e) => e.stopPropagation()}
                aria-label="Customer actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!customer.archivedAt ? (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                  disabled={isArchiving}
                  data-testid={`button-archive-customer-${customer.id}`}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                  }}
                  disabled={isRestoring}
                  data-testid={`button-restore-customer-${customer.id}`}
                >
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Restore
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {isExpanded && customer.quotes?.length > 0 && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={6} className="p-0">
            <div className="p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">Quotes for {customer.name}</p>
              <div className="space-y-2">
                {customer.quotes.map((quote) => (
                  <Link key={quote.id} href={`/quotes/${quote.id}`}>
                    <div 
                      className="flex items-center justify-between p-3 rounded-md border bg-background hover-elevate active-elevate-2 cursor-pointer"
                      data-testid={`quote-row-${quote.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-sm">{quote.quoteNumber}</p>
                          <p className="text-xs text-muted-foreground">{quote.title}</p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${STATUS_COLORS[quote.status]}`}
                        >
                          {quote.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-sm flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {formatCurrency(Number(quote.total))}
                          </p>
                          {quote.eventDate && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(quote.eventDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs" data-testid={`button-view-quote-${quote.id}`}>
                          View
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
