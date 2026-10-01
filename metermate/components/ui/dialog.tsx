"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Modal dialog.
 *
 * Base UI supplies the parts that are easy to get wrong by hand — focus trap,
 * focus restore, Escape, scroll lock, `aria-modal` and the labelling. On phones
 * the popup docks to the bottom of the screen as a sheet, where thumbs are;
 * from `sm` up it centres.
 */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  size = "default",
  ...props
}: DialogPrimitive.Popup.Props & { size?: "default" | "lg" }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          "fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px]",
          "transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        )}
      />
      <DialogPrimitive.Popup
        className={cn(
          "bg-card text-card-foreground fixed z-50 flex flex-col shadow-lg outline-none",
          // Phone: bottom sheet, capped so a long form scrolls inside.
          "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl border-t border-border",
          "transition-transform duration-250 ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
          // Tablet and up: a centred panel.
          "sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-h-[85dvh] sm:w-[calc(100vw-3rem)]",
          "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border",
          "sm:transition-[opacity,transform] sm:data-[ending-style]:translate-y-[-46%] sm:data-[ending-style]:opacity-0",
          "sm:data-[starting-style]:translate-y-[-46%] sm:data-[starting-style]:opacity-0",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-border flex items-start justify-between gap-4 border-b px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn("text-base leading-6 font-semibold", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn(
        "text-muted-foreground mt-0.5 text-sm text-pretty",
        className,
      )}
      {...props}
    />
  );
}

export function DialogDismiss({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Close
      render={
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("-mr-1.5 -mt-0.5", className)}
        />
      }
    >
      <X aria-hidden />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  );
}

/** Scrollable middle section; the header and footer stay put. */
export function DialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-border bg-card flex flex-col-reverse gap-2 border-t px-5 py-4",
        "pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:pb-4",
        className,
      )}
      {...props}
    />
  );
}
