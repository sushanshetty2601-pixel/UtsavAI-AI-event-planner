import { describe, it, expect } from "vitest";
import { parseAllocationIntent, parsePaymentIntent } from "@/lib/ai-intent";
import { Vendor } from "@/types";

describe("AI Intent Parser — parseAllocationIntent", () => {
  it("returns null for unrelated chat messages", () => {
    const result = parseAllocationIntent("What time does the wedding start?", 50000);
    expect(result).toBeNull();
  });

  it("extracts specific category amounts from natural language", () => {
    const prompt = "Please allocate budget: ₹30,000 for food and ₹10,000 for cake from total budget of ₹100,000";
    const result = parseAllocationIntent(prompt, 100000, "₹");

    expect(result).not.toBeNull();
    const action = result?.actionData as { suggestedAllocation?: { totalBudget: number; categories: { category: string; allocatedAmount: number }[] } };
    expect(action?.suggestedAllocation?.totalBudget).toBe(100000);

    const categories = action?.suggestedAllocation?.categories || [];
    const food = categories.find((c) => c.category === "catering");
    const cake = categories.find((c) => c.category === "cake");

    expect(food?.allocatedAmount).toBe(30000);
    expect(cake?.allocatedAmount).toBe(10000);
  });

  it("provides balanced percentage breakdown when generic allocation is requested", () => {
    const prompt = "Can you split budget of 50000 across categories?";
    const result = parseAllocationIntent(prompt, 50000, "₹");

    expect(result).not.toBeNull();
    const action = result?.actionData as { suggestedAllocation?: { categories: { category: string; allocatedAmount: number }[]; contingencyReserve: number } };
    const categories = action?.suggestedAllocation?.categories || [];

    expect(categories.length).toBeGreaterThanOrEqual(4);
    expect(action?.suggestedAllocation?.contingencyReserve).toBe(5000); // 10%
  });
});

describe("AI Intent Parser — parsePaymentIntent", () => {
  const mockVendors: Vendor[] = [
    {
      id: "v-1",
      eventId: "e-1",
      name: "Royal Rasoi Caterers",
      category: "catering",
      contactName: "Chef Anand", contactPhone: "9876543210", contactEmail: "anand@rasoi.in",
      quotedAmount: 100000,
      actualAmount: 25000,
      paymentStatus: "partially_paid",
      bookingStatus: "confirmed",
      notes: "Advance cleared",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "v-2",
      eventId: "e-1",
      name: "Lumiere Studio",
      category: "photography",
      contactName: "Rohan", contactPhone: "9876543211", contactEmail: "rohan@lumiere.in",
      quotedAmount: 40000,
      actualAmount: 0,
      paymentStatus: "unpaid",
      bookingStatus: "confirmed",
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("identifies payment inquiries and calculates outstanding balance across vendors", () => {
    const inquiry = "How much have I paid so far and what is the balance due?";
    const result = parsePaymentIntent(inquiry, mockVendors, "₹");

    expect(result).not.toBeNull();
    const action = result?.actionData as {
      paymentAction?: {
        action: string;
        inquirySummary?: { totalPaid: number; totalQuoted: number; remainingPayable: number };
      };
    };

    expect(action?.paymentAction?.action).toBe("payment_inquiry");
    expect(action?.paymentAction?.inquirySummary?.totalPaid).toBe(25000);
    expect(action?.paymentAction?.inquirySummary?.totalQuoted).toBe(140000);
    expect(action?.paymentAction?.inquirySummary?.remainingPayable).toBe(115000);
  });

  it("extracts exact payment recording action with vendor reconciliation", () => {
    const paymentMsg = "I paid 50,000 to Royal Rasoi Caterers as advance";
    const result = parsePaymentIntent(paymentMsg, mockVendors, "₹");

    expect(result).not.toBeNull();
    const action = result?.actionData as {
      paymentAction?: {
        action: string;
        details?: {
          vendorName: string;
          amount: number;
          previousPaid: number;
          newTotalPaid: number;
          remainingPayable: number;
          paymentStatus: string;
          isAdvance: boolean;
        };
      };
    };

    expect(action?.paymentAction?.action).toBe("record_payment");
    expect(action?.paymentAction?.details?.vendorName).toBe("Royal Rasoi Caterers");
    expect(action?.paymentAction?.details?.amount).toBe(50000);
    expect(action?.paymentAction?.details?.previousPaid).toBe(25000);
    expect(action?.paymentAction?.details?.newTotalPaid).toBe(75000);
    expect(action?.paymentAction?.details?.remainingPayable).toBe(25000); // 100k - 75k
    expect(action?.paymentAction?.details?.paymentStatus).toBe("partially_paid");
    expect(action?.paymentAction?.details?.isAdvance).toBe(true);
  });

  it("handles shorthand amounts like 1.5 lakh or 50k", () => {
    const lakhMsg = "I transferred 1.5 lakh to caterer";
    const lakhResult = parsePaymentIntent(lakhMsg, mockVendors, "₹");
    const lakhDetails = (lakhResult?.actionData as { paymentAction?: { details?: { amount: number } } })?.paymentAction?.details;
    expect(lakhDetails?.amount).toBe(150000);

    const kMsg = "Sent 30k for photography";
    const kResult = parsePaymentIntent(kMsg, mockVendors, "₹");
    const kDetails = (kResult?.actionData as { paymentAction?: { details?: { amount: number } } })?.paymentAction?.details;
    expect(kDetails?.amount).toBe(30000);
  });

  it("asks for clarification if payment intent is detected without amount", () => {
    const noAmtMsg = "I paid Royal Rasoi Caterers";
    const result = parsePaymentIntent(noAmtMsg, mockVendors, "₹");

    expect(result).not.toBeNull();
    expect(result?.actionData).toBeNull();
    expect(result?.reply).toContain("couldn't identify the exact payment amount");
  });
});
