import { describe, expect, it } from "vitest";
import { buildBillMessage, buildWhatsAppLink, normalizeWhatsAppNumber } from "@/lib/whatsapp";

describe("normalizeWhatsAppNumber", () => {
  it("prepends 91 to a bare 10-digit Indian mobile number", () => {
    expect(normalizeWhatsAppNumber("98765 43210")).toBe("919876543210");
  });

  it("keeps an explicit country code as-is", () => {
    expect(normalizeWhatsAppNumber("+1 415 555 0132")).toBe("14155550132");
  });

  it("returns null for empty or too-short input", () => {
    expect(normalizeWhatsAppNumber("")).toBeNull();
    expect(normalizeWhatsAppNumber("12345")).toBeNull();
    expect(normalizeWhatsAppNumber(null)).toBeNull();
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with the message URL-encoded", () => {
    const link = buildWhatsAppLink("9876543210", "Hi there!");
    expect(link).toBe("https://wa.me/919876543210?text=Hi%20there!");
  });

  it("returns null when the number can't be normalized", () => {
    expect(buildWhatsAppLink("", "Hi")).toBeNull();
  });
});

describe("buildBillMessage", () => {
  it("fills the English template with formatted values", () => {
    const message = buildBillMessage("en", {
      meterName: "Flat 2B",
      month: 8,
      year: 2026,
      unitsConsumed: 240,
      billAmount: 1920,
    });
    expect(message).toBe(
      "Hi, your August 2026 electricity bill for Flat 2B is ₹1,920.00 (240 units).",
    );
  });

  it("keeps digits in standard numeral form even in Hindi", () => {
    const message = buildBillMessage("hi", {
      meterName: "फ्लैट 2B",
      month: 8,
      year: 2026,
      unitsConsumed: 240,
      billAmount: 1920,
    });
    expect(message).toContain("1,920.00");
    expect(message).toContain("240");
  });
});
