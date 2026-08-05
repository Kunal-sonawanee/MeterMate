import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PrismaError = {
  code?: string;
};

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    await prisma.meter.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Meter deleted successfully.",
    });
  } catch (error: unknown) {
    console.error(error);

    if ((error as PrismaError).code === "P2025") {
      return NextResponse.json(
        {
          message: "Meter not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        message: "Failed to delete meter.",
      },
      {
        status: 500,
      }
    );
  }
}