import { CheckCircle, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StripeInterstitialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

export function StripeInterstitialModal({
  open,
  onOpenChange,
  onContinue,
  onDismiss,
  isLoading,
}: StripeInterstitialModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-stripe-interstitial">
        <DialogHeader>
          <DialogTitle className="text-xl text-center" data-testid="text-interstitial-title">
            Activate Automatic Deposits
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <p className="text-sm text-muted-foreground text-center">
            You're about to complete a quick, secure setup with Stripe.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm">Verify your identity (bank-level security)</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm">Connect your payout account</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm">Start collecting deposits automatically</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Usually takes about 2–3 minutes. You can come back anytime.
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={onContinue}
              disabled={isLoading}
              className="w-full relative overflow-hidden"
              data-testid="button-continue-to-stripe"
            >
              <Lock className="h-4 w-4 mr-2" />
              {isLoading ? "Setting up..." : "Continue to Secure Setup"}
            </Button>
            <Button
              variant="ghost"
              onClick={onDismiss}
              className="w-full text-muted-foreground"
              data-testid="button-interstitial-dismiss"
            >
              Not right now
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Secured by Stripe</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
