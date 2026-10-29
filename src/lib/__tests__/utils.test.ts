import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  daysUntil,
  generateId,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/lib/utils";

describe("Formatting & Math Utilities — formatCurrency", () => {
  it("formats Indian Rupee (INR) amounts correctly using Indian number formatting system", () => {
    const formatted = formatCurrency(150000, "INR", "en-IN");
    // Standard Indian formatting uses ₹1,50,000
    expect(formatted).toContain("1,50,000");
    expect(formatted).toContain("₹");
  });

  it("formats USD currency correctly", () => {
    const formatted = formatCurrency(2500, "USD", "en-US");
    expect(formatted).toContain("2,500");
    expect(formatted).toContain("$");
  });

  it("handles zero, negative, and invalid values gracefully without throwing", () => {
    expect(formatCurrency(0, "INR")).toContain("0");
    expect(formatCurrency(NaN, "INR")).toContain("0");
    expect(formatCurrency(-500, "INR")).toContain("500");
  });
});

describe("Date Utilities", () => {
  it("formats dates into readable human strings", () => {
    const formatted = formatDate("2026-11-15");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("November");
  });

  it("formats short date labels accurately", () => {
    const formatted = formatDateShort("2026-12-25");
    expect(formatted).toContain("Dec");
  });

  it("computes days until event accurately", () => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 10);

    const diff = daysUntil(futureDate.toISOString().split("T")[0]);
    expect(diff).toBe(10);
  });
});

describe("Identifier & Category Constants", () => {
  it("generates unique string identifiers with random entropy", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe("string");
    expect(id1.length).toBeGreaterThan(6);
  });

  it("contains complete mapping for all primary celebration expense categories", () => {
    const requiredCategories = [
      "venue",
      "catering",
      "photography",
      "decoration",
      "cake",
      "entertainment",
      "invitations",
      "transport",
      "attire",
      "miscellaneous",
    ];

    for (const cat of requiredCategories) {
      expect(CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]).toBeDefined();
      expect(CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS]).toBeDefined();
    }
  });
});
