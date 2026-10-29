// Data models for UtsavAI — The Celebration Copilot

export type OccasionType = "wedding" | "birthday" | "anniversary" | "community" | "other";

export interface Currency {
  code: string;
  symbol: string;
  locale: string;
  name: string;
  rateToINR: number; // For clean display conversion if requested
}

export const CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", locale: "en-IN", name: "Indian Rupee (₹)", rateToINR: 1 },
  { code: "USD", symbol: "$", locale: "en-US", name: "US Dollar ($)", rateToINR: 84 },
  { code: "EUR", symbol: "€", locale: "de-DE", name: "Euro (€)", rateToINR: 91 },
  { code: "GBP", symbol: "£", locale: "en-GB", name: "British Pound (£)", rateToINR: 108 },
  { code: "AED", symbol: "AED", locale: "ar-AE", name: "UAE Dirham (AED)", rateToINR: 23 },
  { code: "SGD", symbol: "S$", locale: "en-SG", name: "Singapore Dollar (S$)", rateToINR: 63 },
];

export const DEFAULT_CURRENCY: Currency = CURRENCIES[0];

export type PaymentStatus = "unpaid" | "partially_paid" | "paid";
export type BookingStatus = "not_booked" | "pending" | "confirmed" | "cancelled";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskCategory =
  | "venue"
  | "catering"
  | "photography"
  | "decoration"
  | "invitations"
  | "entertainment"
  | "cake"
  | "transport"
  | "attire"
  | "planning"
  | "post_event"
  | "other";

export type VendorCategory =
  | "venue"
  | "catering"
  | "photography"
  | "decoration"
  | "cake"
  | "entertainment"
  | "invitations"
  | "transport"
  | "other";

export type ExpenseCategory =
  | "venue"
  | "catering"
  | "photography"
  | "decoration"
  | "cake"
  | "entertainment"
  | "invitations"
  | "transport"
  | "attire"
  | "miscellaneous";

export interface EventPreferences {
  themeStyle: string;
  colorPreferences: string;
  foodPreferences: string;
  dietaryRequirements: string;
  culturalConsiderations: string;
  desiredAtmosphere: string;
  specialRequests: string;
  priorities: string[];
  venueSetting: "indoor" | "outdoor" | "undecided";
}

