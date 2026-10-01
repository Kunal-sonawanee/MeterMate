import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api";

/**
 * Loading, empty and error states.
 *
 * These are product surfaces, not placeholders — a screen with nothing in it
 * should still tell the user what belongs there and how to put it there.
 */

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

/** Announces that a region is loading without spamming a screen reader. */
export function LoadingRegion({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={className}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-border flex flex-col items-center rounded-xl border border-dashed text-center",
        compact ? "px-4 py-8" : "px-6 py-12",
        className,
      )}
    >
      {Icon ? (
        <div
          aria-hidden
          className="bg-muted text-muted-foreground mb-3 flex size-10 items-center justify-center rounded-full"
        >
          <Icon className="size-5" />
        </div>
      ) : null}

      <p className="text-foreground text-sm font-semibold">{title}</p>

      {description ? (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm text-pretty">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/**
 * Error state with a retry. Distinguishes "we can't reach the server" from
 * "the server said no", because the user's next move differs.
 */
export function ErrorState({
  error,
  onRetry,
  title,
  className,
  compact = false,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
  compact?: boolean;
}) {
  const offline = error instanceof ApiRequestError && error.isNetworkError;
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Something went wrong while loading this.";

  const Icon = offline ? WifiOff : AlertCircle;

  return (
    <div
      role="alert"
      className={cn(
        "border-destructive/30 bg-destructive-soft/50 flex flex-col items-center rounded-xl border text-center",
        compact ? "px-4 py-6" : "px-6 py-10",
        className,
      )}
    >
      <div
        aria-hidden
        className="bg-destructive-soft text-destructive mb-3 flex size-10 items-center justify-center rounded-full"
      >
        <Icon className="size-5" />
      </div>

      <p className="text-foreground text-sm font-semibold">
        {title ?? (offline ? "You appear to be offline" : "Couldn't load this")}
      </p>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm text-pretty">
        {message}
      </p>

      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
