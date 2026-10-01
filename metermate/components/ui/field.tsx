"use client";

import { createContext, use, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form field primitives.
 *
 * `Field` owns the ids and wires `aria-describedby` / `aria-invalid` onto the
 * control, so every input in the product announces its label, hint and error
 * to a screen reader without each form remembering to do it.
 */

type FieldContextValue = {
  id: string;
  hintId: string;
  errorId: string;
  invalid: boolean;
  describedBy: string | undefined;
};

const FieldContext = createContext<FieldContextValue | null>(null);

function useField() {
  const context = use(FieldContext);
  if (!context) {
    throw new Error("Field parts must be used inside <Field>");
  }
  return context;
}

/** Controls rendered outside a Field (filter bars) still get styling. */
function useOptionalField() {
  return use(FieldContext);
}

export function Field({
  children,
  error,
  hint,
  className,
}: {
  children: React.ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <FieldContext value={{ id, hintId, errorId, invalid, describedBy }}>
      <div className={cn("grid gap-1.5", className)}>
        {children}
        {hint && !error ? (
          <p id={hintId} className="text-muted-foreground text-xs">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="text-destructive text-xs font-medium">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext>
  );
}

export function FieldLabel({
  className,
  children,
  optional,
  ...props
}: React.ComponentProps<"label"> & { optional?: boolean }) {
  const field = useField();

  return (
    <label
      htmlFor={field.id}
      className={cn(
        "text-foreground flex items-center gap-1.5 text-sm font-medium",
        className,
      )}
      {...props}
    >
      {children}
      {optional ? (
        <span className="text-muted-foreground text-xs font-normal">
          (optional)
        </span>
      ) : null}
    </label>
  );
}

const controlClasses = [
  "w-full rounded-lg border bg-card text-foreground text-sm",
  "border-input placeholder:text-muted-foreground/70",
  "transition-[border-color,box-shadow] duration-150",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
  "aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive",
  // 44px on touch, tightened to 36px where a pointer is available.
  "h-11 px-3 sm:h-9",
];

/**
 * Read-only styling lives on the text inputs, not in `controlClasses`: CSS
 * `:read-only` also matches `<select>`, which would grey out every dropdown.
 */
const readOnlyClasses = "read-only:bg-muted read-only:text-muted-foreground";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  const field = useOptionalField();

  return (
    <input
      id={field?.id}
      aria-invalid={field?.invalid || undefined}
      aria-describedby={field?.describedBy}
      className={cn(controlClasses, readOnlyClasses, className)}
      {...props}
    />
  );
}

/**
 * A native select — on a phone this opens the platform picker, which beats any
 * custom listbox for speed and reliability, and it is keyboard-accessible for
 * free.
 */
export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  const field = useOptionalField();

  return (
    <div className="relative">
      <select
        id={field?.id}
        aria-invalid={field?.invalid || undefined}
        aria-describedby={field?.describedBy}
        className={cn(
          controlClasses,
          "cursor-pointer appearance-none pr-9",
          // Placeholder option renders muted until a real value is chosen.
          "[&:has(option[value='']:checked)]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </div>
  );
}

/** A leading unit or currency symbol attached to a numeric input. */
export function InputAffix({
  prefix,
  suffix,
  className,
  ...props
}: React.ComponentProps<"input"> & { prefix?: string; suffix?: string }) {
  const field = useOptionalField();

  return (
    <div className="relative">
      {prefix ? (
        <span
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm"
        >
          {prefix}
        </span>
      ) : null}
      <input
        id={field?.id}
        aria-invalid={field?.invalid || undefined}
        aria-describedby={field?.describedBy}
        data-numeric=""
        className={cn(
          controlClasses,
          readOnlyClasses,
          prefix && "pl-8",
          suffix && "pr-12",
          className,
        )}
        {...props}
      />
      {suffix ? (
        <span
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm"
        >
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
