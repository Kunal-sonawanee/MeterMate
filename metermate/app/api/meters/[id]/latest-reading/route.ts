import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, route } from "@/lib/http";
import { findPrecedingReading } from "@/lib/readings-service";
import type { PreviousReadingResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * What a new reading on this meter would follow.
 *
 * Accepts `?month=&year=` so a backfilled entry is measured against the month
 * that actually precedes it, not just the newest reading on record.
 */
export const GET = route(async (request: Request, { params }: Params) => {
  const { id } = await params;

  const meter = await prisma.meter.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!meter) {
    throw notFound("That meter no longer exists.");
  }

  const url = new URL(request.url);
  const month = Number.parseInt(url.searchParams.get("month") ?? "", 10);
  const year = Number.parseInt(url.searchParams.get("year") ?? "", 10);
  const period =
    Number.isFinite(month) && Number.isFinite(year) && month >= 1 && month <= 12
      ? { month, year }
      : undefined;

  const preceding = await findPrecedingReading(prisma, id, period);

  // With nothing before it, the entry becomes the meter's baseline — see
  // `recalculateChain` for why that bills zero units.
  const payload: PreviousReadingResponse = {
    previousReading: preceding ? Number(preceding.currentReading) : 0,
    suggestedRate: preceding ? Number(preceding.ratePerUnit) : null,
    precedingPeriod: preceding
      ? { month: preceding.month, year: preceding.year }
      : null,
    isBaseline: preceding === null,
  };

  return NextResponse.json(payload);
});
