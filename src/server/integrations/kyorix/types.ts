// ==============================================================================
// KYORIX INTEGRATION TYPES (Phase 10)
// Strict TypeScript DTOs, data transfer models, and status interfaces
// ==============================================================================

export type KyorixSyncStatus =
  | "NOT_SYNCED"
  | "PENDING"
  | "SYNCED"
  | "FAILED"
  | "DISCONNECTED";

export interface KyorixAthleteDTO {
  externalAthleteId?: string;
  localAthleteId: string; // e.g. KKC26-ATH-001001
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string; // YYYY-MM-DD
  nationality: string;
  beltRank?: string;
  kukkiwonDanNumber?: string;
  academyCode?: string;
  academyName?: string;
}

export interface KyorixAcademyDTO {
  code: string;
  name: string;
  shortName?: string;
  city: string;
  state: string;
  country: string;
}

export interface KyorixRegistrationDTO {
  externalRegistrationId?: string;
  localRegistrationId: string;
  registrationNumber: string;
  championshipId: string;
  categoryCode?: string;
  categoryName?: string;
  genderCategory?: string;
  weightCategory?: string;
  ageCategory?: string;
  athlete: KyorixAthleteDTO;
  academy?: KyorixAcademyDTO;
  paymentStatus: "PAID" | "PENDING" | "REFUNDED" | "EXEMPT";
  registrationStatus: string;
  approvedAt?: string;
}

export interface KyorixChampionshipDTO {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  city: string;
  status: string;
}

export interface KyorixSyncResult {
  success: boolean;
  registrationId: string;
  athleteId: string;
  kyorixAthleteId?: string;
  kyorixRegistrationId?: string;
  status: KyorixSyncStatus;
  error?: string;
  syncedAt?: string;
  attempts: number;
}

export interface KyorixConnectionTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  version?: string;
  authenticated: boolean;
}

export interface KyorixChampionshipMappingDTO {
  id: string;
  championshipId: string;
  kyorixChampionshipId: string;
  kyorixChampionshipName?: string;
  isEnabled: boolean;
  syncMode: "MANUAL" | "AUTOMATIC";
  mappedAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

export interface KyorixSyncRecordDTO {
  id: string;
  championshipId: string;
  registrationId: string;
  athleteId: string;
  athleteName: string;
  categoryName?: string;
  academyName?: string;
  kyorixAthleteId?: string | null;
  kyorixRegistrationId?: string | null;
  kyorixChampionshipId?: string | null;
  syncStatus: KyorixSyncStatus;
  lastSyncedAt?: string | null;
  lastSyncAttemptAt?: string | null;
  lastError?: string | null;
  syncVersion: number;
  attempts: number;
  idempotencyKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KyorixIntegrationStats {
  totalEligible: number;
  synced: number;
  pending: number;
  failed: number;
  notSynced: number;
  lastSyncTime?: string | null;
}

export interface KyorixIntegrationStatusResponse {
  connection: {
    status: "CONNECTED" | "NOT_CONNECTED" | "DISABLED" | "CONNECTION_ERROR";
    message: string;
    lastTestedAt?: string;
    latencyMs?: number;
  };
  config: {
    isEnabled: boolean;
    isConfigured: boolean;
    apiBaseUrl: string;
    timeoutMs: number;
    useMock: boolean;
  };
  mapping: KyorixChampionshipMappingDTO | null;
  stats: KyorixIntegrationStats;
}

export interface KyorixWebhookPayload {
  eventId: string;
  eventType: string; // e.g. "kyorix.athlete.verified", "kyorix.registration.updated"
  timestamp: string;
  data: Record<string, unknown>;
}
