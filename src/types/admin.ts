// ==============================================================================
// ADMIN, AUDIT LOG & CMS CONTENT TYPES
// ==============================================================================

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'EVENT_ADMIN'
  | 'REGISTRATION_ADMIN'
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
  last_login_at?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AdminSession {
  user_id: string;
  email: string;
  full_name: string;
  role: AdminRole;
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
