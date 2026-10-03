-- ==============================================================================
-- KUKKIWON CUP CHAMPIONSHIP - PHASE 9 POSTGRESQL / SUPABASE DDL
-- Championship CMS Content, Announcements, Important Dates, FAQ & Live Publishing
-- Migration: 20261003000004_phase9_cms_publishing.sql
-- ==============================================================================

-- 1. CHAMPIONSHIP CMS CONTENT
CREATE TABLE IF NOT EXISTS "championship_contents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "championship_id" UUID UNIQUE NOT NULL REFERENCES "championships"("id") ON DELETE CASCADE,
    "hero_title" VARCHAR(255) NOT NULL,
    "hero_subtitle" VARCHAR(255),
    "description" TEXT,
    "venue" VARCHAR(255),
    "location" VARCHAR(255),
    "registration_instructions" TEXT,
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(50),
    "website_status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS "idx_championship_contents_status" ON "championship_contents"("website_status");

-- 2. CHAMPIONSHIP ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS "championship_announcements" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "championship_id" UUID NOT NULL REFERENCES "championships"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS "idx_announcements_champ_published" ON "championship_announcements"("championship_id", "is_published");
CREATE INDEX IF NOT EXISTS "idx_announcements_priority_pub" ON "championship_announcements"("priority" DESC, "published_at" DESC);

-- 3. CHAMPIONSHIP IMPORTANT DATES
CREATE TABLE IF NOT EXISTS "championship_important_dates" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "championship_id" UUID NOT NULL REFERENCES "championships"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_dates_champ_order" ON "championship_important_dates"("championship_id", "is_published", "display_order" ASC);

-- 4. CHAMPIONSHIP FAQS
CREATE TABLE IF NOT EXISTS "championship_faqs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "championship_id" UUID NOT NULL REFERENCES "championships"("id") ON DELETE CASCADE,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_faqs_champ_order" ON "championship_faqs"("championship_id", "is_published", "display_order" ASC);
