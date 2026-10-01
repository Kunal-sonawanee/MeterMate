import { cn } from "@/lib/utils";

/**
 * The mark: a meter dial with a needle. Drawn rather than shipped as an asset
 * so it inherits `currentColor` and stays crisp at any size.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5">
        <path
          d="M4.5 17.5a8.5 8.5 0 1 1 15 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 13.5 15.5 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="14" r="1.75" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Logo />
      <span className="text-[0.9375rem] font-semibold tracking-tight">
        MeterMate
      </span>
    </span>
  );
}
