-- ==============================================================================
-- KUKKIWON CUP CHAMPIONSHIP - PHASE 10 MIGRATION: KYORIX INTEGRATION
-- Tables for championship mapping and external synchronization records
-- ==============================================================================

-- 1. Create KyorixSyncStatus enum type if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyorix_sync_status') THEN
    CREATE TYPE "kyorix_sync_status" AS ENUM (
      'NOT_SYNCED',
      'PENDING',
      'SYNCED',
      'FAILED',
      'DISCONNECTED'
    );
  END IF;
END $$;

-- 2. Create kyorix_championship_mappings table
CREATE TABLE IF NOT EXISTS "kyorix_championship_mappings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "championship_id" UUID NOT NULL UNIQUE REFERENCES "championships"("id") ON DELETE CASCADE,
  "kyorix_championship_id" VARCHAR(100) NOT NULL,
  "kyorix_championship_name" VARCHAR(255),
  "is_enabled" BOOLEAN NOT NULL DEFAULT false,
  "sync_mode" VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  "mapped_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS "idx_kyorix_championship_mappings_ext_id" 
  ON "kyorix_championship_mappings" ("kyorix_championship_id");
CREATE INDEX IF NOT EXISTS "idx_kyorix_championship_mappings_enabled" 
  ON "kyorix_championship_mappings" ("is_enabled");

-- 3. Create kyorix_integration_records table
CREATE TABLE IF NOT EXISTS "kyorix_integration_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "championship_id" UUID NOT NULL REFERENCES "championships"("id") ON DELETE CASCADE,
  "registration_id" UUID NOT NULL UNIQUE REFERENCES "registrations"("id") ON DELETE CASCADE,
  "athlete_id" VARCHAR(100) NOT NULL,
  "kyorix_athlete_id" VARCHAR(100),
  "kyorix_registration_id" VARCHAR(100),
  "kyorix_championship_id" VARCHAR(100),
  "sync_status" "kyorix_sync_status" NOT NULL DEFAULT 'NOT_SYNCED',
  "last_synced_at" TIMESTAMPTZ(6),
  "last_sync_attempt_at" TIMESTAMPTZ(6),
  "last_error" TEXT,
  "sync_version" INTEGER NOT NULL DEFAULT 1,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "idempotency_key" VARCHAR(255) UNIQUE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_kyorix_records_champ_status" 
  ON "kyorix_integration_records" ("championship_id", "sync_status");
CREATE INDEX IF NOT EXISTS "idx_kyorix_records_ath_id" 
  ON "kyorix_integration_records" ("athlete_id");
CREATE INDEX IF NOT EXISTS "idx_kyorix_records_ext_ath_id" 
  ON "kyorix_integration_records" ("kyorix_athlete_id");
CREATE INDEX IF NOT EXISTS "idx_kyorix_records_status" 
  ON "kyorix_integration_records" ("sync_status");
