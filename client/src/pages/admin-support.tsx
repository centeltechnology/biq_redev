import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Ticket, MessageSquare, Archive, Send, Shield } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import type { SupportTicket, TicketMessage } from "@shared/schema";

interface SupportTicketWithBaker extends SupportTicket {
  baker: { businessName: string; email: string };
  messages?: TicketMessage[];
}

interface BakerContext {
  plan: string;
  stripeConnectedAt: boolean;
  emailVerified: boolean;
  createdAt: string;
  businessName: string;
  email: string;
  firstQuoteSentAt: string | null;
  firstPaymentProcessedAt: string | null;
}

export default function AdminSupportDashboard() {
  const { toast } = useToast();
  const { baker: currentAdmin } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithBaker | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "in_progress" | "resolved">("open");

  const { data: supportTickets, isLoading: ticketsLoading } = useQuery<SupportTicketWithBaker[]>({
    queryKey: ["/api/admin/support-tickets"],
    refetchInterval: 5000,
  });

  const { data: bakerContext, isLoading: bakerContextLoading } = useQuery<BakerContext>({
    queryKey: ["/api/admin/support-tickets", selectedTicket?.id, "baker-context"],
    enabled: !!selectedTicket,
  });

  const replyToTicketMutation = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      return apiRequest("POST", `/api/admin/support-tickets/${ticketId}/reply`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      setTicketReply("");
      toast({ title: "Reply sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send reply", variant: "destructive" });
    },
  });

  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/support-tickets/${ticketId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      toast({ title: "Ticket status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update ticket", variant: "destructive" });
    },
  });

  const archiveTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return apiRequest("PATCH", `/api/admin/support-tickets/${ticketId}`, { status: "archived" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      setSelectedTicket(null);
      toast({ title: "Ticket archived" });
    },
    onError: () => {
      toast({ title: "Failed to archive ticket", variant: "destructive" });
    },
  });

  const filteredTickets = supportTickets?.filter(
    (t) => ticketFilter === "all" || t.status === ticketFilter
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-semibold" data-testid="text-support-dashboard-title">
            Support Dashboard
          </h1>
        </div>
        <Badge variant="outline" className="gap-1.5" data-testid="badge-role-admin">
          <Shield className="h-3.5 w-3.5" />
          Role: {currentAdmin?.role === "super_admin" ? "Super Admin" : "Admin"}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Support Tickets
                </CardTitle>
                <CardDescription>Manage escalated support requests from bakers</CardDescription>
              </div>
              <Select
                value={ticketFilter}
                onValueChange={(v) => setTicketFilter(v as typeof ticketFilter)}
              >
                <SelectTrigger className="w-[150px]" data-testid="select-ticket-filter">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !supportTickets?.length ? (
              <p className="text-center py-8 text-muted-foreground" data-testid="text-no-tickets">
                No support tickets yet
              </p>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-3 border rounded-md cursor-pointer hover-elevate ${
                        selectedTicket?.id === ticket.id ? "border-primary bg-muted" : ""
                      }`}
                      data-testid={`ticket-item-${ticket.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {ticket.baker?.businessName || "Unknown Baker"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant={
                              ticket.status === "open"
                                ? "destructive"
                                : ticket.status === "in_progress"
                                ? "default"
                                : "secondary"
                            }
                            data-testid={`badge-ticket-status-${ticket.id}`}
                          >
                            {ticket.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline" className="text-xs" data-testid={`badge-ticket-priority-${ticket.id}`}>
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                  ))}
                  {filteredTickets.length === 0 && (
                    <p className="text-center py-4 text-muted-foreground text-sm" data-testid="text-no-filtered-tickets">
                      No tickets match the filter
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              {selectedTicket ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold" data-testid="text-selected-ticket-subject">
                        {selectedTicket.subject}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid="text-selected-ticket-baker">
                        {selectedTicket.baker?.businessName} ({selectedTicket.baker?.email})
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(status) => {
                          updateTicketStatusMutation.mutate({
                            ticketId: selectedTicket.id,
                            status,
                          });
                        }}
                      >
                        <SelectTrigger className="w-[120px]" data-testid="select-ticket-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => archiveTicketMutation.mutate(selectedTicket.id)}
                        data-testid="button-archive-ticket"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[300px] border rounded-md p-3">
                    {selectedTicket.messages?.length ? (
                      <div className="space-y-3">
                        {selectedTicket.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-md ${
                              msg.senderType === "admin"
                                ? "bg-primary/10 ml-4"
                                : msg.senderType === "ai"
                                ? "bg-muted mr-4 border-l-2 border-blue-500"
                                : "bg-muted mr-4"
                            }`}
                            data-testid={`message-${msg.id}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {msg.senderType === "admin"
                                  ? "Admin"
                                  : msg.senderType === "ai"
                                  ? "AI Assistant"
                                  : "Baker"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8" data-testid="text-no-messages">
                        No messages yet
                      </p>
                    )}
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your reply..."
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      className="flex-1"
                      data-testid="textarea-ticket-reply"
                    />
                    <Button
                      onClick={() => {
                        if (ticketReply.trim()) {
                          replyToTicketMutation.mutate({
                            ticketId: selectedTicket.id,
                            content: ticketReply,
                          });
                        }
                      }}
                      disabled={!ticketReply.trim() || replyToTicketMutation.isPending}
                      data-testid="button-send-ticket-reply"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  {bakerContextLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : bakerContext ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Baker Context</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Business</span>
                          <span className="font-medium" data-testid="text-baker-context-business">
                            {bakerContext.businessName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Email</span>
                          <span className="font-medium" data-testid="text-baker-context-email">
                            {bakerContext.email}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Plan</span>
                          <Badge variant="secondary" data-testid="badge-baker-context-plan">
                            {bakerContext.plan}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Stripe Connected</span>
                          <Badge
                            variant={bakerContext.stripeConnectedAt ? "default" : "outline"}
                            data-testid="badge-baker-context-stripe"
                          >
                            {bakerContext.stripeConnectedAt ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Email Verified</span>
                          <span data-testid="text-baker-context-email-verified">
                            {bakerContext.emailVerified ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Account Created</span>
                          <span data-testid="text-baker-context-created">
                            {format(new Date(bakerContext.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        {bakerContext.firstQuoteSentAt && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">First Quote Sent</span>
                            <span data-testid="text-baker-context-first-quote">
                              {format(new Date(bakerContext.firstQuoteSentAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        )}
                        {bakerContext.firstPaymentProcessedAt && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">First Payment</span>
                            <span data-testid="text-baker-context-first-payment">
                              {format(new Date(bakerContext.firstPaymentProcessedAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                  <p data-testid="text-select-ticket-prompt">Select a ticket to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Open Tickets</span>
              <Badge variant="destructive" data-testid="badge-stat-open">
                {supportTickets?.filter((t) => t.status === "open").length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">In Progress</span>
              <Badge data-testid="badge-stat-in-progress">
                {supportTickets?.filter((t) => t.status === "in_progress").length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Resolved</span>
              <Badge variant="secondary" data-testid="badge-stat-resolved">
                {supportTickets?.filter((t) => t.status === "resolved").length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">High Priority</span>
              <Badge variant="outline" className="text-orange-600 border-orange-600" data-testid="badge-stat-high-priority">
                {supportTickets?.filter(
                  (t) => t.priority === "high" && t.status !== "resolved" && t.status !== "archived"
                ).length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
