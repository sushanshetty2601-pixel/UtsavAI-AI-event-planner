"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/contexts/app-context";
import { AppShell } from "@/components/app-shell";
import { ExpenseCategory, TaskCategory, TaskPriority } from "@/types";
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
} from "lucide-react";

import { AllocationBuilderCard } from "@/components/planner/allocation-builder-card";
import { PaymentActionCard } from "@/components/planner/payment-action-card";
import { FormattedMessageContent } from "@/components/planner/formatted-message-content";

export default function AIPlannerPage() {
  const {
    activeEvent,
    chatMessages,
    sendChatMessage,
    clearChat,
    isChatLoading,
    createExpense,
    createTask,
    saveCategoryAllocations,
    recordPayment,
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
          <div aria-live="polite" aria-label="AI Copilot conversation" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
