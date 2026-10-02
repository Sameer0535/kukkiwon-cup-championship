// ==============================================================================
// PARTICIPANT TYPES
// ==============================================================================

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type ParticipantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Participant {
  id: string;
  public_id: string; // Non-guessable public participant ID (e.g. KUKKI-2026-X8F9Q)
  full_name: string;
  date_of_birth: Date | string;
  gender: Gender;
  nationality: string;
  designation: string;
  academy_name?: string | null;
  academy_country?: string | null;
  academy_state?: string | null;
  academy_city?: string | null;
  kukkiwon_id?: string | null;
  photo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  registration_status: ParticipantStatus;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PublicParticipantCard {
  public_id: string;
  full_name: string;
  nationality: string;
  designation: string;
  academy_name?: string | null;
  kukkiwon_id?: string | null;
  photo_url?: string | null;
}
