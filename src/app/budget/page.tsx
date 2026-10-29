"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/contexts/app-context";
import { AppShell } from "@/components/app-shell";
import { formatCurrency, CATEGORY_LABELS } from "@/lib/utils";
import { Expense, ExpenseCategory, PaymentStatus, BudgetCategoryAllocation } from "@/types";
import { exportEventToExcel, exportBudgetChartToPNG } from "@/lib/export";
import {
  WalletCards,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Coins,
  Check,
  X,
  FileSpreadsheet,
  Download,
  Sparkles,
  Bot,
  ArrowRight,
  Loader2,
  Camera,
  History,
  SlidersHorizontal,
  PieChart,
} from "lucide-react";

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

export default function BudgetPage() {
  const {
    activeEvent,
    budgetSummary,
    budgetAlternatives,
    applyBudgetAlternative,
    applyMultipleAlternatives,
    saveCategoryAllocations,
    expenses,
    vendors,
    tasks,
    paymentLedger,
    createExpense,
    updateExpense,
    deleteExpense,
    budgetHistory,
    recordBudgetSnapshot,
    simulateOverBudget,
    resetToNormalBudget,
    loadDemoEvent,
  } = useApp();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Category Allocations Modal state
  const [allocModalOpen, setAllocModalOpen] = useState(false);
  const [allocBudgetInput, setAllocBudgetInput] = useState(0);
  const [allocReserveInput, setAllocReserveInput] = useState(0);
  const [allocRows, setAllocRows] = useState<
    { id: string; category: ExpenseCategory; label: string; amount: number }[]
  >([]);

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("catering");
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0);
  const [quotedAmount, setQuotedAmount] = useState<number>(0);
  const [actualAmount, setActualAmount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");
  const [notes, setNotes] = useState("");

  // AI Budget Assistant interactive state
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiProposal, setAiProposal] = useState<{
    category: ExpenseCategory;
    newEstimate: number;
    savings: number;
    reason: string;
  } | null>(null);

  const [selectedAltIds, setSelectedAltIds] = useState<string[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!activeEvent) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 max-w-xl mx-auto py-12">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl shadow-card">
            <WalletCards className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Budget Management
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Create an event or load our sample to track celebration expenses, record vendor quotations, and run AI Reality Checks.
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

  const currencyCode = activeEvent.currency?.code || "INR";
  const currencyLocale = activeEvent.currency?.locale || "en-IN";

  const openAddDialog = () => {
    setEditingExpense(null);
    setTitle("");
    setCategory("catering");
    setEstimatedAmount(2000);
    setQuotedAmount(2000);
    setActualAmount(0);
    setPaymentStatus("unpaid");
    setNotes("");
    setDialogOpen(true);
  };

  const openEditDialog = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setCategory(exp.category);
    setEstimatedAmount(exp.estimatedAmount);
    setQuotedAmount(exp.quotedAmount ?? exp.estimatedAmount);
    setActualAmount(exp.actualAmount ?? 0);
    setPaymentStatus(exp.paymentStatus);
    setNotes(exp.notes || "");
    setDialogOpen(true);
  };

  const openAllocModal = () => {
    setAllocBudgetInput(activeEvent.budget);
    setAllocReserveInput(activeEvent.contingencyReserve || 0);

    if (activeEvent.categoryAllocations && activeEvent.categoryAllocations.length > 0) {
      setAllocRows(
        activeEvent.categoryAllocations.map((a, i) => ({
          id: `alloc-${i}-${Date.now()}`,
          category: a.category,
          label: a.label || CATEGORY_LABELS[a.category] || a.category,
          amount: a.allocatedAmount,
        }))
      );
    } else {
      const base = budgetSummary.categories.length > 0
        ? budgetSummary.categories.map((c, i) => ({
            id: `alloc-${i}-${Date.now()}`,
            category: c.category,
            label: c.label,
            amount: c.allocated > 0 ? c.allocated : c.estimated || Math.round(activeEvent.budget * 0.2),
          }))
        : [
            { id: "1", category: "catering" as ExpenseCategory, label: "Food & Beverages", amount: Math.round(activeEvent.budget * 0.35) },
            { id: "2", category: "venue" as ExpenseCategory, label: "Venue & Hospitality", amount: Math.round(activeEvent.budget * 0.25) },
            { id: "3", category: "decoration" as ExpenseCategory, label: "Decorations & Ambience", amount: Math.round(activeEvent.budget * 0.15) },
            { id: "4", category: "photography" as ExpenseCategory, label: "Photography", amount: Math.round(activeEvent.budget * 0.10) },
            { id: "5", category: "cake" as ExpenseCategory, label: "Cake & Desserts", amount: Math.round(activeEvent.budget * 0.05) },
          ];
      setAllocRows(base);
    }
    setAllocModalOpen(true);
  };

  const handleSaveAllocationsModal = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted: BudgetCategoryAllocation[] = allocRows.map((r) => {
      const pct = allocBudgetInput > 0 ? Math.round(((Number(r.amount) || 0) / allocBudgetInput) * 100) : 0;
      return {
        category: r.category,
        label: r.label,
        allocatedAmount: Math.max(0, Number(r.amount) || 0),
        percentage: pct,
      };
    });

    saveCategoryAllocations(formatted, allocBudgetInput, allocReserveInput);
    setAllocModalOpen(false);
    setFeedbackMessage("Category budget allocations saved successfully!");
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        title,
        category,
        estimatedAmount: Number(estimatedAmount) || 0,
        quotedAmount: Number(quotedAmount) || 0,
        actualAmount: Number(actualAmount) || 0,
        paymentStatus,
        notes,
      });
      setFeedbackMessage(`Updated expense "${title}"`);
    } else {
      createExpense({
        eventId: activeEvent.id,
        title,
        category,
        estimatedAmount: Number(estimatedAmount) || 0,
        quotedAmount: Number(quotedAmount) || 0,
        actualAmount: Number(actualAmount) || 0,
        paymentStatus,
        notes,
      });
      setFeedbackMessage(`Added new expense "${title}"`);
    }
    setDialogOpen(false);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // AI Budget Assistant query handler
  const handleAskBudgetAssistant = async (question: string) => {
    if (!question.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    setAiProposal(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: activeEvent.id,
          message: `BUDGET QUESTION: ${question}. Focus on practical cost adjustments for ${activeEvent.guestCount} guests in ${activeEvent.currency.code}.`,
          event: activeEvent,
          currentBudgetSummary: budgetSummary,
          currentExpenses: expenses,
        }),
      });

      const data = await res.json();
      if (data && data.reply) {
        setAiResponse(data.reply);
        // Formulate a concrete proposal if relevant
        if (question.toLowerCase().includes("reduce") || question.toLowerCase().includes("food") || question.toLowerCase().includes("catering")) {
          const catExpense = expenses.find((e) => e.category === "catering");
          if (catExpense) {
            const savings = Math.round(catExpense.estimatedAmount * 0.15);
            setAiProposal({
              category: "catering",
              newEstimate: catExpense.estimatedAmount - savings,
              savings,
              reason: "Switch live cooking counters to an artisanal buffet selection.",
            });
          }
        }
      }
    } catch (_err) {
      setAiResponse(
        `To optimize your budget of ${activeEvent.currency.symbol}${activeEvent.budget.toLocaleString()}, we recommend keeping catering capped at ~38% and flowers at ~15%. You currently have ${activeEvent.currency.symbol}${budgetSummary.totalRemaining.toLocaleString()} remaining.`
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiProposal = () => {
    if (!aiProposal) return;
    const exp = expenses.find((e) => e.category === aiProposal.category);
    if (exp) {
      updateExpense(exp.id, {
        estimatedAmount: aiProposal.newEstimate,
        quotedAmount: aiProposal.newEstimate,
        notes: `Optimized via AI Budget Assistant: ${aiProposal.reason}`,
      });
      setFeedbackMessage(`Applied ${aiProposal.category} budget reduction (-${activeEvent.currency.symbol}${aiProposal.savings})!`);
      setAiProposal(null);
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  const handleExcelExport = () => {
    exportEventToExcel({
      event: activeEvent,
      expenses,
      vendors,
      tasks,
      budgetSummary,
      budgetHistory,
      paymentLedger,
    });
  };

  const handlePngExport = () => {
    exportBudgetChartToPNG({
      event: activeEvent,
      budgetSummary,
      budgetHistory,
    });
  };

  const handleTakeSnapshot = () => {
    recordBudgetSnapshot("Manual audit review snapshot");
    setFeedbackMessage("Recorded budget history snapshot!");
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
                Budget Management
              </h1>
              <span
                className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                  budgetSummary.isOverBudget
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-sage/10 text-sage border-sage/20"
                }`}
              >
                {budgetSummary.isOverBudget
                  ? `Over Budget by ${formatCurrency(budgetSummary.overBudgetAmount, currencyCode, currencyLocale)}`
                  : "Within Budget"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Authoritative mathematical expense tracking and AI cost optimization for{" "}
              <span className="font-semibold text-foreground">{activeEvent.title}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openAllocModal}
              className="px-3.5 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary flex items-center gap-1.5 transition-colors shadow-xs"
              title="Adjust category budget caps and targets"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Adjust Allocations</span>
            </button>

            <button
              onClick={handleExcelExport}
              className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors shadow-xs"
              title="Download genuine formatted Excel workbook"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePngExport}
              className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors shadow-xs"
              title="Download high-resolution Budget Chart PNG"
            >
              <Camera className="w-4 h-4 text-primary" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={openAddDialog}
              className="px-4 py-2 rounded-xl gradient-cta text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Feedback Message Toast */}
        {feedbackMessage && (
          <div className="p-3.5 rounded-xl bg-sage/15 border border-sage/30 text-sage text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* 5 Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Target Budget
            </span>
            <p className="font-display text-xl sm:text-2xl font-extrabold text-foreground mt-1">
              {formatCurrency(budgetSummary.totalBudget, currencyCode, currencyLocale)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Fixed overall limit</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Allocated Targets
            </span>
            <p className="font-display text-xl sm:text-2xl font-extrabold text-foreground mt-1">
              {formatCurrency(budgetSummary.totalAllocated, currencyCode, currencyLocale)}
            </p>
            <p className="text-[10px] text-primary font-medium mt-0.5">
              {budgetSummary.totalBudget > 0
                ? `${Math.round((budgetSummary.totalAllocated / budgetSummary.totalBudget) * 100)}% of budget`
                : "No caps set"}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Planned Spend
            </span>
            <p className="font-display text-xl sm:text-2xl font-extrabold text-foreground mt-1">
              {formatCurrency(budgetSummary.totalEstimated, currencyCode, currencyLocale)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Sum of vendor quotes
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Actual Paid
            </span>
            <p className="font-display text-xl sm:text-2xl font-extrabold text-foreground mt-1">
              {formatCurrency(budgetSummary.totalActual, currencyCode, currencyLocale)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Completed payments</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-card col-span-2 sm:col-span-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Net Balance
            </span>
            <p
              className={`font-display text-xl sm:text-2xl font-extrabold mt-1 ${
                budgetSummary.isOverBudget ? "text-red-500" : "text-sage"
              }`}
            >
              {budgetSummary.isOverBudget
                ? `-${formatCurrency(budgetSummary.overBudgetAmount, currencyCode, currencyLocale)}`
                : formatCurrency(budgetSummary.totalRemaining, currencyCode, currencyLocale)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {budgetSummary.isOverBudget ? "Action advised" : "Remaining cushion"}
            </p>
          </div>
        </div>

        {/* CATEGORY BUDGET ALLOCATIONS & SPENDING CAPS SECTION */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl gradient-cta flex items-center justify-center text-white shadow-xs">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-foreground">
                  Category Budget Allocations & Spending Caps
                </h3>
                <p className="text-xs text-muted-foreground">
                  Defined spending targets vs real vendor commitments and actual cash disbursements.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/planner"
                className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Ask AI to Allocate</span>
              </Link>
              <button
                onClick={openAllocModal}
                className="px-3.5 py-1.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-xs hover:opacity-95 flex items-center gap-1.5 transition-opacity"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Edit Allocations</span>
              </button>
            </div>
          </div>

          {/* Category Allocation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {budgetSummary.categories.map((cat) => {
              const cap = cat.allocated;
              const spent = cat.estimated;
              const paid = cat.actual;
              const remaining = cat.remaining;
              const isOverCap = cap > 0 && spent > cap;
              const pctOfCap = cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : (spent > 0 ? 100 : 0);

              return (
                <div
                  key={cat.category}
                  className={`p-4 rounded-2xl border transition-all ${
                    isOverCap
                      ? "border-red-500/40 bg-red-500/5 shadow-xs"
                      : "border-border bg-card hover:border-border/80 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-bold text-foreground text-xs">{cat.label}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOverCap
                          ? "bg-red-500/15 text-red-500 border border-red-500/20"
                          : cap > 0
                          ? "bg-muted text-muted-foreground"
                          : "bg-amber-500/15 text-amber-600 border border-amber-500/20"
                      }`}
                    >
                      {cap > 0 ? `${cat.percentage}% of Budget` : "No Cap Assigned"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 text-xs border-y border-border/50 my-1">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Allocated Cap</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(cap, currencyCode, currencyLocale)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Planned Spend</span>
                      <span className={`font-bold ${isOverCap ? "text-red-500" : "text-foreground"}`}>
                        {formatCurrency(spent, currencyCode, currencyLocale)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Actual Paid</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(paid, currencyCode, currencyLocale)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar of Cap */}
                  <div className="pt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">
                        {cap > 0 ? `${pctOfCap}% cap consumed` : "No cap limit"}
                      </span>
                      <span
                        className={`font-bold ${
                          isOverCap ? "text-red-500" : remaining >= 0 ? "text-sage" : "text-muted-foreground"
                        }`}
                      >
                        {cap > 0
                          ? isOverCap
                            ? `Over cap by ${formatCurrency(Math.abs(remaining), currencyCode, currencyLocale)}`
                            : `${formatCurrency(remaining, currencyCode, currencyLocale)} left`
                          : `Spend: ${formatCurrency(spent, currencyCode, currencyLocale)}`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverCap
                            ? "bg-red-500"
                            : pctOfCap > 85
                            ? "bg-amber-500"
                            : "gradient-cta"
                        }`}
                        style={{ width: `${pctOfCap}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contingency and Balance Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-muted/30 border border-border text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-muted-foreground text-[11px]">Contingency Reserve: </span>
                <strong className="text-foreground">
                  {formatCurrency(budgetSummary.contingencyReserve, currencyCode, currencyLocale)}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Total Budgeted Caps: </span>
                <strong className="text-foreground">
                  {formatCurrency(budgetSummary.totalAllocated, currencyCode, currencyLocale)}
                </strong>
              </div>
            </div>

            <div>
              <span
                className={`font-bold text-[11px] px-2.5 py-1 rounded-xl ${
                  budgetSummary.unallocatedAmount < 0
                    ? "bg-red-500/10 text-red-500"
                    : budgetSummary.unallocatedAmount === 0
                    ? "bg-sage/15 text-sage"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {budgetSummary.unallocatedAmount < 0
                  ? `Allocations exceed budget by ${formatCurrency(Math.abs(budgetSummary.unallocatedAmount), currencyCode, currencyLocale)}`
                  : budgetSummary.unallocatedAmount === 0
                  ? "Budget Caps 100% Balanced with Reserve"
                  : `Unallocated Budget Cushion: ${formatCurrency(budgetSummary.unallocatedAmount, currencyCode, currencyLocale)}`}
              </span>
            </div>
          </div>
        </div>

        {/* AI BUDGET ASSISTANT PANEL */}
        <div className="rounded-3xl border border-primary/30 bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <div className="w-8 h-8 rounded-xl gradient-cta flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                AI Budget Assistant
              </h3>
              <p className="text-xs text-muted-foreground">
                Ask questions about your budget, test cost reductions, or reallocate spend across categories.
              </p>
            </div>
          </div>

          {/* Quick Question Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0">
              Quick questions:
            </span>
            {[
              "How can I reduce catering costs without hurting food quality?",
              "Suggest a revised budget if guest count drops by 15",
              "Which categories have the most room to save?",
              "Recommend photography package allocation",
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAiQuestion(q);
                  handleAskBudgetAssistant(q);
                }}
                className="px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted text-xs text-foreground shrink-0 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Assistant Response Box */}
          {aiLoading && (
            <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Analyzing budget allocations against guest count...</span>
            </div>
          )}

          {aiResponse && !aiLoading && (
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3 animate-in fade-in">
              <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {aiResponse}
              </div>

              {/* Editable AI Proposal Card */}
              {aiProposal && (
                <div className="p-3.5 rounded-xl border border-primary/40 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase">
                      Actionable Cost-Saving Proposal
                    </span>
                    <span className="text-xs font-extrabold text-sage">
                      Save {formatCurrency(aiProposal.savings, currencyCode, currencyLocale)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{aiProposal.reason}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      New {aiProposal.category} estimate:{" "}
                      <strong>
                        {formatCurrency(aiProposal.newEstimate, currencyCode, currencyLocale)}
                      </strong>
                    </span>
                    <button
                      onClick={handleApplyAiProposal}
                      className="px-4 py-1.5 rounded-lg gradient-cta text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity"
                    >
                      Apply Proposal to Budget
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Question Input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskBudgetAssistant(aiQuestion)}
              placeholder="e.g. How can I save ₹5,000 on decor and food?"
              className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={() => handleAskBudgetAssistant(aiQuestion)}
              disabled={!aiQuestion.trim() || aiLoading}
              className="px-4 py-2.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-xs hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5 transition-opacity shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>

        {/* Expenses List Table */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">Itemized Expenses</h3>
              <p className="text-xs text-muted-foreground">All logged celebration costs and payment milestones</p>
            </div>
            <button
              onClick={handleTakeSnapshot}
              className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground flex items-center gap-1.5 transition-colors"
              title="Record current state in budget history"
            >
              <History className="w-3.5 h-3.5" />
              <span>Record Snapshot</span>
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-xs text-muted-foreground">No expenses recorded for this event yet.</p>
              <button
                onClick={openAddDialog}
                className="px-4 py-2 rounded-xl gradient-cta text-white text-xs font-bold shadow-xs"
              >
                + Add First Expense
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                    <th className="pb-3 pl-1">Expense Title</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3 text-right">Estimated</th>
                    <th className="pb-3 text-right">Quoted</th>
                    <th className="pb-3 text-right">Paid</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right pr-1">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 pl-1 font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span>{exp.title}</span>
                          {exp.vendorId && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-bold">
                              Vendor Contract
                            </span>
                          )}
                        </div>
                        {exp.notes && (
                          <div className="text-[10px] text-muted-foreground font-normal">{exp.notes}</div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground font-medium uppercase">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-foreground">
                        {formatCurrency(exp.estimatedAmount, currencyCode, currencyLocale)}
                      </td>
                      <td className="py-3 text-right font-medium text-foreground">
                        {formatCurrency(exp.quotedAmount ?? exp.estimatedAmount, currencyCode, currencyLocale)}
                      </td>
                      <td className="py-3 text-right font-bold text-foreground">
                        {formatCurrency(exp.actualAmount ?? 0, currencyCode, currencyLocale)}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            exp.paymentStatus === "paid"
                              ? "bg-sage/15 text-sage"
                              : exp.paymentStatus === "partially_paid"
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {exp.paymentStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-1">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditDialog(exp)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Edit expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteExpense(exp.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add / Edit Expense Dialog */}
        {dialogOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="font-serif text-xl font-bold text-foreground">
                  {editingExpense ? "Edit Expense" : "Add New Expense"}
                </h3>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Expense Title *</label>
                  <input
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
                    <label className="block font-semibold text-foreground mb-1">Category</label>
                    <select
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
                    <label className="block font-semibold text-foreground mb-1">Payment Status</label>
                    <select
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
                    <label className="block font-semibold text-foreground mb-1">Estimated ({currencyCode})</label>
                    <input
                      type="number"
                      min={0}
                      value={estimatedAmount}
                      onChange={(e) => setEstimatedAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Quoted ({currencyCode})</label>
                    <input
                      type="number"
                      min={0}
                      value={quotedAmount}
                      onChange={(e) => setQuotedAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Actual Paid ({currencyCode})</label>
                    <input
                      type="number"
                      min={0}
                      value={actualAmount}
                      onChange={(e) => setActualAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Notes / Vendor Context</label>
                  <input
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
                    onClick={() => setDialogOpen(false)}
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
        )}

        {/* Modal: Category Budget Allocations Editor Dialog */}
        {allocModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl gradient-cta flex items-center justify-center text-white shadow-xs">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      Edit Category Budget Allocations
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Configure target caps for each vendor category and contingency reserve.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAllocModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAllocationsModal} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">
                      Total Target Budget ({currencyCode})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={allocBudgetInput}
                      onChange={(e) => setAllocBudgetInput(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-1">
                      Contingency Reserve ({currencyCode})
                    </label>
                    <input
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
                    {allocRows.map((row) => {
                      const _pct = allocBudgetInput > 0
                        ? Math.round(((Number(row.amount) || 0) / allocBudgetInput) * 100)
                        : 0;
                      return (
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
                              onClick={() => setAllocRows((prev) => prev.filter((r) => r.id !== row.id))}
                              className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const avail = CATEGORY_CHOICES.find(
                        (c) => !allocRows.some((r) => r.category === c.value)
                      ) || CATEGORY_CHOICES[0];
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
                {(() => {
                  const sumCaps = allocRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
                  const total = sumCaps + (Number(allocReserveInput) || 0);
                  const diff = allocBudgetInput - total;
                  return (
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
                  );
                })()}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setAllocModalOpen(false)}
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
        )}
      </div>
    </AppShell>
  );
}
