"use client";

import { useState } from "react";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InputAffix } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditReadingDialog } from "@/components/readings/edit-reading-dialog";
import {
  errorMessage,
  useCreateReading,
  useDeleteReading,
  usePrecedingReading,
} from "@/hooks/use-metermate";
import { usePreferences } from "@/hooks/use-preferences";
import { useTranslation } from "@/lib/i18n";
import { buildBillMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import {
  currentMonthInputValue,
  formatCurrency,
  formatPeriod,
  formatReading,
  fromMonthInputValue,
} from "@/lib/format";
import type { MeterSummary, ReadingWithMeter } from "@/lib/types";

/**
 * One meter, one row: what it read last month, an input for this month, the
 * bill that follows, and — once saved — a WhatsApp button. Deliberately no
 * rate field here; the rate is applied silently from the meter's last bill
 * (or the device default), the same way `RecordReadingDialog` does it. Fewer
 * fields on the row someone fills in every single month.
 */
export function ReadingRow({ meter }: { meter: MeterSummary }) {
  const { t, language } = useTranslation();
  const { preferences } = usePreferences();
  const targetPeriod = fromMonthInputValue(currentMonthInputValue())!;

  const latest = meter.latestReading;
  const recorded =
    latest !== null &&
    latest.month === targetPeriod.month &&
    latest.year === targetPeriod.year;

  if (recorded) {
    return <RecordedRow meter={meter} reading={latest} language={language} t={t} />;
  }

  return (
    <PendingRow
      meter={meter}
      targetPeriod={targetPeriod}
      defaultRate={preferences.defaultRatePerUnit}
      t={t}
    />
  );
}

function RecordedRow({
  meter,
  reading,
  language,
  t,
}: {
  meter: MeterSummary;
  reading: NonNullable<MeterSummary["latestReading"]>;
  language: ReturnType<typeof useTranslation>["language"];
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteReading = useDeleteReading();

  const readingWithMeter: ReadingWithMeter = {
    ...reading,
    meter: { id: meter.id, name: meter.name, property: meter.property },
  };

  const whatsappLink = buildWhatsAppLink(
    meter.whatsappNumber,
    buildBillMessage(language, {
      meterName: meter.name,
      month: reading.month,
      year: reading.year,
      unitsConsumed: reading.unitsConsumed,
      billAmount: reading.billAmount,
    }),
  );

  async function confirmDelete() {
    setDeleteError(null);
    try {
      await deleteReading.mutateAsync({ id: reading.id, meterId: meter.id });
      setConfirmingDelete(false);
    } catch (error) {
      setDeleteError(errorMessage(error, "Couldn't delete that reading."));
    }
  }

  return (
    <li className="border-border bg-card flex flex-wrap items-center gap-3 rounded-lg border p-3 sm:flex-nowrap">
      <div className="min-w-0 flex-1 basis-full sm:basis-auto">
        <p className="truncate text-sm font-semibold">{meter.name}</p>
        <p className="text-muted-foreground truncate text-xs">{meter.property.name}</p>
      </div>

      <RowStat label={t("home.lastMonth")} value={formatReading(reading.previousReading)} />
      <RowStat label={formatPeriod(reading.month, reading.year)} value={formatReading(reading.currentReading)} emphasis />
      <RowStat label={t("home.amount")} value={formatCurrency(reading.billAmount)} emphasis />

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          className={whatsappLink ? "text-success hover:bg-success-soft hover:text-success" : ""}
          disabled={!whatsappLink}
          render={
            whatsappLink ? (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" />
            ) : undefined
          }
        >
          <MessageCircle aria-hidden />
          <span className="sr-only">{t("home.sendBill")}</span>
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
          <Pencil aria-hidden />
          <span className="sr-only">{t("common.edit")}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="hover:bg-destructive-soft hover:text-destructive"
          onClick={() => {
            setDeleteError(null);
            setConfirmingDelete(true);
          }}
        >
          <Trash2 aria-hidden />
          <span className="sr-only">{t("common.delete")}</span>
        </Button>
      </div>

      <EditReadingDialog
        reading={editing ? readingWithMeter : null}
        onOpenChange={(open) => !open && setEditing(false)}
      />

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        destructive
        title={`Delete this reading?`}
        description={`${meter.name} · ${formatPeriod(reading.month, reading.year)}, worth ${formatCurrency(reading.billAmount)}. This can't be undone.`}
        confirmLabel={t("common.delete")}
        pending={deleteReading.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
      />
    </li>
  );
}

function PendingRow({
  meter,
  targetPeriod,
  defaultRate,
  t,
}: {
  meter: MeterSummary;
  targetPeriod: { month: number; year: number };
  defaultRate: number;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const [value, setValue] = useState("");
  const [rowError, setRowError] = useState<string | null>(null);
  const createReading = useCreateReading();

  const { data: preceding } = usePrecedingReading(meter.id, targetPeriod);
  const isBaseline = preceding?.isBaseline ?? false;
  const previousReading = preceding?.previousReading ?? 0;
  const rate = preceding?.suggestedRate ?? defaultRate;

  const parsed = Number(value);
  const hasValue = value !== "" && Number.isFinite(parsed);
  const units = !hasValue ? null : isBaseline ? 0 : Math.max(0, parsed - previousReading);
  const amount = units === null ? null : units * rate;
  const belowPrevious = hasValue && !isBaseline && parsed < previousReading;

  async function save() {
    if (!hasValue || belowPrevious) return;
    setRowError(null);
    try {
      await createReading.mutateAsync({
        meterId: meter.id,
        month: targetPeriod.month,
        year: targetPeriod.year,
        currentReading: parsed,
        ratePerUnit: rate,
      });
      toast.success(`${meter.name} saved.`);
      setValue("");
    } catch (error) {
      setRowError(errorMessage(error, "Couldn't save that reading."));
    }
  }

  return (
    <li className="border-border bg-card flex flex-wrap items-center gap-3 rounded-lg border p-3 sm:flex-nowrap">
      <div className="min-w-0 flex-1 basis-full sm:basis-auto">
        <p className="truncate text-sm font-semibold">{meter.name}</p>
        <p className="text-muted-foreground truncate text-xs">{meter.property.name}</p>
      </div>

      <RowStat
        label={t("home.lastMonth")}
        value={isBaseline ? "—" : formatReading(previousReading)}
      />

      <div className="w-28 shrink-0">
        <InputAffix
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder={t("home.thisMonth")}
          aria-label={`${meter.name} — ${t("home.thisMonth")}`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
        />
      </div>

      <RowStat label={t("home.amount")} value={amount === null ? "—" : formatCurrency(amount)} emphasis />

      <Button
        size="sm"
        className="shrink-0"
        disabled={!hasValue || belowPrevious || createReading.isPending}
        onClick={save}
      >
        {t("common.save")}
      </Button>

      {belowPrevious ? (
        <p className="text-destructive basis-full text-xs font-medium">
          Must be {formatReading(previousReading)} or higher.
        </p>
      ) : rowError ? (
        <p className="text-destructive basis-full text-xs font-medium">{rowError}</p>
      ) : null}
    </li>
  );
}

function RowStat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="w-20 shrink-0 text-right sm:w-24">
      <p className="text-muted-foreground text-2xs">{label}</p>
      <p className={emphasis ? "text-sm font-semibold" : "text-sm"} data-numeric="">
        {value}
      </p>
    </div>
  );
}
