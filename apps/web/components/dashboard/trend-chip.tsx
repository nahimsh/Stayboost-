import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@stayboost/ui";
import { formatPercent } from "@stayboost/utils";
import type { Trend } from "@stayboost/domain";

/** A compact, colored delta chip (Stripe/Linear style). */
export function TrendChip({ trend, suffix }: { readonly trend: Trend; readonly suffix?: string }): React.JSX.Element {
  const tone =
    trend.direction === "up"
      ? "bg-success/10 text-success"
      : trend.direction === "down"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";
  const Icon = trend.direction === "up" ? ArrowUpRight : trend.direction === "down" ? ArrowDownRight : Minus;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", tone)}>
      <Icon className="size-3" aria-hidden />
      {formatPercent(Math.abs(trend.deltaPct) / 100, "en-US", 1)}
      {suffix ? <span className="font-normal text-muted-foreground">{suffix}</span> : null}
    </span>
  );
}
