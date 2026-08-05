import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const meter = await prisma.meter.findUnique({
      where: {
        id,
      },
    });

    if (!meter) {
      return NextResponse.json(
        {
          message: "Meter not found.",
        },
        {
          status: 404,
        }
      );
    }

    const latestReading = await prisma.monthlyReading.findFirst({
      where: {
        meterId: id,
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

    return NextResponse.json({
      previousReading: latestReading
        ? Number(latestReading.currentReading)
        : 0,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch previous reading.",
      },
      {
        status: 500,
      }
    );
  }
}