import { cn } from "@/lib/utils";

/**
 * Every screen opens the same way: what this page is, then what you can do
 * here. Actions sit under the title on phones so the heading never gets
 * squeezed to two characters wide.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 sm:mb-6", className)}>
      {breadcrumb ? <div className="mb-2">{breadcrumb}</div> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground mt-1 text-sm text-pretty">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
