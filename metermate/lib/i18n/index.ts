"use client";

import { useCallback, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { translate, type TranslationKey } from "./translate";

export { translate } from "./translate";
export type { TranslationKey } from "./translate";
export type { Language } from "@/hooks/use-language";

/** `const { t } = useTranslation(); t("home.title")` */
export function useTranslation() {
  const { language, setLanguage } = useLanguage();

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(language, key, vars),
    [language],
  );

  return useMemo(() => ({ t, language, setLanguage }), [t, language, setLanguage]);
}
