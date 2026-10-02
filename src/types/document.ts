// ==============================================================================
// DOCUMENT TYPES & INTERFACES (Phase 4 Secure Document Management)
// ==============================================================================

import { ParticipantType } from './registration';

export type DocumentType =
  | 'PHOTOGRAPH'
  | 'GOVERNMENT_ID'
  | 'PASSPORT'
  | 'PROOF_OF_AGE'
  | 'DAN_CERTIFICATE'
  | 'MEDICAL_CERTIFICATE'
  | 'PARENTAL_CONSENT'
  | 'COACH_CERTIFICATION'
  | 'ACADEMY_DOCUMENT'
  | 'ACADEMY_LOGO'
  | string;

export type DocumentVerificationStatus =
  | 'NOT_UPLOADED'
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export interface DocumentRequirementConfig {
  id: string;
  championship_id: string;
  participant_type: ParticipantType;
  discipline?: string | null;
  document_type: DocumentType;
  title: string;
  description?: string | null;
  is_required: boolean;
  requires_dan?: boolean;
  min_age?: number | null;
  max_age?: number | null;
  allowed_file_types: string; // Comma separated: "image/jpeg,image/png,application/pdf"
  max_file_size: number; // in bytes (e.g. 2097152 for 2MB, 5242880 for 5MB)
  display_order: number;
  is_active: boolean;
}

export interface ParticipantDocumentInfo {
  id: string;
  registration_id: string;
  document_requirement_id: string;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  file_size: number;
  checksum: string;
  version: number;
  is_current: boolean;
  verification_status: DocumentVerificationStatus;
  rejection_reason?: string | null;
  uploaded_at: Date | string;
  verified_at?: Date | string | null;
  verified_by?: string | null;
  signed_url?: string;
}

export interface RequirementWithDocument extends DocumentRequirementConfig {
  current_document?: ParticipantDocumentInfo | null;
  status: DocumentVerificationStatus;
  history?: ParticipantDocumentInfo[];
}

export interface DocumentReadinessSummary {
  required: number;
  uploaded: number;
  verified: number;
  missing: number;
  rejected: number;
  readyForReview: boolean;
  readinessStatus:
    | 'DOCUMENTS_MISSING'
    | 'DOCUMENTS_IN_REVIEW'
    | 'DOCUMENTS_VERIFIED'
    | 'ACTION_REQUIRED';
  summaryText: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  document: ParticipantDocumentInfo;
  readiness: DocumentReadinessSummary;
}
