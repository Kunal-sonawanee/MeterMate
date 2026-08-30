import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, parseBody, route } from "@/lib/http";
import { meterUpdateSchema } from "@/lib/validation";
import { newestFirst, readingSelect, serializeReading } from "@/lib/serialize";
import type { MeterDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const GET = route(async (_request: Request, { params }: Params) => {
  const { id } = await params;

  const meter = await prisma.meter.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      meterNumber: true,
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
    meterNumber: meter.meterNumber,
    property: meter.property,
    readingCount: meter._count.readings,
    latestReading: readings[0] ?? null,
    createdAt: meter.createdAt.toISOString(),
    readings,
  };

  return NextResponse.json(payload);
});

export const PATCH = route(async (request: Request, { params }: Params) => {
  const { id } = await params;
  const data = await parseBody(request, meterUpdateSchema);

  if (data.propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
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
      ...(data.meterNumber !== undefined
        ? { meterNumber: data.meterNumber ? data.meterNumber : null }
        : {}),
      ...(data.propertyId !== undefined ? { propertyId: data.propertyId } : {}),
    },
    select: {
      id: true,
      name: true,
      meterNumber: true,
      createdAt: true,
      property: { select: { id: true, name: true } },
      _count: { select: { readings: true } },
      readings: { orderBy: newestFirst, take: 1, select: readingSelect },
    },
  });

  return NextResponse.json({
    id: meter.id,
    name: meter.name,
    meterNumber: meter.meterNumber,
    property: meter.property,
    readingCount: meter._count.readings,
    latestReading: meter.readings[0]
      ? serializeReading(meter.readings[0])
      : null,
    createdAt: meter.createdAt.toISOString(),
  });
});

export const DELETE = route(async (_request: Request, { params }: Params) => {
  const { id } = await params;

  const meter = await prisma.meter.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!meter) {
    throw notFound("That meter no longer exists.");
  }

  await prisma.meter.delete({ where: { id } });

  return NextResponse.json({ message: `${meter.name} was deleted.` });
});
