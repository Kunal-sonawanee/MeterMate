import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const meters = await prisma.meter.findMany({
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        readings: {
          orderBy: [
            {
              year: "desc",
            },
            {
              month: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          take: 1,
          select: {
            id: true,
            month: true,
            year: true,
            previousReading: true,
            currentReading: true,
            unitsConsumed: true,
            ratePerUnit: true,
            billAmount: true,
            createdAt: true,
          },
        },
      },
    });

    const recentReadings = await prisma.monthlyReading.findMany({
      include: {
        meter: {
          select: {
            id: true,
            name: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          year: "desc",
        },
        {
          month: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 5,
    });

    const totalUnits = meters.reduce((sum, meter) => {
      return sum + Number(meter.readings[0]?.unitsConsumed ?? 0);
    }, 0);

    const totalBill = meters.reduce((sum, meter) => {
      return sum + Number(meter.readings[0]?.billAmount ?? 0);
    }, 0);

    const latestReadings = meters
      .map((meter) => ({
        meterId: meter.id,
        meterName: meter.name,
        propertyName: meter.property.name,
        latestReading: meter.readings[0] ?? null,
      }))
      .filter((entry) => entry.latestReading !== null);

    return NextResponse.json({
      totalMeters: meters.length,
      totalUnits,
      totalBill,
      latestReadings,
      recentReadings,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}