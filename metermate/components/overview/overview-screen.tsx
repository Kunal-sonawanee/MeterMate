"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CircleCheck,
  Gauge,
  IndianRupee,
  Plus,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stat, StatSkeleton } from "@/components/ui/stat";
import { Segmented } from "@/components/ui/segmented";
import {
  EmptyState,
  ErrorState,
  LoadingRegion,
  Skeleton,
} from "@/components/ui/states";
import { ConsumptionChart } from "@/components/charts/consumption-chart";
import { RecordReadingDialog } from "@/components/readings/record-reading-dialog";
import { useDashboard } from "@/hooks/use-metermate";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPeriod,
  formatPeriodLong,
  formatUnits,
  percentageChange,
} from "@/lib/format";
import type { DashboardResponse } from "@/lib/types";

/**
 * The overview answers one question: where am I in this billing cycle?
 *
 * Everything is scoped to the most recent period that has readings, the meters
 * still missing one are listed by name with a way to record them on the spot,
 * and the trend gives a year of context underneath.
 */
export function OverviewScreen() {
  const { data, isPending, isError, error, refetch } = useDashboard();

  if (isPending) return <OverviewSkeleton />;

  if (isError) {
    return (
      <>
        <PageHeader title="Overview" />
        <ErrorState error={error} onRetry={() => refetch()} />
      </>
    );
  }

  if (data.counts.meters === 0) {
    return <GettingStarted hasProperties={data.counts.properties > 0} />;
  }

  return <Overview data={data} />;
}

