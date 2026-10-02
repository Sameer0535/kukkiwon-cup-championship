// ==============================================================================
// CHAMPIONSHIP TYPES
// ==============================================================================

export type ChampionshipStatus =
  | 'DRAFT'
  | 'UPCOMING'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface Championship {
  id: string;
  slug: string;
  name: string;
  short_name?: string | null;
  subtitle?: string | null;
  description?: string | null;
  status: ChampionshipStatus;
  start_date: Date | string;
  end_date: Date | string;
  venue: string;
  city: string;
  state: string;
  country: string;
  registration_open: Date | string;
  registration_close: Date | string;
  currency: string;
  entry_fee_athlete: number | string;
  entry_fee_coach: number | string;
  entry_fee_official: number | string;
  banner_url?: string | null;
  poster_url?: string | null;
  rules_document_url?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ChampionshipSummary {
  id: string;
  slug: string;
  name: string;
  short_name?: string | null;
  status: ChampionshipStatus;
  start_date: string;
  end_date: string;
  city: string;
  state: string;
  country: string;
  registration_open: string;
  registration_close: string;
  is_registration_active: boolean;
}
