import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Mail, Phone, FileText, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/dashboard-layout";
import type { Customer, Quote } from "@shared/schema";

interface CustomerWithQuotes extends Customer {
  quotes: Quote[];
}

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");

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
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="hidden md:table-cell">Quotes</TableHead>
                      <TableHead className="hidden lg:table-cell">Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers?.map((customer) => (
                      <CustomerTableRow key={customer.id} customer={customer} />
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

function CustomerTableRow({ customer }: { customer: CustomerWithQuotes }) {
  const quoteCount = customer.quotes?.length || 0;
  const lastActivity = customer.quotes?.[0]?.createdAt
    ? new Date(customer.quotes[0].createdAt).toLocaleDateString()
    : new Date(customer.createdAt).toLocaleDateString();

  return (
    <TableRow data-testid={`customer-row-${customer.id}`} className="cursor-pointer hover-elevate">
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
  );
}
