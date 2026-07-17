import type { ReadingResponse } from '../api/types';

const numberFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0
});

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
});

export function formatNumber(value: number, fractionDigits = 0) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits
  }).format(value);
}

export function formatCurrency(value: number) {
  return moneyFormatter.format(value);
}

export function formatReading(value?: number | null) {
  if (value == null) {
    return '—';
  }

  return numberFormatter.format(value);
}

export function formatCreatedAt(value?: string | null) {
  if (!value) {
    return '—';
  }

  return dateFormatter.format(new Date(value));
}

export function monthName(month: number) {
  return new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(2024, month - 1, 1));
}

export function readingPeriodLabel(reading: Pick<ReadingResponse, 'month' | 'year'>) {
  return `${monthName(reading.month)} ${reading.year}`;
}

export function sortReadingsDesc(readings: ReadingResponse[]) {
  return [...readings].sort((left, right) => {
    if (left.year !== right.year) {
      return right.year - left.year;
    }

    if (left.month !== right.month) {
      return right.month - left.month;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}
