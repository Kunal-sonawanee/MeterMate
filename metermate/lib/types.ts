/**
 * The API contract, shared by the route handlers and the browser client.
 *
 * Decimals are serialised as JSON numbers rather than strings: they are
 * meter readings and rupee amounts, well inside the range where a double is
 * exact enough, and it spares every component a `Number(...)` cast.
 */

export type Period = {
  month: number;
  year: number;
};

export type Reading = {
  id: string;
  month: number;
  year: number;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  billAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type ReadingWithMeter = Reading & {
  meter: {
    id: string;
    name: string;
    property: { id: string; name: string };
  };
};

export type MeterSummary = {
  id: string;
  name: string;
  meterNumber: string | null;
  property: { id: string; name: string };
  readingCount: number;
  latestReading: Reading | null;
  createdAt: string;
};

export type MeterDetail = MeterSummary & {
  readings: Reading[];
};

export type PropertySummary = {
  id: string;
  name: string;
  address: string | null;
  meterCount: number;
  createdAt: string;
};

export type PendingMeter = {
  id: string;
  name: string;
  propertyName: string;
  lastPeriod: Period | null;
};

export type TrendPoint = Period & {
  unitsConsumed: number;
  billAmount: number;
};

export type DashboardResponse = {
  /** The most recent period that has any reading at all; null on a fresh account. */
  period: Period | null;
  totals: {
    billAmount: number;
    unitsConsumed: number;
    readingsRecorded: number;
  };
  /** The period before `period`, for change-over-time. Null when there is no history. */
  previousTotals: {
    billAmount: number;
    unitsConsumed: number;
  } | null;
  counts: {
    properties: number;
    meters: number;
    /** Meters with a reading in `period` — the "am I done for this month" number. */
    metersRead: number;
  };
  /** Meters still missing a reading for `period`, oldest gap first. */
  pendingMeters: PendingMeter[];
  /** Up to the last 12 periods, oldest first. */
  trend: TrendPoint[];
  recentReadings: ReadingWithMeter[];
};

export type ReadingsResponse = {
  readings: ReadingWithMeter[];
  total: number;
  hasMore: boolean;
};

export type PreviousReadingResponse = {
  previousReading: number;
  /** The rate used last time on this meter, so the form can pre-fill it. */
  suggestedRate: number | null;
  precedingPeriod: Period | null;
  /**
   * True when nothing precedes this period on the meter. Such a reading is a
   * baseline: it records where the dial stood and bills nothing, because there
   * is no earlier figure to measure consumption against.
   */
  isBaseline: boolean;
};

export type ApiErrorBody = {
  message: string;
  fields?: Record<string, string>;
};
