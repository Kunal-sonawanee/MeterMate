"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Gauge,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  EmptyState,
  ErrorState,
  LoadingRegion,
  Skeleton,
} from "@/components/ui/states";
import { MeterDialog } from "@/components/meters/meter-dialog";
import { RecordReadingDialog } from "@/components/readings/record-reading-dialog";
import { errorMessage, useDeleteMeter, useMeters } from "@/hooks/use-metermate";
import { formatCurrency, formatPeriod, formatUnits } from "@/lib/format";
import type { MeterSummary } from "@/lib/types";

/**
 * Meters, grouped under the property they belong to — which is how a landlord
 * thinks about them. Search is client-side because the list is small by
 * nature: a person only has so many meters.
 */
export function MetersScreen() {
  const { data: meters, isPending, isError, error, refetch } = useMeters();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MeterSummary | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MeterSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteMeter = useDeleteMeter();

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = (meters ?? []).filter((meter) => {
      if (!term) return true;
      return (
        meter.name.toLowerCase().includes(term) ||
        meter.property.name.toLowerCase().includes(term) ||
        (meter.whatsappNumber?.toLowerCase().includes(term) ?? false)
      );
    });

    const byProperty = new Map<string, MeterSummary[]>();
    for (const meter of filtered) {
      const existing = byProperty.get(meter.property.name);
      if (existing) existing.push(meter);
      else byProperty.set(meter.property.name, [meter]);
    }

    return [...byProperty.entries()];
  }, [meters, search]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleteError(null);

    try {
      await deleteMeter.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(errorMessage(error, "Couldn't delete that meter."));
    }
  }

  return (
    <>
      <PageHeader
        title="Meters"
        description="Each meter belongs to a property and keeps its own reading history."
        actions={
          <MeterDialog
            trigger={
              <Button>
                <Plus aria-hidden />
                Add meter
              </Button>
            }
          />
        }
      />

      {isPending ? (
        <LoadingRegion
          label="Loading meters"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <Card key={index}>
              <CardContent>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-2 h-3 w-24" />
                <Skeleton className="mt-4 h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </LoadingRegion>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : meters.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No meters yet"
          description="Add a meter for each tenant, flat or shop front you bill separately."
          action={
            <MeterDialog trigger={<Button>Add your first meter</Button>} />
          }
          className="bg-card"
        />
      ) : (
        <>
          {meters.length > 6 ? (
            <div className="relative mb-4 max-w-sm">
              <Search
                aria-hidden
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search meters, properties or WhatsApp numbers"
                aria-label="Search meters"
                className="pl-9"
              />
            </div>
          ) : null}

          {groups.length === 0 ? (
            <EmptyState
              icon={Search}
              title={`Nothing matches “${search}”`}
              description="Try a meter name, a property or part of a serial number."
              action={
                <Button variant="outline" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              }
              className="bg-card"
            />
          ) : (
            <div className="grid gap-6">
              {groups.map(([propertyName, propertyMeters]) => (
                <section key={propertyName}>
                  <h2 className="text-muted-foreground mb-2.5 text-xs font-semibold tracking-wide uppercase">
                    {propertyName}
                    <span className="ml-2 font-normal normal-case">
                      {propertyMeters.length} meter
                      {propertyMeters.length === 1 ? "" : "s"}
                    </span>
                  </h2>

                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {propertyMeters.map((meter) => (
                      <li key={meter.id}>
                        <MeterCard
                          meter={meter}
                          onEdit={() => setEditing(meter)}
                          onDelete={() => {
                            setDeleteError(null);
                            setPendingDelete(meter);
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <MeterDialog
        meter={editing ?? undefined}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        destructive
        title={`Delete ${pendingDelete?.name ?? "this meter"}?`}
        description={
          pendingDelete ? (
            <>
              {pendingDelete.readingCount > 0 ? (
                <>
                  This will also delete{" "}
                  <strong className="text-foreground font-medium">
                    {pendingDelete.readingCount} reading
                    {pendingDelete.readingCount === 1 ? "" : "s"}
                  </strong>{" "}
                  recorded against it.{" "}
                </>
              ) : null}
              This can&apos;t be undone.
            </>
          ) : null
        }
        confirmLabel="Delete meter"
        pending={deleteMeter.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function MeterCard({
  meter,
  onEdit,
  onDelete,
}: {
  meter: MeterSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const latest = meter.latestReading;

  return (
    <Card interactive className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/meters/${meter.id}`}
              className="hover:text-primary focus-visible:outline-ring block truncate rounded text-[0.9375rem] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {meter.name}
            </Link>
            {/*
              This line is always reserved, so cards sitting side by side line
              up whether or not a meter has a WhatsApp number recorded.
            */}
            <p className="text-muted-foreground mt-0.5 min-h-4 truncate font-mono text-xs">
              {meter.whatsappNumber}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <Button variant="ghost" size="icon-sm" onClick={onEdit}>
              <Pencil aria-hidden />
              <span className="sr-only">Edit {meter.name}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="hover:bg-destructive-soft hover:text-destructive focus-visible:text-destructive focus-visible:outline-destructive"
              onClick={onDelete}
            >
              <Trash2 aria-hidden />
              <span className="sr-only">Delete {meter.name}</span>
            </Button>
          </div>
        </div>

        <div className="bg-muted/60 mt-3 rounded-lg px-3 py-3">
          {latest ? (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-2xs font-medium">
                    Current reading
                  </p>
                  <p className="mt-0.5 text-xl font-semibold" data-numeric="">
                    {formatUnits(latest.currentReading)}
                  </p>
                </div>
                <Badge tone="neutral">
                  {formatPeriod(latest.month, latest.year)}
                </Badge>
              </div>

              <div className="border-border/70 mt-2.5 flex items-center justify-between border-t pt-2.5 text-xs">
                <span className="text-muted-foreground">
                  {formatUnits(latest.unitsConsumed)} units
                </span>
                <span className="font-semibold" data-numeric="">
                  {formatCurrency(latest.billAmount)}
                </span>
              </div>
            </>
          ) : (
            <div className="py-1 text-center">
              <p className="text-muted-foreground text-sm">No readings yet</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 pt-1">
          <RecordReadingDialog
            defaultMeterId={meter.id}
            trigger={
              <Button variant="outline" size="sm" className="flex-1">
                Record reading
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/meters/${meter.id}`} />}
          >
            History
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
