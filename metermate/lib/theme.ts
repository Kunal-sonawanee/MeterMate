/**
 * Theme constants.
 *
 * Deliberately in a plain module, not the `"use client"` provider: the root
 * layout inlines the storage key into a pre-paint script, and importing a value
 * from a client module on the server yields a client-reference stub rather than
 * the string.
 */
export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "metermate.theme";

export const DARK_QUERY = "(prefers-color-scheme: dark)";
