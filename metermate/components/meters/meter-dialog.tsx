"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2 } from "lucide-react";

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
import { Field, FieldLabel, Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ApiRequestError } from "@/lib/api";
import { meterSchema, type MeterInput } from "@/lib/validation";
import {
  errorMessage,
  useCreateMeter,
  useProperties,
  useUpdateMeter,
} from "@/hooks/use-metermate";
import type { MeterSummary } from "@/lib/types";

/** Add or edit a meter. A meter always belongs to exactly one property. */
export function MeterDialog({
  meter,
  defaultPropertyId,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  meter?: MeterSummary;
  defaultPropertyId?: string;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent>
        {open ? (
          <MeterForm
            meter={meter}
            defaultPropertyId={defaultPropertyId}
            onDone={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MeterForm({
  meter,
  defaultPropertyId,
  onDone,
}: {
  meter?: MeterSummary;
  defaultPropertyId?: string;
  onDone: () => void;
}) {
  const { data: properties, isPending: propertiesLoading } = useProperties();
  const createMeter = useCreateMeter();
  const updateMeter = useUpdateMeter();
  const editing = Boolean(meter);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MeterInput>({
    resolver: zodResolver(meterSchema),
    defaultValues: {
      name: meter?.name ?? "",
      meterNumber: meter?.meterNumber ?? "",
      propertyId: meter?.property.id ?? defaultPropertyId ?? "",
    },
  });

  async function onSubmit(values: MeterInput) {
    try {
      if (meter) {
        await updateMeter.mutateAsync({ id: meter.id, data: values });
      } else {
        await createMeter.mutateAsync(values);
      }
      onDone();
    } catch (error) {
      if (error instanceof ApiRequestError && error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          if (
            field === "name" ||
            field === "meterNumber" ||
            field === "propertyId"
          ) {
            setError(field, { message });
          }
        }
      }
      setError("root", {
        message: errorMessage(error, "Couldn't save that meter."),
      });
    }
  }

  // A meter can't exist without somewhere to put it — say that instead of
  // showing a select with nothing in it.
  if (!editing && !propertiesLoading && (properties?.length ?? 0) === 0) {
    return (
      <>
        <DialogHeader>
          <div>
            <DialogTitle>Add a meter</DialogTitle>
            <DialogDescription>
              You&apos;ll need a property first.
            </DialogDescription>
          </div>
          <DialogDismiss />
        </DialogHeader>
        <DialogBody>
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="Every meter belongs to a property. Add one, then come back to add its meters."
            action={
              <Button render={<Link href="/properties" />} onClick={onDone}>
                Add a property
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
          <DialogTitle>{editing ? "Edit meter" : "Add a meter"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Readings recorded against this meter are unaffected."
              : "Name it the way you'd say it out loud — “Flat 2B”, “Shop front”."}
          </DialogDescription>
        </div>
        <DialogDismiss />
      </DialogHeader>

      <DialogBody className="grid gap-4">
        <Field error={errors.propertyId?.message}>
          <FieldLabel>Property</FieldLabel>
          <Select {...register("propertyId")} disabled={propertiesLoading}>
            <option value="">
              {propertiesLoading ? "Loading properties…" : "Select a property"}
            </option>
            {properties?.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field error={errors.name?.message}>
          <FieldLabel>Meter name</FieldLabel>
          <Input
            placeholder="e.g. Flat 2B"
            autoFocus={!editing}
            {...register("name")}
          />
        </Field>

        <Field
          error={errors.meterNumber?.message}
          hint="The serial printed on the meter, if you track it."
        >
          <FieldLabel optional>Meter number</FieldLabel>
          <Input placeholder="e.g. MSEB-4471902" {...register("meterNumber")} />
        </Field>

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
          {isSubmitting ? "Saving…" : editing ? "Save changes" : "Add meter"}
        </Button>
      </DialogFooter>
    </form>
  );
}
