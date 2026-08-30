"use client";

import { cn } from "@/lib/utils";

/**
 * A small radio group styled as a segmented control. Used where a view has two
 * or three mutually exclusive modes and a dropdown would be overkill.
 */
export function Segmented<Value extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: Value;
  onChange: (value: Value) => void;
  options: Array<{ value: Value; label: string }>;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "bg-muted border-border inline-flex items-center gap-0.5 rounded-lg border p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[calc(var(--radius)-6px)] px-2.5 py-1 text-xs font-medium transition-colors duration-150",
              "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-1",
              selected
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
