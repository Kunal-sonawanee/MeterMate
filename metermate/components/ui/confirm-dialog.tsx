"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Confirmation for anything irreversible.
 *
 * An alert dialog rather than a plain one: it can't be dismissed by clicking
 * away, so a destructive action always takes a deliberate answer. Errors from
 * the attempt are shown inside the dialog instead of a toast, because that is
 * where the user is looking and where they can retry.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        // Never yank the dialog away mid-request.
        if (!pending) onOpenChange(next);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop
          className={cn(
            "bg-foreground/25 fixed inset-0 z-50 backdrop-blur-[2px]",
            "transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
          )}
        />
        <AlertDialog.Popup
          className={cn(
            "bg-card text-card-foreground fixed z-50 w-[calc(100vw-2rem)] max-w-md shadow-lg outline-none",
            "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border",
            "transition-[opacity,transform] duration-200 ease-out",
            "data-[ending-style]:translate-y-[-46%] data-[ending-style]:opacity-0",
            "data-[starting-style]:translate-y-[-46%] data-[starting-style]:opacity-0",
          )}
        >
          <div className="flex gap-4 p-5">
            <div
              aria-hidden
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                destructive
                  ? "bg-destructive-soft text-destructive"
                  : "bg-primary-soft text-primary",
              )}
            >
              <AlertTriangle className="size-4.5" />
            </div>

            <div className="min-w-0 flex-1">
              <AlertDialog.Title className="text-base leading-6 font-semibold">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-muted-foreground mt-1.5 text-sm text-pretty">
                {description}
              </AlertDialog.Description>

              {error ? (
                <p
                  role="alert"
                  className="bg-destructive-soft text-destructive mt-3 rounded-lg px-3 py-2 text-sm"
                >
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <div className="border-border bg-card flex flex-col-reverse gap-2 rounded-b-xl border-t px-5 py-4 sm:flex-row sm:justify-end">
            <AlertDialog.Close
              render={<Button variant="outline" size="lg" disabled={pending} />}
            >
              {cancelLabel}
            </AlertDialog.Close>

            <Button
              size="lg"
              variant={destructive ? "destructive" : "default"}
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : null}
              {pending ? "Working…" : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
