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
 * Generates human-readable athlete registration reference
 * Format: KKC26-ATH-[6-DIGIT-RANDOM], e.g. KKC26-ATH-049812
 */
export function generateAthleteRegNumber(prefix = "KKC26"): string {
  const chars = "0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-ATH-${random}`;
}

/**
 * Generates human-readable coach registration reference
 * Format: KKC26-COA-[6-DIGIT-RANDOM], e.g. KKC26-COA-012938
 */
export function generateCoachRegNumber(prefix = "KKC26"): string {
  const chars = "0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-COA-${random}`;
}

/**
 * Generates human-readable academy code
 * Format: KKC26-ACA-[6-DIGIT-RANDOM], e.g. KKC26-ACA-001042
 */
export function generateAcademyCode(prefix = "KKC26"): string {
  const chars = "0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-ACA-${random}`;
}

/**
 * Calculates current age from a Date or ISO string
 */
export function calculateAge(dob: Date | string): number {
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
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
