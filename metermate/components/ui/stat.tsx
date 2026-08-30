import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercentage } from "@/lib/format";
import { Skeleton } from "@/components/ui/states";

/**
 * Stat tile: label, value, and an optional change against a named period.
 *
 * The value uses the font's proportional figures — tabular digits are for
 * columns of numbers, and at display size they read loose.
 */
export function Stat({
  label,
  value,
  hint,
  change,
  changeLabel,
  /** For consumption and cost, going up is bad. Say so explicitly per tile. */
  upIsGood = false,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  change?: number | null;
  changeLabel?: string;
  upIsGood?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const hasChange =
    typeof change === "number" &&
    Number.isFinite(change) &&
    Math.abs(change) >= 0.1;
  const rising = hasChange && change > 0;
  const good = hasChange ? (rising ? upIsGood : !upIsGood) : false;
  const TrendIcon = rising ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "bg-card border-border flex min-w-0 flex-col rounded-xl border p-4 shadow-xs sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        {Icon ? (
          <Icon className="text-muted-foreground/60 size-4 shrink-0" />
        ) : null}
      </div>

      <p className="text-foreground mt-2 text-2xl leading-8 font-semibold tracking-tight sm:text-[1.75rem]">
        {value}
      </p>

      {hasChange ? (
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              good ? "text-success" : "text-warning",
            )}
          >
            <TrendIcon aria-hidden className="size-3.5" />
            {formatPercentage(change)}
          </span>
          {changeLabel ? (
            <span className="text-muted-foreground">{changeLabel}</span>
          ) : null}
        </p>
      ) : hint ? (
        <p className="text-muted-foreground mt-2 text-xs text-pretty">{hint}</p>
      ) : null}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-card border-border rounded-xl border p-4 shadow-xs sm:p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-7 w-32" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  );
}