export interface Event {
  id: string;
  title: string;
  occasion: OccasionType;
  date: string; // ISO string (YYYY-MM-DD)
  startTime?: string;
  endTime?: string;
  location: string;
  guestCount: number;
  budget: number;
  currency: Currency;
  preferences: EventPreferences;
  contingencyReserve?: number;
  categoryAllocations?: BudgetCategoryAllocation[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isDemoEvent?: boolean;
}

export interface Expense {
  id: string;
  eventId: string;
  title: string;
  category: ExpenseCategory;
  estimatedAmount: number;
  quotedAmount?: number;
  actualAmount?: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  vendorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  dueDate: string; // ISO string
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  phase?: "planning" | "bookings" | "one_week" | "event_day" | "post_event";
  notes?: string;
  vendorId?: string;
  estimatedCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  eventId: string;
  name: string;
  category: VendorCategory;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  quotedAmount?: number;
  actualAmount?: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  isPreferred?: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  estimatedCostMin: number;
  estimatedCostMax: number;
  colorPalette: string[];
  keyFeatures: string[];
  imageUrl?: string;
}

export interface BudgetCategoryAllocation {
  category: ExpenseCategory;
  label: string;
  allocatedAmount: number;
  percentage: number;
  notes?: string;
}

export interface AIPlan {
  id: string;
  eventId: string;
  status: "generating" | "complete" | "error" | "demo";
  eventSummary: string;
  creativeConceptTagline: string;
  themeOptions: ThemeOption[];
  selectedThemeId?: string;
  colorPalette: string[];
  budgetCategories: BudgetCategoryAllocation[];
  menuIdeas: string[];
  decorationIdeas: string[];
  entertainmentIdeas: string[];
  vendorCategories: string[];
  contingencySuggestions: string[];
  personalizedTips: string[];
  eventDaySchedule: { time: string; activity: string }[];
  generatedAt: string;
  isDemo: boolean;
}

export interface BudgetSummary {
  totalBudget: number;
  totalEstimated: number; // Sum of expenses (planned commitments)
  totalActual: number;    // Sum of paid
  totalRemaining: number; // totalBudget - totalEstimated
  totalAllocated: number; // Sum of category budget allocation targets
  unallocatedAmount: number; // totalBudget - totalAllocated - contingencyReserve
  contingencyReserve: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
  categories: {
    category: ExpenseCategory;
    label: string;
    allocated: number;   // Target budget cap for this category
    estimated: number;   // Quoted/estimated expenses committed
    actual: number;      // Actual cash paid
    remaining: number;   // allocated - estimated
    percentage: number;  // % of total budget or total estimated
    color: string;
    notes?: string;
  }[];
}

export interface BudgetAlternative {
  id: string;
  title: string;
  description: string;
  savingsAmount: number;
  affectedCategory: ExpenseCategory;
  newEstimate: number;
  originalEstimate: number;
  expenseId: string;
}

// Interactive AI Chat Message Model
export interface ChatMessage {
  id: string;
  eventId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  // Suggested actions the user can trigger from the AI response
  actionData?: {
    suggestedExpense?: {
      title: string;
      category: ExpenseCategory;
      amount: number;
    };
    suggestedTask?: {
      title: string;
      category: TaskCategory;
      dueDate?: string;
      priority?: TaskPriority;
    };
    suggestedBudgetRevision?: {
      category: ExpenseCategory;
      newAmount: number;
      difference: number;
      rationale: string;
    };
    suggestedAllocation?: {
      totalBudget?: number;
      contingencyReserve?: number;
      categories: {
        category: ExpenseCategory;
        label: string;
        allocatedAmount: number;
        notes?: string;
      }[];
      notes?: string;
    };
    paymentAction?: {
      action: "record_payment" | "payment_inquiry" | "mark_paid" | "duplicate_warning";
      paymentRecord?: PaymentRecord;
      details?: {
        vendorName?: string;
        category?: ExpenseCategory;
        amount: number;
        previousPaid?: number;
        newTotalPaid?: number;
        quotedAmount?: number;
        remainingPayable?: number;
        paymentStatus?: PaymentStatus;
        isAdvance?: boolean;
        message?: string;
      };
      inquirySummary?: {
        totalPaid: number;
        totalQuoted: number;
        remainingPayable: number;
        items: {
          name: string;
          category: string;
          quoted: number;
          paid: number;
          remaining: number;
          status: string;
        }[];
      };
    };
  };
}

// Stored Image Model (IndexedDB Media Storage)
export interface StoredImage {
  id: string;
  eventId: string;
  analysisId?: string;
  filename: string;
  mimeType: string;
  size: number;
  data: Blob | string;
  createdAt: string;
}

// Multimodal AI Photo Analysis Model
export interface PhotoAnalysis {
  id: string;
  eventId: string;
  imageId?: string; // Reference to IndexedDB stored image binary
  imageUrl?: string; // Web URL or lightweight display reference (never heavy base64 in store)
  imageName: string;
  mimeType?: string;
  fileSize?: number;
  uploadedAt: string;
  userNotes?: string;
  visualAnalysis: {
    decorElements: string[];
    dominantColors: string[];
    floralStyle: string;
    seatingStyle: string;
    lighting: string;
    backdrop: string;
    generalStyle: string;
    constraints: string[];
  };
  decorationRecommendations: {
    flowers: string[];
    centerpieces: string[];
    tableLinens: string[];
    backdrops: string[];
    lighting: string[];
    signage: string[];
    layout: string[];
  };
  quantityGuidance: {
    tables: string;
    chairs: string;
    centerpieces: string;
    lightingUnits: string;
    florals: string;
    keyZones: string[];
  };
  budgetAlternatives: {
    title: string;
    costRange: string;
    reason: string;
    priority: "essential" | "recommended" | "optional";
  }[];
}

// Curated Reference Theme Model
export interface ReferenceTheme {
  id: string;
  category: "wedding" | "birthday" | "anniversary" | "party";
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  palette: string[];
  tags: string[];
  estimatedCostRange: string;
  keyElements: string[];
}

// Financial Payment Transaction Ledger Model
export interface PaymentRecord {
  id: string;
  eventId: string;
  vendorId?: string;
  expenseId?: string;
  category: ExpenseCategory;
  recipientName: string;
  amount: number;
  currency: Currency;
  paymentDate: string; // ISO date string (YYYY-MM-DD)
  paymentMethod?: string; // "UPI", "Bank Transfer", "Cash", "Card", "Cheque", etc.
  transactionRef?: string;
  notes?: string;
  isAdvance?: boolean;
  source: "ai-recorded" | "manual" | "user-reported";
  createdAt: string;
  updatedAt?: string;
}

// Real Budget History Snapshot Model
export interface BudgetHistoryEntry {
  id: string;
  eventId: string;
  date: string;
  totalBudget: number;
  totalEstimated: number;
  totalActual: number;
  note: string;
}

// Event Notification Model
export interface EventNotification {
  id: string;
  eventId: string;
  title: string;
  message: string;
  type: "alert" | "info" | "success";
  timestamp: string;
  read: boolean;
  link?: string;
}

// Guest RSVP & Dietary Preferences Model
export type DietaryPreference =
  | "vegetarian"
  | "jain"
  | "vegan"
  | "non_veg"
  | "halal"
  | "gluten_free"
  | "no_preference";

export type RSVPStatus = "attending" | "declined" | "pending";

export type GuestGroup =
  | "bride_family"
  | "groom_family"
  | "friends"
  | "colleagues"
  | "vip"
  | "general";

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  phone?: string;
  email?: string;
  rsvpStatus: RSVPStatus;
  group: GuestGroup;
  plusOnes: number;
  dietary: DietaryPreference;
  dietaryNotes?: string;
  tableNumber?: string;
  notes?: string;
  createdAt: string;
}

// Multi-Day Indian Celebration Ceremony Model
export interface SubEventItinerary {
  id: string;
  eventId: string;
  title: string;
  dayNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  venueLocation: string;
  dressCode: string;
  cateringStyle: string;
  description?: string;
  keyMoments: string[];
  coordinatorName?: string;
  coordinatorPhone?: string;
  createdAt: string;
}

export interface StorageData {
  version: number;
  events: Event[];
  expenses: Expense[];
  tasks: Task[];
  vendors: Vendor[];
  paymentLedger: PaymentRecord[];
  guests: Guest[];
  subEvents: SubEventItinerary[];
  plans: AIPlan[];
  chatMessages: ChatMessage[];
  photoAnalyses: PhotoAnalysis[];
  budgetHistory: BudgetHistoryEntry[];
  notifications: EventNotification[];
  activeEventId: string | null;
  preferences: {
    theme: string;
    defaultCurrency: string;
  };
}
