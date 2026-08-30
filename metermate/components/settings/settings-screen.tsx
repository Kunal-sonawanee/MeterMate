"use client";

import { useState } from "react";
import { Check, Info } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel, InputAffix } from "@/components/ui/field";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Skeleton } from "@/components/ui/states";
import { usePreferences } from "@/hooks/use-preferences";
import { useDashboard } from "@/hooks/use-metermate";
import { MAX_RATE } from "@/lib/validation";
import { formatUnits } from "@/lib/format";

/**
 * Settings holds only what the product genuinely has: a default tariff and the
 * theme. Both are per-device, and the page says so rather than implying an
 * account-wide setting that doesn't exist.
 */
export function SettingsScreen() {
  const { preferences, update } = usePreferences();
  const { data: dashboard } = useDashboard();

  // The input shows the saved rate until the user types; `draft` holds their
  // in-progress edit, so no effect is needed to keep the two in step.
  const [draft, setDraft] = useState<string | null>(null);
  const rate = draft ?? String(preferences.defaultRatePerUnit);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save(event: React.FormEvent) {
    event.preventDefault();
    const parsed = Number(rate);

    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a rate of 0 or more.");
      return;
    }
    if (parsed > MAX_RATE) {
      setError("That rate looks too large — please check it.");
      return;
    }

    setError(null);
    update({ defaultRatePerUnit: parsed });
    setDraft(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Defaults for this device. Your readings and meters are stored on the server."
      />

      <div className="grid max-w-2xl gap-4 sm:gap-5">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Default rate per unit</CardTitle>
              <CardDescription>
                Used when a meter has no rate history. Once a meter has been
                billed, its own last rate is suggested instead.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <form
              onSubmit={save}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <Field
                error={error ?? undefined}
                className="sm:max-w-48 sm:flex-1"
              >
                <FieldLabel>Rate</FieldLabel>
                <InputAffix
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  prefix="₹"
                  suffix="/unit"
                  value={rate}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setSaved(false);
                  }}
                />
              </Field>

              <div className="flex items-center gap-3">
                <Button type="submit" size="lg" className="sm:h-9">
                  Save
                </Button>
                {saved ? (
                  <span
                    role="status"
                    className="text-success inline-flex items-center gap-1 text-sm font-medium"
                  >
                    <Check aria-hidden className="size-4" />
                    Saved
                  </span>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Follow your system setting, or pick light or dark for this
                device.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Your data</CardTitle>
              <CardDescription>
                What MeterMate is currently tracking.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <dl className="divide-border divide-y">
              <DataRow
                label="Properties"
                value={dashboard?.counts.properties}
              />
              <DataRow label="Meters" value={dashboard?.counts.meters} />
              <DataRow
                label="Units this cycle"
                value={
                  dashboard
                    ? formatUnits(dashboard.totals.unitsConsumed)
                    : undefined
                }
              />
            </dl>

            <p className="text-muted-foreground mt-4 flex gap-2 text-xs">
              <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Properties, meters and readings are stored in your database. The
                rate default and theme above are saved in this browser only.
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm font-medium" data-numeric="">
        {value === undefined ? <Skeleton className="h-4 w-10" /> : value}
      </dd>
    </div>
  );
}
