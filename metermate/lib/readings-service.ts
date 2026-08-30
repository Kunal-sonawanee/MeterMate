import type { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/http";
import { formatPeriod } from "@/lib/format";

/**
 * The billing arithmetic, in one place.
 *
 * A meter's readings form a chain: each month's `previousReading` is the prior
 * month's `currentReading`, `unitsConsumed` is the difference, and the bill is
 * units × rate. Insert, edit or delete anywhere in that chain and everything
 * after it has to be recomputed — which is why creates, updates and deletes all
 * funnel through `recalculateChain` rather than doing their own sums.
 */

/** Money is stored to the paisa; float dust never reaches the database. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Readings are metered to two decimals at most. */
export function roundReading(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

type ChainReading = {
  id: string;
  month: number;
  year: number;
  previousReading: Prisma.Decimal;
  currentReading: Prisma.Decimal;
  unitsConsumed: Prisma.Decimal;
  ratePerUnit: Prisma.Decimal;
  billAmount: Prisma.Decimal;
};

/**
 * Recomputes every derived value for a meter in chronological order.
 *
 * The earliest reading on a meter is a *baseline*: a dial already showing
 * 12,450 when you start tracking it does not mean the tenant consumed 12,450
 * units, and there is no earlier figure to subtract. So the first entry records
 * zero units and no bill, and billing starts from the second reading. Backfill
 * an earlier month later and the old first entry becomes a normal one, billed
 * against the new baseline.
 *
 * Throws a 409 naming the offending month when the chain would go backwards —
 * a dial that reads lower than the month before it is either a typo or a meter
 * replacement, and silently producing a negative bill would be worse than
 * refusing.
 */
export async function recalculateChain(
  tx: Prisma.TransactionClient,
  meterId: string,
): Promise<void> {
  const readings = (await tx.monthlyReading.findMany({
    where: { meterId },
    orderBy: [{ year: "asc" }, { month: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      month: true,
      year: true,
      previousReading: true,
      currentReading: true,
      unitsConsumed: true,
      ratePerUnit: true,
      billAmount: true,
    },
  })) as ChainReading[];

  let carried: number | null = null;

  for (const reading of readings) {
    const current = Number(reading.currentReading);

    // The first reading establishes the baseline rather than being billed.
    if (carried === null) {
      carried = current;
    }

    if (current < carried) {
      throw new ApiError(
        409,
        `${formatPeriod(reading.month, reading.year)} reads ${current}, which is lower than the ${carried} carried forward from the month before. Check the reading for that month.`,
      );
    }

    const units = roundReading(current - carried);
    const bill = roundMoney(units * Number(reading.ratePerUnit));

    const unchanged =
      Number(reading.previousReading) === carried &&
      Number(reading.unitsConsumed) === units &&
      Number(reading.billAmount) === bill;

    if (!unchanged) {
      await tx.monthlyReading.update({
        where: { id: reading.id },
        data: {
          previousReading: carried,
          unitsConsumed: units,
          billAmount: bill,
        },
      });
    }

    carried = current;
  }
}

/**
 * The reading a new entry for `month`/`year` would follow — what the form shows
 * as "previous reading", and the default rate to pre-fill.
 */
/**
 * What the previous reading and units would be for a new entry, given the
 * reading it follows (or `null` when it would be the meter's first).
 */
export function deriveFromPreceding(
  currentReading: number,
  preceding: { currentReading: number } | null,
): { previousReading: number; unitsConsumed: number } {
  const previousReading = preceding ? preceding.currentReading : currentReading;
  return {
    previousReading,
    unitsConsumed: roundReading(Math.max(0, currentReading - previousReading)),
  };
}

export async function findPrecedingReading(
  client: Prisma.TransactionClient,
  meterId: string,
  period?: { month: number; year: number },
) {
  const before = period
    ? {
        OR: [
          { year: { lt: period.year } },
          { year: period.year, month: { lt: period.month } },
        ],
      }
    : {};

  return client.monthlyReading.findFirst({
    where: { meterId, ...before },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    select: {
      currentReading: true,
      ratePerUnit: true,
      month: true,
      year: true,
    },
  });
}
