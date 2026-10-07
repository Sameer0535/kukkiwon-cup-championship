// ==============================================================================
// PUBLIC CMS & LIVE PUBLISHING TYPES (Phase 9)
// Strictly Sanitized DTOs for Public Consumption and Administrative CMS
// ==============================================================================

export type PublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type RegistrationAvailability = "OPEN" | "CLOSED" | "COMING_SOON";

export type RegistrationState = "NOT_OPEN" | "OPEN" | "CLOSING_SOON" | "CLOSED";

export interface PublicChampionship {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  edition: string;
  subtitle: string;
  description: string;
  status: PublicationStatus;
  registrationAvailability: RegistrationAvailability;
  venue: string;
  city: string;
  state: string;
  country: string;
  startDate: string;
  endDate: string;
  registrationOpen: string;
  registrationClose: string;
  lateRegistrationDeadline: string | null;
  currency: string;
  entryFeeAthlete: number;
  entryFeeCoach: number;
  entryFeeOfficial: number;
  bannerUrl: string | null;
  posterUrl: string | null;
  rulesDocumentUrl: string | null;
  heroHeadline: string;
  heroDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string | null;
  contactAddress: string;
  socialLinks: Record<string, string>;
  isPublished: boolean;
  updatedAt: string;
}

export interface PublicCategory {
  id: string;
  championshipId: string;
  code: string;
  name: string;
  discipline: string;
  division: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  minAge: number | null;
  maxAge: number | null;
  minWeight: number | null;
  maxWeight: number | null;
  beltRequirement: string | null;
  registrationFee: number | null;
  displayOrder: number;
  isActive: boolean;
}

export interface PublicFee {
  id: string;
  championshipId: string;
  categoryId: string | null;
  categoryName: string | null;
  participantType: "ATHLETE" | "COACH" | "ACADEMY_TEAM";
  name: string;
  baseFeePaise: number;
  baseFeeFormatted: string;
  lateFeePaise: number;
  lateFeeFormatted: string;
  currency: string;
  lateFeeFrom: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  isActive: boolean;
}

