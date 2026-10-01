import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { conflict, notFound, parseBody, requireUserId, route } from "@/lib/http";
import { readingUpdateSchema } from "@/lib/validation";
import { recalculateChain, roundReading } from "@/lib/readings-service";
import { readingSelect, serializeReading } from "@/lib/serialize";
import { formatPeriod } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const data = await parseBody(request, readingUpdateSchema);

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.monthlyReading.findFirst({
      where: { id, meter: { property: { userId } } },
      select: { id: true, meterId: true, month: true, year: true },
    });

    if (!existing) {
      throw notFound("That reading no longer exists.");
    }

    const month = data.month ?? existing.month;
    const year = data.year ?? existing.year;

    if (month !== existing.month || year !== existing.year) {
      const clash = await tx.monthlyReading.findFirst({
        where: { meterId: existing.meterId, month, year, NOT: { id } },
        select: { id: true },
      });

      if (clash) {
        throw conflict(
          `This meter already has a reading for ${formatPeriod(month, year)}. Edit that entry instead.`,
        );
      }
    }

    await tx.monthlyReading.update({
      where: { id },
      data: {
        month,
        year,
        ...(data.currentReading !== undefined
          ? { currentReading: roundReading(data.currentReading) }
          : {}),
        ...(data.ratePerUnit !== undefined
          ? { ratePerUnit: data.ratePerUnit }
          : {}),
      },
    });

    // Moving or re-valuing a reading shifts every month after it.
    await recalculateChain(tx, existing.meterId);

    const saved = await tx.monthlyReading.findUniqueOrThrow({
      where: { id },
      select: readingSelect,
    });

    return serializeReading(saved);
  });

  return NextResponse.json(updated);
});

export const DELETE = route(async (_request: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.monthlyReading.findFirst({
      where: { id, meter: { property: { userId } } },
      select: { id: true, meterId: true },
    });

    if (!existing) {
      throw notFound("That reading no longer exists.");
    }

    await tx.monthlyReading.delete({ where: { id } });
    await recalculateChain(tx, existing.meterId);
  });

  return NextResponse.json({ message: "Reading deleted." });
});
