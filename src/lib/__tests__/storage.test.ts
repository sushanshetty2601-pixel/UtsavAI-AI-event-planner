/**
 * Storage Engine — Integration Tests
 *
 * These tests run in the node environment and use a vi.stubGlobal localStorage
 * shim so that the storage service's loadData / saveData / mutate pipeline
 * operates exactly as it does in the browser, without requiring jsdom.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  eventService,
  expenseService,
  taskService,
  vendorService,
  guestService,
  paymentLedgerService,
  exportAllData,
  importAllData,
  getDefaultData,
  // STORAGE_KEY exported for external integration tests that need the raw key
} from "@/lib/storage";

// ---------------------------------------------------------------------------
// Minimal in-memory localStorage shim (Map-backed, synchronous)
// ---------------------------------------------------------------------------
function makeLocalStorageShim() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    get length() { return store.size; },
    key: (index: number) => [...store.keys()][index] ?? null,
  };
}

// Provide window + localStorage in the node environment so loadData / saveData work
const lsShim = makeLocalStorageShim();
vi.stubGlobal("window", { localStorage: lsShim });
vi.stubGlobal("localStorage", lsShim);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Sum actual amounts for all expenses belonging to an event. */
function sumActual(eventId: string): number {
  return expenseService.getByEvent(eventId).reduce((acc, e) => acc + (e.actualAmount ?? 0), 0);
}

