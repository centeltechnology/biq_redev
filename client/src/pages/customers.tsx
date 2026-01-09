import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Mail, Phone, FileText, Calendar, ChevronDown, ChevronRight, DollarSign, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { Customer, Quote } from "@shared/schema";

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
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  const { data: customers, isLoading } = useQuery<CustomerWithQuotes[]>({
    queryKey: ["/api/customers"],
  });

  const filteredCustomers = customers?.filter((customer) => {
    return (
      searchQuery === "" ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const toggleExpanded = (customerId: string) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  return (
    <DashboardLayout title="Customers">
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-customers"
          />
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers?.map((customer) => (
                      <CustomerTableRow 
                        key={customer.id} 
                        customer={customer} 
                        isExpanded={expandedCustomer === customer.id}
                        onToggle={() => toggleExpanded(customer.id)}
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
  onToggle 
}: { 
  customer: CustomerWithQuotes;
  isExpanded: boolean;
  onToggle: () => void;
}) {
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
          <p className="font-medium">{customer.name}</p>
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
      </TableRow>
      {isExpanded && customer.quotes?.length > 0 && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={5} className="p-0">
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
