import type { Prisma } from "@prisma/client";
import type { Reading, ReadingWithMeter } from "@/lib/types";

/** Prisma `Decimal` → plain number, at the API boundary only. */
type DecimalLike = Prisma.Decimal | number | string;

type ReadingRow = {
  id: string;
  month: number;
  year: number;
  previousReading: DecimalLike;
  currentReading: DecimalLike;
  unitsConsumed: DecimalLike;
  ratePerUnit: DecimalLike;
  billAmount: DecimalLike;
  createdAt: Date;
  updatedAt: Date;
};

export const readingSelect = {
  id: true,
  month: true,
  year: true,
  previousReading: true,
  currentReading: true,
  unitsConsumed: true,
  ratePerUnit: true,
  billAmount: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const meterRelationSelect = {
  id: true,
  name: true,
  property: { select: { id: true, name: true } },
} as const;

export function serializeReading(row: ReadingRow): Reading {
  return {
    id: row.id,
    month: row.month,
    year: row.year,
    previousReading: Number(row.previousReading),
    currentReading: Number(row.currentReading),
    unitsConsumed: Number(row.unitsConsumed),
    ratePerUnit: Number(row.ratePerUnit),
    billAmount: Number(row.billAmount),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeReadingWithMeter(
  row: ReadingRow & {
    meter: { id: string; name: string; property: { id: string; name: string } };
  },
): ReadingWithMeter {
  return { ...serializeReading(row), meter: row.meter };
}

/** Newest period first — the order every list in the product uses. */
export const newestFirst = [
  { year: "desc" },
  { month: "desc" },
  { createdAt: "desc" },
] satisfies Prisma.MonthlyReadingOrderByWithRelationInput[];
