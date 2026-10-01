"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { ApiRequestError } from "@/lib/api";
import { ThemeProvider } from "@/components/theme-provider";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Readings change when the user changes them, not on their own — a
        // short freshness window avoids refetching on every navigation while
        // still picking up edits made in another tab.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          // A 4xx will fail the same way every time; only retry transport and
          // server faults, and only briefly.
          if (
            error instanceof ApiRequestError &&
            error.status >= 400 &&
            error.status < 500
          ) {
            return false;
          }
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Created once per client so server-rendered and client trees don't share state.
  const [queryClient] = useState(makeQueryClient);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
