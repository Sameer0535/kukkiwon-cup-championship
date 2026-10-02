// ==============================================================================
// REGISTRATION TYPES
// ==============================================================================

export type RegistrationStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'PAID'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED';

export interface Registration {
  id: string;
  registration_number: string;
  championship_id: string;
  participant_id: string;
  status: RegistrationStatus;
  registered_at: Date | string;
  confirmed_at?: Date | string | null;
  terms_version: string;
  terms_accepted_at: Date | string;
  notes?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface RegistrationWithDetails extends Registration {
  participant?: {
    public_id: string;
    full_name: string;
    designation: string;
    nationality: string;
    academy_name?: string | null;
    photo_url?: string | null;
  };
  championship?: {
    slug: string;
    name: string;
    city: string;
    start_date: Date | string;
  };
}
