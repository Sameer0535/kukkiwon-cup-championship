// ==============================================================================
// DESIGNATION & NATIONALITY TYPES
// ==============================================================================

export interface Designation {
  id: string;
  code: string;
  label: string;
  description?: string | null;
  requires_kukkiwon_id: boolean;
  requires_documents: boolean;
  display_order: number;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Nationality {
  id: string;
  name: string;
  iso_code: string;
  iso_alpha2: string;
  flag_identifier?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date | string;
}
