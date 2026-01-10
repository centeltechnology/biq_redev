import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calculator, Save, Trash2, Plus, DollarSign, Clock, Package, Percent, Loader2, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/dashboard-layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PricingCalculation } from "@shared/schema";

const calculatorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  materialCost: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Must be a valid number"),
  laborHours: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Must be a valid number"),
  hourlyRate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Must be a valid number"),
  overheadPercent: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100, "Must be between 0 and 100"),
  notes: z.string().optional(),
});

type CalculatorFormData = z.infer<typeof calculatorSchema>;

const CATEGORIES = [
  { value: "cake", label: "Cakes" },
  { value: "cupcakes", label: "Cupcakes" },
  { value: "cake_pops", label: "Cake Pops" },
  { value: "cookies", label: "Cookies" },
  { value: "brownies", label: "Brownies" },
  { value: "dipped_strawberries", label: "Dipped Strawberries" },
  { value: "custom", label: "Custom Item" },
];

export default function PricingCalculatorPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCalculation, setSelectedCalculation] = useState<PricingCalculation | null>(null);

  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      name: "",
      category: "cake",
      materialCost: "0",
      laborHours: "0",
      hourlyRate: "25",
      overheadPercent: "15",
      notes: "",
    },
  });

  const materialCost = parseFloat(form.watch("materialCost") || "0");
  const laborHours = parseFloat(form.watch("laborHours") || "0");
  const hourlyRate = parseFloat(form.watch("hourlyRate") || "0");
  const overheadPercent = parseFloat(form.watch("overheadPercent") || "0");

  const calculations = useMemo(() => {
    const laborCost = laborHours * hourlyRate;
    const subtotal = materialCost + laborCost;
    const overhead = subtotal * (overheadPercent / 100);
    const suggestedPrice = subtotal + overhead;
    const profitMargin = suggestedPrice > 0 ? ((suggestedPrice - materialCost) / suggestedPrice) * 100 : 0;

    return {
      laborCost,
      subtotal,
      overhead,
      suggestedPrice,
      profitMargin,
    };
  }, [materialCost, laborHours, hourlyRate, overheadPercent]);

  const { data: savedCalculations = [], isLoading } = useQuery<PricingCalculation[]>({
    queryKey: ["/api/pricing-calculations"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CalculatorFormData) => {
      const payload = {
        ...data,
        suggestedPrice: calculations.suggestedPrice.toFixed(2),
      };

      if (selectedCalculation) {
        return apiRequest("PATCH", `/api/pricing-calculations/${selectedCalculation.id}`, payload);
      }
      return apiRequest("POST", "/api/pricing-calculations", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-calculations"] });
      toast({
        title: selectedCalculation ? "Calculation updated" : "Calculation saved",
        description: "Your pricing calculation has been saved for reference.",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save calculation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/pricing-calculations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-calculations"] });
      toast({
        title: "Calculation deleted",
        description: "The saved calculation has been removed.",
      });
      if (selectedCalculation) {
        resetForm();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete calculation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedCalculation(null);
    form.reset({
      name: "",
      category: "cake",
      materialCost: "0",
      laborHours: "0",
      hourlyRate: "25",
      overheadPercent: "15",
      notes: "",
    });
  };

  const loadCalculation = (calc: PricingCalculation) => {
    setSelectedCalculation(calc);
    form.reset({
      name: calc.name,
      category: calc.category,
      materialCost: calc.materialCost,
      laborHours: calc.laborHours,
      hourlyRate: calc.hourlyRate,
      overheadPercent: calc.overheadPercent,
      notes: calc.notes || "",
    });
  };

  const onSubmit = (data: CalculatorFormData) => {
    saveMutation.mutate(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="pricing-calculator-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Pricing Calculator</h1>
            <p className="text-muted-foreground">Calculate cost-based pricing for your baked goods</p>
          </div>
          {selectedCalculation && (
            <Button variant="outline" onClick={resetForm} data-testid="button-new-calculation">
              <Plus className="h-4 w-4 mr-2" />
              New Calculation
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  {selectedCalculation ? "Edit Calculation" : "New Calculation"}
                </CardTitle>
                <CardDescription>
                  Enter your costs to calculate a suggested price that covers materials, labor, and overhead.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 3-Tier Wedding Cake" {...field} data-testid="input-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="materialCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Material Cost ($)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" {...field} data-testid="input-material-cost" />
                            </FormControl>
                            <FormDescription>Ingredients, decorations, packaging</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="laborHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Labor Hours
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="0.25" min="0" {...field} data-testid="input-labor-hours" />
                            </FormControl>
                            <FormDescription>Time to prep, bake, decorate</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Hourly Rate ($)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" {...field} data-testid="input-hourly-rate" />
                            </FormControl>
                            <FormDescription>Your target labor rate per hour</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="overheadPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Percent className="h-4 w-4" />
                              Overhead (%)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="1" min="0" max="100" {...field} data-testid="input-overhead" />
                            </FormControl>
                            <FormDescription>Utilities, equipment, insurance</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add any notes about this calculation..."
                              {...field}
                              data-testid="input-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save">
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {selectedCalculation ? "Update" : "Save"} Calculation
                      </Button>
                      {selectedCalculation && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" type="button" data-testid="button-delete">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Calculation?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this saved calculation. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(selectedCalculation.id)}
                                data-testid="button-confirm-delete"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Material Cost</span>
                    <span>{formatCurrency(materialCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Labor ({laborHours}h x {formatCurrency(hourlyRate)})
                    </span>
                    <span>{formatCurrency(calculations.laborCost)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(calculations.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overhead ({overheadPercent}%)</span>
                    <span>{formatCurrency(calculations.overhead)}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold">Suggested Price</span>
                    <span className="text-2xl font-bold text-primary" data-testid="text-suggested-price">
                      {formatCurrency(calculations.suggestedPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Profit Margin</span>
                    <span className="text-green-600 font-medium">
                      {calculations.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>A good hourly rate for home bakers is $20-35/hour.</p>
                <p>Overhead of 10-20% covers utilities, equipment wear, and insurance.</p>
                <p>Aim for 40-60% profit margin to grow your business.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Saved Calculations</CardTitle>
            <CardDescription>
              Reference your past calculations to maintain consistent pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedCalculations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No saved calculations yet.</p>
                <p className="text-sm">Create your first calculation above to save it for reference.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Materials</TableHead>
                    <TableHead className="text-right">Labor</TableHead>
                    <TableHead className="text-right">Suggested Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedCalculations.map((calc) => (
                    <TableRow 
                      key={calc.id} 
                      className={selectedCalculation?.id === calc.id ? "bg-muted/50" : ""}
                      data-testid={`row-calculation-${calc.id}`}
                    >
                      <TableCell className="font-medium">{calc.name}</TableCell>
                      <TableCell className="capitalize">
                        {CATEGORIES.find(c => c.value === calc.category)?.label || calc.category}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(parseFloat(calc.materialCost))}</TableCell>
                      <TableCell className="text-right">{calc.laborHours}h</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(parseFloat(calc.suggestedPrice))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => loadCalculation(calc)}
                            data-testid={`button-load-${calc.id}`}
                          >
                            Load
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setLocation(`/quotes/new?calcId=${calc.id}`)}
                            data-testid={`button-create-quote-${calc.id}`}
                            title="Create quote from this calculation"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
