import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Calendar, Mail, Phone, DollarSign, MoreHorizontal, FileText, Eye, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPayloadSummary } from "@/lib/calculator";
import { useFormatCurrency } from "@/hooks/use-baker-currency";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LEAD_STATUSES, type Lead, type CalculatorPayload } from "@shared/schema";

interface FastQuotePayload {
  fastQuote: true;
  featuredItemId: string;
  featuredItemName: string;
  featuredItemPrice: string;
}

function isFastQuoteLead(payload: unknown): payload is FastQuotePayload {
  return payload !== null && typeof payload === 'object' && 'fastQuote' in payload && (payload as any).fastQuote === true;
}

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/leads/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
  });

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      searchQuery === "" ||
      lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="Leads">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-leads"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {LEAD_STATUSES.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.label}
                </SelectItem>
              ))}
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
            ) : filteredLeads?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="font-medium">No leads found</p>
                <p className="text-sm">
                  {leads?.length === 0
                    ? "Share your calculator link to start receiving leads"
                    : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden md:table-cell">Event</TableHead>
                      <TableHead className="hidden lg:table-cell">Cake Summary</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads?.map((lead) => (
                      <LeadTableRow
                        key={lead.id}
                        lead={lead}
                        onStatusChange={(status) =>
                          updateStatusMutation.mutate({ id: lead.id, status })
                        }
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

interface LeadTableRowProps {
  lead: Lead;
  onStatusChange: (status: string) => void;
}

function LeadTableRow({ lead, onStatusChange }: LeadTableRowProps) {
  const formatCurrency = useFormatCurrency();
  const eventDate = lead.eventDate ? new Date(lead.eventDate).toLocaleDateString() : "-";
  const rawPayload = lead.calculatorPayload;
  const isFastQuote = isFastQuoteLead(rawPayload);
  const fastQuotePayload = isFastQuote ? rawPayload : null;
  const payload = !isFastQuote ? (rawPayload as CalculatorPayload | null) : null;
  const cakeSummary = isFastQuote && fastQuotePayload
    ? fastQuotePayload.featuredItemName
    : payload 
      ? getPayloadSummary(payload) 
      : "-";

  return (
    <TableRow data-testid={`lead-row-${lead.id}`}>
      <TableCell className="font-medium">
        {new Date(lead.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{lead.customerName}</p>
            {isFastQuote && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                    <Zap className="h-3 w-3" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Quick Order</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {lead.customerEmail}
            </span>
            {lead.customerPhone && (
              <span className="hidden sm:flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.customerPhone}
              </span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div>
          <p className="capitalize">{lead.eventType || "-"}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {eventDate}
          </p>
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
        {cakeSummary}
      </TableCell>
      <TableCell>
        <span className="font-semibold">
          {formatCurrency(Number(lead.estimatedTotal))}
        </span>
      </TableCell>
      <TableCell>
        <Select value={lead.status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[130px] h-8" data-testid={`select-status-${lead.id}`}>
            <StatusBadge status={lead.status} type="lead" />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-actions-${lead.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/leads/${lead.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/leads/${lead.id}/quote`}>
                <FileText className="mr-2 h-4 w-4" />
                Create Quote
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
