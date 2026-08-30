"use client";

import { useMemo, useState } from "react";
import { ListOrdered, Plus, X } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, Select, Input } from "@/components/ui/field";
import { EmptyState, ErrorState, LoadingRegion } from "@/components/ui/states";
import { RecordReadingDialog } from "@/components/readings/record-reading-dialog";
import {
  ReadingsTable,
  ReadingsTableSkeleton,
} from "@/components/readings/readings-table";
import { useMeters, useProperties, useReadings } from "@/hooks/use-metermate";
import { formatCurrency, formatUnits, fromMonthInputValue } from "@/lib/format";

const PAGE_SIZE = 25;

/**
 * The full history, with the filters a landlord actually reaches for: which
 * property, which meter, which month. Filtering runs server-side, so the page
 * stays fast once there are years of readings.
 */
export function ReadingsScreen() {
  const [propertyId, setPropertyId] = useState("");
  const [meterId, setMeterId] = useState("");
  const [monthValue, setMonthValue] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const period = useMemo(() => fromMonthInputValue(monthValue), [monthValue]);

  const { data: properties } = useProperties();
  const { data: meters } = useMeters();

  // Selecting a property narrows the meter list to that property's meters.
  const availableMeters = useMemo(
    () =>
      (meters ?? []).filter(
        (meter) => !propertyId || meter.property.id === propertyId,
      ),
    [meters, propertyId],
  );

  const query = {
    propertyId: propertyId || undefined,
    meterId: meterId || undefined,
    month: period?.month,
    year: period?.year,
    limit,
  };

  const { data, isPending, isError, error, refetch, isPlaceholderData } =
    useReadings(query);

  const hasFilters = Boolean(propertyId || meterId || monthValue);

  const totals = useMemo(() => {
    const readings = data?.readings ?? [];
    return {
      units: readings.reduce((sum, reading) => sum + reading.unitsConsumed, 0),
      bill: readings.reduce((sum, reading) => sum + reading.billAmount, 0),
    };
  }, [data?.readings]);

  function clearFilters() {
    setPropertyId("");
    setMeterId("");
    setMonthValue("");
    setLimit(PAGE_SIZE);
  }

  return (
    <>
      <PageHeader
        title="Readings"
        description="Every reading you've recorded, newest first."
        actions={
          <RecordReadingDialog
            trigger={
              <Button className="hidden md:inline-flex">
                <Plus aria-hidden />
                Record reading
              </Button>
            }
          />
        }
      />

      <Card className="mb-4 sm:mb-5">
        <CardContent className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <Field>
            <FieldLabel>Property</FieldLabel>
            <Select
              value={propertyId}
              onChange={(event) => {
                setPropertyId(event.target.value);
                setMeterId("");
                setLimit(PAGE_SIZE);
              }}
            >
              <option value="">All properties</option>
              {properties?.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <FieldLabel>Meter</FieldLabel>
            <Select
              value={meterId}
              onChange={(event) => {
                setMeterId(event.target.value);
                setLimit(PAGE_SIZE);
              }}
            >
              <option value="">All meters</option>
              {availableMeters.map((meter) => (
                <option key={meter.id} value={meter.id}>
                  {meter.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <FieldLabel>Billing month</FieldLabel>
            <Input
              type="month"
              value={monthValue}
              onChange={(event) => {
                setMonthValue(event.target.value);
                setLimit(PAGE_SIZE);
              }}
            />
          </Field>
        </CardContent>

        {hasFilters ? (
          <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-5">
            <p className="text-muted-foreground text-sm">
              {data ? (
                <>
                  <span className="text-foreground font-medium">
                    {data.total}
                  </span>{" "}
                  {data.total === 1 ? "reading" : "readings"} matched
                  {data.readings.length > 0 ? (
                    <>
                      {" "}
                      · {formatUnits(totals.units)} units ·{" "}
                      <span className="text-foreground font-medium">
                        {formatCurrency(totals.bill)}
                      </span>
                    </>
                  ) : null}
                </>
              ) : (
                "Filtering…"
              )}
            </p>

            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X aria-hidden />
              Clear filters
            </Button>
          </div>
        ) : null}
      </Card>

      {isPending ? (
        <LoadingRegion label="Loading readings">
          <ReadingsTableSkeleton />
        </LoadingRegion>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data.readings.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={ListOrdered}
            title="No readings match those filters"
            description="Try a different meter or month, or clear the filters to see everything."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
            className="bg-card"
          />
        ) : (
          <EmptyState
            icon={ListOrdered}
            title="No readings yet"
            description="Record your first reading and it'll show up here with units and the bill worked out."
            action={<RecordReadingDialog />}
            className="bg-card"
          />
        )
      ) : (
        <>
          <ReadingsTable readings={data.readings} />

          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-muted-foreground text-xs">
              Showing {data.readings.length} of {data.total}
            </p>
            {data.hasMore ? (
              <Button
                variant="outline"
                disabled={isPlaceholderData}
                onClick={() => setLimit((current) => current + PAGE_SIZE)}
              >
                Load more
              </Button>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}
