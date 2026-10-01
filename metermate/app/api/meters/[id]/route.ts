import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, parseBody, requireUserId, route } from "@/lib/http";
import { meterUpdateSchema } from "@/lib/validation";
import { newestFirst, readingSelect, serializeReading } from "@/lib/serialize";
import type { MeterDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const GET = route(async (_request: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;

  const meter = await prisma.meter.findFirst({
    where: { id, property: { userId } },
    select: {
      id: true,
      name: true,
      whatsappNumber: true,
      createdAt: true,
      property: { select: { id: true, name: true } },
      _count: { select: { readings: true } },
      readings: { orderBy: newestFirst, select: readingSelect },
    },
  });

  if (!meter) {
    throw notFound("That meter no longer exists.");
  }

  const readings = meter.readings.map(serializeReading);

  const payload: MeterDetail = {
    id: meter.id,
    name: meter.name,
    whatsappNumber: meter.whatsappNumber,
    property: meter.property,
    readingCount: meter._count.readings,
    latestReading: readings[0] ?? null,
    createdAt: meter.createdAt.toISOString(),
    readings,
  };

  return NextResponse.json(payload);
});

export const PATCH = route(async (request: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const data = await parseBody(request, meterUpdateSchema);

  const owned = await prisma.meter.findFirst({
    where: { id, property: { userId } },
    select: { id: true },
  });
  if (!owned) {
    throw notFound("That meter no longer exists.");
  }

  if (data.propertyId) {
    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, userId },
      select: { id: true },
    });

    if (!property) {
      throw badRequest("Select a property.", {
        propertyId: "That property no longer exists.",
      });
    }
  }

  const meter = await prisma.meter.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.whatsappNumber !== undefined
        ? { whatsappNumber: data.whatsappNumber ? data.whatsappNumber : null }
        : {}),
      ...(data.propertyId !== undefined ? { propertyId: data.propertyId } : {}),
    },
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

  return NextResponse.json({
    id: meter.id,
    name: meter.name,
    whatsappNumber: meter.whatsappNumber,
    property: meter.property,
    readingCount: meter._count.readings,
    latestReading: meter.readings[0]
      ? serializeReading(meter.readings[0])
      : null,
    createdAt: meter.createdAt.toISOString(),
  });
});

export const DELETE = route(async (_request: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;

  const meter = await prisma.meter.findFirst({
    where: { id, property: { userId } },
    select: { id: true, name: true },
  });

  if (!meter) {
    throw notFound("That meter no longer exists.");
  }

  await prisma.meter.delete({ where: { id } });

  return NextResponse.json({ message: `${meter.name} was deleted.` });
});
