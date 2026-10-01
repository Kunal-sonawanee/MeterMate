"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/local-store";
import { DARK_QUERY, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

export type { Theme };

/**
 * Theme preference.
 *
 * The inline script in `app/layout.tsx` applies the stored theme before first
 * paint; this hook keeps the class in sync afterwards and re-renders when the
 * user switches, when another tab switches, or when the OS setting changes.
 */
const themeStore = createLocalStore<Theme>({
  key: THEME_STORAGE_KEY,
  fallback: "system",
  parse: (raw) => {
    const value = JSON.parse(raw) as unknown;
    return value === "light" || value === "dark" || value === "system"
      ? value
      : "system";
  },
});

function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );

  const systemDark = useSyncExternalStore(
    subscribeToSystemTheme,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );

  const resolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  // Syncing the document is exactly what an effect is for: pushing React state
  // out to an external system.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  return <>{children}</>;
}

export function useTheme() {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );

  const systemDark = useSyncExternalStore(
    subscribeToSystemTheme,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );

  const setTheme = useCallback((next: Theme) => themeStore.set(next), []);

  return useMemo(
    () => ({
      theme,
      resolvedTheme: (theme === "system"
        ? systemDark
          ? "dark"
          : "light"
        : theme) as "light" | "dark",
      setTheme,
    }),
    [theme, systemDark, setTheme],
  );
}
