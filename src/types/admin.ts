// ==============================================================================
// ADMIN, AUDIT LOG & CMS CONTENT TYPES (Phase 8 Architecture)
// Strictly defined, sanitized DTOs for championship administrative operations
// ==============================================================================

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'EVENT_ADMIN'
  | 'REGISTRATION_ADMIN'
  | 'REGISTRAR'
  | 'FINANCE_ADMIN'
  | 'DOCUMENT_ADMIN'
  | 'CONTENT_ADMIN'
  | 'VIEWER';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  assigned_championship_id?: string | null; // Championship scoping
  last_login_at?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AdminSession {
  user_id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  assigned_championship_id?: string | null;
  expires_at: number;
}

export interface AuditLogRecord {
  id: string;
  admin_user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: string | null;
  new_value?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: Date | string;
}

export interface SiteSettings {
  id: string;
  championship_id?: string | null;
  title: string;
  subtitle?: string | null;
  hero_headline?: string | null;
  hero_description?: string | null;
  about_content?: string | null;
  poster_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_address?: string | null;
  footer_text?: string | null;
  social_links?: Record<string, string> | null;
  rules_content?: string | null;
  privacy_policy?: string | null;
  is_published: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface TermsVersion {
  id: string;
  championship_id?: string | null;
  version: string;
  title: string;
  content: string;
  published_at: Date | string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

// ------------------------------------------------------------------------------
// PHASE 8 ADMINISTRATIVE DTOs (Requirement 20)
// Sanitized data transfer objects preventing credential or internal schema leaks
// ------------------------------------------------------------------------------

export interface AdminDashboardMetrics {
  totalRegistrations: number;
  totalAthletes: number;
  paidRegistrations: number;
  pendingPayments: number;
  failedPayments: number;
  documentsPending: number;
  documentsApproved: number;
  documentsRejected: number;
  idCardsGenerated: number;
  idCardsRevoked: number;
  idCardsPending: number;
  activeChampionships: number;
  recentRegistrations?: AdminRegistrationSummary[];
  recentAuditLogs?: AdminAuditLogEntry[];
}

export interface AdminRegistrationSummary {
  id: string;
  registrationNumber: string;
  championshipId: string;
  championshipName: string;
  athleteId: string;
  athleteName: string;
  academyName: string;
  country: string;
  categoryName: string;
  discipline: string;
  gender?: string | null;
  registrationStatus: string;
  paymentStatus: string;
  documentStatus: string;
  idCardStatus: string;
  amountPaise: number;
  amountInrFormatted: string;
  registeredAt: string;
}

export interface AdminRegistrationDetails extends AdminRegistrationSummary {
  participant: {
    id: string;
    fullName: string;
    gender: string;
    dob?: string | null;
    nationality: string;
    kukkiwonDanNumber?: string | null;
    beltRank?: string | null;
    photoUrl?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
  };
  payment: {
    status: string;
    amountPaise: number;
    amountInrFormatted: string;
    currency: string;
    paidAt?: string | null;
    orders: Array<{
      id: string;
      orderNumber: string;
      providerOrderId: string;
      amountPaise: number;
      amountInrFormatted: string;
      status: string;
      createdAt: string;
    }>;
    invoice?: {
      invoiceNumber: string;
      issuedAt: string;
      pdfUrl?: string | null;
    } | null;
    refunds: Array<{
      id: string;
      amountPaise: number;
      amountInrFormatted: string;
      status: string;
      reason: string;
      createdAt: string;
    }>;
  };
  documents: Array<{
    id: string;
    requirementId: string;
    documentType: string;
    title: string;
    status: string;
    version: number;
    fileUrl?: string | null;
    fileName?: string | null;
    rejectionReason?: string | null;
    uploadedAt: string;
    verifiedAt?: string | null;
  }>;
  idCard?: {
    id: string;
    athleteId: string;
    cardNumber: string;
    version: number;
    status: string;
    qrToken: string;
    verificationUrl: string;
    qrCodeDataUrl?: string | null;
    generatedAt?: string | null;
    revokedAt?: string | null;
    revocationReason?: string | null;
  } | null;
  auditTrail: AdminAuditLogEntry[];
}

export interface AdminPaymentSummary {
  id: string;
  orderNumber: string;
  registrationId: string;
  championshipId: string;
  championshipName: string;
  athleteId: string;
  athleteName: string;
  provider: string;
  providerOrderId: string;
  amountPaise: number;
  amountInrFormatted: string;
  currency: string;
  status: string;
  createdAt: string;
  paidAt?: string | null;
  invoiceNumber?: string | null;
  refundStatus?: string | null;
  refundedAmountPaise?: number;
}

export interface AdminIdCardSummary {
  id: string;
  athleteId: string;
  cardNumber: string;
  registrationId: string;
  championshipId: string;
  championshipName: string;
  athleteName: string;
  athleteEmail?: string | null;
  academyName: string;
  categoryName: string;
  version: number;
  status: string;
  qrToken: string;
  verificationUrl: string;
  photoUrl?: string | null;
  kukkiwonId?: string | null;
  generatedAt: string;
  revokedAt?: string | null;
  revocationReason?: string | null;
}

export interface AdminAuditLogEntry {
  id: string;
  adminUserId?: string | null;
  adminName?: string | null;
  adminRole?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
