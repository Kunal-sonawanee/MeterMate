"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gauge, Info, Loader2, Plus } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldLabel,
  Input,
  InputAffix,
  Select,
} from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ApiRequestError } from "@/lib/api";
import {
  currentMonthInputValue,
  formatCurrency,
  formatPeriod,
  formatReading,
  formatUnits,
  fromMonthInputValue,
} from "@/lib/format";
import { readingFormSchema, type ReadingFormValues } from "@/lib/validation";
import {
  useCreateReading,
  useMeters,
  usePrecedingReading,
  errorMessage,
} from "@/hooks/use-metermate";
import { usePreferences } from "@/hooks/use-preferences";
import type { MeterSummary } from "@/lib/types";

/**
 * Recording a reading — the product's core action.
 *
 * The form does the arithmetic the user would otherwise do on paper: it pulls
 * the reading the new one follows, shows units and the resulting bill live as
 * they type, and pre-fills the rate from what this meter was last billed at.
 * That leaves exactly one number to actually enter.
 */
export function RecordReadingDialog({
  trigger,
  defaultMeterId,
}: {
  trigger?: React.ReactElement;
  defaultMeterId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus aria-hidden />
              Record reading
            </Button>
          )
        }
      />
      <DialogContent>
        {/* Remounts per open so the form always starts clean. */}
        {open ? (
          <RecordReadingForm
            defaultMeterId={defaultMeterId}
            onDone={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RecordReadingForm({
  defaultMeterId,
  onDone,
}: {
  defaultMeterId?: string;
  onDone: () => void;
}) {
  const { data: meters, isPending: metersLoading } = useMeters();
  const { preferences } = usePreferences();
  const createReading = useCreateReading();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReadingFormValues>({
    resolver: zodResolver(readingFormSchema),
    defaultValues: {
      meterId: defaultMeterId ?? "",
      readingMonth: currentMonthInputValue(),
      currentReading: "",
      ratePerUnit: "",
    },
  });

  const meterId = watch("meterId");
  const readingMonth = watch("readingMonth");
  const currentReading = watch("currentReading");
  const ratePerUnit = watch("ratePerUnit");

  const period = useMemo(
    () => fromMonthInputValue(readingMonth ?? ""),
    [readingMonth],
  );

  const { data: preceding, isFetching: precedingLoading } = usePrecedingReading(
    meterId || undefined,
    period,
  );

  const isBaseline = preceding?.isBaseline ?? false;
  const previousReading = preceding?.previousReading ?? 0;

  // Rate comes from this meter's last bill where there is one, and from the
  // device default otherwise. Only auto-filled while the user hasn't typed.
  const [rateTouched, setRateTouched] = useState(false);
  useEffect(() => {
    if (rateTouched) return;
    const suggested =
      preceding?.suggestedRate ?? preferences.defaultRatePerUnit;
    setValue("ratePerUnit", suggested ? String(suggested) : "");
  }, [
    preceding?.suggestedRate,
    preferences.defaultRatePerUnit,
    rateTouched,
    setValue,
  ]);

  const parsedCurrent = Number(currentReading);
  const parsedRate = Number(ratePerUnit);
  const hasCurrent = currentReading !== "" && Number.isFinite(parsedCurrent);

  // A baseline reading bills nothing: there is no earlier figure to measure
  // consumption against, so the preview says zero rather than the whole dial.
  const units = !hasCurrent
    ? null
    : isBaseline
      ? 0
      : Math.max(0, parsedCurrent - previousReading);
  const estimatedBill =
    units !== null && Number.isFinite(parsedRate) ? units * parsedRate : null;
  const belowPrevious =
    hasCurrent && !isBaseline && parsedCurrent < previousReading;

  const grouped = useMemo(() => groupByProperty(meters ?? []), [meters]);

  async function onSubmit(values: ReadingFormValues) {
    const parsedPeriod = fromMonthInputValue(values.readingMonth);
    if (!parsedPeriod) {
      setError("readingMonth", { message: "Choose a billing month." });
      return;
    }

    try {
      await createReading.mutateAsync({
        meterId: values.meterId,
        month: parsedPeriod.month,
        year: parsedPeriod.year,
        currentReading: Number(values.currentReading),
        ratePerUnit: Number(values.ratePerUnit),
      });

      const meterName =
        meters?.find((meter) => meter.id === values.meterId)?.name ?? "Meter";
      toast.success(
        `${meterName} · ${formatPeriod(parsedPeriod.month, parsedPeriod.year)} saved.`,
      );
      onDone();
    } catch (error) {
      // Field-level messages land on the input that caused them; anything
      // else stays visible above the buttons rather than in a fleeting toast.
      if (error instanceof ApiRequestError && error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          const target = apiFieldToFormField(field);
          if (target) setError(target, { message });
        }
      }
      setError("root", {
        message: errorMessage(error, "Couldn't save that reading."),
      });
    }
  }

  if (!metersLoading && (meters?.length ?? 0) === 0) {
    return (
      <>
        <DialogHeader>
          <div>
            <DialogTitle>Record a reading</DialogTitle>
            <DialogDescription>
              You&apos;ll need a meter first.
            </DialogDescription>
          </div>
          <DialogDismiss />
        </DialogHeader>
        <DialogBody>
          <EmptyState
            icon={Gauge}
            title="No meters yet"
            description="Add a property and a meter, then you can start recording readings against it."
            action={
              <Button render={<Link href="/meters" />} onClick={onDone}>
                Set up a meter
              </Button>
            }
          />
        </DialogBody>
      </>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-col"
      noValidate
    >
      <DialogHeader>
        <div>
          <DialogTitle>Record a reading</DialogTitle>
          <DialogDescription>
            Units and the bill are worked out from the previous reading.
          </DialogDescription>
        </div>
        <DialogDismiss />
      </DialogHeader>

      <DialogBody className="grid gap-4">
        <Field error={errors.meterId?.message}>
          <FieldLabel>Meter</FieldLabel>
          <Select {...register("meterId")} disabled={metersLoading}>
            <option value="">
              {metersLoading ? "Loading meters…" : "Select a meter"}
            </option>
            {grouped.map(([propertyName, propertyMeters]) => (
              <optgroup key={propertyName} label={propertyName}>
                {propertyMeters.map((meter) => (
                  <option key={meter.id} value={meter.id}>
                    {meter.name}
                    {meter.meterNumber ? ` · ${meter.meterNumber}` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>

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
              !meterId
                ? "Pick a meter to load this."
                : precedingLoading
                  ? "Loading…"
                  : preceding?.precedingPeriod
                    ? `Carried from ${formatPeriod(preceding.precedingPeriod.month, preceding.precedingPeriod.year)}.`
                    : "Nothing recorded before this month."
            }
          >
            <FieldLabel>Previous reading</FieldLabel>
            <Input
              type="text"
              readOnly
              tabIndex={-1}
              data-numeric=""
              value={
                !meterId || isBaseline ? "—" : formatReading(previousReading)
              }
            />
          </Field>
        </div>

        {isBaseline && meterId ? (
          <p className="bg-primary-soft text-primary flex gap-2 rounded-lg px-3 py-2.5 text-sm">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              This is the first reading for this meter, so it sets the starting
              point and bills nothing. Consumption is measured from next
              month&apos;s reading onwards.
            </span>
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            error={
              errors.currentReading?.message ??
              (belowPrevious
                ? `Must be ${formatReading(previousReading)} or higher — the dial can't go backwards.`
                : undefined)
            }
          >
            <FieldLabel>Current reading</FieldLabel>
            <InputAffix
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0"
              autoComplete="off"
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
              placeholder="0.00"
              autoComplete="off"
              {...register("ratePerUnit", {
                onChange: () => setRateTouched(true),
              })}
            />
          </Field>
        </div>

        <ReadingPreview units={units} bill={estimatedBill} />

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
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : null}
          {isSubmitting ? "Saving…" : "Save reading"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Live restatement of what will be saved — the reason to trust the number. */
function ReadingPreview({
  units,
  bill,
}: {
  units: number | null;
  bill: number | null;
}) {
  return (
    <div className="bg-muted grid grid-cols-2 gap-px overflow-hidden rounded-lg">
      <div className="bg-card px-3 py-3">
        <p className="text-muted-foreground text-xs font-medium">
          Units consumed
        </p>
        <p className="mt-1 text-lg font-semibold" data-numeric="">
          {units === null ? "—" : formatUnits(units)}
        </p>
      </div>
      <div className="bg-card px-3 py-3">
        <p className="text-muted-foreground text-xs font-medium">Bill amount</p>
        <p className="text-primary mt-1 text-lg font-semibold" data-numeric="">
          {bill === null ? "—" : formatCurrency(bill)}
        </p>
      </div>
    </div>
  );
}

/** The API validates month and year separately; the form has one month input. */
export function apiFieldToFormField(
  field: string,
): keyof ReadingFormValues | null {
  switch (field) {
    case "month":
    case "year":
      return "readingMonth";
    case "meterId":
    case "currentReading":
    case "ratePerUnit":
      return field;
    default:
      return null;
  }
}

function groupByProperty(
  meters: MeterSummary[],
): Array<[string, MeterSummary[]]> {
  const groups = new Map<string, MeterSummary[]>();

  for (const meter of meters) {
    const existing = groups.get(meter.property.name);
    if (existing) existing.push(meter);
    else groups.set(meter.property.name, [meter]);
  }

  return [...groups.entries()];
}
