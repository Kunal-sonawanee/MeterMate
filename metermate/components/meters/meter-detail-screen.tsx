"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, IndianRupee, Pencil, Trash2, Zap } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Stat, StatSkeleton } from "@/components/ui/stat";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  EmptyState,
  ErrorState,
  LoadingRegion,
  Skeleton,
} from "@/components/ui/states";
import { MeterDialog } from "@/components/meters/meter-dialog";
import { RecordReadingDialog } from "@/components/readings/record-reading-dialog";
import {
  ReadingsTable,
  ReadingsTableSkeleton,
} from "@/components/readings/readings-table";
import { ApiRequestError } from "@/lib/api";
import { errorMessage, useDeleteMeter, useMeter } from "@/hooks/use-metermate";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPeriodLong,
  formatUnits,
  percentageChange,
} from "@/lib/format";
import type { MeterDetail, ReadingWithMeter } from "@/lib/types";

/**
 * One meter, end to end: where it stands now and every reading recorded
 * against it.
 */
export function MeterDetailScreen({ meterId }: { meterId: string }) {
  const router = useRouter();
  const { data: meter, isPending, isError, error, refetch } = useMeter(meterId);

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteMeter = useDeleteMeter();

  async function confirmDelete() {
    setDeleteError(null);
    try {
      await deleteMeter.mutateAsync(meterId);
      setConfirmingDelete(false);
      router.push("/meters");
    } catch (caught) {
      setDeleteError(errorMessage(caught, "Couldn't delete that meter."));
    }
  }

  if (isPending) return <MeterDetailSkeleton />;

  if (isError) {
    const missing = error instanceof ApiRequestError && error.status === 404;

    return (
      <>
        <BackLink />
        <PageHeader title={missing ? "Meter not found" : "Meter"} />
        {missing ? (
          <EmptyState
            icon={Zap}
            title="This meter no longer exists"
            description="It may have been deleted from another device."
            action={
              <Button render={<Link href="/meters" />}>Back to meters</Button>
            }
            className="bg-card"
          />
        ) : (
          <ErrorState error={error} onRetry={() => refetch()} />
        )}
      </>
    );
  }

  return (
    <>
      <BackLink />

      <PageHeader
        title={meter.name}
        description={
          meter.whatsappNumber
            ? `${meter.property.name} · WhatsApp ${meter.whatsappNumber}`
            : meter.property.name
        }
        actions={
          <>
            <RecordReadingDialog
              defaultMeterId={meter.id}
              trigger={
                <Button className="hidden sm:inline-flex">
                  Record reading
                </Button>
              }
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEditing(true)}
            >
              <Pencil aria-hidden />
              <span className="sr-only">Edit {meter.name}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:bg-destructive-soft hover:text-destructive"
              onClick={() => {
                setDeleteError(null);
                setConfirmingDelete(true);
              }}
            >
              <Trash2 aria-hidden />
              <span className="sr-only">Delete {meter.name}</span>
            </Button>
          </>
        }
      />

      <MeterBody meter={meter} />

      <MeterDialog meter={meter} open={editing} onOpenChange={setEditing} />

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        destructive
        title={`Delete ${meter.name}?`}
        description={
          <>
            {meter.readingCount > 0 ? (
              <>
                This will also delete{" "}
                <strong className="text-foreground font-medium">
                  {meter.readingCount} reading
                  {meter.readingCount === 1 ? "" : "s"}
                </strong>{" "}
                recorded against it.{" "}
              </>
            ) : null}
            This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete meter"
        pending={deleteMeter.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function MeterBody({ meter }: { meter: MeterDetail }) {
  const latest = meter.readings[0] ?? null;
  const previous = meter.readings[1] ?? null;

  const totals = useMemo(
    () =>
      meter.readings.reduce(
        (accumulator, reading) => ({
          units: accumulator.units + reading.unitsConsumed,
          bill: accumulator.bill + reading.billAmount,
        }),
        { units: 0, bill: 0 },
      ),
    [meter.readings],
  );

  // The table is shared with the readings screen, which expects the meter
  // relation on each row.
  const rows: ReadingWithMeter[] = useMemo(
    () =>
      meter.readings.map((reading) => ({
        ...reading,
        meter: { id: meter.id, name: meter.name, property: meter.property },
      })),
    [meter],
  );

  if (meter.readings.length === 0) {
    return (
      <EmptyState
        icon={Zap}
        title="No readings for this meter yet"
        description="Record the first one and this page will show usage and bills."
        action={<RecordReadingDialog defaultMeterId={meter.id} />}
        className="bg-card"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:gap-5">
      <section
        aria-label="Meter summary"
        className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
      >
        <Stat
          label="Current reading"
          value={latest ? formatUnits(latest.currentReading) : "—"}
          icon={Zap}
          hint={
            latest
              ? `As of ${formatPeriodLong(latest.month, latest.year)}.`
              : undefined
          }
        />
        <Stat
          label="Units last cycle"
          value={latest ? formatUnits(latest.unitsConsumed) : "—"}
          icon={Zap}
          change={
            latest && previous
              ? percentageChange(latest.unitsConsumed, previous.unitsConsumed)
              : null
          }
          changeLabel="vs previous"
        />
        <Stat
          label="Bill last cycle"
          value={latest ? formatCurrency(latest.billAmount) : "—"}
          icon={IndianRupee}
          hint={
            latest ? `at ${formatCurrency(latest.ratePerUnit)}/unit` : undefined
          }
        />
        <Stat
          label="Billed all time"
          value={formatCurrencyCompact(totals.bill)}
          icon={IndianRupee}
          hint={`${formatUnits(totals.units)} units across ${meter.readingCount} reading${meter.readingCount === 1 ? "" : "s"}.`}
        />
      </section>

      <section aria-labelledby="meter-history">
        <h2 id="meter-history" className="mb-3 text-sm font-semibold">
          Reading history
        </h2>
        <ReadingsTable readings={rows} showMeter={false} />
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/meters"
      className="text-muted-foreground hover:text-foreground focus-visible:outline-ring mb-3 inline-flex items-center gap-1 rounded text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <ChevronLeft className="size-4" aria-hidden />
      All meters
    </Link>
  );
}

function MeterDetailSkeleton() {
  return (
    <LoadingRegion label="Loading meter">
      <BackLink />
      <div className="mb-5 sm:mb-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:gap-5">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
        <ReadingsTableSkeleton />
      </div>
    </LoadingRegion>
  );
}