/** Sum estimated amounts for all expenses belonging to an event. */
function sumEstimated(eventId: string): number {
  return expenseService.getByEvent(eventId).reduce((acc, e) => acc + (e.estimatedAmount ?? 0), 0);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Storage Engine — Persistence & Services", () => {
  beforeEach(() => {
    lsShim.clear();
  });

  // ── eventService ──────────────────────────────────────────────────────────
  describe("eventService", () => {
    it("creates, retrieves, updates, and deletes events correctly", () => {
      const newEvent = eventService.create({
        title: "Pooja & Sangeet Gala",
        occasion: "wedding",
        date: "2026-11-20",
        location: "Mumbai",
        guestCount: 150,
        budget: 500000,
        currency: { code: "INR", symbol: "₹", locale: "en-IN", name: "Indian Rupee", rateToINR: 1 },
        preferences: {
          themeStyle: "Royal Marigold",
          colorPreferences: "Gold, Red",
          foodPreferences: "Traditional Satvik",
          dietaryRequirements: "50% Jain",
          culturalConsiderations: "Gujarati Traditions",
          desiredAtmosphere: "Joyful",
          specialRequests: "Live Shehnai",
          priorities: ["catering", "decoration"],
          venueSetting: "indoor",
        },
      });

      expect(newEvent.id).toBeDefined();
      expect(newEvent.title).toBe("Pooja & Sangeet Gala");

      // Retrieve
      const found = eventService.getById(newEvent.id);
      expect(found).not.toBeUndefined();
      expect(found?.budget).toBe(500000);

      // Update
      const updated = eventService.update(newEvent.id, { budget: 550000, title: "Royal Sangeet Gala" });
      expect(updated?.budget).toBe(550000);
      expect(updated?.title).toBe("Royal Sangeet Gala");

      // Delete
      eventService.delete(newEvent.id);
      expect(eventService.getById(newEvent.id)).toBeUndefined();
    });

    it("sets and retrieves the active event id", () => {
      const evt = eventService.create({
        title: "Anniversary Dinner",
        occasion: "anniversary",
        date: "2026-12-01",
        location: "Delhi",
        guestCount: 30,
        budget: 80000,
        currency: { code: "INR", symbol: "₹", locale: "en-IN", name: "Indian Rupee", rateToINR: 1 },
        preferences: {
          themeStyle: "Elegant",
          colorPreferences: "Gold, White",
          foodPreferences: "Continental",
          dietaryRequirements: "None",
          culturalConsiderations: "None",
          desiredAtmosphere: "Romantic",
          specialRequests: "",
          priorities: ["venue"],
          venueSetting: "indoor",
        },
      });
      eventService.setActive(evt.id);
      expect(eventService.getActiveId()).toBe(evt.id);
    });
  });

  // ── expenseService ────────────────────────────────────────────────────────
  describe("expenseService", () => {
    it("manages itemized expenses and computes accurate category totals", () => {
      const exp1 = expenseService.create({
        eventId: "test-event-1",
        title: "Artisanal Mithai & Sweets",
        category: "cake",
        estimatedAmount: 25000,
        quotedAmount: 30000,
        actualAmount: 15000,
        paymentStatus: "partially_paid",
      });

      const exp2 = expenseService.create({
        eventId: "test-event-1",
        title: "Royal Rajwada Catering",
        category: "catering",
        estimatedAmount: 150000,
        quotedAmount: 160000,
        actualAmount: 160000,
        paymentStatus: "paid",
      });

      // getByEvent (the real method name)
      const eventExpenses = expenseService.getByEvent("test-event-1");
      expect(eventExpenses.length).toBeGreaterThanOrEqual(2);

      // Computed totals via helper
      expect(sumEstimated("test-event-1")).toBeGreaterThanOrEqual(175000);
      expect(sumActual("test-event-1")).toBeGreaterThanOrEqual(175000);

      // Update
      const updated = expenseService.update(exp1.id, { actualAmount: 30000, paymentStatus: "paid" });
      expect(updated?.actualAmount).toBe(30000);
      expect(updated?.paymentStatus).toBe("paid");

      // Cleanup
      expenseService.delete(exp1.id);
      expenseService.delete(exp2.id);
      expect(expenseService.getByEvent("test-event-1").length).toBe(0);
    });
  });

  // ── vendorService ─────────────────────────────────────────────────────────
  describe("vendorService", () => {
    it("handles vendor bookings, preferred flag, and payment status updates", () => {
      const vendor = vendorService.create({
        eventId: "test-event-2",
        name: "Shadi Mandap Decorators",
        category: "decoration",
        quotedAmount: 75000,
        actualAmount: 25000,
        bookingStatus: "confirmed",
        paymentStatus: "partially_paid",
        contactPhone: "+91 98450 11111",
      });

      expect(vendor.name).toBe("Shadi Mandap Decorators");
      expect(vendor.isPreferred).toBeFalsy();

      // setPreferred (the real method name)
      vendorService.setPreferred(vendor.id, vendor.eventId);
      const afterPref = vendorService.getByEvent("test-event-2").find((v) => v.id === vendor.id);
      expect(afterPref?.isPreferred).toBe(true);

      // Update payment status
      const updated = vendorService.update(vendor.id, {
        actualAmount: 75000,
        paymentStatus: "paid",
      });
      expect(updated?.paymentStatus).toBe("paid");
      expect(updated?.actualAmount).toBe(75000);

      vendorService.delete(vendor.id);
      expect(vendorService.getByEvent("test-event-2").find((v) => v.id === vendor.id)).toBeUndefined();
    });
  });

  // ── taskService ───────────────────────────────────────────────────────────
  describe("taskService", () => {
    it("tracks milestone checklist items and completion states via status field", () => {
      const task = taskService.create({
        eventId: "test-event-3",
        title: "Book Dhol & Shehnai Troupe",
        category: "entertainment",
        dueDate: "2026-11-15",
        priority: "high",
        // Tasks use 'status' field; 'pending' is the initial state
        status: "pending",
        phase: "bookings",
      });

      expect(task.status).toBe("pending");

      // Mark as completed using update (the real API — no toggleComplete method)
      const toggled = taskService.update(task.id, { status: "completed" });
      expect(toggled?.status).toBe("completed");

      taskService.delete(task.id);
      expect(taskService.getByEvent("test-event-3").find((t) => t.id === task.id)).toBeUndefined();
    });
  });

  // ── guestService ──────────────────────────────────────────────────────────
  describe("guestService", () => {
    it("handles guest additions and table seating assignments", () => {
      const guest = guestService.create({
        eventId: "test-event-4",
        name: "Aarav & Priya Patel",
        rsvpStatus: "attending",
        group: "bride_family",
        plusOnes: 1,
        dietary: "jain",
        tableNumber: "Table 1",
      });

      expect(guest.dietary).toBe("jain");

      // Bulk-assign via the real bulkAssignTables method
      guestService.bulkAssignTables("test-event-4", [
        { guestId: guest.id, tableNumber: "Table 2 (Bride's Family)" },
      ]);

      // getByEvent is the real method name
      const updatedGuest = guestService.getByEvent("test-event-4").find((g) => g.id === guest.id);
      expect(updatedGuest?.tableNumber).toBe("Table 2 (Bride's Family)");

      guestService.delete(guest.id);
      expect(guestService.getByEvent("test-event-4").length).toBe(0);
    });
  });

  // ── paymentLedgerService & backup/recovery ────────────────────────────────
  describe("paymentLedgerService & backup recovery", () => {
    it("records audit payments and exports/imports full state cleanly", () => {
      const payment = paymentLedgerService.create({
        eventId: "test-event-5",
        vendorId: "v-1",
        recipientName: "Heritage Banquets",
        category: "venue",
        amount: 50000,
        currency: { code: "INR", symbol: "₹", locale: "en-IN", name: "Indian Rupee", rateToINR: 1 },
        paymentDate: "2026-11-01",
        paymentMethod: "bank_transfer",
        isAdvance: true,
        transactionRef: "TXN-998877",
        source: "manual",
      });

      expect(payment.amount).toBe(50000);
      expect(payment.isAdvance).toBe(true);

      // Test export
      const exportedJson = exportAllData();
      expect(typeof exportedJson).toBe("string");
      const parsed = JSON.parse(exportedJson);
      expect(parsed.version).toBeDefined();

      // Test valid import
      const importedOk = importAllData(exportedJson);
      expect(importedOk).toBe(true);

      // Test invalid import handling
      const badImport = importAllData("invalid-corrupted-json");
      expect(badImport).toBe(false);
    });
  });

  // ── getDefaultData ────────────────────────────────────────────────────────
  describe("getDefaultData", () => {
    it("returns a structurally valid empty storage schema", () => {
      const def = getDefaultData();
      expect(Array.isArray(def.events)).toBe(true);
      expect(Array.isArray(def.expenses)).toBe(true);
      expect(Array.isArray(def.vendors)).toBe(true);
      expect(Array.isArray(def.tasks)).toBe(true);
      expect(Array.isArray(def.guests)).toBe(true);
      expect(def.activeEventId).toBeNull();
      expect(def.version).toBeGreaterThan(0);
    });
  });
});
