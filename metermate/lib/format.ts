/**
 * Every number the user sees is formatted here.
 *
 * Meter readings, units and money each have their own conventions, and getting
 * them right once means every screen agrees.
 */

export const CURRENCY = "INR";
export const LOCALE = "en-IN";

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  notation: "compact",
  maximumFractionDigits: 1,
});

const unitsFormatter = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 2,
});

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** `₹ 1,240.00` — used wherever an exact amount matters. */
export function formatCurrency(
  value: number | string | null | undefined,
): string {
  return currencyFormatter.format(toNumber(value));
}

/**
 * `₹1.2L` — for headline figures where the exact paisa is noise.
 *
 * Only kicks in at a lakh and above: `en-IN` compact notation renders ₹11,700
 * as "₹11.7T", which is both unfamiliar and no shorter than the real number.
 * Lakh and crore are the units people actually use.
 */
export function formatCurrencyCompact(
  value: number | string | null | undefined,
): string {
  const amount = toNumber(value);
  return Math.abs(amount) < 100_000
    ? currencyFormatter.format(amount)
    : compactCurrencyFormatter.format(amount);
}

/** Meter units, trimmed of trailing zeroes: `1,204` / `1,204.5`. */
export function formatUnits(value: number | string | null | undefined): string {
  return unitsFormatter.format(toNumber(value));
}

/** `kWh` reading on a dial. Same as units, kept separate so it can diverge. */
export function formatReading(
  value: number | string | null | undefined,
): string {
  return unitsFormatter.format(toNumber(value));
}

/** `Aug 2026` */
export function formatPeriod(month: number, year: number): string {
  const name = MONTH_NAMES[month - 1];
  return name ? `${name.slice(0, 3)} ${year}` : `${month}/${year}`;
}

/** `August 2026` */
export function formatPeriodLong(month: number, year: number): string {
  const name = MONTH_NAMES[month - 1];
  return name ? `${name} ${year}` : `${month}/${year}`;
}

/** `2026-08` — the value shape of an `<input type="month">`. */
export function toMonthInputValue(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Parses `2026-08`; returns null for anything malformed. */
export function fromMonthInputValue(
  value: string,
): { month: number; year: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  return { month, year };
}

export function currentMonthInputValue(): string {
  const now = new Date();
  return toMonthInputValue(now.getMonth() + 1, now.getFullYear());
}

/** `12 Aug 2026` */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** `today` / `3 days ago` / `12 Aug 2026` past a fortnight. */
export function formatRelativeDate(
  value: string | Date | null | undefined,
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const days = Math.round((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  return formatDate(date);
}

/** Signed percentage change, or null when there is no meaningful baseline. */
export function percentageChange(
  current: number,
  previous: number,
): number | null {
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    previous === 0
  ) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

export function formatPercentage(value: number): string {
  const rounded =
    Math.abs(value) < 10 ? value.toFixed(1) : Math.round(value).toString();
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${rounded.replace("-", "")}%`;
}

/** Prisma Decimals arrive as strings over the wire; normalise defensively. */
export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Sortable integer for a billing period, so month/year compare as one value. */
export function periodValue(month: number, year: number): number {
  return year * 12 + month;
}
