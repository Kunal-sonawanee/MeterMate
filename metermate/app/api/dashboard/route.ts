import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, route } from "@/lib/http";
import {
  meterRelationSelect,
  newestFirst,
  readingSelect,
  serializeReadingWithMeter,
} from "@/lib/serialize";
import type { DashboardResponse, PendingMeter, TrendPoint } from "@/lib/types";

export const dynamic = "force-dynamic";

const TREND_PERIODS = 12;
const RECENT_READINGS = 6;

function previousPeriod({ month, year }: { month: number; year: number }) {
  return month === 1
    ? { month: 12, year: year - 1 }
    : { month: month - 1, year };
}

/**
 * The overview payload.
 *
 * The question this screen answers is "where am I in this month's billing
 * cycle" — so everything is scoped to the most recent period that has readings,
 * and the meters still missing one are named rather than merely counted.
 */
export const GET = route(async () => {
  const userId = await requireUserId();
  const scope = { meter: { property: { userId } } } as const;

  const [latest, propertyCount, meterCount] = await Promise.all([
    prisma.monthlyReading.findFirst({
      where: scope,
      orderBy: newestFirst,
      select: { month: true, year: true },
    }),
    prisma.property.count({ where: { userId } }),
    prisma.meter.count({ where: { property: { userId } } }),
  ]);

  if (!latest) {
    const empty: DashboardResponse = {
      period: null,
      totals: { billAmount: 0, unitsConsumed: 0, readingsRecorded: 0 },
      previousTotals: null,
      counts: { properties: propertyCount, meters: meterCount, metersRead: 0 },
      pendingMeters: [],
      trend: [],
      recentReadings: [],
      mainBill: null,
      ownerRemainder: null,
    };

    return NextResponse.json(empty);
  }

  const period = { month: latest.month, year: latest.year };
  const prior = previousPeriod(period);

  const [currentTotals, priorTotals, readMeters, trendRows, recentRows, mainBillRow] =
    await Promise.all([
      prisma.monthlyReading.aggregate({
        where: { ...scope, ...period },
        _sum: { billAmount: true, unitsConsumed: true },
        _count: { _all: true },
      }),
      prisma.monthlyReading.aggregate({
        where: { ...scope, ...prior },
        _sum: { billAmount: true, unitsConsumed: true },
        _count: { _all: true },
      }),
      prisma.monthlyReading.findMany({
        where: { ...scope, ...period },
        select: { meterId: true },
      }),
      prisma.monthlyReading.groupBy({
        by: ["year", "month"],
        where: scope,
        _sum: { billAmount: true, unitsConsumed: true },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: TREND_PERIODS,
      }),
      prisma.monthlyReading.findMany({
        where: scope,
        orderBy: newestFirst,
        take: RECENT_READINGS,
        select: { ...readingSelect, meter: { select: meterRelationSelect } },
      }),
      prisma.mainBill.findUnique({ where: { userId_month_year: { userId, ...period } } }),
    ]);

  const readMeterIds = new Set(readMeters.map((row) => row.meterId));

  const pending = await prisma.meter.findMany({
    where: { property: { userId }, id: { notIn: [...readMeterIds] } },
    orderBy: [{ property: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      property: { select: { name: true } },
      readings: {
        orderBy: newestFirst,
        take: 1,
        select: { month: true, year: true },
      },
    },
  });

  const pendingMeters: PendingMeter[] = pending.map((meter) => ({
    id: meter.id,
    name: meter.name,
    propertyName: meter.property.name,
    lastPeriod: meter.readings[0]
      ? { month: meter.readings[0].month, year: meter.readings[0].year }
      : null,
  }));

  const trend: TrendPoint[] = trendRows
    .map((row) => ({
      month: row.month,
      year: row.year,
      unitsConsumed: Number(row._sum.unitsConsumed ?? 0),
      billAmount: Number(row._sum.billAmount ?? 0),
    }))
    .reverse();

  const payload: DashboardResponse = {
    period,
    totals: {
      billAmount: Number(currentTotals._sum.billAmount ?? 0),
      unitsConsumed: Number(currentTotals._sum.unitsConsumed ?? 0),
      readingsRecorded: currentTotals._count._all,
    },
    previousTotals:
      priorTotals._count._all > 0
        ? {
            billAmount: Number(priorTotals._sum.billAmount ?? 0),
            unitsConsumed: Number(priorTotals._sum.unitsConsumed ?? 0),
          }
        : null,
    counts: {
      properties: propertyCount,
      meters: meterCount,
      metersRead: readMeterIds.size,
    },
    pendingMeters,
    trend,
    recentReadings: recentRows.map(serializeReadingWithMeter),
    mainBill: mainBillRow
      ? { month: mainBillRow.month, year: mainBillRow.year, amount: Number(mainBillRow.amount) }
      : null,
    ownerRemainder: mainBillRow
      ? Number(mainBillRow.amount) - Number(currentTotals._sum.billAmount ?? 0)
      : null,
  };

  return NextResponse.json(payload);
});
