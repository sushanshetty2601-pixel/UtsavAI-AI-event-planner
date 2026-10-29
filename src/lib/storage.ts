import {
  StorageData,
  Event,
  Expense,
  Task,
  Vendor,
  PaymentRecord,
  Guest,
  SubEventItinerary,
  AIPlan,
  ChatMessage,
  PhotoAnalysis,
  BudgetHistoryEntry,
  EventNotification,
  StoredImage,
} from "@/types";
import { generateId } from "./utils";
import { DEMO_EVENT_ID } from "./demo-data";
import { saveImage, deleteImagesByEvent, deleteImage } from "./image-db";

export const STORAGE_KEY = "utsavai_v1_store";
export const BACKUP_KEY = "utsavai_v1_store_backup";
export const STORAGE_VERSION = 3;

export function getDefaultData(): StorageData {
  return {
    version: STORAGE_VERSION,
    events: [],
    expenses: [],
    tasks: [],
    vendors: [],
    paymentLedger: [],
    guests: [],
    subEvents: [],
    plans: [],
    chatMessages: [],
    photoAnalyses: [],
    budgetHistory: [],
    notifications: [],
    activeEventId: null,
    preferences: {
      theme: "dark",
      defaultCurrency: "INR",
    },
  };
}

/**
 * Remove heavy base64 strings or large data URLs from the store
 * so it stays under the 5MB browser localStorage limit (typically < 100KB)
 */
export function sanitizeStore(data: StorageData): StorageData {
  const sanitized: StorageData = {
    ...data,
    photoAnalyses: (data.photoAnalyses || []).map((p) => {
      // If imageUrl is a huge base64 string, strip it from localStorage
      const isBase64 =
        typeof p.imageUrl === "string" &&
        (p.imageUrl.startsWith("data:image/") || p.imageUrl.length > 500);

      return {
        ...p,
        imageId: p.imageId || (isBase64 ? generateId() : undefined),
        imageUrl: isBase64 ? "" : p.imageUrl || "",
      };
    }),
    // Keep chat history to a safe maximum of 100 messages per event
    chatMessages: (data.chatMessages || []).slice(-200),
  };

  return sanitized;
}

/**
 * Load data from localStorage with graceful fallback
 */
export function loadData(): StorageData {
  if (typeof window === "undefined") return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return getDefaultData();

    return {
      version: parsed.version || STORAGE_VERSION,
      events: Array.isArray(parsed.events) ? parsed.events : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      vendors: Array.isArray(parsed.vendors) ? parsed.vendors : [],
      paymentLedger: Array.isArray(parsed.paymentLedger) ? parsed.paymentLedger : [],
      guests: Array.isArray(parsed.guests) ? parsed.guests : [],
      subEvents: Array.isArray(parsed.subEvents) ? parsed.subEvents : [],
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
      chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : [],
      photoAnalyses: Array.isArray(parsed.photoAnalyses) ? parsed.photoAnalyses : [],
      budgetHistory: Array.isArray(parsed.budgetHistory) ? parsed.budgetHistory : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      activeEventId: parsed.activeEventId || null,
      preferences: parsed.preferences || { theme: "dark", defaultCurrency: "INR" },
    };
  } catch (e) {
    console.error("UtsavAI: Error reading storage, attempting recovery from backup", e);
    try {
      const backupRaw = localStorage.getItem(BACKUP_KEY);
      if (backupRaw) {
        const backupParsed = JSON.parse(backupRaw);
        if (backupParsed && typeof backupParsed === "object") {
          return sanitizeStore(backupParsed);
        }
      }
    } catch (bErr) {
      console.error("UtsavAI: Backup recovery failed", bErr);
    }
    return getDefaultData();
  }
}

/**
 * Save data to localStorage with QuotaExceededError protection, sanitization, and non-destructive fallback
 */
