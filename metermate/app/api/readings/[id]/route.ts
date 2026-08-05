import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

type AppError = {
  message: string;
  status?: number;
};

async function recalculateMeterReadings(
  tx: Prisma.TransactionClient,
  meterId: string
) {
  const readings = await tx.monthlyReading.findMany({
    where: {
      meterId,
    },
    orderBy: [
      {
        year: "asc",
      },
      {
        month: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });

  let previousReading = 0;

  for (const reading of readings) {
    const currentReading = Number(reading.currentReading);

    if (currentReading < previousReading) {
      const error: AppError = {
        message: "Reading values must be chronological and non-decreasing.",
      };
      error.status = 400;
      throw error;
    }

    const unitsConsumed = currentReading - previousReading;
    const billAmount = unitsConsumed * Number(reading.ratePerUnit);

    await tx.monthlyReading.update({
      where: {
        id: reading.id,
      },
      data: {
        previousReading,
        unitsConsumed,
        billAmount,
      },
    });

    previousReading = currentReading;
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatedReading = await prisma.$transaction(async (tx) => {
      const existingReading = await tx.monthlyReading.findUnique({
        where: { id },
      });

      if (!existingReading) {
        const error: AppError = { message: "Reading not found." };
        error.status = 404;
        throw error;
      }

      const month = Number(body.month ?? existingReading.month);
      const year = Number(body.year ?? existingReading.year);
      const currentReading = Number(
        body.currentReading ?? existingReading.currentReading
      );
      const ratePerUnit = Number(
        body.ratePerUnit ?? existingReading.ratePerUnit
      );

      if (
        Number.isNaN(month) ||
        Number.isNaN(year) ||
        Number.isNaN(currentReading) ||
        Number.isNaN(ratePerUnit)
      ) {
        const error: AppError = { message: "Invalid numeric values." };
        error.status = 400;
        throw error;
      }

      if (month < 1 || month > 12) {
        const error: AppError = { message: "Month must be between 1 and 12." };
        error.status = 400;
        throw error;
      }

      if (year < 2020 || year > 2100) {
        const error: AppError = { message: "Invalid year." };
        error.status = 400;
        throw error;
      }

      if (currentReading < 0 || ratePerUnit < 0) {
        const error: AppError = { message: "Values cannot be negative." };
        error.status = 400;
        throw error;
      }

      const duplicateReading = await tx.monthlyReading.findFirst({
        where: {
          meterId: existingReading.meterId,
          month,
          year,
          NOT: { id },
        },
      });

      if (duplicateReading) {
        const error: AppError = {
          message:
            "Reading for this meter already exists for the selected month and year.",
        };
        error.status = 409;
        throw error;
      }

      await tx.monthlyReading.update({
        where: { id },
        data: {
          month,
          year,
          currentReading,
          ratePerUnit,
        },
      });

      await recalculateMeterReadings(tx, existingReading.meterId);

      return tx.monthlyReading.findUnique({
        where: { id },
      });
    });

    return NextResponse.json(updatedReading);
  } catch (error: unknown) {
    console.error(error);

    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const existingReading = await tx.monthlyReading.findUnique({
        where: { id },
      });

      if (!existingReading) {
        const error = new Error("Reading not found.");
        (error as Error & { status?: number }).status = 404;
        throw error;
      }

      await tx.monthlyReading.delete({ where: { id } });
      await recalculateMeterReadings(tx, existingReading.meterId);
    });

    return NextResponse.json({ message: "Reading deleted successfully." });
  } catch (error: unknown) {
    console.error(error);

    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: "Failed to delete reading." }, { status: 500 });
  }
}

function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  );
}