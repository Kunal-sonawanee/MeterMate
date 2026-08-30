/**
 * A tiny `useSyncExternalStore`-shaped wrapper around `localStorage`.
 *
 * Reading browser storage during render or in an effect both cause problems —
 * the first breaks hydration, the second cascades a render. Treating storage
 * as what it actually is, an external store, avoids both and keeps other tabs
 * in sync for free.
 */
export type LocalStore<T> = {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (value: T) => void;
};

export function createLocalStore<T>({
  key,
  fallback,
  parse,
}: {
  key: string;
  fallback: T;
  /** Returns `fallback` for anything malformed; never throws. */
  parse: (raw: string) => T;
}): LocalStore<T> {
  const listeners = new Set<() => void>();

  // getSnapshot must be referentially stable between changes, so the parsed
  // value is cached and only re-read when the underlying string changes.
  let cachedRaw: string | null = null;
  let cachedValue: T = fallback;
  let primed = false;

  function readRaw(): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function getSnapshot(): T {
    if (typeof window === "undefined") return fallback;

    const raw = readRaw();
    if (primed && raw === cachedRaw) return cachedValue;

    cachedRaw = raw;
    cachedValue = raw === null ? fallback : safeParse(raw);
    primed = true;
    return cachedValue;
  }

  function safeParse(raw: string): T {
    try {
      return parse(raw);
    } catch {
      return fallback;
    }
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  return {
    subscribe(onChange) {
      listeners.add(onChange);

      // Another tab changing the same key should update this one.
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === key) onChange();
      };
      window.addEventListener("storage", onStorage);

      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot,
    getServerSnapshot: () => fallback,
    set(value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage blocked or full — hold the value in memory for this session.
      }
      cachedRaw = null;
      primed = false;
      cachedValue = value;
      cachedRaw = safeStringify(value);
      primed = true;
      emit();
    },
  };
}

function safeStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}
