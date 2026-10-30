import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/plan/route";
import { NextRequest } from "next/server";

describe("API Route — /api/plan", () => {
  const createRequest = (body: Record<string, unknown>, headers: Record<string, string> = {}) => {
    return new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `ip-${Math.random()}`,
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  it("returns 400 when required fields are missing or invalid", async () => {
    const req = createRequest({ title: "Incomplete Event" });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("Invalid request payload");
  });

  it("returns a comprehensive, mathematically balanced plan with fallback", async () => {
    const validPayload = {
      eventId: "plan-test-1",
      title: "Royal Grand Wedding",
      occasion: "wedding",
      guestCount: 200,
      budget: 1000000,
      currencyCode: "INR",
      currencySymbol: "₹",
      location: "Udaipur",
      preferences: {
        themeStyle: "Royal Rajputana",
        colorPreferences: "Maroon & Gold",
        foodPreferences: "Royal Rajasthani Thali",
        dietaryRequirements: "50% Vegetarian",
        priorities: ["venue", "catering", "photography"],
        venueSetting: "indoor",
      },
    };

    const req = createRequest(validPayload);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const plan = await res.json();
    expect(plan.id).toBeDefined();
    expect(plan.eventId).toBe("plan-test-1");
    expect(plan.themeOptions.length).toBeGreaterThanOrEqual(1);

    // Verify budget allocation math
    if (plan.budgetCategories && plan.budgetCategories.length > 0) {
      const sum = plan.budgetCategories.reduce((acc: number, c: { allocatedAmount: number }) => acc + c.allocatedAmount, 0);
      expect(sum).toBe(1000000);
    }
  });

  it("rejects oversized request bodies with 413 Payload Too Large", async () => {
    const req = new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": "600000", // > 512 KB
      },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });
});
