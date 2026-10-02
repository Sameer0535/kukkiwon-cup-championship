// ==============================================================================
// DOCUMENT, PAYMENT & ID-CARD TYPES
// ==============================================================================

export type DocumentVerificationStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'UPLOADED'
  | 'VERIFIED'
  | 'REJECTED';

export interface DocumentRecord {
  id: string;
  participant_id: string;
  registration_id?: string | null;
  document_type: string;
  file_path: string; // Strictly private path
  file_name: string;
  mime_type: string;
  file_size: number;
  verification_status: DocumentVerificationStatus;
  rejection_reason?: string | null;
  uploaded_at: Date | string;
  verified_at?: Date | string | null;
  verified_by?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';

export interface PaymentRecord {
  id: string;
  registration_id: string;
  provider: string; // RAZORPAY, STRIPE, MANUAL
  order_id?: string | null;
  payment_id?: string | null;
  signature?: string | null;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  payment_method?: string | null;
  paid_at?: Date | string | null;
  receipt_url?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export type IdCardStatus =
  | 'NOT_GENERATED'
  | 'GENERATED'
  | 'REVOKED'
  | 'REISSUED';

export interface IdCardRecord {
  id: string;
  participant_id: string;
  registration_id: string;
  card_number: string;
  qr_token: string;
  card_status: IdCardStatus;
  generated_at?: Date | string | null;
  revoked_at?: Date | string | null;
  revocation_reason?: string | null;
  pdf_path?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface QrVerificationResult {
  is_valid: boolean;
  card_status: IdCardStatus;
  card_number?: string;
  participant_name?: string;
  designation?: string;
  nationality?: string;
  flag_identifier?: string;
  championship_name?: string;
  registration_number?: string;
  photo_url?: string;
  verified_at: string;
  message: string;
}
