// ==============================================================================
// QR VERIFICATION ARCHITECTURE (Phase 6 Requirements 4 & 5)
// High-entropy token generation & privacy-preserving accreditation verification
// ==============================================================================

import crypto from "crypto";
import QRCode from "qrcode";
import { QrVerificationResult, PublicAthleteVerification } from "@/types";

/**
 * Generates a secure, non-guessable, URL-safe QR verification token
 * Uses 32 cryptographically secure random bytes base64url encoded
 */
export function generateSecureQrToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Builds the canonical public verification URL
 * Points to: ${SITE_URL}/verify/athlete/${token}
 * Domain is configurable via NEXT_PUBLIC_SITE_URL environment variable
 */
export function buildVerificationUrl(qrToken: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${baseUrl}/verify/athlete/${encodeURIComponent(qrToken)}`;
}

/**
 * Generates a high-contrast, scannable QR Code Data URL (PNG)
 */
export async function generateQrCodeDataUrl(textOrUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(textOrUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 400,
      color: {
        dark: "#0A192F", // Kukkiwon Deep Navy
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("[QR] Failed to generate QR code data URL:", error);
    // Fallback simple QR
    return QRCode.toDataURL(textOrUrl);
  }
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

/**
 * Formats public athlete verification payload adhering strictly to Phase 7 DTO specification
 * Guaranteed to NEVER leak DOB, phone, email, address, or payment data
 */
export function formatPublicAthleteVerification(data: {
  cardStatus: string;
  athleteId?: string;
  athleteName?: string;
  academyName?: string | null;
  country?: string;
  categoryName?: string | null;
  discipline?: string | null;
  championshipName?: string;
  registrationStatus?: string;
  version?: number;
  issuedAt?: string | null;
  photoUrl?: string | null;
}): PublicAthleteVerification {
  const isValid = isCredentialActive(data.cardStatus);
  const status: "VERIFIED" | "REVOKED" | "NOT_FOUND" = 
    isValid ? "VERIFIED" : data.cardStatus === "REVOKED" ? "REVOKED" : "NOT_FOUND";

  const champName = data.championshipName || "Kukkiwon Cup Championship 2026";
  const athleteStatus = data.registrationStatus || (isValid ? "REGISTERED" : "UNVERIFIED");

  return {
    isValid,
    status,
    message: isValid
      ? "Official Kukkiwon Cup accreditation verified."
      : data.cardStatus === "REVOKED"
      ? "ID CARD REVOKED. This credential is no longer valid."
      : "ACCREDITATION NOT FOUND",
    verifiedAt: new Date().toISOString(),

    // Phase 7 Structured DTO
    athlete: data.athleteId
      ? {
          athleteId: data.athleteId,
          name: data.athleteName || "Competitor",
          academy: data.academyName || null,
          category: data.categoryName || null,
          discipline: data.discipline || null,
          country: data.country || "India",
          photoUrl: data.photoUrl || null,
          status: athleteStatus,
        }
      : undefined,

    championship: {
      name: champName,
      year: "2026",
    },

    card: data.athleteId
      ? {
          version: data.version || 1,
          issuedAt: data.issuedAt || null,
        }
      : undefined,

    // Top-level properties preserved for backwards compatibility
    athleteId: data.athleteId,
    athleteName: data.athleteName,
    academyName: data.academyName,
    country: data.country || "India",
    categoryName: data.categoryName,
    discipline: data.discipline,
    championshipName: champName,
    registrationStatus: athleteStatus,
    version: data.version || 1,
    photoUrl: data.photoUrl,
  };
}
