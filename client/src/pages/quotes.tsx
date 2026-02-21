import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Calendar, MoreHorizontal, Eye, Copy, Trash2, CreditCard, Archive, ArchiveRestore } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { useFormatCurrency, useBakerCurrency } from "@/hooks/use-baker-currency";
import { formatCurrency } from "@/lib/calculator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QUOTE_STATUSES, type Quote } from "@shared/schema";

interface QuoteWithCustomer extends Quote {
  customer?: { name: string };
}

export default function QuotesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [archiveFilter, setArchiveFilter] = useState<string>("active");
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);
  const { toast } = useToast();
  const formatCurrency = useFormatCurrency();

  const includeArchived = archiveFilter === "archived" || archiveFilter === "all";
  const quotesUrl = includeArchived ? "/api/quotes?includeArchived=true" : "/api/quotes";

  const { data: quotes, isLoading } = useQuery<QuoteWithCustomer[]>({
    queryKey: [quotesUrl],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Quote deleted successfully" });
      setDeleteQuoteId(null);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/quotes/${id}/duplicate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Quote duplicated successfully" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/quotes/${id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Quote archived successfully" });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/quotes/${id}/unarchive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Quote restored successfully" });
    },
  });

  const filteredQuotes = quotes?.filter((quote) => {
    const matchesSearch =
      searchQuery === "" ||
      quote.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customer?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    
    // Filter by archive status
    const isArchived = !!quote.archivedAt;
    const matchesArchiveFilter = 
      archiveFilter === "all" ||
      (archiveFilter === "active" && !isArchived) ||
      (archiveFilter === "archived" && isArchived);
    
    return matchesSearch && matchesStatus && matchesArchiveFilter;
  });

  return (
    <DashboardLayout
      title="Quotes"
      actions={
        <Button asChild data-testid="button-new-quote">
          <Link href="/quotes/new">
            <Plus className="mr-2 h-4 w-4" />
            New Quote
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-quotes"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {QUOTE_STATUSES.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={archiveFilter} onValueChange={setArchiveFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-archive-filter">
              <SelectValue placeholder="Filter by archive" />
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
            ) : filteredQuotes?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="font-medium">No quotes found</p>
                <p className="text-sm">
                  {quotes?.length === 0
                    ? "Create your first quote to get started"
                    : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quote #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden md:table-cell">Event Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Payment</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuotes?.map((quote) => (
                      <QuoteTableRow
                        key={quote.id}
                        quote={quote}
                        onDuplicate={() => duplicateMutation.mutate(quote.id)}
                        onDelete={() => setDeleteQuoteId(quote.id)}
                        onArchive={() => archiveMutation.mutate(quote.id)}
                        onUnarchive={() => unarchiveMutation.mutate(quote.id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteQuoteId} onOpenChange={() => setDeleteQuoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuoteId && deleteMutation.mutate(deleteQuoteId)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

interface QuoteTableRowProps {
  quote: QuoteWithCustomer;
  onDuplicate: () => void;
  onDelete: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
}

function QuoteTableRow({ quote, onDuplicate, onDelete, onArchive, onUnarchive }: QuoteTableRowProps) {
  const bakerCurrency = useBakerCurrency();
  const fmt = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
    return formatCurrency(num, quote.currencyCode || bakerCurrency);
  };
  const eventDate = quote.eventDate
    ? new Date(quote.eventDate).toLocaleDateString()
    : "-";
  const isArchived = !!quote.archivedAt;

  return (
    <TableRow data-testid={`quote-row-${quote.id}`}>
      <TableCell className="font-mono text-sm">{quote.quoteNumber}</TableCell>
      <TableCell className="font-medium max-w-[200px] truncate">{quote.title}</TableCell>
      <TableCell>{quote.customer?.name || "-"}</TableCell>
      <TableCell className="hidden md:table-cell">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {eventDate}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-semibold">{fmt(Number(quote.total))}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <StatusBadge status={quote.status} type="quote" />
          {isArchived && (
            <Badge variant="secondary" className="w-fit bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" data-testid={`badge-archived-${quote.id}`}>
              Archived
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {quote.paymentStatus === "paid" ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" data-testid={`payment-status-${quote.id}`}>
            <CreditCard className="h-3 w-3 mr-1" /> Paid
          </Badge>
        ) : quote.paymentStatus === "deposit_paid" ? (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" data-testid={`payment-status-${quote.id}`}>
            <CreditCard className="h-3 w-3 mr-1" /> Deposit
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground" data-testid={`payment-status-${quote.id}`}>-</span>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-actions-${quote.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/quotes/${quote.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            {!isArchived ? (
              <DropdownMenuItem onClick={onArchive} data-testid={`button-archive-${quote.id}`}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onUnarchive} data-testid={`button-restore-${quote.id}`}>
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Restore
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
