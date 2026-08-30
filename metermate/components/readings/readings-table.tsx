"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditReadingDialog } from "@/components/readings/edit-reading-dialog";
import { Skeleton } from "@/components/ui/states";
import {
  formatCurrency,
  formatPeriod,
  formatPeriodLong,
  formatUnits,
} from "@/lib/format";
import { errorMessage, useDeleteReading } from "@/hooks/use-metermate";
import { cn } from "@/lib/utils";
import type { ReadingWithMeter } from "@/lib/types";

/**
 * Reading history.
 *
 * A real table on wide screens, where comparing previous/current/units down a
 * column is the point, and a stacked card list on phones — the same data, not
 * a squeezed table with six columns off the right edge.
 */
export function ReadingsTable({
  readings,
  showMeter = true,
  className,
}: {
  readings: ReadingWithMeter[];
  showMeter?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState<ReadingWithMeter | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ReadingWithMeter | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteReading = useDeleteReading();

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleteError(null);

    try {
      await deleteReading.mutateAsync({
        id: pendingDelete.id,
        meterId: pendingDelete.meter.id,
      });
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(errorMessage(error, "Couldn't delete that reading."));
    }
  }

  return (
    <div className={className}>
      {/* Wide screens */}
      <div className="border-border bg-card hidden rounded-xl border shadow-xs md:block">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <caption className="sr-only">
              Recorded meter readings, most recent first
            </caption>
            <thead>
              <tr className="border-border border-b">
                {showMeter ? <Th className="text-left">Meter</Th> : null}
                <Th className="text-left">Period</Th>
                <Th className="text-right">Previous</Th>
                <Th className="text-right">Current</Th>
                <Th className="text-right">Units</Th>
                <Th className="text-right">Rate</Th>
                <Th className="text-right">Bill</Th>
                <Th className="w-20 text-right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {readings.map((reading) => (
                <tr
                  key={reading.id}
                  className="border-border/70 hover:bg-muted/50 border-b transition-colors last:border-0"
                >
                  {showMeter ? (
                    <Td>
                      <Link
                        href={`/meters/${reading.meter.id}`}
                        className="hover:text-primary focus-visible:outline-ring rounded font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        {reading.meter.name}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {reading.meter.property.name}
                      </p>
                    </Td>
                  ) : null}
                  <Td className="text-muted-foreground whitespace-nowrap">
                    {formatPeriod(reading.month, reading.year)}
                  </Td>
                  <Td className="text-muted-foreground text-right">
                    {formatUnits(reading.previousReading)}
                  </Td>
                  <Td className="text-right">
                    {formatUnits(reading.currentReading)}
                  </Td>
                  <Td className="text-right font-medium">
                    {formatUnits(reading.unitsConsumed)}
                  </Td>
                  <Td className="text-muted-foreground text-right">
                    {formatCurrency(reading.ratePerUnit)}
                  </Td>
                  <Td className="text-right font-semibold">
                    {formatCurrency(reading.billAmount)}
                  </Td>
                  <Td className="text-right">
                    <RowActions
                      reading={reading}
                      onEdit={() => setEditing(reading)}
                      onDelete={() => {
                        setDeleteError(null);
                        setPendingDelete(reading);
                      }}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phones */}
      <ul className="grid gap-3 md:hidden">
        {readings.map((reading) => (
          <li
            key={reading.id}
            className="border-border bg-card rounded-xl border p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {showMeter ? (
                  <>
                    <Link
                      href={`/meters/${reading.meter.id}`}
                      className="block truncate text-sm font-semibold"
                    >
                      {reading.meter.name}
                    </Link>
                    <p className="text-muted-foreground truncate text-xs">
                      {reading.meter.property.name}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-semibold">
                    {formatPeriodLong(reading.month, reading.year)}
                  </p>
                )}
              </div>

              <RowActions
                reading={reading}
                onEdit={() => setEditing(reading)}
                onDelete={() => {
                  setDeleteError(null);
                  setPendingDelete(reading);
                }}
              />
            </div>

            {showMeter ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {formatPeriodLong(reading.month, reading.year)}
              </p>
            ) : null}

            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <MobileStat
                label="Previous"
                value={formatUnits(reading.previousReading)}
              />
              <MobileStat
                label="Current"
                value={formatUnits(reading.currentReading)}
              />
              <MobileStat
                label="Units"
                value={formatUnits(reading.unitsConsumed)}
                emphasis
              />
            </dl>

            <div className="border-border mt-3 flex items-center justify-between border-t pt-3">
              <span className="text-muted-foreground text-xs">
                at {formatCurrency(reading.ratePerUnit)}/unit
              </span>
              <span className="text-base font-semibold" data-numeric="">
                {formatCurrency(reading.billAmount)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <EditReadingDialog
        reading={editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        destructive
        title="Delete this reading?"
        description={
          pendingDelete ? (
            <>
              {pendingDelete.meter.name} ·{" "}
              {formatPeriodLong(pendingDelete.month, pendingDelete.year)}, worth{" "}
              {formatCurrency(pendingDelete.billAmount)}. Later months on this
              meter will be recalculated. This can&apos;t be undone.
            </>
          ) : null
        }
        confirmLabel="Delete reading"
        pending={deleteReading.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function RowActions({
  reading,
  onEdit,
  onDelete,
}: {
  reading: ReadingWithMeter;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const label = `${reading.meter.name}, ${formatPeriodLong(reading.month, reading.year)}`;

  // Row actions stay quiet: a column of red trash icons down a long table reads
  // as a warning rather than a control. Colour arrives on hover and focus.
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon-sm" onClick={onEdit}>
        <Pencil aria-hidden />
        <span className="sr-only">Edit reading for {label}</span>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="hover:bg-destructive-soft hover:text-destructive focus-visible:text-destructive focus-visible:outline-destructive"
        onClick={onDelete}
      >
        <Trash2 aria-hidden />
        <span className="sr-only">Delete reading for {label}</span>
      </Button>
    </div>
  );
}

function MobileStat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="bg-muted/60 rounded-lg px-2 py-2">
      <dt className="text-muted-foreground text-2xs font-medium">{label}</dt>
      <dd
        data-numeric=""
        className={cn(
          "mt-0.5 text-sm",
          emphasis ? "font-semibold" : "font-medium",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Th({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "text-muted-foreground px-3 py-2.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

function Td({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-3 py-3.5 align-top", className)} {...props} />;
}

export function ReadingsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="border-border bg-card flex items-center gap-4 rounded-xl border p-4 md:rounded-lg md:py-3"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
