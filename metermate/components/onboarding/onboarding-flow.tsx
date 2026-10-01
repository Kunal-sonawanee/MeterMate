"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, Input } from "@/components/ui/field";
import { propertySchema, meterSchema, type PropertyInput, type MeterInput } from "@/lib/validation";
import {
  errorMessage,
  useCompleteOnboarding,
  useCreateMeter,
  useCreateProperty,
} from "@/hooks/use-metermate";

/**
 * One-time setup, shown right after signup and never again.
 *
 * Two steps only — a property, then its first meter — because that's the
 * minimum MeterMate needs to record a reading. Everything else (more
 * properties, more meters) lives in Settings for whenever it's next needed.
 */
export function OnboardingFlow() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState<"property" | "meter" | "done">("property");
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);

  const createProperty = useCreateProperty();
  const createMeter = useCreateMeter();
  const complete = useCompleteOnboarding();

  const propertyForm = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: { name: "", address: "" },
  });

  const meterForm = useForm<MeterInput>({
    resolver: zodResolver(meterSchema),
    defaultValues: { name: "", whatsappNumber: "", propertyId: "" },
  });

  async function onSubmitProperty(values: PropertyInput) {
    setRootError(null);
    try {
      const property = await createProperty.mutateAsync(values);
      setPropertyId(property.id);
      meterForm.setValue("propertyId", property.id);
      setStep("meter");
    } catch (error) {
      setRootError(errorMessage(error, "Couldn't save that property."));
    }
  }

  async function onSubmitMeter(values: MeterInput) {
    if (!propertyId) return;
    setRootError(null);
    try {
      await createMeter.mutateAsync({ ...values, propertyId });
      await finish();
    } catch (error) {
      setRootError(errorMessage(error, "Couldn't save that meter."));
    }
  }

  async function finish() {
    setRootError(null);
    try {
      await complete.mutateAsync();
      await update();
      router.push("/");
      router.refresh();
    } catch (error) {
      setRootError(errorMessage(error, "Couldn't finish setup."));
    }
  }

  if (step === "property") {
    return (
      <form
        onSubmit={propertyForm.handleSubmit(onSubmitProperty)}
        className="grid gap-4"
        noValidate
      >
        <Header
          step={1}
          title="Add your first property"
          description="A building or unit you bill for. You can add more later, from Settings."
        />

        <Field error={propertyForm.formState.errors.name?.message}>
          <FieldLabel>Property name</FieldLabel>
          <Input
            placeholder="e.g. Sunrise Apartments"
            autoFocus
            {...propertyForm.register("name")}
          />
        </Field>

        <Field
          error={propertyForm.formState.errors.address?.message}
          hint="Helps tell similar properties apart."
        >
          <FieldLabel optional>Address</FieldLabel>
          <Input
            placeholder="e.g. 14 MG Road, Pune"
            {...propertyForm.register("address")}
          />
        </Field>

        <ErrorLine message={rootError} />

        <Button type="submit" size="lg" disabled={propertyForm.formState.isSubmitting}>
          {propertyForm.formState.isSubmitting ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : null}
          Continue
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={meterForm.handleSubmit(onSubmitMeter)} className="grid gap-4" noValidate>
      <Header
        step={2}
        title="Add its first meter"
        description="One per tenant, flat or shop front. The WhatsApp number is optional — add it now or later."
      />

      <Field error={meterForm.formState.errors.name?.message}>
        <FieldLabel>Meter name</FieldLabel>
        <Input placeholder="e.g. Flat 2B" autoFocus {...meterForm.register("name")} />
      </Field>

      <Field
        error={meterForm.formState.errors.whatsappNumber?.message}
        hint="Used for the WhatsApp bill button."
      >
        <FieldLabel optional>Tenant&apos;s WhatsApp number</FieldLabel>
        <Input
          type="tel"
          inputMode="tel"
          placeholder="e.g. 98765 43210"
          {...meterForm.register("whatsappNumber")}
        />
      </Field>

      <ErrorLine message={rootError} />

      <div className="grid gap-2">
        <Button type="submit" size="lg" disabled={meterForm.formState.isSubmitting || complete.isPending}>
          {meterForm.formState.isSubmitting || complete.isPending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : null}
          Finish setup
        </Button>
        <Button type="button" variant="ghost" onClick={finish} disabled={complete.isPending}>
          Skip — add a meter later
        </Button>
      </div>
    </form>
  );
}

function Header({
  step,
  title,
  description,
}: {
  step: 1 | 2;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium">Step {step} of 2</p>
      <h1 className="mt-1 text-lg font-semibold">{title}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="bg-destructive-soft text-destructive rounded-lg px-3 py-2 text-sm">
      {message}
    </p>
  );
}
