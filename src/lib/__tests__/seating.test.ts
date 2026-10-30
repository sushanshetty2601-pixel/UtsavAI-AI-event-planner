import { describe, it, expect } from "vitest";
import { computeTableAssignments, getTableLabel, TABLE_GROUPS_PRIORITY } from "@/lib/seating";
import { Guest } from "@/types";

describe("Seating Engine — computeTableAssignments", () => {
  const createMockGuest = (
    id: string,
    name: string,
    group: Guest["group"],
    rsvpStatus: Guest["rsvpStatus"] = "attending",
    plusOnes: number = 0
  ): Guest => ({
    id,
    eventId: "event-1",
    name,
    group,
    rsvpStatus,
    plusOnes,
    dietary: "vegetarian",
    createdAt: new Date().toISOString(),
      });

  it("prioritizes VIP guests at Table 1 and orders groups per hierarchy", () => {
    const guests: Guest[] = [
      createMockGuest("g-1", "Friend Alex", "friends"),
      createMockGuest("g-2", "VIP Minister Rao", "vip"),
      createMockGuest("g-3", "Bride's Uncle", "bride_family"),
    ];

    const assignments = computeTableAssignments(guests, 8);
    expect(assignments).toHaveLength(3);

    // VIP should be Table 1
    const vip = assignments.find((a) => a.guestId === "g-2");
    expect(vip?.tableNumber).toBe("Table 1 (VIP)");

    // Bride's family should follow VIP
    const brideUncle = assignments.find((a) => a.guestId === "g-3");
    expect(brideUncle?.tableNumber).toBe("Table 2 (Bride's Family)");

    // Friend should follow bride's family
    const friend = assignments.find((a) => a.guestId === "g-1");
    expect(friend?.tableNumber).toBe("Table 3 (Friends)");
  });

  it("filters out declined guests automatically", () => {
    const guests: Guest[] = [
      createMockGuest("g-1", "Attending Guest", "general", "attending"),
      createMockGuest("g-2", "Pending Guest", "general", "pending"),
      createMockGuest("g-3", "Declined Guest", "general", "declined"),
    ];

    const assignments = computeTableAssignments(guests, 8);
    expect(assignments).toHaveLength(2);
    expect(assignments.some((a) => a.guestId === "g-3")).toBe(false);
  });

  it("splits guests across tables when seat limit is exceeded with plus-ones", () => {
    const guests: Guest[] = [
      createMockGuest("g-1", "Guest with 4 family", "friends", "attending", 4), // 5 seats
      createMockGuest("g-2", "Guest with 3 family", "friends", "attending", 3), // 4 seats (5+4=9 > 8 capacity)
    ];

    const assignments = computeTableAssignments(guests, 8);
    expect(assignments).toHaveLength(2);
    expect(assignments[0].tableNumber).toBe("Table 1 (Friends)");
    expect(assignments[1].tableNumber).toBe("Table 2 (Friends)");
  });

  it("generates human-readable table labels for all supported categories", () => {
    expect(getTableLabel(1, "vip")).toBe("Table 1 (VIP)");
    expect(getTableLabel(2, "bride_family")).toBe("Table 2 (Bride's Family)");
    expect(getTableLabel(3, "groom_family")).toBe("Table 3 (Groom's Family)");
    expect(getTableLabel(4, "friends")).toBe("Table 4 (Friends)");
    expect(getTableLabel(5, "colleagues")).toBe("Table 5 (Colleagues)");
    expect(getTableLabel(6, "general")).toBe("Table 6");
    expect(getTableLabel(7, "custom_unknown")).toBe("Table 7");
  });

  it("includes all defined priority tiers in constant", () => {
    expect(TABLE_GROUPS_PRIORITY).toContain("vip");
    expect(TABLE_GROUPS_PRIORITY).toContain("bride_family");
    expect(TABLE_GROUPS_PRIORITY).toContain("groom_family");
  });
});
