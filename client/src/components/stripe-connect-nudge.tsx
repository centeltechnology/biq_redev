import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface StripeConnectNudgeProps {
  open: boolean;
  onClose: () => void;
  stripeConnectAccountId?: string | null;
}

export function StripeConnectNudge({ open, onClose, stripeConnectAccountId }: StripeConnectNudgeProps) {
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!stripeConnectAccountId) {
        const res = await apiRequest("POST", "/api/stripe-connect/create-account");
        await res.json();
      }
      const linkRes = await apiRequest("POST", "/api/stripe-connect/onboarding-link");
      return linkRes.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm" data-testid="dialog-stripe-nudge">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Connect Stripe to accept payments
          </DialogTitle>
          <DialogDescription className="pt-2">
            Connect Stripe to accept deposits and payments on invoices.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            data-testid="button-nudge-not-now"
          >
            Not now
          </Button>
          <Button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            data-testid="button-nudge-connect-stripe"
          >
            {connectMutation.isPending ? "Setting up..." : "Connect Stripe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
