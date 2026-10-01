"use client";

import { useMemo } from "react";
import { Gauge, Zap } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, LoadingRegion, Skeleton } from "@/components/ui/states";
import { ReadingRow } from "@/components/home/reading-row";
import { HistorySheet } from "@/components/home/history-sheet";
import { useMainBill, useMeters } from "@/hooks/use-metermate";
import { useTranslation } from "@/lib/i18n";
import {
  currentMonthInputValue,
  formatCurrencyCompact,
  formatPeriodLong,
  fromMonthInputValue,
} from "@/lib/format";

/**
 * Home is the whole product for most visits: where this month's billing
 * cycle stands, and a row per meter to record it. History used to be a
 * separate page that did the same job as this one's "already recorded"
 * rows — it's a button here now instead of a second destination.
 */
export function HomeScreen() {
  const { t } = useTranslation();
  const targetPeriod = useMemo(() => fromMonthInputValue(currentMonthInputValue())!, []);

  const { data: meters, isPending, isError, refetch } = useMeters();

  if (isPending) return <HomeSkeleton />;

  if (isError) {
    return (
      <>
        <PageHeader title={t("home.title")} />
        <EmptyState
          icon={Zap}
          title="Couldn't load this"
          description="Something went wrong while loading your meters."
          action={<Button onClick={() => refetch()}>{t("common.retry")}</Button>}
          className="bg-card"
        />
      </>
    );
  }

  if (meters.length === 0) {
    return (
      <>
        <PageHeader title={t("home.welcomeTitle")} description={t("home.welcomeDescription")} />
        <EmptyState
          icon={Gauge}
          title={t("home.noMetersTitle")}
          description={t("home.noMetersDescription")}
          className="bg-card"
        />
      </>
    );
  }

  const recordedCount = meters.filter(
    (meter) =>
      meter.latestReading?.month === targetPeriod.month &&
      meter.latestReading?.year === targetPeriod.year,
  ).length;

  return (
    <>
      <PageHeader
        title={t("home.title")}
        description={t("home.subtitle", { period: formatPeriodLong(targetPeriod.month, targetPeriod.year) })}
      />

      <div className="grid gap-4 sm:gap-5">
        <MainBillSummary targetPeriod={targetPeriod} meters={meters} />

        <Card>
          <CardHeader>
            <CardTitle>
              {recordedCount === meters.length ? t("home.allRecordedTitle") : t("home.recordTitle")}
            </CardTitle>
            <CardDescription>
              {t("home.recordedCount", {
                recorded: recordedCount,
                total: meters.length,
                period: formatPeriodLong(targetPeriod.month, targetPeriod.year),
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="grid gap-2">
              {meters.map((meter) => (
                <ReadingRow key={meter.id} meter={meter} />
              ))}
            </ul>
          </CardContent>
        </Card>

        <HistorySheet />
      </div>
    </>
  );
}

/**
 * The main bill is read-only here on purpose — Home is for the monthly
 * ritual of recording readings, not for editing a number you set once a
 * month. It's edited from Settings instead, so there's exactly one place a
 * wrong tap can change it.
 */
function MainBillSummary({
  targetPeriod,
  meters,
}: {
  targetPeriod: { month: number; year: number };
  meters: NonNullable<ReturnType<typeof useMeters>["data"]>;
}) {
  const { t } = useTranslation();
  const { data: mainBill } = useMainBill(targetPeriod);
  const savedAmount = mainBill?.amount ?? null;

  const meterAmountsTotal = meters.reduce((sum, meter) => {
    const reading = meter.latestReading;
    const recorded =
      reading && reading.month === targetPeriod.month && reading.year === targetPeriod.year;
    return recorded ? sum + reading.billAmount : sum;
  }, 0);

  const ownerAmount = savedAmount !== null ? savedAmount - meterAmountsTotal : null;

  return (
    <Card>
      <CardContent className="grid gap-4 pt-4 sm:grid-cols-3 sm:pt-5">
        <div>
          <p className="text-muted-foreground text-xs">{t("home.mainBillLabel")}</p>
          <p className="mt-1 text-lg font-semibold" data-numeric="">
            {savedAmount === null ? t("home.mainBillNotAdded") : formatCurrencyCompact(savedAmount)}
          </p>
        </div>

        <div className="border-border/70 border-t pt-3 sm:border-t-0 sm:pt-0">
          <p className="text-muted-foreground text-xs">{t("home.meterAmountsLabel")}</p>
          <p className="mt-1 text-lg font-semibold" data-numeric="">
            {formatCurrencyCompact(meterAmountsTotal)}
          </p>
        </div>

        <div className="border-border/70 border-t pt-3 sm:border-t-0 sm:pt-0">
          <p className="text-muted-foreground text-xs">{t("home.ownerAmountLabel")}</p>
          <p className="mt-1 text-lg font-semibold" data-numeric="">
            {ownerAmount === null ? t("home.ownerAmountAdd") : formatCurrencyCompact(ownerAmount)}
          </p>
          {ownerAmount !== null ? (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {ownerAmount < 0 ? t("home.ownerAmountOver") : t("home.ownerAmountRemaining")}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function HomeSkeleton() {
  return (
    <LoadingRegion label="Loading your home screen">
      <PageHeader title="Home" />
      <div className="grid gap-4 sm:gap-5">
        <Card>
          <CardContent className="grid gap-3 pt-4 sm:grid-cols-3 sm:pt-5">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid gap-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </LoadingRegion>
  );
}
