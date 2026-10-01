import { formatAmountPlain, formatPeriodLong, formatUnits } from "@/lib/format";
import { translate, type Language } from "@/lib/i18n/translate";

/**
 * WhatsApp deep links, no API or account needed.
 *
 * `https://wa.me/<digits>?text=<message>` opens the WhatsApp app (or
 * web.whatsapp.com) with the message pre-filled — the tenant still has to
 * tap send. Numbers are normalised to include a country code, defaulting to
 * India (`91`) for a bare 10-digit mobile number, since that's the only case
 * genuinely ambiguous.
 */

/** Digits only, with a country code. `null` when there's nothing usable. */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasCountryCode = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) return null;

  if (hasCountryCode) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function buildWhatsAppLink(rawNumber: string | null | undefined, message: string): string | null {
  const digits = normalizeWhatsAppNumber(rawNumber);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildBillMessage(
  language: Language,
  params: {
    meterName: string;
    month: number;
    year: number;
    unitsConsumed: number;
    billAmount: number;
  },
): string {
  return translate(language, "whatsapp.billMessage", {
    meterName: params.meterName,
    period: formatPeriodLong(params.month, params.year),
    units: formatUnits(params.unitsConsumed),
    amount: formatAmountPlain(params.billAmount),
  });
}
