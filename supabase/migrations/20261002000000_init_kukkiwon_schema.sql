-- ==============================================================================
-- KUKKIWON CUP CHAMPIONSHIP - INITIAL POSTGRESQL / SUPABASE DDL
-- Standalone Architecture for Kukkiwon North India x Kyorix Sports Technology
-- Migration: 20261002000000_init_kukkiwon_schema.sql
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE "ChampionshipStatus" AS ENUM (
        'DRAFT', 'UPCOMING', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'ARCHIVED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ParticipantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "RegistrationStatus" AS ENUM (
        'DRAFT', 'PENDING_PAYMENT', 'PAYMENT_FAILED', 'PAID', 'UNDER_REVIEW', 'CONFIRMED', 'REJECTED', 'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "DocumentVerificationStatus" AS ENUM (
        'NOT_REQUIRED', 'PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM (
        'CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "IdCardStatus" AS ENUM (
        'NOT_GENERATED', 'GENERATED', 'REVOKED', 'REISSUED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "AdminRole" AS ENUM (
        'SUPER_ADMIN', 'EVENT_ADMIN', 'REGISTRATION_ADMIN', 'FINANCE_ADMIN', 'DOCUMENT_ADMIN', 'CONTENT_ADMIN', 'VIEWER'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 2. CHAMPIONSHIPS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "championships" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "short_name" VARCHAR(50),
    "subtitle" VARCHAR(255),
    "description" TEXT,
    "status" "ChampionshipStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "venue" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "registration_open" TIMESTAMPTZ(6) NOT NULL,
    "registration_close" TIMESTAMPTZ(6) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "entry_fee_athlete" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "entry_fee_coach" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "entry_fee_official" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "banner_url" TEXT,
    "poster_url" TEXT,
    "rules_document_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_championships_slug" ON "championships"("slug");
CREATE INDEX IF NOT EXISTS "idx_championships_status" ON "championships"("status");
CREATE INDEX IF NOT EXISTS "idx_championships_dates" ON "championships"("start_date", "end_date");

-- ------------------------------------------------------------------------------
-- 3. PARTICIPANTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "participants" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "public_id" VARCHAR(50) NOT NULL UNIQUE,
    "full_name" VARCHAR(255) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "nationality" VARCHAR(50) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "academy_name" VARCHAR(255),
    "academy_country" VARCHAR(100),
    "academy_state" VARCHAR(100),
    "academy_city" VARCHAR(100),
    "kukkiwon_id" VARCHAR(100),
    "photo_url" TEXT,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "registration_status" "ParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_participants_public_id" ON "participants"("public_id");
CREATE INDEX IF NOT EXISTS "idx_participants_full_name" ON "participants"("full_name");
CREATE INDEX IF NOT EXISTS "idx_participants_designation" ON "participants"("designation");
CREATE INDEX IF NOT EXISTS "idx_participants_nationality" ON "participants"("nationality");

-- ------------------------------------------------------------------------------
-- 4. REGISTRATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "registrations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "registration_number" VARCHAR(60) NOT NULL UNIQUE,
    "championship_id" UUID NOT NULL REFERENCES "championships"("id") ON DELETE RESTRICT,
    "participant_id" UUID NOT NULL REFERENCES "participants"("id") ON DELETE CASCADE,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'DRAFT',
    "registered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "confirmed_at" TIMESTAMPTZ(6),
    "terms_version" VARCHAR(20) NOT NULL,
    "terms_accepted_at" TIMESTAMPTZ(6) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_registrations_championship" ON "registrations"("championship_id");
CREATE INDEX IF NOT EXISTS "idx_registrations_participant" ON "registrations"("participant_id");
CREATE INDEX IF NOT EXISTS "idx_registrations_status" ON "registrations"("status");
CREATE INDEX IF NOT EXISTS "idx_registrations_reg_number" ON "registrations"("registration_number");

-- ------------------------------------------------------------------------------
-- 5. DESIGNATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "designations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "label" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "requires_kukkiwon_id" BOOLEAN NOT NULL DEFAULT FALSE,
    "requires_documents" BOOLEAN NOT NULL DEFAULT FALSE,
    "display_order" INT NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_designations_active_order" ON "designations"("is_active", "display_order");

-- ------------------------------------------------------------------------------
-- 6. NATIONALITIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "nationalities" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "iso_code" VARCHAR(3) NOT NULL UNIQUE,
    "iso_alpha2" VARCHAR(2) NOT NULL UNIQUE,
    "flag_identifier" VARCHAR(50),
    "display_order" INT NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_nationalities_iso_code" ON "nationalities"("iso_code");
CREATE INDEX IF NOT EXISTS "idx_nationalities_alpha2" ON "nationalities"("iso_alpha2");

-- ------------------------------------------------------------------------------
-- 7. DOCUMENTS TABLE (Private Storage)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "documents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "participant_id" UUID NOT NULL REFERENCES "participants"("id") ON DELETE CASCADE,
    "registration_id" UUID REFERENCES "registrations"("id") ON DELETE SET NULL,
    "document_type" VARCHAR(100) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INT NOT NULL,
    "verification_status" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "verified_at" TIMESTAMPTZ(6),
    "verified_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_documents_participant" ON "documents"("participant_id");
CREATE INDEX IF NOT EXISTS "idx_documents_registration" ON "documents"("registration_id");
CREATE INDEX IF NOT EXISTS "idx_documents_status" ON "documents"("verification_status");

-- ------------------------------------------------------------------------------
-- 8. PAYMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "payments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "registration_id" UUID NOT NULL REFERENCES "registrations"("id") ON DELETE RESTRICT,
    "provider" VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
    "order_id" VARCHAR(100),
    "payment_id" VARCHAR(100),
    "signature" TEXT,
    "amount" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "payment_method" VARCHAR(50),
    "paid_at" TIMESTAMPTZ(6),
    "receipt_url" TEXT,
    "raw_response" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_payments_registration" ON "payments"("registration_id");
CREATE INDEX IF NOT EXISTS "idx_payments_order_id" ON "payments"("order_id");
CREATE INDEX IF NOT EXISTS "idx_payments_payment_id" ON "payments"("payment_id");
CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments"("status");

-- ------------------------------------------------------------------------------
-- 9. ID CARDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "id_cards" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "participant_id" UUID NOT NULL REFERENCES "participants"("id") ON DELETE CASCADE,
    "registration_id" UUID NOT NULL UNIQUE REFERENCES "registrations"("id") ON DELETE CASCADE,
    "card_number" VARCHAR(60) NOT NULL UNIQUE,
    "qr_token" VARCHAR(128) NOT NULL UNIQUE,
    "card_status" "IdCardStatus" NOT NULL DEFAULT 'NOT_GENERATED',
    "generated_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "revocation_reason" TEXT,
    "pdf_path" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_id_cards_card_number" ON "id_cards"("card_number");
CREATE INDEX IF NOT EXISTS "idx_id_cards_qr_token" ON "id_cards"("qr_token");
CREATE INDEX IF NOT EXISTS "idx_id_cards_status" ON "id_cards"("card_status");

-- ------------------------------------------------------------------------------
-- 10. ADMIN USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'VIEWER',
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_admin_users_email" ON "admin_users"("email");
CREATE INDEX IF NOT EXISTS "idx_admin_users_role" ON "admin_users"("role");

-- ------------------------------------------------------------------------------
-- 11. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "admin_user_id" UUID REFERENCES "admin_users"("id") ON DELETE SET NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_admin" ON "audit_logs"("admin_user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- ------------------------------------------------------------------------------
-- 12. SITE SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "championship_id" UUID UNIQUE REFERENCES "championships"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL DEFAULT 'Kukkiwon Cup Championship',
    "subtitle" VARCHAR(255) DEFAULT 'Presented by Kukkiwon North India & Kyorix Sports Technology',
    "hero_headline" VARCHAR(255),
    "hero_description" TEXT,
    "about_content" TEXT,
    "poster_url" TEXT,
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(50),
    "contact_address" TEXT,
    "footer_text" TEXT,
    "social_links" TEXT,
    "rules_content" TEXT,
    "privacy_policy" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. TERMS VERSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "terms_versions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "championship_id" UUID REFERENCES "championships"("id") ON DELETE CASCADE,
    "version" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL DEFAULT 'Official Championship Registration Terms',
    "content" TEXT NOT NULL,
    "published_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    UNIQUE("championship_id", "version")
);

