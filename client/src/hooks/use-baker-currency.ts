import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/calculator";
import type { Baker } from "@shared/schema";

interface SessionData {
  baker: Baker | null;
}

export function useBakerCurrency() {
  const { data: session } = useQuery<SessionData>({
    queryKey: ["/api/auth/session"],
  });
  return session?.baker?.currency || "USD";
}

export function useFormatCurrency() {
  const currency = useBakerCurrency();
  return (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
    return formatCurrency(num, currency);
  };
}
