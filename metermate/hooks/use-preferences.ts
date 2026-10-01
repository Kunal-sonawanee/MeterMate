"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/local-store";

/**
 * Per-device preferences.
 *
 * There is no user or settings table in the schema, and inventing one to hold a
 * default tariff would be a bigger change than the problem warrants. These live
 * in `localStorage` and the settings screen says so plainly. Anything that must
 * be shared or audited stays in the database.
 */

export const PREFERENCES_KEY = "metermate.preferences";

export type Preferences = {
  /** Pre-filled into the reading form when a meter has no rate history. */
  defaultRatePerUnit: number;
};

export const DEFAULT_PREFERENCES: Preferences = {
  defaultRatePerUnit: 8,
};

const store = createLocalStore<Preferences>({
  key: PREFERENCES_KEY,
  fallback: DEFAULT_PREFERENCES,
  parse: (raw) => {
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    const rate = Number(parsed.defaultRatePerUnit);

    return {
      defaultRatePerUnit:
        Number.isFinite(rate) && rate >= 0 && rate <= 10_000
          ? rate
          : DEFAULT_PREFERENCES.defaultRatePerUnit,
    };
  },
});

export function usePreferences() {
  const preferences = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const update = useCallback((patch: Partial<Preferences>) => {
    store.set({ ...store.getSnapshot(), ...patch });
  }, []);

  return { preferences, update };
}
