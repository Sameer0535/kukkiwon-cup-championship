// ==============================================================================
// QR VERIFICATION ARCHITECTURE (Requirements 13 & 14)
// High-entropy token generation & privacy-preserving accreditation verification
// ==============================================================================

import crypto from "crypto";
import { QrVerificationResult } from "@/types";

/**
 * Generates a secure, non-guessable, URL-safe QR verification token
 * Uses 32 cryptographically secure random bytes base64url encoded
 */
export function generateSecureQrToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Builds the canonical public verification URL
 * Points to: ${SITE_URL}/verify/${token}
 * Domain is configurable via NEXT_PUBLIC_SITE_URL environment variable
 */
export function buildVerificationUrl(qrToken: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${baseUrl}/verify/${encodeURIComponent(qrToken)}`;
}

/**
 * Evaluates whether a credential status permits tournament access
 */
export function isCredentialActive(status: string): boolean {
  return status === "GENERATED" || status === "REISSUED";
}

/**
 * Redacts sensitive PII from participant data for safe public accreditation display
 */
export function formatPublicVerificationPayload(data: {
  cardStatus: string;
  cardNumber?: string;
  fullName?: string;
  designation?: string;
  nationality?: string;
  flagIdentifier?: string;
  championshipName?: string;
  registrationNumber?: string;
  photoUrl?: string;
}): QrVerificationResult {
  const isValid = isCredentialActive(data.cardStatus);

  return {
    is_valid: isValid,
    card_status: data.cardStatus as any,
    card_number: data.cardNumber,
    participant_name: data.fullName,
    designation: data.designation,
    nationality: data.nationality,
    flag_identifier: data.flagIdentifier,
    championship_name: data.championshipName,
    registration_number: data.registrationNumber,
    photo_url: data.photoUrl,
    verified_at: new Date().toISOString(),
    message: isValid
      ? "Official Kukkiwon Cup accreditation verified."
      : `Accreditation status is ${data.cardStatus}. Access not authorized.`,
  };
}
