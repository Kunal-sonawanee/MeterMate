"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

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
import { Field, FieldLabel, Input } from "@/components/ui/field";
import { ApiRequestError } from "@/lib/api";
import { propertySchema, type PropertyInput } from "@/lib/validation";
import {
  errorMessage,
  useCreateProperty,
  useUpdateProperty,
} from "@/hooks/use-metermate";
import type { PropertySummary } from "@/lib/types";

/**
 * Add or rename a property. One component for both so the two never drift
 * apart in wording, validation or layout.
 */
export function PropertyDialog({
  property,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  property?: PropertySummary;
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
          <PropertyForm property={property} onDone={() => setOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PropertyForm({
  property,
  onDone,
}: {
  property?: PropertySummary;
  onDone: () => void;
}) {
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const editing = Boolean(property);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: property?.name ?? "",
      address: property?.address ?? "",
    },
  });

  async function onSubmit(values: PropertyInput) {
    try {
      if (property) {
        await updateProperty.mutateAsync({ id: property.id, data: values });
      } else {
        await createProperty.mutateAsync(values);
      }
      onDone();
    } catch (error) {
      if (error instanceof ApiRequestError && error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          if (field === "name" || field === "address")
            setError(field, { message });
        }
      }
      setError("root", {
        message: errorMessage(error, "Couldn't save that property."),
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
          <DialogTitle>
            {editing ? "Edit property" : "Add a property"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Meters and readings stay attached."
              : "A building or unit you bill for. Meters belong to a property."}
          </DialogDescription>
        </div>
        <DialogDismiss />
      </DialogHeader>

      <DialogBody className="grid gap-4">
        <Field error={errors.name?.message}>
          <FieldLabel>Property name</FieldLabel>
          <Input
            placeholder="e.g. Sunrise Apartments"
            autoFocus
            {...register("name")}
          />
        </Field>

        <Field
          error={errors.address?.message}
          hint="Helps tell similar properties apart."
        >
          <FieldLabel optional>Address</FieldLabel>
          <Input placeholder="e.g. 14 MG Road, Pune" {...register("address")} />
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
          {isSubmitting ? "Saving…" : editing ? "Save changes" : "Add property"}
        </Button>
      </DialogFooter>
    </form>
  );
}
