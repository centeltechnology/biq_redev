import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Cake,
  DollarSign,
  Clock,
  User,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/dashboard-layout";
import { formatCurrency } from "@/lib/calculator";
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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: [`/api/orders?month=${currentMonth + 1}&year=${currentYear}`],
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
  orders?.forEach((order) => {
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

  const monthlyTotal = orders?.reduce((sum, order) => sum + Number(order.amount), 0) ?? 0;
  const orderCount = orders?.length ?? 0;

  return (
    <DashboardLayout title="Calendar">
      <div className="space-y-6">
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
                            <Link key={order.id} href={`/quotes/${order.quoteId}`}>
                              <div
                                className="text-xs p-1.5 rounded bg-primary/10 hover-elevate active-elevate-2 cursor-pointer truncate"
                                data-testid={`order-${order.id}`}
                              >
                                <div className="flex items-center gap-1">
                                  <Cake className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate font-medium">{order.customerName}</span>
                                </div>
                                <div className="text-muted-foreground mt-0.5">
                                  {formatCurrency(Number(order.amount))}
                                </div>
                              </div>
                            </Link>
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
            ) : orders?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No orders this month</p>
                <p className="text-sm">Create quotes and convert them to orders to see them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders
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
    </DashboardLayout>
  );
}

function OrderRow({ order }: { order: OrderWithDetails }) {
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
