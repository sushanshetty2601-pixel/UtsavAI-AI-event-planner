"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/contexts/app-context";
import { AppShell } from "@/components/app-shell";
import { formatCurrency, CATEGORY_LABELS } from "@/lib/utils";
import { ExpenseCategory, BudgetCategoryAllocation, ChatMessage, TaskCategory, TaskPriority } from "@/types";
import {
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Check,
  Plus,
  Coins,
  Clock,
  Calendar,
  Users,
  MapPin,
  Bot,
  User,
  ArrowRight,
  WalletCards,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";

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

function AllocationBuilderCard({
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

function FormattedMessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <div className="whitespace-pre-wrap font-sans">{content}</div>;
  }

  const lines = content.split("\n");
  return (
    <div className="space-y-1.5 font-sans leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-serif text-sm font-bold text-foreground mt-2 mb-1">
              {trimmed.replace(/^###\s+/, "")}
            </h4>
          );
        }

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ");
        const cleanLine = isBullet ? trimmed.replace(/^(?:•|-)\s*/, "") : line;
        const parts = cleanLine.split(/(\*\*.*?\*\*|\*.*?\*)/g);

        return (
          <div key={idx} className={isBullet ? "flex items-start gap-1.5 pl-1" : ""}>
            {isBullet && <span className="text-primary font-bold mt-0.5">•</span>}
            <div>
              {parts.map((part, pIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={pIdx} className="font-bold text-foreground">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                if (part.startsWith("*") && part.endsWith("*")) {
                  return (
                    <em key={pIdx} className="italic text-muted-foreground">
                      {part.slice(1, -1)}
                    </em>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaymentActionCard({
  paymentAction,
  currencySymbol,
  onRecord,
}: {
  paymentAction: NonNullable<ChatMessage["actionData"]>["paymentAction"] extends infer T ? T extends undefined ? never : T : never;
  currencySymbol: string;
  onRecord: (details: Record<string, unknown>) => void;
}) {
  const [recorded, setRecorded] = useState(false);

  if (paymentAction.action === "payment_inquiry" && paymentAction.inquirySummary) {
    const s = paymentAction.inquirySummary;
    return (
      <div className="mt-2.5 p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-border/70 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs text-foreground">Financial Ledger Balances</span>
          </div>
          <Link href="/vendors" className="text-[11px] font-semibold text-primary hover:underline">
            Manage Vendors →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] p-2 rounded-xl bg-muted/40">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Paid</span>
            <span className="font-bold text-sage">{currencySymbol}{s.totalPaid.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Committed</span>
            <span className="font-bold text-foreground">{currencySymbol}{s.totalQuoted.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Outstanding</span>
            <span className={`font-bold ${s.remainingPayable > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
              {currencySymbol}{s.remainingPayable.toLocaleString()}
            </span>
          </div>
        </div>

        {s.items && s.items.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {s.items.map((it: { name: string; category: string; quoted: number; paid: number; remaining: number; status: string }, i: number) => (
              <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-border/40 last:border-0">
                <div>
                  <span className="font-semibold text-foreground">{it.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5 capitalize">({it.category})</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">{currencySymbol}{it.paid.toLocaleString()}</span>
                  <span className="text-muted-foreground text-[10px]"> / {currencySymbol}{it.quoted.toLocaleString()}</span>
                  <span
                    className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                      it.status === "Paid in Full"
                        ? "bg-sage/15 text-sage font-semibold"
                        : it.status === "Partially Paid"
                        ? "bg-amber-500/15 text-amber-500 font-semibold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {it.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (paymentAction.action === "record_payment" && paymentAction.details) {
    const d = paymentAction.details;

    return (
      <div className="mt-2.5 p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-border/70 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-xs text-foreground">Record Payment to Ledger</span>
              {d.isAdvance && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-semibold">
                  Advance Deposit
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {d.category || "General"}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Payee / Vendor</span>
            <p className="font-serif text-sm font-bold text-foreground">{d.vendorName}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Payment Amount</span>
            <p className="font-sans text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              +{currencySymbol}{d.amount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] p-2 rounded-xl bg-muted/40">
          <div>
            <span className="text-muted-foreground block text-[10px]">Previously Paid</span>
            <span className="font-semibold text-foreground">{currencySymbol}{(d.previousPaid || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">New Total Paid</span>
            <span className="font-bold text-sage">{currencySymbol}{(d.newTotalPaid || d.amount).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">Balance Left</span>
            <span className={`font-semibold ${(d.remainingPayable || 0) > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
              {currencySymbol}{(d.remainingPayable || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-muted-foreground">
            Status: <span className="font-bold text-foreground capitalize">{d.paymentStatus?.replace("_", " ") || "Recorded"}</span>
          </div>
          <button
            onClick={() => {
              onRecord(d);
              setRecorded(true);
            }}
            disabled={recorded}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              recorded
                ? "bg-sage/15 text-sage border border-sage/30 cursor-default"
                : "gradient-cta text-white hover:opacity-95 active:scale-95"
            }`}
          >
            {recorded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Recorded to Ledger</span>
              </>
            ) : (
              <>
                <Coins className="w-3.5 h-3.5" />
                <span>Confirm & Record to Ledger</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function AIPlannerPage() {
  const {
    activeEvent,
    chatMessages,
    sendChatMessage,
    clearChat,
    isChatLoading,
    createExpense,
    createTask,
    updateExpense,
    saveCategoryAllocations,
    recordPayment,
    expenses,
    budgetSummary,
    loadDemoEvent,
  } = useApp();

  const [inputPrompt, setInputPrompt] = useState("");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  // If no event exists, show welcoming empty state
  if (!activeEvent) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 max-w-xl mx-auto py-12">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl shadow-card">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground">
            AI Celebration Planner
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Create an event or load our sample to start conversing with your personal AI celebration copilot.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={loadDemoEvent}
              className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
            >
              Load Demo Event
            </button>
            <Link
              href="/wizard"
              className="px-5 py-2.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
            >
              + Create New Event
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const currencySymbol = activeEvent.currency?.symbol || "₹";
  const currencyCode = activeEvent.currency?.code || "INR";

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isChatLoading) return;
    const prompt = inputPrompt;
    setInputPrompt("");
    await sendChatMessage(prompt);
  };

  const handleApplySuggestedExpense = (sExpense: { title: string; category: ExpenseCategory; amount: number }) => {
    createExpense({
      eventId: activeEvent.id,
      title: sExpense.title,
      category: sExpense.category,
      estimatedAmount: sExpense.amount,
      quotedAmount: sExpense.amount,
      actualAmount: 0,
      paymentStatus: "unpaid",
      notes: "Added via UtsavAI Planner conversation",
    });
    setActionFeedback(`Added "${sExpense.title}" to Budget!`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleApplySuggestedTask = (sTask: { title: string; category?: TaskCategory; priority?: TaskPriority }) => {
    createTask({
      eventId: activeEvent.id,
      title: sTask.title,
      category: sTask.category || "planning",
      priority: sTask.priority || "medium",
      status: "pending",
      dueDate: activeEvent.date || new Date().toISOString().split("T")[0],
      notes: "Created via UtsavAI Planner assistant",
    });
    setActionFeedback(`Added task "${sTask.title}" to Timeline!`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleRecordPayment = (details: {
    vendorId?: string;
    category?: ExpenseCategory;
    vendorName?: string;
    amount?: number;
    isAdvance?: boolean;
    message?: string;
  }) => {
    if (!activeEvent || !details.amount || !details.vendorName) return;
    recordPayment({
      eventId: activeEvent.id,
      vendorId: details.vendorId,
      category: details.category || "catering",
      recipientName: details.vendorName,
      amount: details.amount,
      currency: activeEvent.currency,
      paymentDate: new Date().toISOString().split("T")[0],
      isAdvance: details.isAdvance || false,
      source: "ai-recorded",
      notes: details.message || `Payment recorded via AI Copilot`,
    });
    setActionFeedback(
      `Recorded payment of ${currencySymbol}${details.amount.toLocaleString()} to ${details.vendorName}!`
    );
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const promptSuggestions = [
    "I have paid the caterer ₹80,000 today",
    "How much have I paid so far?",
    "Allocate ₹1,00,000 as follows: cake ₹10,000, food and beverages ₹20,000, decorations ₹50,000, other expenses ₹10,000 and contingency reserve ₹10,000",
    "How can I reduce catering costs without compromising quality?",
    "Suggest decor and floral centerpieces within my budget",
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl gradient-cta flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                Plan with UtsavAI
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your conversational celebration copilot. Ask anything, set preferences, and let AI update your budget and tasks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {chatMessages.length > 0 && (
              <button
                onClick={clearChat}
                className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 transition-colors"
                title="Clear conversation history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Chat</span>
              </button>
            )}
            <Link
              href="/budget"
              className="px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Coins className="w-3.5 h-3.5 text-primary" />
              <span>Budget: {currencySymbol}{budgetSummary.totalEstimated.toLocaleString()}</span>
            </Link>
          </div>
        </div>

        {/* Compact Event Context Chip Bar */}
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-card border border-border text-xs text-muted-foreground shadow-xs">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {activeEvent.title}
          </span>
          <span className="text-border">•</span>
          <span className="capitalize">{activeEvent.occasion}</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-primary" />
            {activeEvent.guestCount} Guests
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {activeEvent.date}
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {activeEvent.location || "India"}
          </span>
          <span className="text-border">•</span>
          <span className="font-semibold text-primary">
            Target Budget: {currencySymbol}{activeEvent.budget.toLocaleString()}
          </span>
        </div>

        {/* Toast Notification for Added Actions */}
        {actionFeedback && (
          <div className="p-3 rounded-xl bg-sage/15 border border-sage/30 text-sage text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Conversational Stream Card */}
        <div className="rounded-3xl border border-border bg-card shadow-card min-h-[420px] max-h-[580px] flex flex-col overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="py-12 text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl">
                  ✨
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-bold text-foreground">
                    Start Planning Your Celebration
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ask UtsavAI to suggest creative concepts, draft timelines, optimize expenses, or recommend decor tailored specifically for {activeEvent.title}.
                  </p>
                </div>

                <div className="pt-2 text-left space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Quick suggestions:
                  </p>
                  {promptSuggestions.slice(0, 3).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setInputPrompt(prompt)}
                      className="w-full text-left p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-xs text-foreground transition-all flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                        isUser
                          ? "bg-primary text-white"
                          : "gradient-cta text-white"
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                        isUser
                          ? "bg-primary text-white rounded-tr-xs"
                          : "bg-muted/50 border border-border text-foreground rounded-tl-xs shadow-xs"
                      }`}
                    >
                      {/* Message Content formatted with linebreaks and markdown */}
                      <FormattedMessageContent content={msg.content} isUser={isUser} />

                      {/* Action buttons if AI suggested concrete records */}
                      {!isUser && msg.actionData && (
                        <div className="pt-2 border-t border-border/60 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {msg.actionData.suggestedExpense && (
                              <button
                                onClick={() => {
                                  if (msg.actionData?.suggestedExpense) {
                                    handleApplySuggestedExpense(msg.actionData.suggestedExpense);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg gradient-cta text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                              >
                                <Plus className="w-3 h-3" />
                                <span>
                                  Add Expense: {msg.actionData.suggestedExpense.title} (+{currencySymbol}
                                  {msg.actionData.suggestedExpense.amount.toLocaleString()})
                                </span>
                              </button>
                            )}
                            {msg.actionData.suggestedTask && (
                              <button
                                onClick={() => {
                                  if (msg.actionData?.suggestedTask) {
                                    handleApplySuggestedTask(msg.actionData.suggestedTask);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                              >
                                <Clock className="w-3 h-3 text-primary" />
                                <span>Add Task: {msg.actionData.suggestedTask.title}</span>
                              </button>
                            )}
                          </div>

                          {/* Payment Ledger Action Card */}
                          {msg.actionData.paymentAction && (
                            <PaymentActionCard
                              paymentAction={msg.actionData.paymentAction}
                              currencySymbol={currencySymbol}
                              onRecord={handleRecordPayment}
                            />
                          )}

                          {/* Full Interactive Budget Allocation Builder */}
                          {msg.actionData.suggestedAllocation && (
                            <AllocationBuilderCard
                              initialData={msg.actionData.suggestedAllocation}
                              eventBudget={activeEvent.budget}
                              currencySymbol={currencySymbol}
                              onSave={(allocs, tBudget, cReserve) => {
                                saveCategoryAllocations(allocs, tBudget, cReserve);
                                setActionFeedback("Budget allocations saved directly to active event!");
                                setTimeout(() => setActionFeedback(null), 4000);
                              }}
                            />
                          )}
                        </div>
                      )}

                      <div
                        className={`text-[10px] ${
                          isUser ? "text-white/70" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Thinking / Loading indicator */}
            {isChatLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full gradient-cta text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl rounded-tl-xs bg-muted/60 border border-border p-3.5 text-xs text-muted-foreground flex items-center gap-2 shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>UtsavAI is crafting your tailored response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Shortcut Pills (Above Input) */}
          <div className="px-4 py-2 border-t border-border/60 bg-muted/20 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
              Suggestions:
            </span>
            {promptSuggestions.map((suggestion, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputPrompt(suggestion)}
                className="px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Bottom Prominent AI Prompt Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 sm:p-4 border-t border-border bg-card flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={2}
                placeholder={`Ask UtsavAI to plan, optimize, or revise ${activeEvent.title}... (Shift+Enter for newline)`}
                className="w-full px-4 py-2.5 rounded-2xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!inputPrompt.trim() || isChatLoading}
              className="px-5 py-3 rounded-2xl gradient-cta text-white font-bold text-sm shadow-md hover:opacity-95 disabled:opacity-50 flex items-center gap-2 transition-all shrink-0"
            >
              {isChatLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Ask UtsavAI</span>
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
