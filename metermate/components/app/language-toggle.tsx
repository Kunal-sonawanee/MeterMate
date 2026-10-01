"use client";

import { cn } from "@/lib/utils";
import { LANGUAGES, LANGUAGE_LABELS } from "@/hooks/use-language";
import { useTranslation } from "@/lib/i18n";

/**
 * Same segmented-control shape as `ThemeToggle`, for the same reason: three
 * mutually exclusive, equally-weighted choices read better as buttons than a
 * dropdown, and it's touch-friendly without extra chrome.
 */
export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className="bg-muted border-border inline-flex items-center gap-0.5 rounded-lg border p-0.5"
    >
      {LANGUAGES.map((code) => {
        const selected = language === code;

        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setLanguage(code)}
            className={cn(
              "rounded-[calc(var(--radius)-6px)] px-3 py-1.5 text-sm font-medium transition-colors duration-150",
              "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-1",
              selected
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LANGUAGE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
