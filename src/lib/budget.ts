import { Expense, BudgetSummary, BudgetAlternative, ExpenseCategory, BudgetCategoryAllocation } from "@/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "./utils";

export function calculateBudgetSummary(
  budget: number,
  expenses: Expense[],
  contingencyReserve: number = 0,
  categoryAllocations?: BudgetCategoryAllocation[]
): BudgetSummary {
  const safeBudget = Math.max(0, Number(budget) || 0);
  const safeContingency = Math.max(0, Number(contingencyReserve) || 0);

  // Total planned/committed is the sum of quoted amount (if entered) or estimated amount
  const totalEstimated = expenses.reduce((sum, item) => {
    const val = item.quotedAmount !== undefined && item.quotedAmount !== null && !isNaN(item.quotedAmount)
      ? item.quotedAmount
      : item.estimatedAmount || 0;
    return sum + Math.max(0, val);
  }, 0);

  // Total actual cash paid or disbursed
  const totalActual = expenses.reduce((sum, item) => {
    const val = item.actualAmount || 0;
    return sum + Math.max(0, val);
  }, 0);

  const isOverBudget = totalEstimated > safeBudget;
  const overBudgetAmount = isOverBudget ? totalEstimated - safeBudget : 0;
  const totalRemaining = safeBudget - totalEstimated;

  // Group expenses by category
  const expenseMap = new Map<ExpenseCategory, { estimated: number; actual: number }>();
  for (const exp of expenses) {
    const planned = exp.quotedAmount !== undefined && exp.quotedAmount !== null && !isNaN(exp.quotedAmount)
      ? exp.quotedAmount
      : exp.estimatedAmount || 0;
    const actual = exp.actualAmount || 0;

    const current = expenseMap.get(exp.category) || { estimated: 0, actual: 0 };
    expenseMap.set(exp.category, {
      estimated: current.estimated + Math.max(0, planned),
      actual: current.actual + Math.max(0, actual),
    });
  }

  const hasExplicitAllocations = Array.isArray(categoryAllocations) && categoryAllocations.length > 0;
  let totalAllocated = 0;
  let categories: BudgetSummary["categories"] = [];

  if (hasExplicitAllocations) {
    // 1. Process explicit allocations
    const processedCategories = new Set<ExpenseCategory>();

    categoryAllocations!.forEach((alloc) => {
      processedCategories.add(alloc.category);
      const allocatedAmount = Math.max(0, Number(alloc.allocatedAmount) || 0);
      totalAllocated += allocatedAmount;

      const exp = expenseMap.get(alloc.category) || { estimated: 0, actual: 0 };
      const percentage = safeBudget > 0 ? Math.round((allocatedAmount / safeBudget) * 100) : 0;

      categories.push({
        category: alloc.category,
        label: alloc.label || CATEGORY_LABELS[alloc.category] || alloc.category,
        allocated: allocatedAmount,
        estimated: exp.estimated,
        actual: exp.actual,
        remaining: allocatedAmount - exp.estimated,
        percentage,
        color: CATEGORY_COLORS[alloc.category] || "#9782E8",
        notes: alloc.notes,
      });
    });

    // 2. Include any expenses in categories without an explicit allocation
    expenseMap.forEach((expVal, cat) => {
      if (!processedCategories.has(cat)) {
        categories.push({
          category: cat,
          label: CATEGORY_LABELS[cat] || cat,
          allocated: 0,
          estimated: expVal.estimated,
          actual: expVal.actual,
          remaining: 0 - expVal.estimated,
          percentage: 0,
          color: CATEGORY_COLORS[cat] || "#9782E8",
        });
      }
    });

    // Sort: categories with allocations first (descending by allocated), then unallocated
    categories.sort((a, b) => b.allocated - a.allocated || b.estimated - a.estimated);
  } else {
    // No explicit allocations saved yet: derive categories solely from expenses
    categories = Array.from(expenseMap.entries()).map(([cat, values]) => {
      const pct = totalEstimated > 0 ? Math.round((values.estimated / totalEstimated) * 100) : 0;
      return {
        category: cat,
        label: CATEGORY_LABELS[cat] || cat,
        allocated: 0,
        estimated: values.estimated,
        actual: values.actual,
        remaining: 0 - values.estimated,
        percentage: pct,
        color: CATEGORY_COLORS[cat] || "#9782E8",
      };
    });

    categories.sort((a, b) => b.estimated - a.estimated);
  }

  const unallocatedAmount = safeBudget - totalAllocated - safeContingency;

  return {
    totalBudget: safeBudget,
    totalEstimated,
    totalActual,
    totalRemaining,
    totalAllocated,
    unallocatedAmount,
    contingencyReserve: safeContingency,
    isOverBudget,
    overBudgetAmount,
    categories,
  };
}

/**
 * Intelligent Budget Reality Check: Evaluates overspending and computes
 * specific, actionable cost-saving proposals based on current expenses.
 */
export function generateBudgetAlternatives(
  expenses: Expense[],
  overBudgetAmount: number
): BudgetAlternative[] {
  if (overBudgetAmount <= 0) return [];

  const alternatives: BudgetAlternative[] = [];

  // Look for high-spending categories that can be trimmed
  const sortedExpenses = [...expenses].sort((a, b) => {
    const amtA = a.quotedAmount ?? a.estimatedAmount;
    const amtB = b.quotedAmount ?? b.estimatedAmount;
    return amtB - amtA;
  });

  for (const exp of sortedExpenses) {
    const current = exp.quotedAmount ?? exp.estimatedAmount;
    if (current <= 1000) continue; // Skip minimal expenses

    let title = "";
    let desc = "";
    let savings = 0;

    switch (exp.category) {
      case "decoration":
        savings = Math.min(1500, Math.round(current * 0.25));
        title = "Opt for a simpler decoration package";
        desc = `Scale back to essential floral accents and LED fairy lights. Saves ${savings} without sacrificing aesthetic beauty.`;
        break;
      case "catering":
        savings = Math.min(1000, Math.round(current * 0.15));
        title = "Choose a more economical menu";
        desc = `Streamline dessert and starter counters from 4 to 2 options. Saves ${savings} while maintaining gourmet taste.`;
        break;
      case "entertainment":
        savings = Math.min(800, Math.round(current * 0.4));
        title = "Reduce entertainment expenses";
        desc = `Shift from live accompaniment to curated professional acoustic playlist with high-fidelity sound. Saves ${savings}.`;
        break;
      case "photography":
        savings = Math.min(1200, Math.round(current * 0.3));
        title = "Consider a tailored photography session";
        desc = `Focus coverage on key event moments (cake cutting, family portraits) for 2 hours rather than whole evening. Saves ${savings}.`;
        break;
      case "venue":
        savings = Math.min(1200, Math.round(current * 0.2));
        title = "Consider a different venue option";
        desc = `Negotiate weekday rate or adjust booking slot by 30 mins to avoid peak hall surcharges. Saves ${savings}.`;
        break;
      default:
        savings = Math.min(600, Math.round(current * 0.2));
        title = `Optimize ${CATEGORY_LABELS[exp.category]} costs`;
        desc = `Reduce miscellaneous non-essential accessories. Saves ${savings}.`;
        break;
    }

    if (savings > 0) {
      alternatives.push({
        id: `alt-${exp.id}`,
        title,
        description: desc,
        savingsAmount: savings,
        affectedCategory: exp.category,
        newEstimate: Math.max(0, current - savings),
        originalEstimate: current,
        expenseId: exp.id,
      });
    }
  }

  return alternatives;
}
