"use client";

import React, { useState, useEffect } from "react";
import { Expense, ExpenseCategory, PaymentStatus } from "@/types";
import { X } from "lucide-react";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: {
    title: string;
    category: ExpenseCategory;
    estimatedAmount: number;
    quotedAmount: number;
    actualAmount: number;
    paymentStatus: PaymentStatus;
    notes: string;
  }) => void;
  editingExpense: Expense | null;
  currencyCode: string;
}

function ExpenseModalContent({
  onClose,
  onSave,
  editingExpense,
  currencyCode,
}: Omit<ExpenseModalProps, "isOpen">) {
  const [title, setTitle] = useState(editingExpense?.title || "");
  const [category, setCategory] = useState<ExpenseCategory>(editingExpense?.category || "catering");
  const [estimatedAmount, setEstimatedAmount] = useState<number>(editingExpense?.estimatedAmount || 0);
  const [quotedAmount, setQuotedAmount] = useState<number>(editingExpense?.quotedAmount || 0);
  const [actualAmount, setActualAmount] = useState<number>(editingExpense?.actualAmount || 0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(editingExpense?.paymentStatus || "unpaid");
  const [notes, setNotes] = useState(editingExpense?.notes || "");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      category,
      estimatedAmount,
      quotedAmount,
      actualAmount,
      paymentStatus,
      notes: notes.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 id="expense-modal-title" className="font-serif text-xl font-bold text-foreground">
            {editingExpense ? "Edit Expense" : "Add New Expense"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label htmlFor="expense-title-input" className="block font-semibold text-foreground mb-1">
              Expense Title *
            </label>
            <input
              id="expense-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Wedding Mandap & Floral Styling"
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="expense-category-select" className="block font-semibold text-foreground mb-1">
                Category
              </label>
              <select
                id="expense-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background"
              >
                <option value="catering">Catering & Food</option>
                <option value="decoration">Decor & Florals</option>
                <option value="venue">Venue</option>
                <option value="photography">Photography</option>
                <option value="cake">Cake & Desserts</option>
                <option value="entertainment">Music & Entertainment</option>
                <option value="invitations">Invitations</option>
                <option value="transport">Transport</option>
                <option value="attire">Attire & Styling</option>
                <option value="miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label htmlFor="expense-payment-status" className="block font-semibold text-foreground mb-1">
                Payment Status
              </label>
              <select
                id="expense-payment-status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background"
              >
                <option value="unpaid">Unpaid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Fully Paid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="expense-estimated-input" className="block font-semibold text-foreground mb-1">
                Estimated ({currencyCode})
              </label>
              <input
                id="expense-estimated-input"
                type="number"
                min={0}
                value={estimatedAmount}
                onChange={(e) => setEstimatedAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
              />
            </div>
            <div>
              <label htmlFor="expense-quoted-input" className="block font-semibold text-foreground mb-1">
                Quoted ({currencyCode})
              </label>
              <input
                id="expense-quoted-input"
                type="number"
                min={0}
                value={quotedAmount}
                onChange={(e) => setQuotedAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
              />
            </div>
            <div>
              <label htmlFor="expense-actual-input" className="block font-semibold text-foreground mb-1">
                Actual Paid ({currencyCode})
              </label>
              <input
                id="expense-actual-input"
                type="number"
                min={0}
                value={actualAmount}
                onChange={(e) => setActualAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
              />
            </div>
          </div>

          <div>
            <label htmlFor="expense-notes-input" className="block font-semibold text-foreground mb-1">
              Notes / Vendor Context
            </label>
            <input
              id="expense-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Includes setup, teardown & service staff"
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl gradient-cta text-white font-bold shadow-xs hover:opacity-95 transition-opacity"
            >
              {editingExpense ? "Save Changes" : "Create Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ExpenseModal(props: ExpenseModalProps) {
  if (!props.isOpen) return null;
  return <ExpenseModalContent {...props} key={props.editingExpense?.id || "new-expense"} />;
}
