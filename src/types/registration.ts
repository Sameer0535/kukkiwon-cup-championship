// ==============================================================================
// REGISTRATION TYPES (Phase 3 Championship Registration System)
// ==============================================================================

export type ParticipantType = 'ATHLETE' | 'COACH' | 'ACADEMY_TEAM';

export type RegistrationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'PAID'
  | 'CONFIRMED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface Category {
  id: string;
  championship_id: string;
  code: string;
  name: string;
  discipline: 'KYORUGI' | 'POOMSAE' | 'DEMO' | string;
  division: 'SENIOR' | 'JUNIOR' | 'CADET' | 'SUB_JUNIOR' | string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  min_age?: number | null;
  max_age?: number | null;
  min_weight?: number | null;
  max_weight?: number | null;
  belt_requirement?: string | null;
  registration_fee?: number | null;
  max_participants?: number | null;
  display_order: number;
  is_active: boolean;
}

export interface Academy {
  id: string;
  code: string;
  name: string;
  short_name?: string | null;
  country: string;
  state: string;
  city: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  head_coach_name?: string | null;
  representative_name?: string | null;
  representative_email?: string | null;
  representative_phone?: string | null;
  representative_role?: string | null;
  status: string;
  manager_user_id?: string | null;
}

export interface AthleteDraftData {
  // Step 1: Personal
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  nationality: string;
  country: string;
  state: string;
  city: string;
  phone: string;
  email: string;
  photo_url?: string;

  // Step 2: Academy
  academy_id?: string;
  academy_name?: string;
  academy_code?: string;
  is_new_academy?: boolean;
  new_academy_data?: {
    name: string;
    country: string;
    state: string;
    city: string;
    head_coach: string;
  };

  // Step 3: Discipline & Category
  discipline: 'KYORUGI' | 'POOMSAE' | 'DEMO' | '';
  division?: string;
  category_id?: string;
  belt_rank?: string;
  kukkiwon_dan_number?: string;
  weight_kg?: string;

  // Step 4: Documents checklist
  documents_checked?: Record<string, boolean>;

  // Step 5: Declarations
  declaration_accurate: boolean;
  declaration_terms: boolean;
  declaration_rules: boolean;
}

export interface CoachDraftData {
  // Step 1: Personal
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  nationality: string;
  country: string;
  state: string;
  city: string;
  phone: string;
  email: string;
  photo_url?: string;

  // Step 2: Academy
  academy_id?: string;
  academy_name?: string;
  academy_code?: string;
  is_new_academy?: boolean;
  new_academy_data?: {
    name: string;
    country: string;
    state: string;
    city: string;
    head_coach: string;
  };

  // Step 3: Professional & Certification
  coach_role: string;
  qualification: string;
  kukkiwon_dan_number?: string;
  certification_details?: string;
  experience_years?: string;

  // Step 4: Declarations
  declaration_accurate: boolean;
  declaration_terms: boolean;
  declaration_rules: boolean;
}

export interface AcademyDraftData {
  name: string;
  short_name?: string;
  country: string;
  state: string;
  city: string;
  address?: string;
  email: string;
  phone: string;
  website?: string;
  head_coach_name: string;

  // Representative
  representative_first_name: string;
  representative_last_name: string;
  representative_email: string;
  representative_phone: string;
  representative_role: string;

  // Declarations
  declaration_accurate: boolean;
  declaration_terms: boolean;
}

export interface Registration {
  id: string;
  user_id?: string | null;
  registration_number: string;
  championship_id: string;
  participant_id: string;
  participant_type: ParticipantType;
  status: RegistrationStatus;
  discipline?: string | null;
  category_id?: string | null;
  academy_id?: string | null;
  weight_kg?: number | null;
  belt_rank?: string | null;
  coach_role?: string | null;
  coach_qualification?: string | null;
  draft_data?: string | null;
  registered_at: Date | string;
  submitted_at?: Date | string | null;
  confirmed_at?: Date | string | null;
  terms_version: string;
  terms_accepted_at: Date | string;
  notes?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface RegistrationWithDetails extends Registration {
  participant?: {
    id: string;
    public_id: string;
    full_name: string;
    designation: string;
    nationality: string;
    gender: string;
    date_of_birth: Date | string;
    academy_name?: string | null;
    photo_url?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  championship?: {
    id: string;
    slug: string;
    name: string;
    city: string;
    start_date: Date | string;
    currency?: string;
    entry_fee_athlete?: number;
    entry_fee_coach?: number;
  };
  category?: Category | null;
  academy?: Academy | null;
  documentReadiness?: import('./document').DocumentReadinessSummary;
}

