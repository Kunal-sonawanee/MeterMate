import { cn } from "@/lib/utils";

/**
 * The single surface primitive. Everything the product shows on the page
 * background sits in a Card, so elevation and radius stay consistent.
 */
function Card({
  className,
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      className={cn(
        // `min-w-0` matters: as a grid or flex item, a card whose content has a
        // nowrap run would otherwise floor its track at that content's width and
        // push the whole page sideways. Cards truncate inside instead.
        "bg-card text-card-foreground border-border min-w-0 rounded-xl border shadow-xs",
        interactive && "transition-shadow duration-150 hover:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        // `pb-3` is the header's own rhythm; content that follows uses `pt-0`.
        "flex flex-col gap-1 px-4 pt-4 pb-3 sm:px-5 sm:pt-5",
        "has-data-[slot=card-actions]:flex-row has-data-[slot=card-actions]:items-start has-data-[slot=card-actions]:justify-between has-data-[slot=card-actions]:gap-4",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="card-title"
      className={cn("text-[0.9375rem] leading-6 font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm text-pretty", className)}
      {...props}
    />
  );
}

function CardActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-actions"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-4 sm:p-5", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "border-border flex items-center gap-2 border-t px-4 py-3 sm:px-5",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardActions,
  CardContent,
  CardFooter,
};