export interface PublicAnnouncement {
  id: string;
  championshipId: string;
  title: string;
  shortDescription: string;
  content: string;
  publishDate: string;
  expiryDate: string | null;
  status: PublicationStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicDocument {
  id: string;
  championshipId: string;
  title: string;
  documentType: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSizeFormatted: string;
  publishDate: string;
  status: PublicationStatus;
  displayOrder: number;
}

export interface PublicChampionshipPackage {
  championship: PublicChampionship;
  categories: PublicCategory[];
  fees: PublicFee[];
  announcements: PublicAnnouncement[];
  documents: PublicDocument[];
}

// ------------------------------------------------------------------------------
// CMS Administrative Mutation Inputs
// ------------------------------------------------------------------------------

export interface UpdateChampionshipCmsInput {
  name?: string;
  shortName?: string;
  edition?: string;
  subtitle?: string;
  description?: string;
  status?: PublicationStatus;
  venue?: string;
  city?: string;
  state?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  registrationOpen?: string;
  registrationClose?: string;
  lateRegistrationDeadline?: string | null;
  currency?: string;
  bannerUrl?: string | null;
  posterUrl?: string | null;
  rulesDocumentUrl?: string | null;
  heroHeadline?: string;
  heroDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string | null;
  contactAddress?: string;
  entryFeeAthlete?: number;
  entryFeeCoach?: number;
  isPublished?: boolean;
}

export interface CreateCategoryInput {
  championshipId: string;
  code: string;
  name: string;
  discipline: string;
  division: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  minAge?: number | null;
  maxAge?: number | null;
  minWeight?: number | null;
  maxWeight?: number | null;
  beltRequirement?: string | null;
  registrationFee?: number | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  code?: string;
  name?: string;
  discipline?: string;
  division?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  minAge?: number | null;
  maxAge?: number | null;
  minWeight?: number | null;
  maxWeight?: number | null;
  beltRequirement?: string | null;
  registrationFee?: number | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CreateFeeInput {
  championshipId: string;
  categoryId?: string | null;
  categoryName?: string | null;
  participantType: "ATHLETE" | "COACH" | "ACADEMY_TEAM";
  name: string;
  amountPaise?: number;
  baseFeePaise?: number;
  lateFeePaise?: number;
  currency?: string;
  lateFeeFrom?: string | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  isActive?: boolean;
}

export interface UpdateFeeInput {
  name?: string;
  amountPaise?: number;
  baseFeePaise?: number;
  lateFeePaise?: number;
  currency?: string;
  lateFeeFrom?: string | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  isActive?: boolean;
}

export interface CreateAnnouncementInput {
  championshipId: string;
  title: string;
  shortDescription: string;
  content: string;
  publishDate?: string;
  expiryDate?: string | null;
  status: PublicationStatus;
  displayOrder?: number;
}

export interface UpdateAnnouncementInput {
  title?: string;
  shortDescription?: string;
  content?: string;
  publishDate?: string;
  expiryDate?: string | null;
  status?: PublicationStatus;
  displayOrder?: number;
}

export interface CreatePublicDocumentInput {
  championshipId: string;
  title: string;
  documentType: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSizeFormatted?: string;
  publishDate?: string;
  status: PublicationStatus;
  displayOrder?: number;
}

export interface UpdatePublicDocumentInput {
  title?: string;
  documentType?: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSizeFormatted?: string;
  publishDate?: string;
  status?: PublicationStatus;
  displayOrder?: number;
}

// ------------------------------------------------------------------------------
// Championship Content, Dates & FAQ DTOs
// ------------------------------------------------------------------------------

export interface ChampionshipContentDTO {
  id: string;
  championshipId: string;
  heroTitle: string;
  heroSubtitle: string | null;
  heroTagline?: string | null;
  heroPrimaryCtaText?: string | null;
  heroSecondaryCtaText?: string | null;
  description: string | null;
  venue: string | null;
  location: string | null;
  registrationInstructions: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactPhoneHours?: string | null;
  contactAddress?: string | null;
  websiteStatus: PublicationStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  updatedBy: string | null;
  // Partnership & Governance Section
  partnershipTagline?: string | null;
  partnershipHeading?: string | null;
  partnershipDescription?: string | null;
  kukkiwonTitle?: string | null;
  kukkiwonBranch?: string | null;
  kukkiwonRole?: string | null;
  kukkiwonDescription?: string | null;
  kukkiwonUrl?: string | null;
  kukkiwonUrlText?: string | null;
  kukkiwonBadge?: string | null;
  kyorixTitle?: string | null;
  kyorixSubtitle?: string | null;
  kyorixRole?: string | null;
  kyorixDescription?: string | null;
  kyorixBadge?: string | null;
  // Disciplines Section
  disciplinesTagline?: string | null;
  disciplinesHeading?: string | null;
  disciplinesDescription?: string | null;
  disciplinesJson?: string | null;
  // Dates Section Headers
  datesTagline?: string | null;
  datesHeading?: string | null;
  datesDescription?: string | null;
  // CTA Section
  ctaTagline?: string | null;
  ctaTitle?: string | null;
  ctaDescription?: string | null;
  ctaPrimaryBtnText?: string | null;
  ctaSecondaryBtnText?: string | null;
  // Contact Section Headers
  contactTagline?: string | null;
  contactHeading?: string | null;
  contactDescription?: string | null;
  // About Page Mission
  aboutMissionHeading?: string | null;
  aboutMissionText?: string | null;
}

export interface ChampionshipImportantDateDTO {
  id: string;
  championshipId: string;
  title: string;
  description: string | null;
  date: string;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChampionshipFAQDTO {
  id: string;
  championshipId: string;
  question: string;
  answer: string;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicChampionshipResponse {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  edition: string;
  subtitle: string;
  description: string;
  venue: string;
  location: string;
  city: string;
  state: string;
  country: string;
  heroTitle: string;
  heroSubtitle: string;
  heroHeadline: string;
  heroDescription: string;
  registrationInstructions: string;
  registrationStatus: RegistrationState;
  startDate: string;
  endDate: string;
  registrationOpen: string;
  registrationClose: string;
  lateRegistrationDeadline: string | null;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string | null;
  contactAddress: string;
  socialLinks: Record<string, string>;
  publishedAt: string | null;
  importantDates: {
    id: string;
    title: string;
    description: string | null;
    date: string;
    displayOrder: number;
  }[];
  announcements: {
    id: string;
    title: string;
    content: string;
    priority: number;
    publishedAt: string | null;
  }[];
  faqs: {
    id: string;
    question: string;
    answer: string;
    displayOrder: number;
  }[];
  categories: PublicCategory[];
  fees: PublicFee[];
  documents: PublicDocument[];
}

export interface CreateOrUpdateContentInput {
  heroTitle?: string;
  heroSubtitle?: string;
  heroTagline?: string;
  heroPrimaryCtaText?: string;
  heroSecondaryCtaText?: string;
  description?: string;
  venue?: string;
  location?: string;
  registrationInstructions?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPhoneHours?: string;
  contactAddress?: string;
  websiteStatus?: PublicationStatus;
  // Partnership & Governance Section
  partnershipTagline?: string;
  partnershipHeading?: string;
  partnershipDescription?: string;
  kukkiwonTitle?: string;
  kukkiwonBranch?: string;
  kukkiwonRole?: string;
  kukkiwonDescription?: string;
  kukkiwonUrl?: string;
  kukkiwonUrlText?: string;
  kukkiwonBadge?: string;
  kyorixTitle?: string;
  kyorixSubtitle?: string;
  kyorixRole?: string;
  kyorixDescription?: string;
  kyorixBadge?: string;
  // Disciplines Section
  disciplinesTagline?: string;
  disciplinesHeading?: string;
  disciplinesDescription?: string;
  disciplinesJson?: string;
  // Dates Section Headers
  datesTagline?: string;
  datesHeading?: string;
  datesDescription?: string;
  // CTA Section
  ctaTagline?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaPrimaryBtnText?: string;
  ctaSecondaryBtnText?: string;
  // Contact Section Headers
  contactTagline?: string;
  contactHeading?: string;
  contactDescription?: string;
  // About Page Mission
  aboutMissionHeading?: string;
  aboutMissionText?: string;
}

export interface CreateDateInput {
  championshipId: string;
  title: string;
  description?: string;
  date: string;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface UpdateDateInput {
  title?: string;
  description?: string;
  date?: string;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface CreateFAQInput {
  championshipId: string;
  question: string;
  answer: string;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface UpdateFAQInput {
  question?: string;
  answer?: string;
  displayOrder?: number;
  isPublished?: boolean;
}

