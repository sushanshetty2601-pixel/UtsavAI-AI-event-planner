"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  Event,
  Expense,
  ExpenseCategory,
  Task,
  Vendor,
  PaymentRecord,
  PaymentStatus,
  Guest,
  SubEventItinerary,
  AIPlan,
  BudgetSummary,
  BudgetAlternative,
  BudgetCategoryAllocation,
  Currency,
  ChatMessage,
  PhotoAnalysis,
  BudgetHistoryEntry,
  EventNotification,
  DEFAULT_CURRENCY,
} from "@/types";
import {
  eventService,
  expenseService,
  taskService,
  vendorService,
  paymentLedgerService,
  guestService,
  subEventService,
  planService,
  chatService,
  photoService,
  budgetHistoryService,
  notificationService,
  clearDemoData as clearDemoDataStorage,
  migrateStorageToIndexedDB,
  loadData,
  saveData,
  exportAllData,
  importAllData,
} from "@/lib/storage";
import {
  DEMO_EVENT,
  DEMO_EXPENSES,
  DEMO_TASKS,
  DEMO_VENDORS,
  DEMO_PAYMENTS,
  DEMO_GUESTS,
  DEMO_SUB_EVENTS,
  DEMO_PLAN,
  DEMO_EVENT_ID,
  OVER_BUDGET_SIMULATION_EXPENSES,
} from "@/lib/demo-data";
import { calculateBudgetSummary, generateBudgetAlternatives } from "@/lib/budget";

interface AppContextType {
  // Events
  events: Event[];
  activeEvent: Event | null;
  activeEventId: string | null;
  setActiveEventId: (id: string) => void;
  createEvent: (event: Omit<Event, "id" | "createdAt" | "updatedAt">) => Event;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  changeCurrency: (currency: Currency) => void;