-- ------------------------------------------------------------------------------
-- 14. SEED DATA - INITIAL DESIGNATIONS
-- ------------------------------------------------------------------------------
INSERT INTO "designations" ("code", "label", "description", "requires_kukkiwon_id", "requires_documents", "display_order")
VALUES 
    ('ATHLETE', 'Athlete', 'Competing participant in championship categories', false, true, 1),
    ('COACH', 'Coach', 'Official team / academy coach', true, true, 2),
    ('TECHNICAL_OFFICIAL', 'Technical Official', 'Technical management and scoring officials', true, true, 3),
    ('REFEREE', 'Referee', 'Certified ring and mat referees', true, true, 4),
    ('JURY', 'Jury', 'Appeals and jury board members', true, true, 5),
    ('DOCTOR', 'Doctor', 'Licensed medical doctor for athlete health', false, true, 6),
    ('MEDICAL_STAFF', 'Medical Staff', 'Physiotherapists, nurses, first-aid crew', false, true, 7),
    ('TEAM_MANAGER', 'Team Manager', 'Official academy/state team manager', false, false, 8),
    ('OFFICIAL', 'Official', 'Organizing committee and VIP officials', false, false, 9),
    ('OTHER', 'Other', 'Accredited media, security, logistics', false, false, 10)
ON CONFLICT ("code") DO NOTHING;

-- ------------------------------------------------------------------------------
-- 15. SEED DATA - TOP NATIONALITIES
-- ------------------------------------------------------------------------------
INSERT INTO "nationalities" ("name", "iso_code", "iso_alpha2", "flag_identifier", "display_order")
VALUES
    ('India', 'IND', 'IN', '🇮🇳', 1),
    ('South Korea', 'KOR', 'KR', '🇰🇷', 2),
    ('Nepal', 'NEP', 'NP', '🇳🇵', 3),
    ('Bhutan', 'BHU', 'BT', '🇧🇹', 4),
    ('Sri Lanka', 'SRI', 'LK', '🇱🇰', 5),
    ('Bangladesh', 'BAN', 'BD', '🇧🇩', 6),
    ('United States', 'USA', 'US', '🇺🇸', 7),
    ('United Kingdom', 'GBR', 'GB', '🇬🇧', 8),
    ('Australia', 'AUS', 'AU', '🇦🇺', 9),
    ('Japan', 'JPN', 'JP', '🇯🇵', 10),
    ('Thailand', 'THA', 'TH', '🇹🇭', 11),
    ('Malaysia', 'MAS', 'MY', '🇲🇾', 12),
    ('Iran', 'IRI', 'IR', '🇮🇷', 13),
    ('United Arab Emirates', 'UAE', 'AE', '🇦🇪', 14)
ON CONFLICT ("iso_code") DO NOTHING;
