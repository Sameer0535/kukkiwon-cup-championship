-- ==============================================================================
-- KUKKIWON CUP CHAMPIONSHIP - PHASE 4 POSTGRESQL / SUPABASE DDL
-- Secure Document & Participant Media Management Architecture
-- Migration: 20261002000001_phase4_document_management.sql
-- ==============================================================================

-- 1. ENUM UPDATES
DO $$ BEGIN
    ALTER TYPE "DocumentVerificationStatus" ADD VALUE IF NOT EXISTS 'NOT_UPLOADED';
    ALTER TYPE "DocumentVerificationStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. DOCUMENT REQUIREMENTS TABLE
CREATE TABLE IF NOT EXISTS "document_requirements" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "championship_id" UUID NOT NULL REFERENCES "championships"("id") ON DELETE CASCADE,
    "participant_type" "ParticipantType" NOT NULL,
    "discipline" VARCHAR(50),
    "document_type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "requires_dan" BOOLEAN NOT NULL DEFAULT false,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "allowed_file_types" VARCHAR(255) NOT NULL DEFAULT 'image/jpeg,image/png,application/pdf',
    "max_file_size" INTEGER NOT NULL DEFAULT 5242880,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_doc_reqs_champ_type" ON "document_requirements"("championship_id", "participant_type");
CREATE INDEX IF NOT EXISTS "idx_doc_reqs_active_order" ON "document_requirements"("is_active", "display_order");

-- 3. PARTICIPANT DOCUMENTS TABLE (Versioned, Secure)
CREATE TABLE IF NOT EXISTS "participant_documents" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "registration_id" UUID NOT NULL REFERENCES "registrations"("id") ON DELETE CASCADE,
    "document_requirement_id" UUID NOT NULL REFERENCES "document_requirements"("id") ON DELETE CASCADE,
    "original_filename" VARCHAR(255) NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "verification_status" "DocumentVerificationStatus" NOT NULL DEFAULT 'UPLOADED',
    "rejection_reason" TEXT,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMPTZ(6),
    "verified_by" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_participant_docs_reg" ON "participant_documents"("registration_id");
CREATE INDEX IF NOT EXISTS "idx_participant_docs_req" ON "participant_documents"("document_requirement_id");
CREATE INDEX IF NOT EXISTS "idx_participant_docs_status" ON "participant_documents"("verification_status");
CREATE INDEX IF NOT EXISTS "idx_participant_docs_current" ON "participant_documents"("is_current");

-- 4. AUDIT LOG USER ID COLUMN
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs"("user_id");
