// ==============================================================================
// UTILITIES
// Class merges, ID generation, date & currency formatters
// ==============================================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates non-sequential, non-guessable Public Participant IDs
 * Format: KUKKI-[YEAR]-[CHARACTERS], e.g. KUKKI-2026-X8F9Q
 */
export function generatePublicParticipantId(year = "2026"): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 5; i++) {
    randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `KUKKI-${year}-${randomPart}`;
}

/**
 * Generates unique registration number
 * Format: REG-KC[YY]-[RANDOM], e.g. REG-KC26-9281A
 */
export function generateRegistrationNumber(shortCode = "KC26"): string {
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let random = "";
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REG-${shortCode}-${random}`;
}

/**
 * Formats currency values in INR or USD
 */
export function formatCurrency(amount: number | string, currency = "INR"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currency} 0.00`;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats dates into human-readable tournament dates
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "TBD";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "TBD";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
