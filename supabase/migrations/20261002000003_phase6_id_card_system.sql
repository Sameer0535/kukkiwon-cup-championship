-- ==============================================================================
-- KUKKIWON CUP CHAMPIONSHIP - PHASE 6 POSTGRESQL / SUPABASE DDL
-- Athlete ID Card Generation, QR Verification & Download Architecture
-- Migration: 20261002000003_phase6_id_card_system.sql
-- ==============================================================================

-- 1. ENUM UPDATES
DO $$ BEGIN
    ALTER TYPE "IdCardStatus" ADD VALUE IF NOT EXISTS 'NOT_ELIGIBLE';
    ALTER TYPE "IdCardStatus" ADD VALUE IF NOT EXISTS 'READY';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. REGISTRATIONS ATHLETE ID COLUMN
ALTER TABLE "registrations" 
ADD COLUMN IF NOT EXISTS "athlete_id" VARCHAR(60) UNIQUE;

CREATE INDEX IF NOT EXISTS "idx_registrations_athlete_id" ON "registrations"("athlete_id");

-- 3. ID CARDS ATHLETE ID & VERSION COLUMNS
ALTER TABLE "id_cards"
ADD COLUMN IF NOT EXISTS "athlete_id" VARCHAR(60) UNIQUE,
ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS "idx_id_cards_athlete_id" ON "id_cards"("athlete_id");
