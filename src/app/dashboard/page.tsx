"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/app-context";
import { AppShell } from "@/components/app-shell";
import { formatCurrency, formatDateShort, daysUntil } from "@/lib/utils";
import { exportEventToExcel, exportBudgetChartToPNG } from "@/lib/export";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CoordinatorHandoutModal } from '@/components/coordinator-handout-modal';
import {
  Printer,
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Coins,
  TrendingDown,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
  Store,
  Plus,
  RefreshCw,
  Check,
  FileSpreadsheet,
  Camera,
  Send,
  Loader2,
  } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const {
    activeEvent,
    budgetSummary,
    budgetAlternatives,
    applyMultipleAlternatives,
    tasks,
    updateTask,
    vendors,
    budgetHistory,
    loadDemoEvent,
    isDemoMode,
    simulateOverBudget,
    resetToNormalBudget,
    sendChatMessage,
  } = useApp();

  const [selectedAltIds, setSelectedAltIds] = useState<string[]>([]);
  const [justApplied, setJustApplied] = useState(false);
  const [quickQuestion, setQuickQuestion] = useState("");
  const [askingAi, setAskingAi] = useState(false);
  const [handoutOpen, setHandoutOpen] = useState(false);

  // If no active event exists, show a welcoming empty state
  if (!activeEvent) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-2xl mx-auto py-12">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary flex items-center justify-center mx-auto text-4xl shadow-card">
            🎉
          </div>
          <div className="space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
              Welcome to UtsavAI
            </h2>
            <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
              Your AI-powered celebration copilot. Create your first event or explore a sample to see the full planning experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
            <Link
              href="/wizard"
              className="px-5 py-4 rounded-2xl gradient-cta text-white font-bold hover:opacity-90 shadow-md transition-all text-center space-y-1"
            >
              <div className="text-xl">✨</div>
              <div className="text-sm">Create New Event</div>
              <div className="text-xs opacity-80 font-normal">Plan your celebration with AI</div>
            </Link>
            <button
              onClick={loadDemoEvent}
              className="px-5 py-4 rounded-2xl border border-border bg-card hover:bg-muted text-foreground font-semibold transition-colors text-center space-y-1"
            >
              <div className="text-xl">🎂</div>
              <div className="text-sm">Load Demo Event</div>
              <div className="text-xs text-muted-foreground font-normal">Explore a sample birthday plan</div>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-4 text-center text-xs text-muted-foreground">
            <div>
              <div className="text-2xl font-bold text-foreground font-display">AI</div>
              <div>Smart Planning</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground font-display">₹</div>
              <div>Budget Reality Check</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground font-display">✓</div>
              <div>Task Checklists</div>
            </div>
          </div>
        </div>
            <CoordinatorHandoutModal isOpen={handoutOpen} onClose={() => setHandoutOpen(false)} />
    </AppShell>
    );
  }

  const currencyCode = activeEvent.currency?.code || "INR";
  const currencyLocale = activeEvent.currency?.locale || "en-IN";

  const daysLeft = daysUntil(activeEvent.date);
  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;
  const totalTasksCount = tasks.length || 1;
  const taskCompletionPct = Math.round((completedTasksCount / totalTasksCount) * 100);

  const upcomingTasks = tasks
    .filter((t) => t.status !== "completed")
    .slice(0, 5);

  const confirmedVendorsCount = vendors.filter((v) => v.bookingStatus === "confirmed").length;

  const plannedPctOfBudget =
    budgetSummary.totalBudget > 0
      ? Math.round((budgetSummary.totalEstimated / budgetSummary.totalBudget) * 100)
      : 0;

  // Toggle selection for Budget Reality Check alternatives
  const toggleAlt = (id: string) => {
    setSelectedAltIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleApplySelected = () => {
    const selected = budgetAlternatives.filter((a) => selectedAltIds.includes(a.id));
    if (selected.length > 0) {
      applyMultipleAlternatives(selected);
      setSelectedAltIds([]);
      setJustApplied(true);
      setTimeout(() => setJustApplied(false), 3000);
    }
  };

  const handleQuickAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    setAskingAi(true);
    await sendChatMessage(quickQuestion);
    setAskingAi(false);
    router.push("/planner");
  };

  const handleExcelExport = () => {
    exportEventToExcel({
      event: activeEvent,
      expenses: [],
      vendors,
      tasks,
      budgetSummary,
      budgetHistory,
    });
  };

  const handlePngExport = () => {
    exportBudgetChartToPNG({
      event: activeEvent,
      budgetSummary,
      budgetHistory,
    });
  };

  return (
    <AppShell>
      {/* Top Greeting & Host Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Your Celebration Dashboard
            </h1>
            {isDemoMode && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Demo
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Planning overview for{" "}
            <span className="font-semibold text-foreground">{activeEvent.title}</span>.
          </p>
        </div>

        {/* Quick Actions & Export Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setHandoutOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors shadow-xs"
            title="Print Day-of Coordinator Brief"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Coordinator Handout / PDF</span>
          </button>

          <button
            onClick={handleExcelExport}
            className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors shadow-xs"
            title="Download Excel Workbook"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={handlePngExport}
            className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors shadow-xs"
            title="Download PNG Chart"
          >
            <Camera className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">PNG Chart</span>
          </button>

          {budgetSummary.isOverBudget ? (
            <button
              onClick={resetToNormalBudget}
              className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground flex items-center gap-1.5 transition-colors"
              title="Reset budget simulation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Budget</span>
            </button>
          ) : (
            <button
              onClick={simulateOverBudget}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/25 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Simulates ₹3,500 overspending to test Budget Reality Check"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Test Overspend (+₹3.5k)</span>
            </button>
          )}

          <Link
            href="/wizard"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </Link>
        </div>
      </div>

      {/* Hero Celebration Banner Card (Inspired by ForeverUs & Template 1) */}
      <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-elevated">
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-coral/15 via-lavender/10 to-primary/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-card text-foreground border border-border shadow-xs">
                  {daysLeft > 0 ? `In ${daysLeft} Days` : "Celebration Day!"}
                </span>
                <span className="text-xs font-semibold text-muted-foreground capitalize">
                  {activeEvent.occasion}
                </span>
              </div>

              {/* Romantic script tagline from ForeverUs reference theme */}
              <p className="font-serif italic text-lg sm:text-xl text-primary font-medium">
                Our celebration budget — Built on love, planned with purpose.
              </p>

              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                {activeEvent.title}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  {activeEvent.guestCount} Guests
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  {activeEvent.location || "India"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {formatDateShort(activeEvent.date)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/planner"
                className="px-5 py-2.5 rounded-xl gradient-cta text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-95 text-center transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Planner</span>
              </Link>
              <Link
                href="/budget"
                className="px-4 py-2.5 rounded-xl border border-border bg-card/90 hover:bg-muted text-foreground text-xs sm:text-sm font-semibold text-center transition-colors shadow-xs"
              >
                Manage Budget
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Budget */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Budget</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {formatCurrency(budgetSummary.totalBudget, currencyCode, currencyLocale)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">100% Target Limit</p>
        </div>

        {/* KPI 2: Estimated Spending */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimated Spending</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {formatCurrency(budgetSummary.totalEstimated, currencyCode, currencyLocale)}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`text-[11px] font-semibold ${
                budgetSummary.isOverBudget ? "text-red-500" : "text-sage"
              }`}
            >
              {plannedPctOfBudget}% of budget
            </span>
          </div>
        </div>

        {/* KPI 3: Remaining Budget */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Remaining Budget</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                budgetSummary.isOverBudget
                  ? "bg-red-500/10 text-red-500"
                  : "bg-sage/15 text-sage"
              }`}
            >
              {budgetSummary.isOverBudget ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <p
            className={`font-display text-2xl sm:text-3xl font-extrabold tracking-tight ${
              budgetSummary.isOverBudget ? "text-red-500" : "text-foreground"
            }`}
          >
            {budgetSummary.isOverBudget
              ? `-${formatCurrency(budgetSummary.overBudgetAmount, currencyCode, currencyLocale)}`
              : formatCurrency(budgetSummary.totalRemaining, currencyCode, currencyLocale)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {budgetSummary.isOverBudget ? "Action Required" : "Safe Surplus"}
          </p>
        </div>

        {/* KPI 4: Tasks Completed */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tasks Completed</span>
            <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {completedTasksCount} / {totalTasksCount}
          </p>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="gradient-cta h-full transition-all duration-500"
              style={{ width: `${taskCompletionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* CORE DIFFERENTIATOR: Budget Reality Check with Interactive AI Q&A */}
      <div
        className={`rounded-3xl border-2 p-6 shadow-card space-y-4 transition-all ${
          budgetSummary.isOverBudget
            ? "border-red-500/40 bg-card shadow-elevated"
            : "border-border bg-card"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                budgetSummary.isOverBudget
                  ? "bg-red-500/10 text-red-500"
                  : "bg-sage/15 text-sage"
              }`}
            >
              {budgetSummary.isOverBudget ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                {budgetSummary.isOverBudget ? (
                  <>
                    Budget Reality Check: Over budget by{" "}
                    <span className="text-red-500">
                      {formatCurrency(budgetSummary.overBudgetAmount, currencyCode, currencyLocale)}
                    </span>
                  </>
                ) : (
                  <>Budget Reality Check: Healthy Surplus ({formatCurrency(budgetSummary.totalRemaining, currencyCode, currencyLocale)})</>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                Planned expenses (
                {formatCurrency(budgetSummary.totalEstimated, currencyCode, currencyLocale)}) compared with your budget limit (
                {formatCurrency(budgetSummary.totalBudget, currencyCode, currencyLocale)}).
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-center border ${
              budgetSummary.isOverBudget
                ? "bg-red-500/10 text-red-500 border-red-500/20"
                : "bg-sage/10 text-sage border-sage/20"
            }`}
          >
            {budgetSummary.isOverBudget ? "Immediate Action Advised" : "Audit Passed"}
          </span>
        </div>

        {/* AI Cost-Saving Suggestions if Over Budget */}
        {budgetSummary.isOverBudget && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-foreground">
              AI Suggestions to Reduce Cost: (Select and click apply to automatically adjust expenses)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {budgetAlternatives.map((alt) => {
                const isSelected = selectedAltIds.includes(alt.id);
                return (
                  <div
                    key={alt.id}
                    onClick={() => toggleAlt(alt.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border bg-muted/40 hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAlt(alt.id)}
                        className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-foreground">{alt.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{alt.description}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-sage shrink-0">
                      - Save {formatCurrency(alt.savingsAmount, currencyCode, currencyLocale)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {selectedAltIds.length} suggestion(s) selected
              </span>
              <div className="flex items-center gap-3">
                {justApplied && (
                  <span className="text-xs font-semibold text-sage flex items-center gap-1 animate-in fade-in">
                    <Check className="w-4 h-4" /> Expenses updated!
                  </span>
                )}
                <button
                  disabled={selectedAltIds.length === 0}
                  onClick={handleApplySelected}
                  className="px-5 py-2.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-md hover:opacity-95 disabled:opacity-50 transition-opacity"
                >
                  Apply Selected Suggestions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ask UtsavAI Quick Input right inside Budget Reality Check */}
        <form onSubmit={handleQuickAsk} className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={quickQuestion}
            onChange={(e) => setQuickQuestion(e.target.value)}
            placeholder="Ask UtsavAI about reducing costs, catering options, or vendor quotes..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={!quickQuestion.trim() || askingAi}
            className="px-4 py-2 rounded-xl gradient-cta text-white text-xs font-bold shadow-xs hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0 transition-opacity"
          >
            {askingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Ask Copilot</span>
          </button>
        </form>
      </div>

      {/* Main Visual Panels: Budget Breakdown Donut & Next Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Budget Overview & Visual Donut Chart */}
        <div className="lg:col-span-7 rounded-3xl border border-border bg-card p-6 shadow-card space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">Budget Overview</h3>
              <p className="text-xs text-muted-foreground">Category allocation of planned celebration expenses</p>
            </div>
            <Link
              href="/budget"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Donut Chart Container */}
            <div className="sm:col-span-5 relative h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={budgetSummary.categories}
                    dataKey="estimated"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={3}
                  >
                    {budgetSummary.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value) || 0, currencyCode, currencyLocale),
                      "Planned",
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      boxShadow: "var(--shadow-card)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metrics in Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="font-display text-base font-extrabold text-foreground">
                  {formatCurrency(budgetSummary.totalEstimated, currencyCode, currencyLocale)}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  of {formatCurrency(budgetSummary.totalBudget, currencyCode, currencyLocale)}
                </span>
              </div>
            </div>

            {/* Category Breakdown Legend */}
            <div className="sm:col-span-7 space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {budgetSummary.categories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate text-foreground font-medium">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-muted-foreground text-[11px]">{cat.percentage}%</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(cat.estimated, currencyCode, currencyLocale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Tasks & Deadlines */}
        <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">Next Tasks</h3>
              <p className="text-xs text-muted-foreground">Prioritized checklist for {activeEvent.title}</p>
            </div>
            <Link
              href="/timeline"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">All caught up! No pending tasks.</p>
            ) : (
              upcomingTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <input
                      type="checkbox"
                      checked={t.status === "completed"}
                      onChange={() =>
                        updateTask(t.id, {
                          status: t.status === "completed" ? "pending" : "completed",
                        })
                      }
                      className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-foreground truncate">{t.title}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                    {formatDateShort(t.dueDate)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <Link
              href="/timeline"
              className="w-full py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View All Tasks & Milestones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Vendor Snapshot & AI Intelligence Insight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vendor Status Snapshot */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              <h3 className="font-serif text-lg font-bold text-foreground">Vendor Snapshot</h3>
            </div>
            <Link href="/vendors" className="text-xs text-primary font-semibold hover:underline">
              Compare Quotes
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-sage/10 text-center">
              <p className="text-xl font-extrabold text-sage">{confirmedVendorsCount}</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Confirmed</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-center">
              <p className="text-xl font-extrabold text-amber-500">
                {vendors.filter((v) => v.bookingStatus === "pending").length}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Pending</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/70 text-center">
              <p className="text-xl font-extrabold text-foreground">
                {vendors.filter((v) => v.bookingStatus === "not_booked").length}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Reviewing</p>
            </div>
          </div>
        </div>

        {/* AI Insight Intelligence Panel */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-serif text-lg font-bold text-foreground">UtsavAI Intelligence Insight</h3>
          </div>

          <div className="space-y-2 text-xs">
            {budgetSummary.isOverBudget ? (
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-red-500">Budget Alert:</strong> Your planned expenses currently exceed your target budget. Review the suggested adjustments above to restore your surplus balance.
              </p>
            ) : (
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-sage">Healthy Surplus:</strong> You have {formatCurrency(budgetSummary.totalRemaining, currencyCode, currencyLocale)} unallocated buffer. We recommend holding this as a contingency reserve for event-day items.
              </p>
            )}
            <p className="text-muted-foreground leading-relaxed">
              <strong>Timetable Tip:</strong> Book your photographer at least 3 weeks before the celebration to lock Bangalore weekend rates.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
