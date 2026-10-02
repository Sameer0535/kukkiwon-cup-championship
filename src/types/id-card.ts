// ==============================================================================
// PHASE 6: ATHLETE ID CARD & QR VERIFICATION TYPES
// Clean type safety for digital credentials, eligibility, and privacy-preserving QR
// ==============================================================================

export type IdCardStatusType =
  | 'NOT_ELIGIBLE'
  | 'READY'
  | 'NOT_GENERATED'
  | 'GENERATED'
  | 'REVOKED'
  | 'REISSUED';

export interface AthleteIdCardDetails {
  id: string;
  registrationId: string;
  participantId?: string;
  athleteId: string;
  cardNumber: string;
  qrToken: string;
  version: number;
  cardStatus: IdCardStatusType;
  generatedAt?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  qrCodeDataUrl?: string;
  verificationUrl: string;

  // Visual card display fields
  athleteName: string;
  academyName?: string | null;
  categoryName?: string | null;
  discipline?: string | null;
  gender?: string | null;
  nationality: string;
  championshipName: string;
  photoUrl?: string | null;
  registrationNumber: string;
}

export interface IdCardEligibilityResult {
  isEligible: boolean;
  status: IdCardStatusType;
  reason?: string;
  athleteId?: string;
  hasExistingCard: boolean;
  existingCard?: AthleteIdCardDetails;
}

export interface PublicAthleteVerification {
  isValid: boolean;
  status: 'VERIFIED' | 'REVOKED' | 'NOT_FOUND';
  message: string;
  verifiedAt: string;

  // Phase 7 Structured Public Response DTO
  athlete?: {
    athleteId: string;
    name: string;
    academy: string | null;
    category: string | null;
    discipline: string | null;
    country: string;
    photoUrl: string | null;
    status?: string;
  };
  championship?: {
    name: string;
    year: string;
  };
  card?: {
    version: number;
    issuedAt?: string | null;
  };

  // Top-level convenience properties preserved for backwards compatibility
  athleteId?: string;
  athleteName?: string;
  academyName?: string | null;
  country?: string;
  categoryName?: string | null;
  discipline?: string | null;
  championshipName?: string;
  registrationStatus?: string;
  version?: number;
  photoUrl?: string | null;
}

export interface IdCardPrintConfig {
  widthMm: number; // 85.6mm standard CR80
  heightMm: number; // 53.98mm standard CR80
  orientation: 'portrait' | 'landscape';
}
