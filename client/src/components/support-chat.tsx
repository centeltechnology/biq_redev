import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Send, X, Loader2, Ticket, CheckCircle, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TicketMessage {
  id: string;
  ticketId: string;
  senderType: "baker" | "admin" | "ai";
  senderId: string | null;
  content: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  messages?: TicketMessage[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your BakerIQ support assistant. How can I help you today? Ask me about pricing, leads, quotes, orders, or any other features!",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [ticketCreated, setTicketCreated] = useState(false);
  const [ticketMessagesLoaded, setTicketMessagesLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Filter out ticket separators and clean [Support Team] prefixes for AI context
      const cleanHistory = messages
        .filter(m => !m.content.startsWith("---") && !m.content.startsWith("[CREATE_TICKET]"))
        .map(m => ({
          role: m.role,
          content: m.content.replace(/^\[Support Team\]\s*/i, ""),
        }));
      
      const response = await apiRequest("POST", "/api/support/chat", {
        message,
        conversationHistory: cleanHistory,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const aiResponse = data.response;
      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
      
      if (aiResponse.includes("[CREATE_TICKET]")) {
        const summary = aiResponse.replace("[CREATE_TICKET]", "").trim();
        createTicketMutation.mutate({ subject: "Support Request", message: summary || messages[messages.length - 1]?.content || "Support needed" });
      }
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again in a moment." },
      ]);
    },
  });

  // Mutation to send message directly to ticket (for human support, not AI)
  const sendTicketMessageMutation = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/support/tickets/${ticketId}/messages`, {
        content,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Add the new message ID to prevent duplicate from polling
      if (data?.id) {
        loadedMessageIdsRef.current.add(data.id);
      }
      // Invalidate to refresh ticket data
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      const response = await apiRequest("POST", "/api/support/tickets", {
        subject,
        initialMessage: message,
      });
      return response.json();
    },
    onSuccess: () => {
      setTicketCreated(true);
      setMessages((prev) => [
        ...prev.filter(m => !m.content.includes("[CREATE_TICKET]")),
        {
          role: "assistant",
          content: "I've created a support ticket for you. Our team will review it and get back to you soon. You can continue using the platform while you wait!",
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      toast({
        title: "Support ticket created",
        description: "An admin will review your request soon.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create ticket",
        description: "Please try again or email support@bakeriq.app",
        variant: "destructive",
      });
    },
  });

  // Mutation to close ticket (baker can mark resolved)
  const closeTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await apiRequest("PATCH", `/api/support/tickets/${ticketId}/close`);
      return response.json();
    },
    onSuccess: () => {
      setTicketCreated(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Your support ticket has been closed. Feel free to ask more questions anytime!",
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      toast({
        title: "Ticket closed",
        description: "Thanks for using support!",
      });
    },
    onError: () => {
      toast({
        title: "Failed to close ticket",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch existing tickets to mark as read - poll every 5 seconds when chat is open
  const { data: existingTickets, isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
    enabled: isOpen,
    refetchInterval: isOpen ? 5000 : false,
  });

  // Track which ticket message IDs we've already added to chat
  const loadedMessageIdsRef = useRef<Set<string>>(new Set());

  // Load ticket messages on initial open (one-time)
  useEffect(() => {
    const loadInitialMessages = async () => {
      if (!isOpen || !existingTickets?.length || ticketMessagesLoaded) return;
      
      try {
        const activeTickets = existingTickets.filter(t => t.status === "open" || t.status === "in_progress");
        if (activeTickets.length === 0) {
          setTicketMessagesLoaded(true);
          return;
        }
        
        const ticketMessages: ChatMessage[] = [];
        
        for (const ticket of activeTickets) {
          const response = await apiRequest("GET", `/api/support/tickets/${ticket.id}`);
          const ticketWithMessages = await response.json() as SupportTicket;
          
          if (ticketWithMessages.messages?.length) {
            ticketMessages.push({
              role: "assistant",
              content: `--- Previous conversation: ${ticket.subject} ---`,
            });
            
            for (const msg of ticketWithMessages.messages) {
              loadedMessageIdsRef.current.add(msg.id);
              ticketMessages.push({
                role: msg.senderType === "baker" ? "user" : "assistant",
                content: msg.senderType === "admin" ? `[Support Team] ${msg.content}` : msg.content,
              });
            }
          }
        }
        
        if (ticketMessages.length > 0) {
          setMessages(prev => {
            const greeting = prev[0];
            return [greeting, ...ticketMessages];
          });
          setTicketCreated(true);
        }
        
        setTicketMessagesLoaded(true);
      } catch (error) {
        console.error("Failed to load ticket messages:", error);
        setTicketMessagesLoaded(true);
      }
    };
    
    loadInitialMessages();
  }, [isOpen, existingTickets, ticketMessagesLoaded]);

  // Poll for NEW messages only and append them (don't replace existing chat)
  useEffect(() => {
    if (!isOpen || !ticketMessagesLoaded || !existingTickets?.length) return;
    
    const checkForNewMessages = async () => {
      try {
        const activeTickets = existingTickets.filter(t => t.status === "open" || t.status === "in_progress");
        
        for (const ticket of activeTickets) {
          const response = await apiRequest("GET", `/api/support/tickets/${ticket.id}`);
          const ticketWithMessages = await response.json() as SupportTicket;
          
          if (ticketWithMessages.messages?.length) {
            const newMessages: ChatMessage[] = [];
            
            for (const msg of ticketWithMessages.messages) {
              // Only add messages we haven't seen before
              if (!loadedMessageIdsRef.current.has(msg.id)) {
                loadedMessageIdsRef.current.add(msg.id);
                newMessages.push({
                  role: msg.senderType === "baker" ? "user" : "assistant",
                  content: msg.senderType === "admin" ? `[Support Team] ${msg.content}` : msg.content,
                });
              }
            }
            
            // Append new messages to the end of existing chat
            if (newMessages.length > 0) {
              setMessages(prev => [...prev, ...newMessages]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to check for new messages:", error);
      }
    };
    
    const interval = setInterval(checkForNewMessages, 5000);
    return () => clearInterval(interval);
  }, [isOpen, ticketMessagesLoaded, existingTickets]);

  // Mark all tickets as read when chat opens
  useEffect(() => {
    if (isOpen && existingTickets?.length) {
      // Mark all tickets as read in parallel
      const markPromises = existingTickets.map(ticket =>
        apiRequest("POST", `/api/support/tickets/${ticket.id}/mark-read`).catch(() => {})
      );
      Promise.all(markPromises).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/support/unread-count"] });
      });
    }
  }, [isOpen, existingTickets]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Get the first active ticket for routing messages
  const activeTicket = existingTickets?.find(t => t.status === "open" || t.status === "in_progress");

  const handleSend = () => {
    const isPending = chatMutation.isPending || sendTicketMessageMutation.isPending;
    if (!inputValue.trim() || isPending) return;
    
    const userMessage = inputValue.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInputValue("");
    
    // If there's an active ticket, send message directly to ticket (for admin to see)
    // Otherwise, chat with AI first
    if (activeTicket) {
      sendTicketMessageMutation.mutate({ ticketId: activeTicket.id, content: userMessage });
    } else {
      chatMutation.mutate(userMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateTicket = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "Need help with BakerIQ";
    createTicketMutation.mutate({ subject: "Support Request", message: lastUserMessage });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="!fixed !bottom-6 !right-6 !left-auto h-14 w-14 rounded-full shadow-lg z-[100]"
          data-testid="button-support-chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Support Assistant
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                  data-testid={`chat-message-${idx}`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content.replace("[CREATE_TICKET]", "").trim()}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t space-y-3">
          {activeTicket ? (
            <div className="flex items-center justify-between gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                <span>Ticket #{activeTicket.id.slice(0, 8)} - {activeTicket.status === "in_progress" ? "In Progress" : "Open"}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => closeTicketMutation.mutate(activeTicket.id)}
                disabled={closeTicketMutation.isPending}
                data-testid="button-close-ticket"
                className="text-muted-foreground hover:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-1" />
                {closeTicketMutation.isPending ? "Closing..." : "Close"}
              </Button>
            </div>
          ) : ticketCreated ? (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span>Support ticket submitted!</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleCreateTicket}
              disabled={createTicketMutation.isPending || messages.length < 2}
              data-testid="button-create-ticket"
            >
              <Ticket className="h-4 w-4" />
              {createTicketMutation.isPending ? "Creating..." : "Create Support Ticket"}
            </Button>
          )}
          
          <div className="flex gap-2">
            <Input
              placeholder="Type your question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={chatMutation.isPending || sendTicketMessageMutation.isPending}
              data-testid="input-support-message"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim() || chatMutation.isPending || sendTicketMessageMutation.isPending || ticketsLoading}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
