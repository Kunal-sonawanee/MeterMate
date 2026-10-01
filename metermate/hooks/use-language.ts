"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/local-store";

/**
 * UI language preference — per-device, same pattern as `usePreferences`
 * (theme, default rate). Numbers and currency are never affected by this:
 * `lib/format.ts` always formats in `en-IN`, regardless of which language
 * the interface text is shown in.
 */

export const LANGUAGE_KEY = "metermate.language";

export const LANGUAGES = ["en", "hi", "mr"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  mr: "मराठी",
};

const DEFAULT_LANGUAGE: Language = "en";

const store = createLocalStore<Language>({
  key: LANGUAGE_KEY,
  fallback: DEFAULT_LANGUAGE,
  parse: (raw) => {
    const value = JSON.parse(raw) as unknown;
    return (LANGUAGES as readonly string[]).includes(value as string)
      ? (value as Language)
      : DEFAULT_LANGUAGE;
  },
});

export function useLanguage() {
  const language = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const setLanguage = useCallback((next: Language) => store.set(next), []);

  return { language, setLanguage };
}
