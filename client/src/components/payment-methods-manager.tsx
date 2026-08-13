import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CreditCard, Smartphone, Link2, Wallet, CalendarClock, Loader2, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackActivationEvent } from "@/lib/activation";

export interface PaymentMethodView {
  key: string;
  label: string;
  category: "everyday" | "flexible";
  description: string;
  status: "on" | "off" | "unavailable" | "requires_verification";
  statusLabel: string;
  locked: boolean;
  lockedReason?: string;
}

export interface PaymentMethodsData {
  ok: boolean;
  connected: boolean;
  onboarded: boolean;
  payoutsEnabled: boolean;
  customized: boolean;
  methods: PaymentMethodView[];
  message?: string;
}

export function usePaymentMethods(enabled = true) {
  return useQuery<PaymentMethodsData>({
    queryKey: ["/api/payment-methods"],
    enabled,
    staleTime: 60_000,
  });
}

const METHOD_ICONS: Record<string, typeof CreditCard> = {
  card: CreditCard,
  apple_pay: Smartphone,
  cashapp: Wallet,
  link: Link2,
  amazon_pay: Wallet,
  affirm: CalendarClock,
  afterpay_clearpay: CalendarClock,
  klarna: CalendarClock,
};

function StatusBadge({ method }: { method: PaymentMethodView }) {
  if (method.status === "on") {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs" data-testid={`badge-method-${method.key}`}>
        On
      </Badge>
    );
  }
  if (method.status === "off") {
    return <Badge variant="secondary" className="text-xs" data-testid={`badge-method-${method.key}`}>Off</Badge>;
  }
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground" data-testid={`badge-method-${method.key}`}>
      {method.statusLabel}
    </Badge>
  );
}

interface PaymentMethodsManagerProps {
  data: PaymentMethodsData;
  editable: boolean;
  /** analytics context: "onboarding" | "settings" */
  context: string;
}

export function PaymentMethodsManager({ data, editable, context }: PaymentMethodsManagerProps) {
  const { toast } = useToast();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async ({ method, enabled }: { method: string; enabled: boolean }) => {
      const res = await apiRequest("PATCH", "/api/payment-methods", { method, enabled });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update payment methods");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't update payment method", description: error.message, variant: "destructive" });
    },
    onSettled: () => setPendingKey(null),
  });

  const handleToggle = (method: PaymentMethodView, on: boolean) => {
    setPendingKey(method.key);
    updateMutation.mutate({ method: method.key, enabled: on });
  };

  const groups: { title: string; blurb: string; category: "everyday" | "flexible" }[] = [
    { title: "Everyday Payments", blurb: "The options most customers use", category: "everyday" },
    { title: "Flexible Payment Options", blurb: "Let customers pay over time", category: "flexible" },
  ];

  return (
    <div className="space-y-5" data-testid={`payment-methods-manager-${context}`}>
      {groups.map((group) => {
        const methods = data.methods.filter((m) => m.category === group.category);
        // Hide entirely-unavailable groups instead of showing clutter
        if (methods.length === 0) return null;
        return (
          <div key={group.category}>
            <p className="text-sm font-medium">{group.title}</p>
            <p className="text-xs text-muted-foreground mb-2">{group.blurb}</p>
            <div className="border rounded-lg divide-y">
              {methods.map((method) => {
                const Icon = METHOD_ICONS[method.key] || CreditCard;
                const isUnavailable = method.status === "unavailable" || method.status === "requires_verification";
                return (
                  <div key={method.key} className={`flex items-center gap-3 p-3 ${isUnavailable ? "opacity-60" : ""}`} data-testid={`row-method-${method.key}`}>
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{method.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {method.locked && method.lockedReason && !isUnavailable ? method.lockedReason : method.description}
                      </p>
                    </div>
                    {editable && !method.locked ? (
                      pendingKey === method.key && updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Switch
                          checked={method.status === "on"}
                          onCheckedChange={(on) => handleToggle(method, on)}
                          disabled={updateMutation.isPending}
                          data-testid={`switch-method-${method.key}`}
                        />
                      )
                    ) : (
                      <StatusBadge method={method} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        What customers actually see at checkout can also depend on their device, location, purchase amount, and Stripe eligibility.
      </p>
    </div>
  );
}

export function PaymentMethodsLoadError({ message }: { message?: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-4" data-testid="payment-methods-error">
      <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <p className="text-sm text-muted-foreground">
        {message || "We couldn't load your payment options right now. You can review them anytime in Settings → Payments."}
      </p>
    </div>
  );
}

// Fire a once-per-session analytics event helper re-exported for callers.
export { trackActivationEvent };
