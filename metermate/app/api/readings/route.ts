import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getPeriodValue(month: number, year: number) {
  return year * 12 + month;
}

type PrismaError = {
  code?: string;
};

export async function GET() {
  try {
    const readings = await prisma.monthlyReading.findMany({
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
      ],
    });

    return NextResponse.json(readings, {
      status: 200,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch readings.",
      },
      {
        status: 500,
      }
    );
  }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Required fields
    if (
      body.month === undefined ||
      body.year === undefined ||
      body.currentReading === undefined ||
      body.ratePerUnit === undefined ||
      !body.meterId
    ) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    const month = Number(body.month);
    const year = Number(body.year);
    const currentReading = Number(body.currentReading);
    const ratePerUnit = Number(body.ratePerUnit);

    // Number validation
    if (
      Number.isNaN(month) ||
      Number.isNaN(year) ||
      Number.isNaN(currentReading) ||
      Number.isNaN(ratePerUnit)
    ) {
      return NextResponse.json(
        { message: "Invalid numeric values." },
        { status: 400 }
      );
    }

    // Month validation
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { message: "Month must be between 1 and 12." },
        { status: 400 }
      );
    }

    // Year validation
    if (year < 2020 || year > 2100) {
      return NextResponse.json(
        { message: "Invalid year." },
        { status: 400 }
      );
    }

    // Negative values
    if (currentReading < 0 || ratePerUnit < 0) {
      return NextResponse.json(
        { message: "Values cannot be negative." },
        { status: 400 }
      );
    }

    // Check meter exists
    const meter = await prisma.meter.findUnique({
      where: {
        id: body.meterId,
      },
    });

    if (!meter) {
      return NextResponse.json(
        { message: "Meter not found." },
        { status: 404 }
      );
    }

    const latestReading = await prisma.monthlyReading.findFirst({
      where: {
        meterId: body.meterId,
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
      select: {
        month: true,
        year: true,
        currentReading: true,
      },
    });

    const requestedPeriod = getPeriodValue(month, year);
    const latestPeriod = latestReading
      ? getPeriodValue(latestReading.month, latestReading.year)
      : null;

    if (latestPeriod !== null && requestedPeriod < latestPeriod) {
      return NextResponse.json(
        {
          message:
            "Reading month must be later than the latest saved reading for this meter.",
        },
        { status: 400 }
      );
    }

    if (latestPeriod !== null && requestedPeriod === latestPeriod) {
      return NextResponse.json(
        {
          message:
            "Reading for this meter already exists for the selected month and year.",
        },
        { status: 409 }
      );
    }

    const previousReading = Number(latestReading?.currentReading ?? 0);

    if (currentReading < previousReading) {
      return NextResponse.json(
        {
          message:
            "Current reading cannot be less than the previous reading.",
        },
        { status: 400 }
      );
    }

    const unitsConsumed = currentReading - previousReading;
    const billAmount = unitsConsumed * ratePerUnit;

    const reading = await prisma.monthlyReading.create({
      data: {
        month,
        year,
        previousReading,
        currentReading,
        unitsConsumed,
        ratePerUnit,
        billAmount,
        meterId: body.meterId,
      },
    });

    return NextResponse.json(reading, {
      status: 201,
    });
  } catch (error: unknown) {
    console.error(error);

    // Duplicate month/year for same meter
    if ((error as PrismaError).code === "P2002") {
      return NextResponse.json(
        {
          message:
            "Reading for this meter already exists for the selected month and year.",
        },
        { status: 409 }
      );
    }

    // Invalid foreign key
    if ((error as PrismaError).code === "P2003") {
      return NextResponse.json(
        {
          message: "Invalid meter selected.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Internal server error.",
      },
      {
        status: 500,
      }
    );
  }
}