  // Expenses
  expenses: Expense[];
  createExpense: (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Tasks
  tasks: Task[];
  createTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Vendors
  vendors: Vendor[];
  createVendor: (vendor: Omit<Vendor, "id" | "createdAt" | "updatedAt">) => Vendor;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  setPreferredVendor: (id: string) => void;

  // Financial Payment Ledger
  paymentLedger: PaymentRecord[];
  recordPayment: (payment: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">) => PaymentRecord | null;
  updatePayment: (id: string, updates: Partial<PaymentRecord>) => void;
  deletePayment: (id: string) => void;

  // Guest RSVP & Seating Arrangement Copilot
  guests: Guest[];
  createGuest: (guest: Omit<Guest, "id" | "createdAt">) => Guest;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  autoAssignTables: (seatsPerTable?: number) => void;

  // Multi-Day Indian Celebration Itinerary
  subEvents: SubEventItinerary[];
  createSubEvent: (subEvent: Omit<SubEventItinerary, "id" | "createdAt">) => SubEventItinerary;
  updateSubEvent: (id: string, updates: Partial<SubEventItinerary>) => void;
  deleteSubEvent: (id: string) => void;

  // Plan
  plan: AIPlan | null;
  savePlan: (plan: AIPlan) => void;

  // Chat / AI Assistant (Interactive History)
  chatMessages: ChatMessage[];
  sendChatMessage: (content: string, actionData?: ChatMessage["actionData"]) => Promise<void>;
  addAssistantMessage: (content: string, actionData?: ChatMessage["actionData"]) => void;
  clearChat: () => void;
  isChatLoading: boolean;

  // Photo Analyses (Inspiration Studio)
  photoAnalyses: PhotoAnalysis[];
  savePhotoAnalysis: (analysis: PhotoAnalysis) => void;
  deletePhotoAnalysis: (id: string) => void;

  // Budget History
  budgetHistory: BudgetHistoryEntry[];
  recordBudgetSnapshot: (note?: string) => void;

  // Notifications
  notifications: EventNotification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Budget Calculations
  budgetSummary: BudgetSummary;
  budgetAlternatives: BudgetAlternative[];
  applyBudgetAlternative: (alternative: BudgetAlternative) => void;
  applyMultipleAlternatives: (alternatives: BudgetAlternative[]) => void;
  saveCategoryAllocations: (
    allocations: BudgetCategoryAllocation[],
    totalBudget?: number,
    contingencyReserve?: number
  ) => void;

  // Demo Controls
  loadDemoEvent: () => void;
  clearDemoMode: () => void;
  simulateOverBudget: () => void;
  resetToNormalBudget: () => void;
  isDemoMode: boolean;

  // Storage
  exportData: () => string;
  importData: (json: string) => boolean;
}

// Helper to bi-directionally synchronize vendor quotes & payments with itemized expenses
function syncVendorsWithExpenses(
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEventId, setActiveEventIdState] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [paymentLedger, setPaymentLedger] = useState<PaymentRecord[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [subEvents, setSubEvents] = useState<SubEventItinerary[]>([]);
  const [plan, setPlan] = useState<AIPlan | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [photoAnalyses, setPhotoAnalyses] = useState<PhotoAnalysis[]>([]);
  const [budgetHistory, setBudgetHistory] = useState<BudgetHistoryEntry[]>([]);
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Initialize data on mount — strictly clean start, no auto-seeding
  useEffect(() => {
    // Run non-destructive IndexedDB migration to safely offload any heavy base64 images
    migrateStorageToIndexedDB().catch((err) =>
      console.warn("Storage migration error:", err)
    );

    const timer = setTimeout(() => {
      const existing = loadData();
      if (existing.events && existing.events.length > 0) {
        setEvents(existing.events);
        const aid = existing.activeEventId || existing.events[0]?.id || null;
        setActiveEventIdState(aid);
        if (aid) {
          const rawExpenses = existing.expenses.filter((e) => e.eventId === aid);
          const eventVendors = existing.vendors.filter((v) => v.eventId === aid);
          const syncedExpenses = syncVendorsWithExpenses(eventVendors, rawExpenses, aid);

          setExpenses(syncedExpenses);
          setTasks(existing.tasks.filter((t) => t.eventId === aid));
          setVendors(eventVendors);
          setPaymentLedger(existing.paymentLedger?.filter((p) => p.eventId === aid) || []);
          setGuests(existing.guests?.filter((g) => g.eventId === aid) || []);
          setSubEvents(existing.subEvents?.filter((s) => s.eventId === aid) || []);
          setPlan(existing.plans.find((p) => p.eventId === aid) || null);
          setChatMessages(existing.chatMessages?.filter((m) => m.eventId === aid) || []);
          setPhotoAnalyses(existing.photoAnalyses?.filter((p) => p.eventId === aid) || []);
          setBudgetHistory(existing.budgetHistory?.filter((b) => b.eventId === aid) || []);
          setNotifications(existing.notifications?.filter((n) => n.eventId === aid) || []);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === activeEventId) || null;
  }, [events, activeEventId]);

  const isDemoMode = activeEvent?.isDemoEvent ?? false;

  const setActiveEventId = useCallback((id: string) => {
    eventService.setActive(id);
    setActiveEventIdState(id);
    const loaded = loadData();
    const eventVendors = loaded.vendors.filter((v) => v.eventId === id);
    const rawExpenses = loaded.expenses.filter((e) => e.eventId === id);
    const syncedExpenses = syncVendorsWithExpenses(eventVendors, rawExpenses, id);

    setExpenses(syncedExpenses);
    setTasks(loaded.tasks.filter((t) => t.eventId === id));
    setVendors(eventVendors);
    setPaymentLedger(loaded.paymentLedger?.filter((p) => p.eventId === id) || []);
    setGuests(loaded.guests?.filter((g) => g.eventId === id) || []);
    setSubEvents(loaded.subEvents?.filter((s) => s.eventId === id) || []);
    setPlan(loaded.plans.find((p) => p.eventId === id) || null);
    setChatMessages(loaded.chatMessages?.filter((m) => m.eventId === id) || []);
    setPhotoAnalyses(loaded.photoAnalyses?.filter((p) => p.eventId === id) || []);
    setBudgetHistory(loaded.budgetHistory?.filter((b) => b.eventId === id) || []);
    setNotifications(loaded.notifications?.filter((n) => n.eventId === id) || []);
  }, []);

  const createEvent = useCallback((eventData: Omit<Event, "id" | "createdAt" | "updatedAt">) => {
    const newEvent = eventService.create(eventData);
    setEvents((prev) => [...prev, newEvent]);
    setActiveEventId(newEvent.id);
    return newEvent;
  }, [setActiveEventId]);

  const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
    const updated = eventService.update(id, updates);
    if (updated) {
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    }
  }, []);

  const deleteEvent = useCallback((id: string) => {
    eventService.delete(id);
    const remaining = eventService.getAll();
    setEvents(remaining);
    const newAid = eventService.getActiveId();
    setActiveEventIdState(newAid);
    if (newAid) {
      setActiveEventId(newAid);
    } else {
      setExpenses([]);
      setTasks([]);
      setVendors([]);
      setPaymentLedger([]);
      setGuests([]);
      setSubEvents([]);
      setPlan(null);
      setChatMessages([]);
      setPhotoAnalyses([]);
      setBudgetHistory([]);
      setNotifications([]);
    }
  }, [setActiveEventId]);

  const changeCurrency = useCallback((currency: Currency) => {
    if (!activeEvent) return;
    updateEvent(activeEvent.id, { currency });
  }, [activeEvent, updateEvent]);

  // Expenses
  const createExpense = useCallback((data: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    const item = expenseService.create(data);
    setExpenses((prev) => [...prev, item]);
    return item;
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    const item = expenseService.update(id, updates);
    if (item) {
      setExpenses((prev) => prev.map((e) => (e.id === id ? item : e)));
    }
  }, []);

  const deleteExpense = useCallback((id: string) => {
    expenseService.delete(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Tasks
  const createTask = useCallback((data: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    const item = taskService.create(data);
    setTasks((prev) => [...prev, item]);
    return item;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const item = taskService.update(id, updates);
    if (item) {
      setTasks((prev) => prev.map((t) => (t.id === id ? item : t)));
    }
  }, []);

  const deleteTask = useCallback((id: string) => {
    taskService.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Vendors
  const createVendor = useCallback((data: Omit<Vendor, "id" | "createdAt" | "updatedAt">) => {
    const item = vendorService.create(data);
    setVendors((prev) => [...prev, item]);

    // Automatically sync with expenses so quoted and paid amounts immediately appear in Budget Allocations
    const expCat: ExpenseCategory =
      item.category === "other" ? "miscellaneous" : (item.category as ExpenseCategory);

    const paidAmt =
      item.paymentStatus === "paid"
        ? (item.actualAmount && item.actualAmount > 0 ? item.actualAmount : (item.quotedAmount || 0))
        : (item.actualAmount || 0);

    if ((item.quotedAmount && item.quotedAmount > 0) || paidAmt > 0 || item.bookingStatus === "confirmed") {
      const newExp = expenseService.create({
        eventId: item.eventId,
        title: item.name,
        category: expCat,
        quotedAmount: item.quotedAmount || 0,
        estimatedAmount: item.quotedAmount || 0,
        actualAmount: paidAmt,
        paymentStatus: item.paymentStatus,
        vendorId: item.id,
        notes: `Vendor Booking (${item.bookingStatus.toUpperCase()}) • ${item.name}`,
      });
      setExpenses((prev) => [...prev, newExp]);
    }

    return item;
  }, []);

  const updateVendor = useCallback((id: string, updates: Partial<Vendor>) => {
    const item = vendorService.update(id, updates);
    if (item) {
      setVendors((prev) => prev.map((v) => (v.id === id ? item : v)));

      // Synchronize with linked expense
      const expCat: ExpenseCategory =
        item.category === "other" ? "miscellaneous" : (item.category as ExpenseCategory);

      const paidAmt =
        item.paymentStatus === "paid"
          ? (item.actualAmount && item.actualAmount > 0 ? item.actualAmount : (item.quotedAmount || 0))
          : (item.actualAmount || 0);

      setExpenses((prevExpenses) => {
        const existingExp = prevExpenses.find(
          (e) => e.vendorId === id || (e.title === item.name && e.category === expCat)
        );

        if (existingExp) {
          const updatedExp = expenseService.update(existingExp.id, {
            title: item.name,
            category: expCat,
            quotedAmount: item.quotedAmount || 0,
            estimatedAmount: item.quotedAmount || 0,
            actualAmount: paidAmt,
            paymentStatus: item.paymentStatus,
            vendorId: item.id,
            notes: `Vendor Booking (${item.bookingStatus.toUpperCase()}) • ${item.name}`,
          });
          if (updatedExp) {
            return prevExpenses.map((e) => (e.id === existingExp.id ? updatedExp : e));
          }
          return prevExpenses;
        } else if (
          (item.quotedAmount && item.quotedAmount > 0) ||
          paidAmt > 0 ||
          item.bookingStatus === "confirmed"
        ) {
          const newExp = expenseService.create({
            eventId: item.eventId,
            title: item.name,
            category: expCat,
            quotedAmount: item.quotedAmount || 0,
            estimatedAmount: item.quotedAmount || 0,
            actualAmount: paidAmt,
            paymentStatus: item.paymentStatus,
            vendorId: item.id,
            notes: `Vendor Booking (${item.bookingStatus.toUpperCase()}) • ${item.name}`,
          });
          return [...prevExpenses, newExp];
        }
        return prevExpenses;
      });
    }
  }, []);

  const deleteVendor = useCallback((id: string) => {
    vendorService.delete(id);
    setVendors((prev) => prev.filter((v) => v.id !== id));

    // Remove linked expense if exists
    const loadedData = loadData();
    const linked = loadedData.expenses.find((e) => e.vendorId === id);
    if (linked) {
      expenseService.delete(linked.id);
      setExpenses((prev) => prev.filter((e) => e.id !== linked.id && e.vendorId !== id));
    }
  }, []);

  const setPreferredVendor = useCallback((id: string) => {
    if (!activeEventId) return;
    vendorService.setPreferred(id, activeEventId);
    setVendors(vendorService.getByEvent(activeEventId));
  }, [activeEventId]);

  // Plan
  const savePlan = useCallback((newPlan: AIPlan) => {
    planService.save(newPlan);
    setPlan(newPlan);
  }, []);

  // Real-time calculations
  const budgetSummary = useMemo(() => {
    const b = activeEvent?.budget || 0;
    const r = activeEvent?.contingencyReserve || 0;
    const allocs = activeEvent?.categoryAllocations;
    return calculateBudgetSummary(b, expenses, r, allocs);
  }, [activeEvent, expenses]);

  const budgetAlternatives = useMemo(() => {
    return generateBudgetAlternatives(expenses, budgetSummary.overBudgetAmount);
  }, [expenses, budgetSummary.overBudgetAmount]);

  const applyBudgetAlternative = useCallback((alt: BudgetAlternative) => {
    updateExpense(alt.expenseId, {
      quotedAmount: alt.newEstimate,
      estimatedAmount: alt.newEstimate,
      notes: `Adjusted via Budget Reality Check (-${alt.savingsAmount})`,
    });
  }, [updateExpense]);

  const applyMultipleAlternatives = useCallback((alts: BudgetAlternative[]) => {
    alts.forEach((alt) => {
      updateExpense(alt.expenseId, {
        quotedAmount: alt.newEstimate,
        estimatedAmount: alt.newEstimate,
        notes: `Adjusted via Budget Reality Check (-${alt.savingsAmount})`,
      });
    });
  }, [updateExpense]);

  // Budget History Snapshots
  const recordBudgetSnapshot = useCallback((note?: string) => {
    if (!activeEventId || !activeEvent) return;
    const item = budgetHistoryService.recordSnapshot({
      eventId: activeEventId,
      date: new Date().toISOString().split("T")[0],
      totalBudget: activeEvent.budget,
      totalEstimated: budgetSummary.totalEstimated,
      totalActual: budgetSummary.totalActual,
      note: note || `Budget review snapshot`,
    });
    setBudgetHistory((prev) => [...prev, item]);
  }, [activeEventId, activeEvent, budgetSummary]);

  const saveCategoryAllocations = useCallback((
    allocations: BudgetCategoryAllocation[],
    totalBudget?: number,
    contingencyReserve?: number
  ) => {
    if (!activeEventId || !activeEvent) return;

    const updates: Partial<Event> = {
      categoryAllocations: allocations,
    };
    if (totalBudget !== undefined && !isNaN(totalBudget) && totalBudget > 0) {
      updates.budget = totalBudget;
    }
    if (contingencyReserve !== undefined && !isNaN(contingencyReserve) && contingencyReserve >= 0) {
      updates.contingencyReserve = contingencyReserve;
    }

    updateEvent(activeEventId, updates);
    recordBudgetSnapshot("Saved AI category budget allocations");
  }, [activeEventId, activeEvent, updateEvent, recordBudgetSnapshot]);

  // Financial Payment Ledger Actions
  const recordPayment = useCallback(
    (paymentData: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">): PaymentRecord | null => {
      if (!activeEventId) return null;

      // Idempotency & duplicate check: prevent recording duplicate payment within 5 minutes
      const isDuplicate = paymentLedger.find(
        (p) =>
          p.eventId === activeEventId &&
          Number(p.amount) === Number(paymentData.amount) &&
          ((paymentData.vendorId && p.vendorId === paymentData.vendorId) ||
            (paymentData.recipientName &&
              p.recipientName?.toLowerCase() === paymentData.recipientName?.toLowerCase())) &&
          Date.now() - new Date(p.createdAt).getTime() < 5 * 60 * 1000
      );

      if (isDuplicate) {
        console.warn("UtsavAI: Duplicate payment prevented:", isDuplicate);
        return isDuplicate;
      }

      // 1. Create payment entry in storage
      const newRecord = paymentLedgerService.create({
        ...paymentData,
        eventId: activeEventId,
        currency: paymentData.currency || activeEvent?.currency || DEFAULT_CURRENCY,
      });

      setPaymentLedger((prev) => [newRecord, ...prev]);

      // 2. Identify and update corresponding vendor
      const currentVendors = loadData().vendors.filter((v) => v.eventId === activeEventId);
      const targetVendor = currentVendors.find(
        (v) =>
          (newRecord.vendorId && v.id === newRecord.vendorId) ||
          (newRecord.recipientName && v.name.toLowerCase() === newRecord.recipientName.toLowerCase()) ||
          (newRecord.category && v.category === newRecord.category)
      );

      if (targetVendor) {
        const allPaymentsForVendor = [
          newRecord,
          ...paymentLedger.filter(
            (p) =>
              p.id !== newRecord.id &&
              ((p.vendorId && p.vendorId === targetVendor.id) ||
                (p.recipientName && p.recipientName.toLowerCase() === targetVendor.name.toLowerCase()))
          ),
        ];
        const totalPaid = allPaymentsForVendor.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const quoted = targetVendor.quotedAmount || 0;
        const newStatus: PaymentStatus =
          quoted > 0 && totalPaid >= quoted ? "paid" : totalPaid > 0 ? "partially_paid" : "unpaid";

        updateVendor(targetVendor.id, {
          actualAmount: totalPaid,
          paymentStatus: newStatus,
        });
      }

      // 3. Identify and update corresponding expense
      const currentExpenses = loadData().expenses.filter((e) => e.eventId === activeEventId);
      const targetExpense = currentExpenses.find(
        (e) =>
          (targetVendor && e.vendorId === targetVendor.id) ||
          (newRecord.expenseId && e.id === newRecord.expenseId) ||
          (newRecord.recipientName && e.title.toLowerCase() === newRecord.recipientName.toLowerCase()) ||
          (newRecord.category && e.category === newRecord.category)
      );

      if (targetExpense) {
        const allPaymentsForExpense = [
          newRecord,
          ...paymentLedger.filter(
            (p) =>
              p.id !== newRecord.id &&
              ((p.expenseId && p.expenseId === targetExpense.id) ||
                (targetExpense.vendorId && p.vendorId === targetExpense.vendorId) ||
                (p.recipientName && p.recipientName.toLowerCase() === targetExpense.title.toLowerCase()))
          ),
        ];
        const totalPaidExp = allPaymentsForExpense.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const quotedExp = targetExpense.quotedAmount || targetExpense.estimatedAmount || 0;
        const newStatusExp: PaymentStatus =
          quotedExp > 0 && totalPaidExp >= quotedExp ? "paid" : totalPaidExp > 0 ? "partially_paid" : "unpaid";

        updateExpense(targetExpense.id, {
          actualAmount: totalPaidExp,
          paymentStatus: newStatusExp,
        });
      }

      // 4. Log notification and record budget history snapshot
      notificationService.add({
        eventId: activeEventId,
        title: "Payment Recorded",
        message: `Recorded payment of ${(paymentData.currency || activeEvent?.currency || DEFAULT_CURRENCY).symbol}${paymentData.amount.toLocaleString()} to ${paymentData.recipientName}`,
        type: "success",
        read: false,
      });

      recordBudgetSnapshot(
        `Recorded payment of ${(paymentData.currency || activeEvent?.currency || DEFAULT_CURRENCY).symbol}${paymentData.amount.toLocaleString()} to ${paymentData.recipientName}`
      );

      return newRecord;
    },
    [activeEventId, activeEvent, paymentLedger, updateVendor, updateExpense, recordBudgetSnapshot]
  );

  const updatePayment = useCallback(
    (id: string, updates: Partial<PaymentRecord>) => {
      if (!activeEventId) return;
      const updated = paymentLedgerService.update(id, updates);
      if (!updated) return;

      setPaymentLedger((prev) => prev.map((p) => (p.id === id ? updated : p)));

      // Re-sync vendor & expense balances
      const allPayments = paymentLedgerService.getByEvent(activeEventId);
      const loadedVendors = vendorService.getByEvent(activeEventId);
      loadedVendors.forEach((v) => {
        const vPayments = allPayments.filter(
          (p) => p.vendorId === v.id || (p.recipientName && p.recipientName.toLowerCase() === v.name.toLowerCase())
        );
        const sum = vPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const quoted = v.quotedAmount || 0;
        const status: PaymentStatus = quoted > 0 && sum >= quoted ? "paid" : sum > 0 ? "partially_paid" : "unpaid";
        updateVendor(v.id, { actualAmount: sum, paymentStatus: status });
      });
    },
    [activeEventId, updateVendor]
  );

  // Guest RSVP & Seating Copilot
  const createGuest = useCallback((guestData: Omit<Guest, "id" | "createdAt">) => {
    const newGuest = guestService.create(guestData);
    setGuests((prev) => [...prev, newGuest]);
    return newGuest;
  }, []);

  const updateGuest = useCallback((id: string, updates: Partial<Guest>) => {
    const updated = guestService.update(id, updates);
    if (updated) {
      setGuests((prev) => prev.map((g) => (g.id === id ? updated : g)));
    }
  }, []);

  const deleteGuest = useCallback((id: string) => {
    guestService.delete(id);
    setGuests((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const autoAssignTables = useCallback(
    (seatsPerTable: number = 8) => {
      if (!activeEventId) return;
      const attendingGuests = guests.filter(
        (g) => g.rsvpStatus === "attending" || g.rsvpStatus === "pending"
      );
      const assignments: { guestId: string; tableNumber: string }[] = [];

      const groupsPriority = [
        "vip",
        "bride_family",
        "groom_family",
        "friends",
        "colleagues",
        "general",
      ];
      const sorted = [...attendingGuests].sort((a, b) => {
        return groupsPriority.indexOf(a.group) - groupsPriority.indexOf(b.group);
      });

      let currentTableIdx = 1;
      let currentTableSeats = 0;
      let currentGroupName = sorted[0]?.group || "general";

      const getTableLabel = (num: number, grp: string) => {
        const labels: Record<string, string> = {
          vip: `Table ${num} (VIP)`,
          bride_family: `Table ${num} (Bride's Family)`,
          groom_family: `Table ${num} (Groom's Family)`,
          friends: `Table ${num} (Friends)`,
          colleagues: `Table ${num} (Colleagues)`,
          general: `Table ${num}`,
        };
        return labels[grp] || `Table ${num}`;
      };

      sorted.forEach((g) => {
        const guestSeatCount = 1 + (g.plusOnes || 0);
        if (g.group !== currentGroupName && currentTableSeats > 0) {
          currentTableIdx++;
          currentTableSeats = 0;
          currentGroupName = g.group;
        } else if (currentTableSeats + guestSeatCount > seatsPerTable) {
          currentTableIdx++;
          currentTableSeats = 0;
        }

        const tableLabel = getTableLabel(currentTableIdx, g.group);
        assignments.push({ guestId: g.id, tableNumber: tableLabel });
        currentTableSeats += guestSeatCount;
      });

      guestService.bulkAssignTables(activeEventId, assignments);
      setGuests((prev) =>
        prev.map((g) => {
          const found = assignments.find((a) => a.guestId === g.id);
          return found ? { ...g, tableNumber: found.tableNumber } : g;
        })
      );
    },
    [activeEventId, guests]
  );

  // Multi-Day Indian Celebration Itinerary
  const createSubEvent = useCallback((subEventData: Omit<SubEventItinerary, "id" | "createdAt">) => {
    const newSub = subEventService.create(subEventData);
    setSubEvents((prev) => [...prev, newSub]);
    return newSub;
  }, []);

  const updateSubEvent = useCallback((id: string, updates: Partial<SubEventItinerary>) => {
    const updated = subEventService.update(id, updates);
    if (updated) {
      setSubEvents((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  }, []);

  const deleteSubEvent = useCallback((id: string) => {
    subEventService.delete(id);
    setSubEvents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const deletePayment = useCallback(
    (id: string) => {
      if (!activeEventId) return;
      paymentLedgerService.delete(id);
      setPaymentLedger((prev) => prev.filter((p) => p.id !== id));

      // Re-sync vendor & expense balances
      const allPayments = paymentLedgerService.getByEvent(activeEventId);
      const loadedVendors = vendorService.getByEvent(activeEventId);
      loadedVendors.forEach((v) => {
        const vPayments = allPayments.filter(
          (p) => p.vendorId === v.id || (p.recipientName && p.recipientName.toLowerCase() === v.name.toLowerCase())
        );
        const sum = vPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const quoted = v.quotedAmount || 0;
        const status: PaymentStatus = quoted > 0 && sum >= quoted ? "paid" : sum > 0 ? "partially_paid" : "unpaid";
        updateVendor(v.id, { actualAmount: sum, paymentStatus: status });
      });
    },
    [activeEventId, updateVendor]
  );

  // Chat / AI Assistant
  const addAssistantMessage = useCallback((content: string, actionData?: ChatMessage["actionData"]) => {
    if (!activeEventId) return;
    const msg = chatService.addMessage({
      eventId: activeEventId,
      role: "assistant",
      content,
      actionData,
    });
    setChatMessages((prev) => [...prev, msg]);
  }, [activeEventId]);

  const sendChatMessage = useCallback(async (content: string, actionData?: ChatMessage["actionData"]) => {
    if (!activeEventId || !activeEvent || !content.trim()) return;

    // 1. Add user message
    const userMsg = chatService.addMessage({
      eventId: activeEventId,
      role: "user",
      content,
      actionData,
    });
    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      // 2. Call server-side chat API with event context
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: activeEventId,
          message: content,
          event: {
            title: activeEvent.title,
            occasion: activeEvent.occasion,
            date: activeEvent.date,
            location: activeEvent.location,
            guestCount: activeEvent.guestCount,
            budget: activeEvent.budget,
            currency: activeEvent.currency,
            preferences: activeEvent.preferences,
          },
          currentBudgetSummary: budgetSummary,
          currentExpenses: expenses.map((e) => ({
            title: e.title,
            category: e.category,
            estimated: e.estimatedAmount,
            quoted: e.quotedAmount,
            paid: e.actualAmount,
          })),
          currentVendors: vendors.map((v) => ({
            id: v.id,
            name: v.name,
            category: v.category,
            quotedAmount: v.quotedAmount || 0,
            actualAmount: v.actualAmount || 0,
            bookingStatus: v.bookingStatus,
            paymentStatus: v.paymentStatus,
          })),
          currentPaymentLedger: paymentLedger.map((p) => ({
            id: p.id,
            recipientName: p.recipientName,
            category: p.category,
            amount: p.amount,
            paymentDate: p.paymentDate,
            paymentMethod: p.paymentMethod,
          })),
          currentTasksCount: tasks.length,
          chatHistory: chatMessages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (data && data.reply) {
        addAssistantMessage(data.reply, data.actionData);
      } else {
        addAssistantMessage(
          `I reviewed your celebration plan for "${activeEvent.title}". With ${activeEvent.guestCount} guests and a budget of ${activeEvent.currency.symbol}${activeEvent.budget.toLocaleString()}, I recommend keeping food & beverages at ~38% and decor at ~20%. Would you like me to suggest specific vendor packages or cost optimizations?`
        );
      }
    } catch (err) {
      console.error("Chat error", err);
      addAssistantMessage(
        `I have updated my recommendations for "${activeEvent.title}". You currently have ${activeEvent.currency.symbol}${budgetSummary.totalRemaining.toLocaleString()} remaining in your budget. Feel free to ask me to adjust catering, suggest decor items, or add timeline milestones.`
      );
    } finally {
      setIsChatLoading(false);
    }
  }, [activeEventId, activeEvent, budgetSummary, expenses, vendors, paymentLedger, tasks, chatMessages, addAssistantMessage]);

  const clearChat = useCallback(() => {
    if (!activeEventId) return;
    chatService.clearByEvent(activeEventId);
    setChatMessages([]);
  }, [activeEventId]);

  // Photo Analyses (Inspiration Studio)
  const savePhotoAnalysis = useCallback((analysis: PhotoAnalysis) => {
    photoService.save(analysis);
    setPhotoAnalyses((prev) => {
      const idx = prev.findIndex((p) => p.id === analysis.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = analysis;
        return copy;
      }
      return [analysis, ...prev];
    });
  }, []);

  const deletePhotoAnalysis = useCallback((id: string) => {
    photoService.delete(id);
    setPhotoAnalyses((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    if (!activeEventId) return;
    notificationService.clear(activeEventId);
    setNotifications([]);
  }, [activeEventId]);

  // Demo Controls
  const loadDemoEvent = useCallback(() => {
    const store = loadData();
    // Clean old demo data first
    store.events = store.events.filter((e) => e.id !== DEMO_EVENT_ID);
    store.expenses = store.expenses.filter((e) => e.eventId !== DEMO_EVENT_ID);
    store.tasks = store.tasks.filter((t) => t.eventId !== DEMO_EVENT_ID);
    store.vendors = store.vendors.filter((v) => v.eventId !== DEMO_EVENT_ID);
    store.paymentLedger = (store.paymentLedger || []).filter((p) => p.eventId !== DEMO_EVENT_ID);
    store.guests = (store.guests || []).filter((g) => g.eventId !== DEMO_EVENT_ID);
    store.subEvents = (store.subEvents || []).filter((s) => s.eventId !== DEMO_EVENT_ID);
    store.plans = store.plans.filter((p) => p.eventId !== DEMO_EVENT_ID);

    store.events.unshift(DEMO_EVENT);
    store.expenses.push(...DEMO_EXPENSES);
    store.tasks.push(...DEMO_TASKS);
    store.vendors.push(...DEMO_VENDORS);
    store.paymentLedger.push(...DEMO_PAYMENTS);
    store.guests.push(...DEMO_GUESTS);
    store.subEvents.push(...DEMO_SUB_EVENTS);
    store.plans.push(DEMO_PLAN);
    store.activeEventId = DEMO_EVENT_ID;

    // Add initial demo snapshot
    store.budgetHistory.push({
      id: "demo-hist-1",
      eventId: DEMO_EVENT_ID,
      date: new Date().toISOString().split("T")[0],
      totalBudget: DEMO_EVENT.budget,
      totalEstimated: 22400,
      totalActual: 5000,
      note: "Initial Demo Event Setup",
    });

    saveData(store);

    setEvents(store.events);
    setActiveEventIdState(DEMO_EVENT_ID);
    setExpenses([...DEMO_EXPENSES]);
    setTasks([...DEMO_TASKS]);
    setVendors([...DEMO_VENDORS]);
    setPaymentLedger([...DEMO_PAYMENTS]);
    setGuests([...DEMO_GUESTS]);
    setSubEvents([...DEMO_SUB_EVENTS]);
    setPlan(DEMO_PLAN);
    setBudgetHistory(store.budgetHistory.filter((b) => b.eventId === DEMO_EVENT_ID));
  }, []);

  const clearDemoMode = useCallback(() => {
    clearDemoDataStorage();
    const loaded = loadData();
    setEvents(loaded.events);
    const newAid = loaded.activeEventId || loaded.events[0]?.id || null;
    setActiveEventIdState(newAid);
    if (newAid) {
      setActiveEventId(newAid);
    } else {
      setExpenses([]);
      setTasks([]);
      setVendors([]);
      setPaymentLedger([]);
      setGuests([]);
      setSubEvents([]);
      setPlan(null);
      setChatMessages([]);
      setPhotoAnalyses([]);
      setBudgetHistory([]);
      setNotifications([]);
    }
  }, [setActiveEventId]);

  const simulateOverBudget = useCallback(() => {
    if (!activeEventId) return;
    const store = loadData();
    store.expenses = store.expenses.filter((e) => e.eventId !== activeEventId);
    const newExpenses = OVER_BUDGET_SIMULATION_EXPENSES.map((e) => ({
      ...e,
      eventId: activeEventId,
    }));
    store.expenses.push(...newExpenses);
    saveData(store);
    setExpenses(newExpenses);
  }, [activeEventId]);

  const resetToNormalBudget = useCallback(() => {
    if (!activeEventId) return;
    const store = loadData();
    store.expenses = store.expenses.filter((e) => e.eventId !== activeEventId);
    const standardExpenses = DEMO_EXPENSES.map((e) => ({
      ...e,
      eventId: activeEventId,
    }));
    store.expenses.push(...standardExpenses);
    saveData(store);
    setExpenses(standardExpenses);
  }, [activeEventId]);

  const exportData = useCallback(() => {
    return exportAllData();
  }, []);

  const importData = useCallback((json: string) => {
    const ok = importAllData(json);
    if (ok) {
      const data = loadData();
      setEvents(data.events);
      const aid = data.activeEventId || data.events[0]?.id || null;
      setActiveEventIdState(aid);
      if (aid) {
        setExpenses(data.expenses.filter((e) => e.eventId === aid));
        setTasks(data.tasks.filter((t) => t.eventId === aid));
        setVendors(data.vendors.filter((v) => v.eventId === aid));
        setPlan(data.plans.find((p) => p.eventId === aid) || null);
        setChatMessages(data.chatMessages?.filter((m) => m.eventId === aid) || []);
        setPhotoAnalyses(data.photoAnalyses?.filter((p) => p.eventId === aid) || []);
        setBudgetHistory(data.budgetHistory?.filter((b) => b.eventId === aid) || []);
        setNotifications(data.notifications?.filter((n) => n.eventId === aid) || []);
      }
    }
    return ok;
  }, []);

  return (
    <AppContext.Provider
      value={{
        events,
        activeEvent,
        activeEventId,
        setActiveEventId,
        createEvent,
        updateEvent,
        deleteEvent,
        changeCurrency,
        expenses,
        createExpense,
        updateExpense,
        deleteExpense,
        tasks,
        createTask,
        updateTask,
        deleteTask,
        vendors,
        createVendor,
        updateVendor,
        deleteVendor,
        setPreferredVendor,
        paymentLedger,
        recordPayment,
        updatePayment,
        deletePayment,
        guests,
        createGuest,
        updateGuest,
        deleteGuest,
        autoAssignTables,
        subEvents,
        createSubEvent,
        updateSubEvent,
        deleteSubEvent,
        plan,
        savePlan,
        chatMessages,
        sendChatMessage,
        addAssistantMessage,
        clearChat,
        isChatLoading,
        photoAnalyses,
        savePhotoAnalysis,
        deletePhotoAnalysis,
        budgetHistory,
        recordBudgetSnapshot,
        notifications,
        markNotificationRead,
        clearNotifications,
        budgetSummary,
        budgetAlternatives,
        applyBudgetAlternative,
        applyMultipleAlternatives,
        saveCategoryAllocations,
        loadDemoEvent,
        clearDemoMode,
        simulateOverBudget,
        resetToNormalBudget,
        isDemoMode,
        exportData,
        importData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}
