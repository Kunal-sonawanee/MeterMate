import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, route } from "@/lib/http";
import { propertySchema } from "@/lib/validation";
import type { PropertySummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const properties = await prisma.property.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      createdAt: true,
      _count: { select: { meters: true } },
    },
  });

  const payload: PropertySummary[] = properties.map((property) => ({
    id: property.id,
    name: property.name,
    address: property.address,
    meterCount: property._count.meters,
    createdAt: property.createdAt.toISOString(),
  }));

  return NextResponse.json(payload);
});

export const POST = route(async (request: Request) => {
  const data = await parseBody(request, propertySchema);

  const property = await prisma.property.create({
    data: {
      name: data.name,
      address: data.address ? data.address : null,
    },
    select: { id: true, name: true, address: true, createdAt: true },
  });

  return NextResponse.json(
    { ...property, meterCount: 0, createdAt: property.createdAt.toISOString() },
    { status: 201 },
  );
});
