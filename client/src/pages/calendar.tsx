import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Cake,
  DollarSign,
  Clock,
  User,
  ArrowRight,
  Search,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useFormatCurrency } from "@/hooks/use-baker-currency";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

interface OrderWithDetails extends Order {
  customerName: string;
  eventType: string | null;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  zelle: "Zelle",
  paypal: "PayPal",
  cashapp: "CashApp",
  venmo: "Venmo",
};

const FULFILLMENT_STATUS_COLORS: Record<string, string> = {
  booked: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const EVENT_COLORS = [
  "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
];

function getEventColor(orderId: string): string {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const [, setLocation] = useLocation();
  const formatCurrency = useFormatCurrency();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: [`/api/orders?month=${currentMonth + 1}&year=${currentYear}`],
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ orderId, paymentStatus }: { orderId: string; paymentStatus: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}`, { paymentStatus });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders?month=${currentMonth + 1}&year=${currentYear}`] });
      setSelectedOrder(prev => prev ? { ...prev, paymentStatus: data.paymentStatus } : null);
      toast({ title: `Payment marked as ${data.paymentStatus}` });
    },
    onError: () => {
      toast({ title: "Failed to update payment status", variant: "destructive" });
    },
  });

  const filteredOrders = orders?.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.title.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      (order.eventType && order.eventType.toLowerCase().includes(query))
    );
  });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  const ordersByDate: Record<number, OrderWithDetails[]> = {};
  filteredOrders?.forEach((order) => {
    if (!order.eventDate) return;
    const eventDate = new Date(order.eventDate);
    if (
      eventDate.getMonth() === currentMonth &&
      eventDate.getFullYear() === currentYear
    ) {
      const day = eventDate.getDate();
      if (!ordersByDate[day]) {
        ordersByDate[day] = [];
      }
      ordersByDate[day].push(order);
    }
  });

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthlyTotal = filteredOrders?.reduce((sum, order) => sum + Number(order.amount), 0) ?? 0;
  const orderCount = filteredOrders?.length ?? 0;

  return (
    <DashboardLayout title="Calendar">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold min-w-[200px] text-center">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{orderCount}</span> orders 
                <span className="mx-2">|</span>
                <span className="font-medium text-foreground">{formatCurrency(monthlyTotal)}</span> total
              </div>
              <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">
                Today
              </Button>
            </div>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders by title or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-orders"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <Skeleton className="h-[600px] w-full" />
            ) : (
              <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    className="bg-muted py-3 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] bg-background p-2 ${
                      day === null ? "bg-muted/50" : ""
                    }`}
                  >
                    {day !== null && (
                      <>
                        <div
                          className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                            isToday(day) ? "bg-primary text-primary-foreground" : ""
                          }`}
                        >
                          {day}
                        </div>
                        <div className="space-y-1">
                          {ordersByDate[day]?.map((order) => (
                            <div
                              key={order.id}
                              className={`text-xs p-1.5 rounded hover-elevate active-elevate-2 cursor-pointer truncate ${getEventColor(order.id)}`}
                              data-testid={`order-${order.id}`}
                              onClick={() => setSelectedOrder(order)}
                            >
                              <div className="flex items-center gap-1">
                                <Cake className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate font-medium">{order.customerName}</span>
                              </div>
                              <div className="text-muted-foreground mt-0.5">
                                {formatCurrency(Number(order.amount))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Upcoming Orders
            </CardTitle>
            <CardDescription>Orders scheduled for {MONTHS[currentMonth]}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredOrders?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">{searchQuery ? "No matching orders" : "No orders this month"}</p>
                <p className="text-sm">{searchQuery ? "Try adjusting your search" : "Create quotes and convert them to orders to see them here"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders
                  ?.filter((o) => o.eventDate)
                  .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime())
                  .map((order) => (
                    <OrderRow key={order.id} order={order} />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Event Date</p>
                    <p className="font-medium">
                      {selectedOrder.eventDate
                        ? new Date(selectedOrder.eventDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Not set"}
                    </p>
                  </div>
                </div>

                {selectedOrder.eventType && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Event Type</p>
                      <p className="font-medium capitalize">{selectedOrder.eventType}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium text-lg">{formatCurrency(Number(selectedOrder.amount))}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium">
                      {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={`${FULFILLMENT_STATUS_COLORS[selectedOrder.fulfillmentStatus]}`}
                >
                  {selectedOrder.fulfillmentStatus.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {selectedOrder.paymentStatus.replace("_", " ")}
                </Badge>
              </div>
            </div>
          )}
          {selectedOrder && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {selectedOrder.paymentStatus !== "paid" && (
                <Button
                  variant="default"
                  onClick={() => {
                    updatePaymentMutation.mutate({ 
                      orderId: selectedOrder.id, 
                      paymentStatus: "paid" 
                    });
                  }}
                  disabled={updatePaymentMutation.isPending}
                  data-testid="button-mark-paid"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
              )}
              {selectedOrder.paymentStatus === "paid" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    updatePaymentMutation.mutate({ 
                      orderId: selectedOrder.id, 
                      paymentStatus: "pending" 
                    });
                  }}
                  disabled={updatePaymentMutation.isPending}
                  data-testid="button-mark-pending"
                >
                  Mark as Pending
                </Button>
              )}
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  data-testid="button-close-order-modal"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setSelectedOrder(null);
                    setLocation(`/quotes/${selectedOrder.quoteId}`);
                  }}
                  data-testid="button-view-quote"
                >
                  View Quote
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function OrderRow({ order }: { order: OrderWithDetails }) {
  const formatCurrency = useFormatCurrency();
  const eventDate = order.eventDate ? new Date(order.eventDate) : null;
  const formattedDate = eventDate?.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) ?? "No date";

  return (
    <Link href={`/quotes/${order.quoteId}`}>
      <div
        className="flex items-center justify-between gap-4 p-4 rounded-md border hover-elevate active-elevate-2 cursor-pointer"
        data-testid={`order-row-${order.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <p className="font-medium truncate">{order.customerName}</p>
            <Badge
              variant="secondary"
              className={`text-xs ${FULFILLMENT_STATUS_COLORS[order.fulfillmentStatus]}`}
            >
              {order.fulfillmentStatus.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
            {order.eventType && (
              <span className="capitalize">{order.eventType}</span>
            )}
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(Number(order.amount))}</p>
          <Button variant="ghost" size="sm" className="text-xs mt-1">
            View Quote
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
