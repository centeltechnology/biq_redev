import { useState } from "react";
import { useLocation } from "wouter";
import { FileText, TestTube, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FirstQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FirstQuoteModal({ open, onOpenChange }: FirstQuoteModalProps) {
  const [choice, setChoice] = useState<"real" | "test">("test");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const testQuoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quotes/test-quote");
      return res.json();
    },
    onSuccess: (data: { quoteId: string; customerId: string }) => {
      onOpenChange(false);
      apiRequest("POST", "/api/activity/track", { eventType: "first_quote_cta_used" }).catch(() => {});
      setLocation(`/quotes/${data.quoteId}`);
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Could not create the test quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContinue = () => {
    if (choice === "real") {
      onOpenChange(false);
      apiRequest("POST", "/api/activity/track", { eventType: "first_quote_cta_used" }).catch(() => {});
      setLocation("/quotes/new");
    } else {
      testQuoteMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-first-quote">
        <DialogHeader>
          <DialogTitle>Send your first quote</DialogTitle>
          <DialogDescription>
            Would you like to send a real quote to a customer, or test the system first?
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={choice}
          onValueChange={(val) => setChoice(val as "real" | "test")}
          className="space-y-3 py-2"
        >
          <div className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover-elevate" onClick={() => setChoice("real")}>
            <RadioGroupItem value="real" id="choice-real" className="mt-0.5" data-testid="radio-real-quote" />
            <Label htmlFor="choice-real" className="cursor-pointer flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Send to a real customer</span>
              </div>
              <p className="text-xs text-muted-foreground">Create a new quote from scratch</p>
            </Label>
          </div>
          <div className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover-elevate" onClick={() => setChoice("test")}>
            <RadioGroupItem value="test" id="choice-test" className="mt-0.5" data-testid="radio-test-quote" />
            <Label htmlFor="choice-test" className="cursor-pointer flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <TestTube className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Send a test quote to myself</span>
              </div>
              <p className="text-xs text-muted-foreground">Preview exactly what your customers will see</p>
            </Label>
          </div>
        </RadioGroup>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-first-quote"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={testQuoteMutation.isPending}
            data-testid="button-continue-first-quote"
          >
            {testQuoteMutation.isPending ? "Creating..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
