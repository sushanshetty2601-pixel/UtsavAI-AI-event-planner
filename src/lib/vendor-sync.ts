import { Vendor, Expense, ExpenseCategory } from "@/types";
import { expenseService } from "@/lib/storage";

/**
 * Bi-directionally synchronizes vendor quotes & payments with itemized expenses.
 */
export function syncVendorsWithExpenses(
  vendorsList: Vendor[],
  expensesList: Expense[],
  eventId: string
): Expense[] {
  const updatedExpenses = [...expensesList];

  for (const v of vendorsList.filter((v) => v.eventId === eventId)) {
    const expCat: ExpenseCategory =
      v.category === "other" ? "miscellaneous" : (v.category as ExpenseCategory);

    const paidAmt =
      v.paymentStatus === "paid"
        ? (v.actualAmount && v.actualAmount > 0 ? v.actualAmount : (v.quotedAmount || 0))
        : (v.actualAmount || 0);

    const existingIdx = updatedExpenses.findIndex(
      (e) => e.vendorId === v.id || (e.title === v.name && e.category === expCat)
    );

    if (existingIdx !== -1) {
      const exp = updatedExpenses[existingIdx];
      if (
        exp.actualAmount !== paidAmt ||
        exp.quotedAmount !== (v.quotedAmount || 0) ||
        exp.paymentStatus !== v.paymentStatus ||
        !exp.vendorId
      ) {
        const synced = expenseService.update(exp.id, {
          title: v.name,
          category: expCat,
          quotedAmount: v.quotedAmount || 0,
          estimatedAmount: v.quotedAmount || 0,
          actualAmount: paidAmt,
          paymentStatus: v.paymentStatus,
          vendorId: v.id,
          notes: `Vendor Booking (${v.bookingStatus.toUpperCase()}) • ${v.name}`,
        });
        if (synced) {
          updatedExpenses[existingIdx] = synced;
        }
      }
    } else if (
      (v.quotedAmount && v.quotedAmount > 0) ||
      paidAmt > 0 ||
      v.bookingStatus === "confirmed"
    ) {
      const newExp = expenseService.create({
        eventId: v.eventId,
        title: v.name,
        category: expCat,
        quotedAmount: v.quotedAmount || 0,
        estimatedAmount: v.quotedAmount || 0,
        actualAmount: paidAmt,
        paymentStatus: v.paymentStatus,
        vendorId: v.id,
        notes: `Vendor Booking (${v.bookingStatus.toUpperCase()}) • ${v.name}`,
      });
      updatedExpenses.push(newExp);
    }
  }

  return updatedExpenses;
}