export function saveData(data: StorageData): boolean {
  if (typeof window === "undefined") return false;

  try {
    // 1. Sanitize to ensure no heavy binary or multi-MB base64 ever enters localStorage
    const cleanData = sanitizeStore(data);
    cleanData.version = STORAGE_VERSION;
    const serialized = JSON.stringify(cleanData);

    // 2. Perform safe write
    localStorage.setItem(STORAGE_KEY, serialized);

    // 3. Keep a rotating backup of valid data
    try {
      localStorage.setItem(BACKUP_KEY, serialized);
    } catch {
      // Backup write failure is non-fatal
    }

    return true;
  } catch (err: unknown) {
    const isQuotaError =
      (err instanceof DOMException &&
        (err.name === "QuotaExceededError" ||
          err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
          err.code === 22 ||
          err.code === 1014)) ||
      (typeof err === "object" && err !== null && "name" in err && (err as { name: string }).name === "QuotaExceededError");

    console.warn("UtsavAI: Storage write error encountered", isQuotaError ? "QuotaExceededError" : err);

    if (isQuotaError) {
      try {
        // Emergency mitigation: Strip all optional non-critical caches to save critical user events & expenses
        const emergencyData: StorageData = {
          ...data,
          photoAnalyses: (data.photoAnalyses || []).map((p) => ({
            ...p,
            imageUrl: "",
          })),
          chatMessages: (data.chatMessages || []).slice(-30),
          notifications: (data.notifications || []).slice(-10),
        };
        const emergencySerialized = JSON.stringify(emergencyData);
        localStorage.setItem(STORAGE_KEY, emergencySerialized);
        console.info("UtsavAI: Emergency compact save succeeded!");
        return true;
      } catch (subErr) {
        console.error("UtsavAI: Could not save even in compact mode. Data preserved in memory.", subErr);
      }
    }

    // Notify UI if window is available
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("utsavai-storage-error", {
          detail: {
            isQuota: isQuotaError,
            message: "Browser storage quota reached. Large files have been moved to IndexedDB.",
          },
        })
      );
    }

    return false;
  }
}

function mutate(fn: (data: StorageData) => void): StorageData {
  const data = loadData();
  fn(data);
  saveData(data);
  return data;
}

/**
 * Asynchronous migration: Inspects existing stored records for Base64 image strings,
 * moves them into IndexedDB, and updates the localStorage records to lightweight metadata.
 */
export async function migrateStorageToIndexedDB(): Promise<{
  migratedCount: number;
  success: boolean;
}> {
  if (typeof window === "undefined") return { migratedCount: 0, success: true };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { migratedCount: 0, success: true };

    // 1. Create a safety backup first before touching anything
    try {
      if (!localStorage.getItem(BACKUP_KEY)) {
        localStorage.setItem(BACKUP_KEY, raw);
      }
    } catch (e) {
      console.warn("Could not create pre-migration backup string", e);
    }

    const data: StorageData = JSON.parse(raw);
    if (!data || !Array.isArray(data.photoAnalyses)) {
      return { migratedCount: 0, success: true };
    }

    let migratedCount = 0;

    for (const analysis of data.photoAnalyses) {
      const rawUrl = analysis.imageUrl;
      const isBase64 =
        typeof rawUrl === "string" &&
        (rawUrl.startsWith("data:image/") || rawUrl.length > 500);

      if (isBase64 && rawUrl) {
        const imageId = analysis.imageId || generateId();
        analysis.imageId = imageId;

        // Move the base64 string into IndexedDB
        try {
          const storedImage: StoredImage = {
            id: imageId,
            eventId: analysis.eventId,
            analysisId: analysis.id,
            filename: analysis.imageName || "inspiration.jpg",
            mimeType: "image/jpeg",
            size: rawUrl.length,
            data: rawUrl, // Stored safely in IndexedDB
            createdAt: analysis.uploadedAt || new Date().toISOString(),
          };
          await saveImage(storedImage);
          migratedCount++;
        } catch (idbErr) {
          console.warn("Failed moving image into IndexedDB during migration", idbErr);
        }

        // Clean out of the localStorage object
        analysis.imageUrl = "";
      }
    }

    // Save the cleansed store back to localStorage
    if (migratedCount > 0 || (data.version && data.version < STORAGE_VERSION)) {
      data.version = STORAGE_VERSION;
      saveData(data);
      console.info(`UtsavAI: Successfully migrated ${migratedCount} image(s) to IndexedDB!`);
    }

    return { migratedCount, success: true };
  } catch (err) {
    console.error("UtsavAI: Storage migration error:", err);
    return { migratedCount: 0, success: false };
  }
}

