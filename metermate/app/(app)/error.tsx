"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Last line of defence for a render-time failure inside the app shell. Data
 * fetching has its own inline error states — this catches the rest.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] render error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-lg font-semibold">
        Something went wrong on this page
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm text-pretty">
        The error has been logged. Reloading this section usually clears it —
        your saved readings are unaffected.
      </p>

      {error.digest ? (
        <p className="text-muted-foreground mt-3 font-mono text-xs">
          Reference: {error.digest}
        </p>
      ) : null}

      <Button className="mt-5" onClick={reset}>
        <RefreshCw aria-hidden />
        Try again
      </Button>
    </div>
  );
}
