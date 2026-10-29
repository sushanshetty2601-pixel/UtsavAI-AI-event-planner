import { describe, it, expect } from "vitest";
import { calculateBudgetSummary, generateBudgetAlternatives } from "@/lib/budget";
import { Expense, BudgetCategoryAllocation } from "@/types";

describe("Financial Engine — calculateBudgetSummary", () => {
  it("computes clean zeros when no expenses are present", () => {
    const summary = calculateBudgetSummary(50000, []);
    expect(summary.totalBudget).toBe(50000);
    expect(summary.totalEstimated).toBe(0);
    expect(summary.totalActual).toBe(0);
    expect(summary.totalRemaining).toBe(50000);
    expect(summary.isOverBudget).toBe(false);
    expect(summary.overBudgetAmount).toBe(0);
    expect(summary.categories).toEqual([]);
  });

  it("handles negative or invalid budget values safely", () => {
    const summary = calculateBudgetSummary(-1000, []);
    expect(summary.totalBudget).toBe(0);
    expect(summary.totalRemaining).toBe(0);
  });

  it("correctly prioritizes quotedAmount over estimatedAmount for commitments", () => {
    const expenses: Expense[] = [
      {
        id: "exp-1",
        eventId: "event-1",
        title: "Grand Banquet Hall",
        category: "venue",
        estimatedAmount: 20000,
        quotedAmount: 25000, // Quoted is committed
        actualAmount: 10000, // Advance paid
        paymentStatus: "partially_paid",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const summary = calculateBudgetSummary(50000, expenses);
    expect(summary.totalEstimated).toBe(25000);
    expect(summary.totalActual).toBe(10000);
    expect(summary.totalRemaining).toBe(25000);
    expect(summary.isOverBudget).toBe(false);
  });

  it("detects over-budget situation accurately and calculates exact overage", () => {
    const expenses: Expense[] = [
      {
        id: "exp-1",
        eventId: "event-1",
        title: "Royal Catering Buffet",
        category: "catering",
        estimatedAmount: 35000,
        actualAmount: 35000,
        paymentStatus: "paid",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "exp-2",
        eventId: "event-1",
        title: "Floral Stage Décor",
        category: "decoration",
        estimatedAmount: 20000,
        actualAmount: 0,
        paymentStatus: "unpaid",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Total expenses = 55,000 against a 50,000 budget
    const summary = calculateBudgetSummary(50000, expenses);
    expect(summary.totalEstimated).toBe(55000);
    expect(summary.totalRemaining).toBe(-5000);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.overBudgetAmount).toBe(5000);
  });

  it("accounts for contingency reserve in unallocated budget computation", () => {
    const allocations: BudgetCategoryAllocation[] = [
      { category: "catering", label: "Catering", allocatedAmount: 30000, percentage: 60 },
      { category: "decoration", label: "Décor", allocatedAmount: 10000, percentage: 20 },
    ];

    const contingencyReserve = 5000;
    const summary = calculateBudgetSummary(50000, [], contingencyReserve, allocations);

    expect(summary.totalAllocated).toBe(40000);
    expect(summary.contingencyReserve).toBe(5000);
    // Unallocated = 50,000 - 40,000 - 5,000 = 5,000
    expect(summary.unallocatedAmount).toBe(5000);
  });

  it("computes category balances and remaining allowances correctly", () => {
    const allocations: BudgetCategoryAllocation[] = [
      { category: "catering", label: "Food & Drinks", allocatedAmount: 20000, percentage: 40 },
    ];

    const expenses: Expense[] = [
      {
        id: "exp-1",
        eventId: "event-1",
        title: "Dinner Buffet",
        category: "catering",
        estimatedAmount: 15000,
        actualAmount: 5000,
        paymentStatus: "partially_paid",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const summary = calculateBudgetSummary(50000, expenses, 0, allocations);
    const cateringCat = summary.categories.find((c) => c.category === "catering");

    expect(cateringCat).toBeDefined();
    expect(cateringCat?.allocated).toBe(20000);
    expect(cateringCat?.estimated).toBe(15000);
    expect(cateringCat?.actual).toBe(5000);
    expect(cateringCat?.remaining).toBe(5000); // 20000 - 15000
  });
});

describe("AI Budget Reality Check — generateBudgetAlternatives", () => {
  it("returns empty alternatives if not over budget", () => {
    const expenses: Expense[] = [
      {
        id: "exp-1",
        eventId: "event-1",
        title: "Flowers",
        category: "decoration",
        estimatedAmount: 5000,
        paymentStatus: "unpaid",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    const alts = generateBudgetAlternatives(expenses, 0);
    expect(alts).toEqual([]);
  });

  it("suggests realistic category-specific cost reductions when over budget", () => {
    const expenses: Expense[] = [
      {
        id: "exp-decor",
        eventId: "event-1",
        title: "Grand Stage Florals",
        category: "decoration",
        estimatedAmount: 20000,
        paymentStatus: "unpaid",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "exp-cater",
        eventId: "event-1",
        title: "5-Course Gourmet Dinner",
        category: "catering",
        estimatedAmount: 30000,
        paymentStatus: "unpaid",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const alts = generateBudgetAlternatives(expenses, 8000);
    expect(alts.length).toBeGreaterThan(0);

    const decorAlt = alts.find((a) => a.affectedCategory === "decoration");
    expect(decorAlt).toBeDefined();
    expect(decorAlt?.savingsAmount).toBeGreaterThan(0);
    expect(decorAlt?.newEstimate).toBeLessThan(decorAlt?.originalEstimate || 0);
  });
});
