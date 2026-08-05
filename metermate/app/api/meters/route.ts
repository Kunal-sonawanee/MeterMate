import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const meters = await prisma.meter.findMany({
      include: {
        property: true,
        readings: true,
      },
    });

    return NextResponse.json(meters);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch meters" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const meter = await prisma.meter.create({
      data: {
        name: body.name,
        meterNumber: body.meterNumber,
        propertyId: body.propertyId,
      },
    });

    return NextResponse.json(meter, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to create meter" },
      { status: 500 }
    );
  }
}