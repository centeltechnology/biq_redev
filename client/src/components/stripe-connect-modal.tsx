import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { CreditCard, X } from "lucide-react";
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
import type { Baker } from "@shared/schema";

interface StripeConnectModalProps {
  baker: Baker;
  onDismiss: () => void;
}

export function StripeConnectModal({ baker, onDismiss }: StripeConnectModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (baker.role === "super_admin") return;
    if (baker.stripeConnectedAt) return;

    const dismissed = sessionStorage.getItem("stripeConnectModalDismissed");
    if (dismissed === "true") return;

    setOpen(true);

    apiRequest("POST", "/api/activation/stripe-prompt-shown").catch(() => {});
  }, [baker]);

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe-connect/create-account");
      const data = await res.json();
      if (data.accountId) {
        const linkRes = await apiRequest("POST", "/api/stripe-connect/onboarding-link");
        const linkData = await linkRes.json();
        return linkData;
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const onboardingLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe-connect/onboarding-link");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const handleConnect = () => {
    if (baker.stripeConnectAccountId) {
      onboardingLinkMutation.mutate();
    } else {
      connectMutation.mutate();
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("stripeConnectModalDismissed", "true");
    setOpen(false);
    onDismiss();
  };

  const isPending = connectMutation.isPending || onboardingLinkMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-stripe-connect">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Connect Stripe to start getting paid
          </DialogTitle>
          <DialogDescription className="pt-2">
            Connecting Stripe takes a few minutes and lets you collect deposits and payments directly through BakerIQ.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">With Stripe connected, you can:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Collect deposits upfront on orders</li>
              <li>• Accept full payments through quotes</li>
              <li>• Get paid directly to your bank account</li>
              <li>• Track all payments in one place</li>
            </ul>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            data-testid="button-stripe-not-now"
          >
            <X className="h-4 w-4 mr-1" />
            Not now
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isPending}
            data-testid="button-stripe-connect-modal"
          >
            {isPending ? "Setting up..." : "Connect Stripe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
