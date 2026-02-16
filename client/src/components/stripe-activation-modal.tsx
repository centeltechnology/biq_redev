import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Copy, Check, QrCode, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { downloadCalculatorQR } from "@/lib/qr-download";

const STORAGE_KEY = "bakeriq_stripe_activation_modal_seen";

export function StripeActivationModal() {
  const { baker } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAdmin = baker?.role === "admin" || baker?.role === "super_admin";
  const hasStripe = !!baker?.stripeConnectedAt;
  const hasSentQuote = !!baker?.firstQuoteSentAt;

  useEffect(() => {
    if (!baker || isAdmin || !hasStripe || hasSentQuote) return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [baker, isAdmin, hasStripe, hasSentQuote]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const calculatorUrl = baker?.slug
    ? `${window.location.origin}/c/${baker.slug}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(calculatorUrl);
      setCopied(true);
      toast({ title: "Calculator link copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleDownloadQR = async () => {
    try {
      await downloadCalculatorQR(calculatorUrl, baker?.businessName || undefined);
      toast({ title: "QR code downloaded!" });
    } catch {
      toast({ title: "Failed to download QR code", variant: "destructive" });
    }
  };

  if (!baker || isAdmin || !hasStripe || hasSentQuote) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md" data-testid="modal-stripe-activation">
        <DialogHeader>
          <DialogTitle data-testid="text-activation-title">Payments Activated</DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>Now let's put it to work.</p>
            <p>
              Send your calculator link to anyone who asked about pricing recently.
              Don't reply with a number — reply with your link.
              Then send your first quote and collect your first deposit.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            data-testid="button-activation-copy-link"
          >
            {copied ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? "Copied!" : "Copy Calculator Link"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadQR}
            data-testid="button-activation-download-qr"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
          <Button
            asChild
            onClick={handleDismiss}
            data-testid="button-activation-send-quote"
          >
            <Link href="/customers?new=true">
              <FileText className="h-4 w-4 mr-2" />
              Send Your First Quote
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: Send your link to everyone who DM'd you about pricing in the last 30 days.
        </p>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground"
            data-testid="button-activation-dismiss"
          >
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
