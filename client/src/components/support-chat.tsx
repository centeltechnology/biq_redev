import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Send, X, Loader2, Ticket, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/support/chat", {
        message,
        conversationHistory: messages,
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || chatMutation.isPending) return;
    
    const userMessage = inputValue.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInputValue("");
    chatMutation.mutate(userMessage);
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
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
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
          {ticketCreated ? (
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
              disabled={chatMutation.isPending}
              data-testid="input-support-message"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim() || chatMutation.isPending}
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
