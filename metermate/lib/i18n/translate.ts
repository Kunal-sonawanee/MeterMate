import type { Language } from "@/hooks/use-language";
import { en, type TranslationKey } from "./translations/en";
import { hi } from "./translations/hi";
import { mr } from "./translations/mr";

export type { TranslationKey } from "./translations/en";
export type { Language } from "@/hooks/use-language";

/**
 * The pure lookup + interpolation, with no React/hook dependency, so it can
 * be called from Server Components (e.g. the auth layout's watermark) as
 * well as from `useTranslation()` on the client.
 */
const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = {
  en,
  hi,
  mr,
};

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export function translate(
  language: Language,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const template = DICTIONARIES[language][key] ?? DICTIONARIES.en[key];
  return interpolate(template, vars);
}
