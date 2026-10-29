import { describe, it, expect } from "vitest";
import { z } from "zod";

// Zod schemas matching our core application data models
const CurrencySchema = z.object({
  code: z.string().min(3).max(4),
  symbol: z.string().min(1),
  locale: z.string(),
  name: z.string(),
  rateToINR: z.number().positive(),
});

const EventRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  occasion: z.enum(["wedding", "birthday", "anniversary", "community", "other"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestCount: z.number().int().positive(),
  budget: z.number().positive(),
  currency: CurrencySchema,
});

const PaymentRecordSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  category: z.string(),
  recipientName: z.string().min(1),
  amount: z.number().positive(),
  currency: CurrencySchema,
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.enum(["ai-recorded", "manual", "user-reported"]),
});

const GuestRecordSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  name: z.string().min(1),
  rsvpStatus: z.enum(["attending", "declined", "pending"]),
  group: z.enum(["bride_family", "groom_family", "friends", "colleagues", "vip", "general"]),
  plusOnes: z.number().int().nonnegative(),
  dietary: z.enum([
    "vegetarian",
    "jain",
    "vegan",
    "non_veg",
    "halal",
    "gluten_free",
    "no_preference",
  ]),
});

describe("Security & Input Validation — Schema Integrity", () => {
  const mockCurrency = {
    code: "INR",
    symbol: "₹",
    locale: "en-IN",
    name: "Indian Rupee (₹)",
    rateToINR: 1,
  };

  it("validates a genuine EventRecord successfully", () => {
    const validEvent = {
      id: "event-123",
      title: "Rohan & Priya Grand Sangeet",
      occasion: "wedding" as const,
      date: "2026-11-20",
      guestCount: 250,
      budget: 1500000,
      currency: mockCurrency,
    };

    const result = EventRecordSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it("rejects malicious or malformed event records", () => {
    const invalidEvent = {
      id: "",
      title: "",
      occasion: "invalid_occasion",
      date: "not-a-date",
      guestCount: -5,
      budget: -100,
      currency: mockCurrency,
    };

    const result = EventRecordSchema.safeParse(invalidEvent);
    expect(result.success).toBe(false);
  });

  it("strictly validates payment transaction amounts and sources", () => {
    const validPayment = {
      id: "pay-1",
      eventId: "event-123",
      category: "catering",
      recipientName: "Royal Flavors Catering",
      amount: 75000,
      currency: mockCurrency,
      paymentDate: "2026-10-29",
      source: "ai-recorded" as const,
    };

    expect(PaymentRecordSchema.safeParse(validPayment).success).toBe(true);

    const negativePayment = { ...validPayment, amount: -500 };
    expect(PaymentRecordSchema.safeParse(negativePayment).success).toBe(false);

    const zeroPayment = { ...validPayment, amount: 0 };
    expect(PaymentRecordSchema.safeParse(zeroPayment).success).toBe(false);
  });

  it("validates guest RSVP and dietary preference compliance", () => {
    const validGuest = {
      id: "guest-1",
      eventId: "event-123",
      name: "Aarav Sharma",
      rsvpStatus: "attending" as const,
      group: "bride_family" as const,
      plusOnes: 1,
      dietary: "jain" as const,
    };

    expect(GuestRecordSchema.safeParse(validGuest).success).toBe(true);

    const invalidDietary = { ...validGuest, dietary: "unknown_diet" };
    expect(GuestRecordSchema.safeParse(invalidDietary).success).toBe(false);
  });
});
