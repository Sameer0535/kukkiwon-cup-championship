// ==============================================================================
// DOCUMENT REQUIREMENTS CONFIGURATION (Phase 4 Configurable Architecture)
// Defines official accreditation document criteria for Kukkiwon Cup 2026
// ==============================================================================

import { DocumentRequirementConfig } from "@/types/document";

export const DEFAULT_CHAMPIONSHIP_ID = "c1111111-1111-1111-1111-111111111111";

export const DEFAULT_DOCUMENT_REQUIREMENTS: DocumentRequirementConfig[] = [
  // ----------------------------------------------------------------------------
  // ATHLETE REQUIREMENTS
  // ----------------------------------------------------------------------------
  {
    id: "req-ath-photo",
    championship_id: DEFAULT_CHAMPIONSHIP_ID,
    participant_type: "ATHLETE",
    discipline: null,
    document_type: "PHOTOGRAPH",
    title: "Accreditation Photograph",
    description: "Recent color passport-style headshot with plain background for official championship ID badge.",
    is_required: true,
    requires_dan: false,
    min_age: null,
    max_age: null,
    allowed_file_types: "image/jpeg,image/png",
    max_file_size: 2 * 1024 * 1024, // 2MB
    display_order: 1,
    is_active: true,
  },
  {
    id: "req-ath-govid",
    championship_id: DEFAULT_CHAMPIONSHIP_ID,
    participant_type: "ATHLETE",
    discipline: null,
    document_type: "GOVERNMENT_ID",
    title: "Government Photo ID / Passport",
    description: "Official government-issued identity proof (Aadhaar, Passport, Voter ID, or National ID Card).",
    is_required: true,
    requires_dan: false,
    min_age: null,
    max_age: null,
    allowed_file_types: "image/jpeg,image/png,application/pdf",
    max_file_size: 5 * 1024 * 1024, // 5MB
    display_order: 2,
    is_active: true,
  },
  {
    id: "req-ath-ageproof",
    championship_id: DEFAULT_CHAMPIONSHIP_ID,
    participant_type: "ATHLETE",
    discipline: null,
    document_type: "PROOF_OF_AGE",
    title: "Proof of Age / Birth Certificate",
    description: "Municipal birth certificate or matriculation/school board certificate verifying date of birth.",
    is_required: true,
    requires_dan: false,
    min_age: null,
    max_age: null,
    allowed_file_types: "image/jpeg,image/png,application/pdf",
    max_file_size: 5 * 1024 * 1024, // 5MB
    display_order: 3,
    is_active: true,
  },
  {
    id: "req-ath-dan",
    championship_id: DEFAULT_CHAMPIONSHIP_ID,
    participant_type: "ATHLETE",
    discipline: null,
    document_type: "DAN_CERTIFICATE",
    title: "Kukkiwon Dan / Poom Certificate",
    description: "Official Kukkiwon certificate. Mandatory for Black Belt and Poom division competitors.",
    is_required: false, // Conditioned on belt level in business logic
    requires_dan: true,
    min_age: null,
    max_age: null,
    allowed_file_types: "image/jpeg,image/png,application/pdf",
    max_file_size: 5 * 1024 * 1024, // 5MB
    display_order: 4,
    is_active: true,
  },
  {
    id: "req-ath-consent",
    championship_id: DEFAULT_CHAMPIONSHIP_ID,
    participant_type: "ATHLETE",
    discipline: null,
    document_type: "PARENTAL_CONSENT",
    title: "Medical & Minor Consent Form",
    description: "Official championship waiver and parental consent signed by parent or legal guardian for athletes under 18.",
    is_required: false, // Conditioned on age < 18 in business logic
    requires_dan: false,
    min_age: null,
    max_age: 17,
    allowed_file_types: "image/jpeg,image/png,application/pdf",
    max_file_size: 5 * 1024 * 1024, // 5MB
    display_order: 5,
    is_active: true,
  },

  // ----------------------------------------------------------------------------
  // COACH REQUIREMENTS
  // ----------------------------------------------------------------------------
  {
    id: "req-coa-photo",
    championship_id: DEFAULT_CHAMPIONSHIP_ID,
    participant_type: "COACH",
    discipline: null,
    document_type: "PHOTOGRAPH",
    title: "Coach Accreditation Photograph",
    description: "Clear portrait photograph for coach field-of-play access badge and corner credential.",
    is_required: true,
    requires_dan: false,
    min_age: null,
    max_age: null,
    allowed_file_types: "image/jpeg,image/png",
    max_file_size: 2 * 1024 * 1024, // 2MB
    display_order: 1,
    is_active: true,
  },
  {
    id: "req-coa-govid",
    championship_id: DEFAULT_CHAMPIONSHIP_ID,
    participant_type: "COACH",
    discipline: null,
    document_type: "GOVERNMENT_ID",
    title: "Government Identity Document",
    description: "Valid government-issued photo identity proof (Passport, Aadhaar, Driver License).",
    is_required: true,
    requires_dan: false,
    min_age: null,
    max_age: null,
    allowed_file_types: "image/jpeg,image/png,application/pdf",
    max_file_size: 5 * 1024 * 1024, // 5MB
    display_order: 2,
    is_active: true,
  },
  {
    id: "req-coa-cert",
    championship_id: DEFAULT_CHAMPIONSHIP_ID,
    participant_type: "COACH",
    discipline: null,
    document_type: "COACH_CERTIFICATION",
    title: "Coaching Qualification / License",
    description: "Accredited National, State, or WT Coach Certification / Referee credential.",
    is_required: true,
    requires_dan: false,
    min_age: null,
    max_age: null,
    allowed_file_types: "image/jpeg,image/png,application/pdf",
    max_file_size: 5 * 1024 * 1024, // 5MB
    display_order: 3,
    is_active: true,
  },
  {
    id: "req-coa-dan",
    championship_id: DEFAULT_CHAMPIONSHIP_ID,
    participant_type: "COACH",
    discipline: null,
    document_type: "DAN_CERTIFICATE",
    title: "Kukkiwon Dan Certificate",
    description: "Kukkiwon Dan Certificate for coach credential verification (minimum 1st Dan).",
    is_required: false,
    requires_dan: true,
    min_age: null,
    max_age: null,
    allowed_file_types: "image/jpeg,image/png,application/pdf",
    max_file_size: 5 * 1024 * 1024, // 5MB
    display_order: 4,
    is_active: true,
  },

  // ----------------------------------------------------------------------------
  // ACADEMY / TEAM REQUIREMENTS
  // ----------------------------------------------------------------------------
  {
    id: "req-aca-logo",
    championship_id: DEFAULT_CHAMPIONSHIP_ID,
    participant_type: "ACADEMY_TEAM",
    discipline: null,
    document_type: "ACADEMY_LOGO",
    title: "Academy Emblem / Logo",
    description: "High-resolution club or academy logo for official team draws and championship display.",
    is_required: true,
    requires_dan: false,
    min_age: null,
    max_age: null,
    allowed_file_types: "image/jpeg,image/png",
    max_file_size: 2 * 1024 * 1024, // 2MB
    display_order: 1,
    is_active: true,
  },
  {
    id: "req-aca-auth",
    championship_id: DEFAULT_CHAMPIONSHIP_ID,
    participant_type: "ACADEMY_TEAM",
    discipline: null,
    document_type: "ACADEMY_DOCUMENT",
    title: "Academy Affiliation & Authorization Letter",
    description: "Official team delegation letter on academy letterhead signed by Head Coach or Master.",
    is_required: true,
    requires_dan: false,
    min_age: null,
    max_age: null,
    allowed_file_types: "image/jpeg,image/png,application/pdf",
    max_file_size: 5 * 1024 * 1024, // 5MB
    display_order: 2,
    is_active: true,
  },
];
