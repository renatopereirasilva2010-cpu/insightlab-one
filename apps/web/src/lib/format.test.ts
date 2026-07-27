import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, formatDateTime } from "./format";

// Intl usa espaço não-quebrável entre "R$" e o número.
const normalize = (s: string) => s.replace(/ /g, " ");

describe("formatCurrency", () => {
  it("formats numbers as BRL", () => {
    expect(normalize(formatCurrency(1234.5))).toBe("R$ 1.234,50");
  });

  it("formats the decimal strings the API returns", () => {
    expect(normalize(formatCurrency("1234.50"))).toBe("R$ 1.234,50");
    expect(normalize(formatCurrency("0"))).toBe("R$ 0,00");
  });

  it("falls back to zero instead of NaN for unparseable input", () => {
    expect(normalize(formatCurrency("abc"))).toBe("R$ 0,00");
    expect(normalize(formatCurrency(Number.NaN))).toBe("R$ 0,00");
  });

  it("keeps negative values signed", () => {
    expect(normalize(formatCurrency(-10))).toBe("-R$ 10,00");
  });
});

describe("formatDate / formatDateTime", () => {
  it("renders an em dash for empty values", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDateTime(null)).toBe("—");
  });

  it("formats an ISO date in pt-BR order", () => {
    expect(formatDate(new Date(2026, 6, 25))).toBe("25/07/2026");
  });
});
