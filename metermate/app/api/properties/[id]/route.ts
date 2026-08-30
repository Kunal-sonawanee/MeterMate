import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { conflict, notFound, parseBody, route } from "@/lib/http";
import { propertyUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: Request, { params }: Params) => {
  const { id } = await params;
  const data = await parseBody(request, propertyUpdateSchema);

  const property = await prisma.property.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.address !== undefined
        ? { address: data.address ? data.address : null }
        : {}),
    },
    select: {
      id: true,
      name: true,
      address: true,
      createdAt: true,
      _count: { select: { meters: true } },
    },
  });

  return NextResponse.json({
    id: property.id,
    name: property.name,
    address: property.address,
    meterCount: property._count.meters,
    createdAt: property.createdAt.toISOString(),
  });
});

export const DELETE = route(async (request: Request, { params }: Params) => {
  const { id } = await params;
  const url = new URL(request.url);
  const cascade = url.searchParams.get("cascade") === "true";

  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, name: true, _count: { select: { meters: true } } },
  });

  if (!property) {
    throw notFound("That property no longer exists.");
  }

  // Deleting a property cascades to its meters and their entire reading
  // history. That is unrecoverable, so it has to be asked for explicitly.
  if (property._count.meters > 0 && !cascade) {
    throw conflict(
      `${property.name} still has ${property._count.meters} meter${property._count.meters === 1 ? "" : "s"}. Deleting it will remove them and all of their readings.`,
    );
  }

  await prisma.property.delete({ where: { id } });

  return NextResponse.json({ message: `${property.name} was deleted.` });
});
