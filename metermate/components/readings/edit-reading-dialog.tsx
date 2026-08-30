"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogDismiss,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, Input, InputAffix } from "@/components/ui/field";
import { ApiRequestError } from "@/lib/api";
import {
  currentMonthInputValue,
  formatCurrency,
  formatUnits,
  fromMonthInputValue,
  toMonthInputValue,
} from "@/lib/format";
import {
  readingEditFormSchema,
  type ReadingEditFormValues,
} from "@/lib/validation";
import { errorMessage, useUpdateReading } from "@/hooks/use-metermate";
import type { ReadingWithMeter } from "@/lib/types";

/**
 * Editing a saved reading.
 *
 * The meter isn't editable here — moving a reading between meters would rewrite
 * two billing chains at once, and re-entering it on the right meter is both
 * clearer and safer. Changing the month or value re-derives every later month
 * on the server, which the description says out loud.
 */
export function EditReadingDialog({
  reading,
  onOpenChange,
}: {
  reading: ReadingWithMeter | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={reading !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {reading ? (
          <EditReadingForm
            reading={reading}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditReadingForm({
  reading,
  onDone,
}: {
  reading: ReadingWithMeter;
  onDone: () => void;
}) {
  const updateReading = useUpdateReading();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ReadingEditFormValues>({
    resolver: zodResolver(readingEditFormSchema),
    defaultValues: {
      readingMonth: toMonthInputValue(reading.month, reading.year),
      currentReading: String(reading.currentReading),
      ratePerUnit: String(reading.ratePerUnit),
    },
  });

  const currentReading = watch("currentReading");
  const ratePerUnit = watch("ratePerUnit");

  // A reading whose `previousReading` equals its own value is the meter's
  // baseline — the first one recorded, which bills nothing.
  const isBaseline =
    reading.previousReading === reading.currentReading &&
    reading.unitsConsumed === 0;

  const preview = useMemo(() => {
    const current = Number(currentReading);
    const rate = Number(ratePerUnit);
    if (!Number.isFinite(current) || !Number.isFinite(rate)) return null;

    const units = isBaseline
      ? 0
      : Math.max(0, current - reading.previousReading);
    return { units, bill: units * rate };
  }, [currentReading, ratePerUnit, reading.previousReading, isBaseline]);

  const belowPrevious =
    !isBaseline &&
    currentReading !== "" &&
    Number.isFinite(Number(currentReading)) &&
    Number(currentReading) < reading.previousReading;

  async function onSubmit(values: ReadingEditFormValues) {
    const period = fromMonthInputValue(values.readingMonth);
    if (!period) {
      setError("readingMonth", { message: "Choose a billing month." });
      return;
    }

    try {
      await updateReading.mutateAsync({
        id: reading.id,
        meterId: reading.meter.id,
        data: {
          month: period.month,
          year: period.year,
          currentReading: Number(values.currentReading),
          ratePerUnit: Number(values.ratePerUnit),
        },
      });

      toast.success("Reading updated.");
      onDone();
    } catch (error) {
      if (error instanceof ApiRequestError && error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          if (field === "currentReading" || field === "ratePerUnit") {
            setError(field, { message });
          } else if (field === "month" || field === "year") {
            setError("readingMonth", { message });
          }
        }
      }
      setError("root", {
        message: errorMessage(error, "Couldn't update that reading."),
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-col"
      noValidate
    >
      <DialogHeader>
        <div>
          <DialogTitle>Edit reading</DialogTitle>
          <DialogDescription>
            {reading.meter.name} · {reading.meter.property.name}. Later months
            are recalculated automatically.
          </DialogDescription>
        </div>
        <DialogDismiss />
      </DialogHeader>

      <DialogBody className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.readingMonth?.message}>
            <FieldLabel>Billing month</FieldLabel>
            <Input
              type="month"
              max={currentMonthInputValue()}
              {...register("readingMonth")}
            />
          </Field>

          <Field
            hint={
              isBaseline
                ? "First reading on this meter — it sets the baseline and bills nothing."
                : "Carried forward from the previous month."
            }
          >
            <FieldLabel>Previous reading</FieldLabel>
            <Input
              type="text"
              readOnly
              tabIndex={-1}
              data-numeric=""
              value={isBaseline ? "—" : formatUnits(reading.previousReading)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            error={
              errors.currentReading?.message ??
              (belowPrevious
                ? `Must be ${formatUnits(reading.previousReading)} or higher.`
                : undefined)
            }
          >
            <FieldLabel>Current reading</FieldLabel>
            <InputAffix
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              {...register("currentReading")}
            />
          </Field>

          <Field error={errors.ratePerUnit?.message}>
            <FieldLabel>Rate per unit</FieldLabel>
            <InputAffix
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              prefix="₹"
              {...register("ratePerUnit")}
            />
          </Field>
        </div>

        <div className="bg-muted grid grid-cols-2 gap-px overflow-hidden rounded-lg">
          <div className="bg-card px-3 py-3">
            <p className="text-muted-foreground text-xs font-medium">
              Units consumed
            </p>
            <p className="mt-1 text-lg font-semibold" data-numeric="">
              {preview ? formatUnits(preview.units) : "—"}
            </p>
          </div>
          <div className="bg-card px-3 py-3">
            <p className="text-muted-foreground text-xs font-medium">
              Bill amount
            </p>
            <p
              className="text-primary mt-1 text-lg font-semibold"
              data-numeric=""
            >
              {preview ? formatCurrency(preview.bill) : "—"}
            </p>
          </div>
        </div>

        {errors.root?.message ? (
          <p
            role="alert"
            className="bg-destructive-soft text-destructive rounded-lg px-3 py-2 text-sm"
          >
            {errors.root.message}
          </p>
        ) : null}
      </DialogBody>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onDone}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : null}
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
