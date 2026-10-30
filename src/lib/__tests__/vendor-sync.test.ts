/**
 * Vendor Synchronization Engine — Integration Tests
 *
 * Uses an in-memory localStorage shim so expenseService.update (called
 * inside syncVendorsWithExpenses) can persist changes the same way the
 * browser version does, without requiring jsdom.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { syncVendorsWithExpenses } from "@/lib/vendor-sync";
import { expenseService } from "@/lib/storage";
import { Vendor, Expense } from "@/types";

// ---------------------------------------------------------------------------
// Minimal in-memory localStorage shim
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

const lsShim = makeLocalStorageShim();
vi.stubGlobal("window", { localStorage: lsShim });
vi.stubGlobal("localStorage", lsShim);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const eventId = "test-sync-event-1";

const createMockVendor = (overrides: Partial<Vendor> = {}): Vendor => ({
  id: "v-sync-1",
  eventId,
  name: "Royal Rasoi Caterers",
  category: "catering",
  quotedAmount: 100000,
  actualAmount: 25000,
  bookingStatus: "confirmed",
  paymentStatus: "partially_paid",
  notes: "Advance paid",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createMockExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: "exp-sync-1",
  eventId,
  title: "Royal Rasoi Caterers",
  category: "catering",
  estimatedAmount: 100000,
  quotedAmount: 100000,
  actualAmount: 0,
  paymentStatus: "unpaid",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Vendor Synchronization Engine — syncVendorsWithExpenses", () => {
  beforeEach(() => {
    lsShim.clear();
  });

  it("automatically generates an itemized expense when a confirmed vendor is added", () => {
    const vendors: Vendor[] = [createMockVendor()];
    const initialExpenses: Expense[] = [];

    const synced = syncVendorsWithExpenses(vendors, initialExpenses, eventId);
    expect(synced.length).toBe(1);
    expect(synced[0].title).toBe("Royal Rasoi Caterers");
    expect(synced[0].actualAmount).toBe(25000);
    expect(synced[0].paymentStatus).toBe("partially_paid");
    expect(synced[0].vendorId).toBe("v-sync-1");
  });

  it("updates existing expense when vendor payments advance", () => {
    // Seed an existing expense record into persistent storage so expenseService.update finds it
    const seeded = expenseService.create({
      eventId,
      title: "Royal Rasoi Caterers",
      category: "catering",
      estimatedAmount: 100000,
      quotedAmount: 100000,
      actualAmount: 10000,
      paymentStatus: "partially_paid",
      vendorId: "v-sync-1",
    });

    const existingExp = createMockExpense({ id: seeded.id, vendorId: "v-sync-1", actualAmount: 10000, paymentStatus: "partially_paid" });
    const vendorWithUpdate = createMockVendor({ actualAmount: 100000, paymentStatus: "paid" });

    const synced = syncVendorsWithExpenses([vendorWithUpdate], [existingExp], eventId);
    expect(synced.length).toBe(1);
    expect(synced[0].actualAmount).toBe(100000);
    expect(synced[0].paymentStatus).toBe("paid");
  });

  it("isolates sync to the target event and ignores other events", () => {
    const otherEventVendor = createMockVendor({ id: "v-other", eventId: "other-event-id", name: "Foreign Vendor" });
    const synced = syncVendorsWithExpenses([otherEventVendor], [], eventId);
    expect(synced.length).toBe(0);
  });

  it("maps 'other' category correctly to 'miscellaneous'", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const otherVendor = createMockVendor({ id: "v-other-cat", category: "other" as any, name: "Special Effect Fireworks" });
    const synced = syncVendorsWithExpenses([otherVendor], [], eventId);
    expect(synced.length).toBe(1);
    expect(synced[0].category).toBe("miscellaneous");
  });
});
