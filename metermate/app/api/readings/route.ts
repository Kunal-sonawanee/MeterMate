import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  badRequest,
  conflict,
  intParam,
  parseBody,
  requireUserId,
  route,
} from "@/lib/http";
import { readingSchema } from "@/lib/validation";
import {
  deriveFromPreceding,
  findPrecedingReading,
  recalculateChain,
  roundMoney,
  roundReading,
} from "@/lib/readings-service";
import {
  meterRelationSelect,
  newestFirst,
  readingSelect,
  serializeReading,
  serializeReadingWithMeter,
} from "@/lib/serialize";
import { formatPeriod } from "@/lib/format";
import type { ReadingsResponse } from "@/lib/types";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Paged reading history, newest first. Filtering happens in the database so a
 * landlord with years of history doesn't ship the whole archive to the browser.
 */
export const GET = route(async (request: Request) => {
  const userId = await requireUserId();
  const params = new URL(request.url).searchParams;

  const limit = intParam(params, "limit", { fallback: 50, min: 1, max: 200 });
  const offset = intParam(params, "offset", {
    fallback: 0,
    min: 0,
    max: 1_000_000,
  });
  const meterId = params.get("meterId")?.trim() || undefined;
  const propertyId = params.get("propertyId")?.trim() || undefined;

  const month = Number.parseInt(params.get("month") ?? "", 10);
  const year = Number.parseInt(params.get("year") ?? "", 10);
  const hasPeriod =
    Number.isFinite(month) &&
    Number.isFinite(year) &&
    month >= 1 &&
    month <= 12;

  const where: Prisma.MonthlyReadingWhereInput = {
    meter: {
      property: { userId, ...(propertyId ? { id: propertyId } : {}) },
    },
    ...(meterId ? { meterId } : {}),
    ...(hasPeriod ? { month, year } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.monthlyReading.findMany({
      where,
      orderBy: newestFirst,
      skip: offset,
      take: limit,
      select: { ...readingSelect, meter: { select: meterRelationSelect } },
    }),
    prisma.monthlyReading.count({ where }),
  ]);

  const payload: ReadingsResponse = {
    readings: rows.map(serializeReadingWithMeter),
    total,
    hasMore: offset + rows.length < total,
  };

  return NextResponse.json(payload);
});

/**
 * Records a reading for a meter and month.
 *
 * Entries may be backfilled out of order — a landlord catching up on paperwork
 * shouldn't be blocked because March was entered before February. The whole
 * chain is recomputed afterwards, so `previousReading`, units and bills stay
 * correct for every month regardless of the order they were typed in.
 */
export const POST = route(async (request: Request) => {
  const userId = await requireUserId();
  const data = await parseBody(request, readingSchema);

  const meter = await prisma.meter.findFirst({
    where: { id: data.meterId, property: { userId } },
    select: { id: true },
  });

  if (!meter) {
    throw badRequest("Select a meter.", {
      meterId: "That meter no longer exists.",
    });
  }

  const created = await prisma.$transaction(async (tx) => {
    const duplicate = await tx.monthlyReading.findFirst({
      where: { meterId: data.meterId, month: data.month, year: data.year },
      select: { id: true },
    });

    if (duplicate) {
      throw conflict(
        `This meter already has a reading for ${formatPeriod(data.month, data.year)}. Edit that entry instead.`,
      );
    }

    const preceding = await findPrecedingReading(tx, data.meterId, {
      month: data.month,
      year: data.year,
    });

    const currentReading = roundReading(data.currentReading);

    if (preceding && currentReading < Number(preceding.currentReading)) {
      const floor = Number(preceding.currentReading);
      throw badRequest(
        `The reading for ${formatPeriod(data.month, data.year)} must be at least ${floor}, the reading carried forward from ${formatPeriod(preceding.month, preceding.year)}.`,
        { currentReading: `Must be ${floor} or higher.` },
      );
    }

    const { previousReading, unitsConsumed } = deriveFromPreceding(
      currentReading,
      preceding ? { currentReading: Number(preceding.currentReading) } : null,
    );

    const row = await tx.monthlyReading.create({
      data: {
        month: data.month,
        year: data.year,
        meterId: data.meterId,
        previousReading,
        currentReading,
        unitsConsumed,
        ratePerUnit: data.ratePerUnit,
        billAmount: roundMoney(unitsConsumed * data.ratePerUnit),
      },
      select: { id: true },
    });

    // Later months now follow a different reading — bring them back in line.
    await recalculateChain(tx, data.meterId);

    const saved = await tx.monthlyReading.findUniqueOrThrow({
      where: { id: row.id },
      select: readingSelect,
    });

    return serializeReading(saved);
  });

  return NextResponse.json(created, { status: 201 });
});