function Overview({ data }: { data: DashboardResponse }) {
  const [measure, setMeasure] = useState<"units" | "bill">("units");

  const {
    period,
    totals,
    previousTotals,
    counts,
    pendingMeters,
    trend,
    recentReadings,
  } = data;

  const billChange = previousTotals
    ? percentageChange(totals.billAmount, previousTotals.billAmount)
    : null;
  const unitsChange = previousTotals
    ? percentageChange(totals.unitsConsumed, previousTotals.unitsConsumed)
    : null;

  const averageRate =
    totals.unitsConsumed > 0 ? totals.billAmount / totals.unitsConsumed : null;
  const allRead = pendingMeters.length === 0;

  return (
    <>
      <PageHeader
        title="Overview"
        description={
          period
            ? `${formatPeriodLong(period.month, period.year)} — the latest cycle with readings.`
            : "No readings recorded yet."
        }
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

      {period === null ? (
        <EmptyState
          icon={Zap}
          title="No readings yet"
          description="You have meters set up. Record the first reading and this page will fill in."
          action={<RecordReadingDialog />}
          className="bg-card"
        />
      ) : (
        <div className="grid gap-4 sm:gap-5">
          <section
            aria-label="This cycle"
            className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
          >
            <Stat
              label="Billed this cycle"
              value={formatCurrencyCompact(totals.billAmount)}
              icon={IndianRupee}
              change={billChange}
              changeLabel="vs last cycle"
              hint={`Across ${totals.readingsRecorded} reading${totals.readingsRecorded === 1 ? "" : "s"}.`}
            />
            <Stat
              label="Units consumed"
              value={formatUnits(totals.unitsConsumed)}
              icon={Zap}
              change={unitsChange}
              changeLabel="vs last cycle"
              hint="Total across all meters."
            />
            <Stat
              label="Meters read"
              value={`${counts.metersRead} of ${counts.meters}`}
              icon={Gauge}
              hint={
                allRead
                  ? "Every meter is up to date."
                  : `${pendingMeters.length} still to record.`
              }
            />
            <Stat
              label="Average cost per unit"
              value={averageRate === null ? "—" : formatCurrency(averageRate)}
              icon={IndianRupee}
              hint="Weighted across this cycle's readings."
            />
          </section>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Consumption over time</CardTitle>
                  <CardDescription>
                    {trend.length > 1
                      ? `Last ${trend.length} billing periods, all meters combined.`
                      : "One period so far — this fills out as you record more."}
                  </CardDescription>
                </div>
                <CardActions>
                  <Segmented
                    label="Chart measure"
                    value={measure}
                    onChange={setMeasure}
                    options={[
                      { value: "units", label: "Units" },
                      { value: "bill", label: "Amount" },
                    ]}
                  />
                </CardActions>
              </CardHeader>
              <CardContent className="pt-0">
                <ConsumptionChart
                  data={trend}
                  measure={measure}
                  caption={
                    measure === "units"
                      ? "Units consumed per billing period, all meters combined"
                      : "Amount billed per billing period, all meters combined"
                  }
                />
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <div>
                  <CardTitle>
                    {allRead ? "This cycle is complete" : "Still to record"}
                  </CardTitle>
                  <CardDescription>
                    {period
                      ? allRead
                        ? `Every meter has a reading for ${formatPeriod(period.month, period.year)}.`
                        : `Meters without a reading for ${formatPeriod(period.month, period.year)}.`
                      : null}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
                {allRead ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                    <div
                      aria-hidden
                      className="bg-success-soft text-success mb-3 flex size-10 items-center justify-center rounded-full"
                    >
                      <CircleCheck className="size-5" />
                    </div>
                    <p className="text-sm font-medium">All caught up</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Nothing is waiting on you.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-border -mx-1 divide-y">
                    {pendingMeters.slice(0, 6).map((meter) => (
                      <li
                        key={meter.id}
                        className="flex items-center justify-between gap-3 px-1 py-2.5"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/meters/${meter.id}`}
                            className="hover:text-primary focus-visible:outline-ring block truncate rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                          >
                            {meter.name}
                          </Link>
                          <p className="text-muted-foreground truncate text-xs">
                            {meter.propertyName}
                            {meter.lastPeriod
                              ? ` · last read ${formatPeriod(meter.lastPeriod.month, meter.lastPeriod.year)}`
                              : " · never read"}
                          </p>
                        </div>

                        <RecordReadingDialog
                          defaultMeterId={meter.id}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                            >
                              Record
                            </Button>
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {pendingMeters.length > 6 ? (
                  <p className="text-muted-foreground mt-3 text-xs">
                    and {pendingMeters.length - 6} more.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Latest readings</CardTitle>
                <CardDescription>
                  The most recent entries across every meter.
                </CardDescription>
              </div>
              <CardActions>
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/readings" />}
                >
                  View all
                  <ArrowRight aria-hidden />
                </Button>
              </CardActions>
            </CardHeader>
            <CardContent className="pt-0">
              {recentReadings.length === 0 ? (
                <EmptyState compact title="No readings yet" />
              ) : (
                <ul className="divide-border divide-y">
                  {recentReadings.map((reading) => (
                    <li
                      key={reading.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/meters/${reading.meter.id}`}
                          className="hover:text-primary focus-visible:outline-ring block truncate rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                          {reading.meter.name}
                        </Link>
                        <p className="text-muted-foreground truncate text-xs">
                          {reading.meter.property.name} ·{" "}
                          {formatPeriod(reading.month, reading.year)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <Badge tone="neutral">
                          {formatUnits(reading.unitsConsumed)} units
                        </Badge>
                        <span className="text-sm font-semibold" data-numeric="">
                          {formatCurrency(reading.billAmount)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

/** First run. Three steps, in the order they have to happen. */
function GettingStarted({ hasProperties }: { hasProperties: boolean }) {
  const steps = [
    {
      title: "Add a property",
      description: "A building or unit you bill for.",
      href: "/properties",
      cta: "Add property",
      icon: Building2,
      done: hasProperties,
    },
    {
      title: "Add its meters",
      description: "One per tenant, flat or shop front.",
      href: "/meters",
      cta: "Add meter",
      icon: Gauge,
      done: false,
    },
    {
      title: "Record a reading",
      description: "Units and the bill are worked out for you.",
      href: "/readings",
      cta: "Record reading",
      icon: Zap,
      done: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Welcome to MeterMate"
        description="Three steps and you're tracking usage. It takes about a minute."
      />

      <ol className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = !step.done && (index === 0 || steps[index - 1]?.done);

          return (
            <li key={step.title}>
              <Card className="h-full">
                <CardContent className="flex h-full flex-col">
                  <div className="flex items-center gap-3">
                    <div
                      aria-hidden
                      className={
                        step.done
                          ? "bg-success-soft text-success flex size-9 items-center justify-center rounded-lg"
                          : "bg-primary-soft text-primary flex size-9 items-center justify-center rounded-lg"
                      }
                    >
                      {step.done ? (
                        <CircleCheck className="size-5" />
                      ) : (
                        <Icon className="size-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-2xs text-muted-foreground font-medium">
                        Step {index + 1}
                      </p>
                      <p className="text-sm font-semibold">{step.title}</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground mt-3 text-sm text-pretty">
                    {step.description}
                  </p>

                  <div className="mt-4 pt-1">
                    {step.done ? (
                      <Badge tone="success">
                        <CircleCheck aria-hidden />
                        Done
                      </Badge>
                    ) : (
                      <Button
                        variant={active ? "default" : "outline"}
                        size="sm"
                        render={<Link href={step.href} />}
                      >
                        {step.cta}
                        <ArrowRight aria-hidden />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function OverviewSkeleton() {
  return (
    <LoadingRegion label="Loading your overview">
      <PageHeader title="Overview" />

      <div className="grid gap-4 sm:gap-5">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardContent>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-4 h-[220px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid gap-3">
              <Skeleton className="h-4 w-32" />
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </LoadingRegion>
  );
}
