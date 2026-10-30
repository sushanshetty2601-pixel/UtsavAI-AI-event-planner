"use client";

import React, { useState } from "react";
import { ExpenseCategory, BudgetCategoryAllocation } from "@/types";
import { Plus, Trash2, Check, SlidersHorizontal, CheckCircle2, WalletCards } from "lucide-react";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/utils";

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: "catering", label: "Food & Beverages" },
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

interface AllocationRow {
  id: string;
  category: ExpenseCategory;
  label: string;
  allocatedAmount: number;
}

export function AllocationBuilderCard({
  initialData,
  eventBudget,
  currencySymbol,
  onSave,
}: {
  initialData: {
    totalBudget?: number;
    contingencyReserve?: number;
    categories: {
      category: ExpenseCategory;
      label: string;
      allocatedAmount: number;
      notes?: string;
    }[];
  };
  eventBudget: number;
  currencySymbol: string;
  onSave: (allocations: BudgetCategoryAllocation[], totalBudget: number, contingencyReserve: number) => void;
}) {
  const [totalBudget, setTotalBudget] = useState<number>(
    initialData.totalBudget && initialData.totalBudget > 0
      ? initialData.totalBudget
      : eventBudget || 50000
  );
  const [contingencyReserve, setContingencyReserve] = useState<number>(
    initialData.contingencyReserve !== undefined ? initialData.contingencyReserve : 0
  );
  const [rows, setRows] = useState<AllocationRow[]>(
    initialData.categories.map((c, idx) => ({
      id: `row-${idx}-${c.category}`, 
      category: c.category,
      label: c.label || CATEGORY_LABELS[c.category] || c.category,
      allocatedAmount: c.allocatedAmount || 0,
    }))
  );
  const [isSaved, setIsSaved] = useState(false);

  const sumAllocated = rows.reduce((sum, r) => sum + (Number(r.allocatedAmount) || 0), 0);
  const grandTotal = sumAllocated + (Number(contingencyReserve) || 0);
  const unallocatedBalance = totalBudget - grandTotal;
  const isOverBudget = grandTotal > totalBudget;

  const handleRowAmountChange = (id: string, amount: number) => {
    setIsSaved(false);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, allocatedAmount: Math.max(0, amount) } : r))
    );
  };

  const handleRowCategoryChange = (id: string, category: ExpenseCategory) => {
    setIsSaved(false);
    const catObj = CATEGORY_OPTIONS.find((c) => c.value === category);
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              category,
              label: catObj ? catObj.label : category,
            }
          : r
      )
    );
  };

  const handleRowLabelChange = (id: string, label: string) => {
    setIsSaved(false);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, label } : r)));
  };

  const handleAddRow = () => {
    setIsSaved(false);
    const available = CATEGORY_OPTIONS.find(
      (opt) => !rows.some((r) => r.category === opt.value)
    ) || CATEGORY_OPTIONS[0];

    const newAmount = unallocatedBalance > 0 ? unallocatedBalance : 1000;
    setRows((prev) => [
      ...prev,
      {
        id: `row-new-${Date.now()}`,
        category: available.value,
        label: available.label,
        allocatedAmount: newAmount,
      },
    ]);
  };

  const handleDeleteRow = (id: string) => {
    setIsSaved(false);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveToEvent = () => {
    const allocations: BudgetCategoryAllocation[] = rows.map((r) => {
      const pct = totalBudget > 0 ? Math.round((r.allocatedAmount / totalBudget) * 100) : 0;
      return {
        category: r.category,
        label: r.label,
        allocatedAmount: r.allocatedAmount,
        percentage: pct,
      };
    });

    onSave(allocations, totalBudget, contingencyReserve);
    setIsSaved(true);
  };

  return (
    <div className="w-full mt-3 rounded-2xl border border-primary/30 bg-card p-4 sm:p-5 shadow-card space-y-4 text-xs">
      {/* Builder Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-cta flex items-center justify-center text-white shadow-xs">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-foreground">
              Editable Budget Allocation Builder
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Define category caps without affecting actual expenses. Edit amounts or add new categories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
              isOverBudget
                ? "bg-red-500/10 text-red-500 border-red-500/20"
                : unallocatedBalance === 0
                ? "bg-sage/15 text-sage border-sage/30"
                : "bg-primary/10 text-primary border-primary/20"
            }`}
          >
            {isOverBudget
              ? `Over Target by ${currencySymbol}${Math.abs(unallocatedBalance).toLocaleString()}`
              : unallocatedBalance === 0
              ? "100% Perfectly Balanced"
              : `Unallocated: ${currencySymbol}${unallocatedBalance.toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* Target Budget Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/80">
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            Target Event Budget ({currencySymbol})
          </label>
          <input
            type="number"
            min={0}
            value={totalBudget}
            onChange={(e) => {
              setIsSaved(false);
              setTotalBudget(Math.max(0, Number(e.target.value) || 0));
            }}
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background font-bold text-foreground text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            Contingency Reserve ({currencySymbol})
          </label>
          <input
            type="number"
            min={0}
            value={contingencyReserve}
            onChange={(e) => {
              setIsSaved(false);
              setContingencyReserve(Math.max(0, Number(e.target.value) || 0));
            }}
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background font-bold text-foreground text-xs"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          <div className="col-span-4 sm:col-span-3">Category</div>
          <div className="col-span-4 sm:col-span-4">Display Label</div>
          <div className="col-span-3 sm:col-span-3 text-right">Allocated ({currencySymbol})</div>
          <div className="col-span-1 sm:col-span-2 text-center">Share / Action</div>
        </div>

        <div className="space-y-1.5">
          {rows.map((row) => {
            const pct = totalBudget > 0 ? Math.round((row.allocatedAmount / totalBudget) * 100) : 0;
            return (
              <div
                key={row.id}
                className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-muted/20 border border-border hover:border-primary/40 transition-colors"
              >
                <div className="col-span-4 sm:col-span-3">
                  <select
                    value={row.category}
                    onChange={(e) => handleRowCategoryChange(row.id, e.target.value as ExpenseCategory)}
                    className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-[11px] font-medium"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4 sm:col-span-4">
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => handleRowLabelChange(row.id, e.target.value)}
                    placeholder="Category title"
                    className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-[11px]"
                  />
                </div>

                <div className="col-span-3 sm:col-span-3">
                  <input
                    type="number"
                    min={0}
                    value={row.allocatedAmount}
                    onChange={(e) => handleRowAmountChange(row.id, Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-right font-bold text-foreground text-[11px]"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 flex items-center justify-end sm:justify-between gap-1">
                  <span className="hidden sm:inline text-[10px] font-bold text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted">
                    {pct}%
                  </span>
                  <button
                    onClick={() => handleDeleteRow(row.id)}
                    className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Remove category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleAddRow}
          className="w-full py-2 rounded-xl border border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Category Allocation</span>
        </button>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border text-[11px]">
        <div>
          <span className="text-muted-foreground">Sum Categories:</span>
          <p className="font-bold text-foreground">
            {currencySymbol}{sumAllocated.toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Reserve:</span>
          <p className="font-bold text-foreground">
            {currencySymbol}{contingencyReserve.toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Total Budgeted:</span>
          <p className="font-bold text-foreground">
            {currencySymbol}{grandTotal.toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Remaining Cap:</span>
          <p className={`font-bold ${isOverBudget ? "text-red-500" : "text-sage"}`}>
            {currencySymbol}{unallocatedBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border">
        {isSaved ? (
          <div className="flex items-center gap-2 text-sage text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Budget allocations successfully saved to active event!</span>
            <Link
              href="/budget"
              className="ml-2 underline text-primary hover:text-primary/80 font-bold"
            >
              View in Budget Manager →
            </Link>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">
            Allocations define category caps; actual payments are managed in Itemized Expenses.
          </div>
        )}

        <button
          onClick={handleSaveToEvent}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all ${
            isSaved
              ? "bg-sage text-white"
              : "gradient-cta text-white hover:opacity-95"
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Allocations Saved</span>
            </>
          ) : (
            <>
              <WalletCards className="w-4 h-4" />
              <span>Save Budget Allocations to Event</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
