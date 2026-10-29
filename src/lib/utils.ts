import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ExpenseCategory } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currencyCode: string = "INR",
  locale: string = "en-IN"
): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    // Fallback if locale or currency code is unsupported
    const symbol = currencyCode === "INR" ? "₹" : currencyCode === "USD" ? "$" : currencyCode;
    return `${symbol}${safeAmount.toLocaleString()}`;
  }
}

export function formatDate(date: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function daysUntil(date: Date | string): number {
  if (!date) return 0;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  // Normalize both dates to midnight
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = target.getTime() - current.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isValidDate(date: unknown): boolean {
  if (!date) return false;
  const d = new Date(date as string);
  return d instanceof Date && !isNaN(d.getTime());
}

export function isValidAmount(amount: unknown): boolean {
  const n = Number(amount);
  return !isNaN(n) && n >= 0 && isFinite(n);
}

export function clampAmount(amount: number): number {
  return Math.max(0, Math.round(amount * 100) / 100);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getOccasionIcon(occasion: string): string {
  const icons: Record<string, string> = {
    wedding: "💍",
    birthday: "🎂",
    anniversary: "💑",
    community: "🎊",
    other: "🎉",
  };
  return icons[occasion] || "🎉";
}

export function getOccasionLabel(occasion: string): string {
  const labels: Record<string, string> = {
    wedding: "Wedding",
    birthday: "Birthday",
    anniversary: "Anniversary",
    community: "Community Event",
    other: "Celebration",
  };
  return labels[occasion] || "Celebration";
}

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  venue: "#9782E8",
  catering: "#EF7187",
  photography: "#638773",
  decoration: "#F2A541",
  cake: "#FF9BB5",
  entertainment: "#83D9C9",
  invitations: "#C9986A",
  transport: "#A0C4FF",
  attire: "#D4A5FF",
  miscellaneous: "#B6AABC",
};

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  venue: "Venue",
  catering: "Food & Catering",
  photography: "Photography",
  decoration: "Decorations",
  cake: "Cake & Desserts",
  entertainment: "Entertainment",
  invitations: "Invitations",
  transport: "Transport",
  attire: "Attire",
  miscellaneous: "Miscellaneous",
};
