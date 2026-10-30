"use client";

import React, { useState, useEffect } from "react";
import { ExpenseCategory, BudgetCategoryAllocation } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { SlidersHorizontal, X, Trash2, Plus } from "lucide-react";

const CATEGORY_CHOICES: { value: ExpenseCategory; label: string }[] = [
  { value: "catering", label: "Catering & Food" },
  { value: "decoration", label: "Decorations & Ambience" },
  { value: "venue", label: "Venue & Hospitality" },
  { value: "photography", label: "Photography & Video" },
  { value: "cake", label: "Cake & Desserts" },
  { value: "entertainment", label: "Music & Entertainment" },
  { value: "invitations", label: "Invitations & Cards" },
  { value: "transport", label: "Transport & Logistics" },
  { value: "attire", label: "Attire & Styling" },
  { value: "miscellaneous", label: "Other Expenses" },
];

interface CategoryAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (allocations: BudgetCategoryAllocation[], targetBudget: number, contingencyReserve: number) => void;
  initialBudget: number;
  initialReserve: number;
  initialAllocations: BudgetCategoryAllocation[];
  currencyCode: string;
  currencyLocale: string;
}

function CategoryAllocationModalContent({
  onClose,
  onSave,
  initialBudget,
  initialReserve,
  initialAllocations,
  currencyCode,
  currencyLocale,
}: Omit<CategoryAllocationModalProps, "isOpen">) {
  const [allocBudgetInput, setAllocBudgetInput] = useState<number>(initialBudget);
  const [allocReserveInput, setAllocReserveInput] = useState<number>(initialReserve);
  const [allocRows, setAllocRows] = useState<
    { id: string; category: ExpenseCategory; label: string; amount: number }[]
  >(() => {
    if (initialAllocations && initialAllocations.length > 0) {
      return initialAllocations.map((a, i) => ({
        id: `row-${i}-${Date.now()}`,
        category: a.category,
        label: a.label || a.category,
        amount: a.allocatedAmount || 0,
      }));
    }
    return CATEGORY_CHOICES.slice(0, 5).map((c, i) => ({
      id: `row-${i}-${Date.now()}`,
      category: c.value,
      label: c.label,
      amount: Math.round(initialBudget * 0.15),
    }));
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAllocations: BudgetCategoryAllocation[] = allocRows.map((r) => {
      const pct = allocBudgetInput > 0 ? Math.round(((Number(r.amount) || 0) / allocBudgetInput) * 100) : 0;
      return {
        category: r.category,
        label: r.label,
        allocatedAmount: Number(r.amount) || 0,
        percentage: pct,
      };
    });
    onSave(finalAllocations, allocBudgetInput, allocReserveInput);
    onClose();
  };

  const sumCaps = allocRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const total = sumCaps + (Number(allocReserveInput) || 0);
  const diff = allocBudgetInput - total;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alloc-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-cta flex items-center justify-center text-white shadow-xs">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 id="alloc-modal-title" className="font-serif text-xl font-bold text-foreground">
                Edit Category Budget Allocations
              </h3>
              <p className="text-xs text-muted-foreground">
                Configure target caps for each vendor category and contingency reserve.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border">
            <div>
              <label htmlFor="alloc-budget-input" className="block font-semibold text-foreground mb-1">
                Total Target Budget ({currencyCode})
              </label>
              <input
                id="alloc-budget-input"
                type="number"
                min={0}
                value={allocBudgetInput}
                onChange={(e) => setAllocBudgetInput(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background font-bold text-sm"
              />
            </div>
            <div>
              <label htmlFor="alloc-reserve-input" className="block font-semibold text-foreground mb-1">
                Contingency Reserve ({currencyCode})
              </label>
              <input
                id="alloc-reserve-input"
                type="number"
                min={0}
                value={allocReserveInput}
                onChange={(e) => setAllocReserveInput(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background font-bold text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-muted-foreground px-1">
              <div className="col-span-4">Category</div>
              <div className="col-span-4">Display Label</div>
              <div className="col-span-3 text-right">Target Cap ({currencyCode})</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allocRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-muted/20 border border-border"
                >
                  <div className="col-span-4">
                    <select
                      value={row.category}
                      onChange={(e) => {
                        const newCat = e.target.value as ExpenseCategory;
                        const choice = CATEGORY_CHOICES.find((c) => c.value === newCat);
                        setAllocRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id
                              ? { ...r, category: newCat, label: choice ? choice.label : newCat }
                              : r
                          )
                        );
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-xs"
                    >
                      {CATEGORY_CHOICES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-4">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) =>
                        setAllocRows((prev) =>
                          prev.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r))
                        )
                      }
                      className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-xs"
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      min={0}
                      value={row.amount}
                      onChange={(e) =>
                        setAllocRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, amount: Math.max(0, Number(e.target.value) || 0) } : r
                          )
                        )
                      }
                      className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-right font-bold text-xs"
                    />
                  </div>

                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      aria-label="Remove category row"
                      onClick={() => setAllocRows((prev) => prev.filter((r) => r.id !== row.id))}
                      className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const avail =
                  CATEGORY_CHOICES.find((c) => !allocRows.some((r) => r.category === c.value)) ||
                  CATEGORY_CHOICES[0];
                setAllocRows((prev) => [
                  ...prev,
                  {
                    id: `alloc-new-${Date.now()}`,
                    category: avail.value,
                    label: avail.label,
                    amount: 2000,
                  },
                ]);
              }}
              className="w-full py-2 rounded-xl border border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category Allocation Row</span>
            </button>
          </div>

          {/* Math Recap */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs font-medium">
            <div>
              <span>Categories + Reserve: </span>
              <strong>{formatCurrency(total, currencyCode, currencyLocale)}</strong> of{" "}
              <strong>{formatCurrency(allocBudgetInput, currencyCode, currencyLocale)}</strong>
            </div>
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${
                diff < 0
                  ? "bg-red-500/10 text-red-500"
                  : diff === 0
                  ? "bg-sage/15 text-sage"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {diff < 0
                ? `Over budget by ${formatCurrency(Math.abs(diff), currencyCode, currencyLocale)}`
                : diff === 0
                ? "100% Balanced"
                : `Buffer: ${formatCurrency(diff, currencyCode, currencyLocale)}`}
            </span>
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
              Save Category Allocations
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CategoryAllocationModal(props: CategoryAllocationModalProps) {
  if (!props.isOpen) return null;
  return <CategoryAllocationModalContent {...props} key={`${props.initialBudget}-${props.initialReserve}`} />;
}
