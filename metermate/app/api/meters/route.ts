import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, parseBody, requireUserId, route } from "@/lib/http";
import { meterSchema } from "@/lib/validation";
import { newestFirst, readingSelect, serializeReading } from "@/lib/serialize";
import type { MeterSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Meters with just their latest reading attached. The full history lives on
 * `/api/meters/[id]` so the list view never pulls every reading ever taken.
 */
export const GET = route(async () => {
  const userId = await requireUserId();

  const meters = await prisma.meter.findMany({
    where: { property: { userId } },
    orderBy: [{ property: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      whatsappNumber: true,
      createdAt: true,
      property: { select: { id: true, name: true } },
      _count: { select: { readings: true } },
      readings: { orderBy: newestFirst, take: 1, select: readingSelect },
    },
  });

  const payload: MeterSummary[] = meters.map((meter) => ({
    id: meter.id,
    name: meter.name,
    whatsappNumber: meter.whatsappNumber,
    property: meter.property,
    readingCount: meter._count.readings,
    latestReading: meter.readings[0]
      ? serializeReading(meter.readings[0])
      : null,
    createdAt: meter.createdAt.toISOString(),
  }));

  return NextResponse.json(payload);
});

export const POST = route(async (request: Request) => {
  const userId = await requireUserId();
  const data = await parseBody(request, meterSchema);

  const property = await prisma.property.findFirst({
    where: { id: data.propertyId, userId },
    select: { id: true },
  });

  if (!property) {
    throw badRequest("Select a property.", {
      propertyId: "That property no longer exists.",
    });
  }

  const meter = await prisma.meter.create({
    data: {
      name: data.name,
      whatsappNumber: data.whatsappNumber ? data.whatsappNumber : null,
      propertyId: data.propertyId,
    },
    select: {
      id: true,
      name: true,
      whatsappNumber: true,
      createdAt: true,
      property: { select: { id: true, name: true } },
    },
  });

  const payload: MeterSummary = {
    ...meter,
    readingCount: 0,
    latestReading: null,
    createdAt: meter.createdAt.toISOString(),
  };

  return NextResponse.json(payload, { status: 201 });
});
