import { Badge } from "@/components/ui/badge";
import { LEAD_STATUSES, QUOTE_STATUSES } from "@shared/schema";

interface StatusBadgeProps {
  status: string;
  type: "lead" | "quote";
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const statuses = type === "lead" ? LEAD_STATUSES : QUOTE_STATUSES;
  const statusConfig = statuses.find((s) => s.id === status);
  
  const label = statusConfig?.label || status;
  const color = statusConfig?.color || "gray";
  const colorClass = colorMap[color] || colorMap.gray;

  return (
    <Badge 
      variant="secondary" 
      className={`${colorClass} font-medium uppercase text-xs tracking-wide`}
      data-testid={`badge-status-${status}`}
    >
      {label}
    </Badge>
  );
}