// Events Service
export const eventService = {
  getAll(): Event[] {
    return loadData().events;
  },
  getById(id: string): Event | undefined {
    return loadData().events.find((e) => e.id === id);
  },
  create(event: Omit<Event, "id" | "createdAt" | "updatedAt">): Event {
    const now = new Date().toISOString();
    const newEvent: Event = {
      ...event,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    mutate((d) => {
      d.events.push(newEvent);
      d.activeEventId = newEvent.id;
      // Add initial budget history snapshot
      d.budgetHistory.push({
        id: generateId(),
        eventId: newEvent.id,
        date: now.split("T")[0],
        totalBudget: newEvent.budget,
        totalEstimated: 0,
        totalActual: 0,
        note: `Event created: ${newEvent.title}`,
      });
    });
    return newEvent;
  },
  update(id: string, updates: Partial<Event>): Event | undefined {
    let updated: Event | undefined;
    mutate((d) => {
      const idx = d.events.findIndex((e) => e.id === id);
      if (idx !== -1) {
        d.events[idx] = {
          ...d.events[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        updated = d.events[idx];
      }
    });
    return updated;
  },
  delete(id: string): void {
    // Also remove any binary images from IndexedDB
    deleteImagesByEvent(id).catch((e) => console.warn("Failed to delete event images from IDB:", e));

    mutate((d) => {
      d.events = d.events.filter((e) => e.id !== id);
      d.expenses = d.expenses.filter((e) => e.eventId !== id);
      d.tasks = d.tasks.filter((t) => t.eventId !== id);
      d.vendors = d.vendors.filter((v) => v.eventId !== id);
      d.paymentLedger = (d.paymentLedger || []).filter((p) => p.eventId !== id);
      d.guests = (d.guests || []).filter((g) => g.eventId !== id);
      d.subEvents = (d.subEvents || []).filter((s) => s.eventId !== id);
      d.plans = d.plans.filter((p) => p.eventId !== id);
      d.chatMessages = d.chatMessages.filter((m) => m.eventId !== id);
      d.photoAnalyses = d.photoAnalyses.filter((p) => p.eventId !== id);
      d.budgetHistory = d.budgetHistory.filter((b) => b.eventId !== id);
      d.notifications = d.notifications.filter((n) => n.eventId !== id);
      if (d.activeEventId === id) {
        d.activeEventId = d.events[0]?.id || null;
      }
    });
  },
  setActive(id: string): void {
    mutate((d) => {
      d.activeEventId = id;
    });
  },
  getActiveId(): string | null {
    return loadData().activeEventId;
  },
};

// Safe Demo Cleanup — Clears all demo event data while leaving user events completely untouched
export function clearDemoData(): void {
  deleteImagesByEvent(DEMO_EVENT_ID).catch((e) => console.warn("Demo IDB delete error:", e));

  mutate((d) => {
    d.events = d.events.filter((e) => e.id !== DEMO_EVENT_ID && !e.isDemoEvent);
    d.expenses = d.expenses.filter((e) => e.eventId !== DEMO_EVENT_ID);
    d.tasks = d.tasks.filter((t) => t.eventId !== DEMO_EVENT_ID);
    d.vendors = d.vendors.filter((v) => v.eventId !== DEMO_EVENT_ID);
    d.paymentLedger = (d.paymentLedger || []).filter((p) => p.eventId !== DEMO_EVENT_ID);
    d.guests = (d.guests || []).filter((g) => g.eventId !== DEMO_EVENT_ID);
    d.subEvents = (d.subEvents || []).filter((s) => s.eventId !== DEMO_EVENT_ID);
    d.plans = d.plans.filter((p) => p.eventId !== DEMO_EVENT_ID);
    d.chatMessages = d.chatMessages.filter((m) => m.eventId !== DEMO_EVENT_ID);
    d.photoAnalyses = d.photoAnalyses.filter((p) => p.eventId !== DEMO_EVENT_ID);
    d.budgetHistory = d.budgetHistory.filter((b) => b.eventId !== DEMO_EVENT_ID);
    d.notifications = d.notifications.filter((n) => n.eventId !== DEMO_EVENT_ID);
    if (d.activeEventId === DEMO_EVENT_ID) {
      d.activeEventId = d.events[0]?.id || null;
    }
  });
}

// Expenses Service
export const expenseService = {
  getByEvent(eventId: string): Expense[] {
    return loadData().expenses.filter((e) => e.eventId === eventId);
  },
  create(expense: Omit<Expense, "id" | "createdAt" | "updatedAt">): Expense {
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    mutate((d) => {
      d.expenses.push(newExpense);
    });
    return newExpense;
  },
  update(id: string, updates: Partial<Expense>): Expense | undefined {
    let updated: Expense | undefined;
    mutate((d) => {
      const idx = d.expenses.findIndex((e) => e.id === id);
      if (idx !== -1) {
        d.expenses[idx] = {
          ...d.expenses[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        updated = d.expenses[idx];
      }
    });
    return updated;
  },
  delete(id: string): void {
    mutate((d) => {
      d.expenses = d.expenses.filter((e) => e.id !== id);
    });
  },
};

// Tasks Service
export const taskService = {
  getByEvent(eventId: string): Task[] {
    return loadData().tasks.filter((t) => t.eventId === eventId);
  },
  create(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Task {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    mutate((d) => {
      d.tasks.push(newTask);
    });
    return newTask;
  },
  update(id: string, updates: Partial<Task>): Task | undefined {
    let updated: Task | undefined;
    mutate((d) => {
      const idx = d.tasks.findIndex((t) => t.id === id);
      if (idx !== -1) {
        d.tasks[idx] = {
          ...d.tasks[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        updated = d.tasks[idx];
      }
    });
    return updated;
  },
  delete(id: string): void {
    mutate((d) => {
      d.tasks = d.tasks.filter((t) => t.id !== id);
    });
  },
};

// Vendors Service
export const vendorService = {
  getByEvent(eventId: string): Vendor[] {
    return loadData().vendors.filter((v) => v.eventId === eventId);
  },
  create(vendor: Omit<Vendor, "id" | "createdAt" | "updatedAt">): Vendor {
    const now = new Date().toISOString();
    const newVendor: Vendor = {
      ...vendor,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    mutate((d) => {
      d.vendors.push(newVendor);
    });
    return newVendor;
  },
  update(id: string, updates: Partial<Vendor>): Vendor | undefined {
    let updated: Vendor | undefined;
    mutate((d) => {
      const idx = d.vendors.findIndex((v) => v.id === id);
      if (idx !== -1) {
        d.vendors[idx] = {
          ...d.vendors[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        updated = d.vendors[idx];
      }
    });
    return updated;
  },
  delete(id: string): void {
    mutate((d) => {
      d.vendors = d.vendors.filter((v) => v.id !== id);
    });
  },
  setPreferred(id: string, eventId: string): void {
    mutate((d) => {
      const vendor = d.vendors.find((v) => v.id === id);
      if (vendor) {
        d.vendors
          .filter((v) => v.eventId === eventId && v.category === vendor.category)
          .forEach((v) => {
            v.isPreferred = v.id === id;
          });
      }
    });
  },
};

// Payment Ledger Service (Authoritative Financial Record of Cash Outflows)
export const paymentLedgerService = {
  getByEvent(eventId: string): PaymentRecord[] {
    return (loadData().paymentLedger || []).filter((p) => p.eventId === eventId);
  },
  create(payment: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">): PaymentRecord {
    const now = new Date().toISOString();
    const newPayment: PaymentRecord = {
      ...payment,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    mutate((d) => {
      d.paymentLedger = d.paymentLedger || [];
      d.paymentLedger.unshift(newPayment);
    });
    return newPayment;
  },
  update(id: string, updates: Partial<PaymentRecord>): PaymentRecord | null {
    let updated: PaymentRecord | null = null;
    mutate((d) => {
      d.paymentLedger = d.paymentLedger || [];
      const idx = d.paymentLedger.findIndex((p) => p.id === id);
      if (idx !== -1) {
        d.paymentLedger[idx] = {
          ...d.paymentLedger[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        updated = d.paymentLedger[idx];
      }
    });
    return updated;
  },
  delete(id: string): void {
    mutate((d) => {
      d.paymentLedger = (d.paymentLedger || []).filter((p) => p.id !== id);
    });
  },
  deleteByEvent(eventId: string): void {
    mutate((d) => {
      d.paymentLedger = (d.paymentLedger || []).filter((p) => p.eventId !== eventId);
    });
  },
};

// Guests Service
export const guestService = {
  getByEvent(eventId: string): Guest[] {
    return (loadData().guests || []).filter((g) => g.eventId === eventId);
  },
  create(guest: Omit<Guest, "id" | "createdAt">): Guest {
    const newGuest: Guest = {
      ...guest,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    mutate((d) => {
      d.guests = d.guests || [];
      d.guests.push(newGuest);
    });
    return newGuest;
  },
  update(id: string, updates: Partial<Guest>): Guest | null {
    let updated: Guest | null = null;
    mutate((d) => {
      d.guests = d.guests || [];
      const idx = d.guests.findIndex((g) => g.id === id);
      if (idx !== -1) {
        d.guests[idx] = {
          ...d.guests[idx],
          ...updates,
        };
        updated = d.guests[idx];
      }
    });
    return updated;
  },
  delete(id: string): void {
    mutate((d) => {
      d.guests = (d.guests || []).filter((g) => g.id !== id);
    });
  },
  bulkAssignTables(eventId: string, assignments: { guestId: string; tableNumber: string }[]): void {
    mutate((d) => {
      d.guests = d.guests || [];
      const map = new Map(assignments.map((a) => [a.guestId, a.tableNumber]));
      d.guests.forEach((g) => {
        if (g.eventId === eventId && map.has(g.id)) {
          g.tableNumber = map.get(g.id);
        }
      });
    });
  },
};

// Sub-Events (Multi-day ceremonies) Service
export const subEventService = {
  getByEvent(eventId: string): SubEventItinerary[] {
    return (loadData().subEvents || []).filter((s) => s.eventId === eventId);
  },
  create(subEvent: Omit<SubEventItinerary, "id" | "createdAt">): SubEventItinerary {
    const newSub: SubEventItinerary = {
      ...subEvent,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    mutate((d) => {
      d.subEvents = d.subEvents || [];
      d.subEvents.push(newSub);
    });
    return newSub;
  },
  update(id: string, updates: Partial<SubEventItinerary>): SubEventItinerary | null {
    let updated: SubEventItinerary | null = null;
    mutate((d) => {
      d.subEvents = d.subEvents || [];
      const idx = d.subEvents.findIndex((s) => s.id === id);
      if (idx !== -1) {
        d.subEvents[idx] = {
          ...d.subEvents[idx],
          ...updates,
        };
        updated = d.subEvents[idx];
      }
    });
    return updated;
  },
  delete(id: string): void {
    mutate((d) => {
      d.subEvents = (d.subEvents || []).filter((s) => s.id !== id);
    });
  },
};

// Plan Service
export const planService = {
  getByEvent(eventId: string): AIPlan | undefined {
    return loadData().plans.find((p) => p.eventId === eventId);
  },
  save(plan: AIPlan): void {
    mutate((d) => {
      const idx = d.plans.findIndex((p) => p.eventId === plan.eventId);
      if (idx !== -1) {
        d.plans[idx] = plan;
      } else {
        d.plans.push(plan);
      }
    });
  },
};

// Chat Service (Persistent Conversational History per Event)
export const chatService = {
  getByEvent(eventId: string): ChatMessage[] {
    return loadData().chatMessages.filter((m) => m.eventId === eventId);
  },
  addMessage(message: Omit<ChatMessage, "id" | "timestamp">): ChatMessage {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    mutate((d) => {
      d.chatMessages.push(newMessage);
    });
    return newMessage;
  },
  clearByEvent(eventId: string): void {
    mutate((d) => {
      d.chatMessages = d.chatMessages.filter((m) => m.eventId !== eventId);
    });
  },
};

// Photo Analysis Service (Inspiration Studio)
export const photoService = {
  getByEvent(eventId: string): PhotoAnalysis[] {
    return loadData().photoAnalyses.filter((p) => p.eventId === eventId);
  },
  save(analysis: PhotoAnalysis): void {
    mutate((d) => {
      // Ensure no base64 string slips into the stored analysis
      const isBase64 =
        typeof analysis.imageUrl === "string" &&
        (analysis.imageUrl.startsWith("data:image/") || analysis.imageUrl.length > 500);

      const sanitizedAnalysis: PhotoAnalysis = {
        ...analysis,
        imageUrl: isBase64 ? "" : analysis.imageUrl || "",
      };

      const idx = d.photoAnalyses.findIndex((p) => p.id === sanitizedAnalysis.id);
      if (idx !== -1) {
        d.photoAnalyses[idx] = sanitizedAnalysis;
      } else {
        d.photoAnalyses.unshift(sanitizedAnalysis);
      }
    });
  },
  delete(id: string): void {
    // Find analysis and delete associated IndexedDB image if present
    const existing = loadData().photoAnalyses.find((p) => p.id === id);
    if (existing?.imageId) {
      deleteImage(existing.imageId).catch((e) => console.warn("IDB delete failed:", e));
    }

    mutate((d) => {
      d.photoAnalyses = d.photoAnalyses.filter((p) => p.id !== id);
    });
  },
};

// Budget History Service (Snapshots for Real Charts & Analysis)
export const budgetHistoryService = {
  getByEvent(eventId: string): BudgetHistoryEntry[] {
    return loadData().budgetHistory.filter((b) => b.eventId === eventId);
  },
  recordSnapshot(entry: Omit<BudgetHistoryEntry, "id">): BudgetHistoryEntry {
    const item: BudgetHistoryEntry = {
      ...entry,
      id: generateId(),
    };
    mutate((d) => {
      d.budgetHistory.push(item);
    });
    return item;
  },
};

// Notification Service
export const notificationService = {
  getByEvent(eventId: string): EventNotification[] {
    return loadData().notifications.filter((n) => n.eventId === eventId);
  },
  add(notification: Omit<EventNotification, "id" | "timestamp">): EventNotification {
    const item: EventNotification = {
      ...notification,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    mutate((d) => {
      d.notifications.unshift(item);
    });
    return item;
  },
  markAsRead(id: string): void {
    mutate((d) => {
      const n = d.notifications.find((item) => item.id === id);
      if (n) n.read = true;
    });
  },
  clear(eventId: string): void {
    mutate((d) => {
      d.notifications = d.notifications.filter((n) => n.eventId !== eventId);
    });
  },
};

// Full Data Export & Import
export function exportAllData(): string {
  const data = loadData();
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.events)) {
      throw new Error("Invalid format");
    }
    saveData(data);
    return true;
  } catch (e) {
    console.error("UtsavAI: Failed to import data", e);
    return false;
  }
}
