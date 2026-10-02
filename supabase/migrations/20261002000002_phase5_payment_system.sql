-- ==============================================================================
-- KUKKIWON CUP CHAMPIONSHIP - PHASE 5 POSTGRESQL / SUPABASE DDL
-- Registration Fees, Payment Integration & Financial Reconciliation
-- Migration: 20261002000002_phase5_payment_system.sql
-- ==============================================================================

-- 1. ENUM DEFINITIONS
DO $$ BEGIN
    CREATE TYPE "PaymentOrderStatus" AS ENUM (
        'PENDING',
        'PROCESSING',
        'PAID',
        'FAILED',
        'CANCELLED',
        'REFUND_PENDING',
        'PARTIALLY_REFUNDED',
        'REFUNDED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "RefundStatus" AS ENUM (
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. REGISTRATION FEES TABLE
CREATE TABLE IF NOT EXISTS "registration_fees" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "championship_id" UUID NOT NULL REFERENCES "championships"("id") ON DELETE CASCADE,
    "category_id" UUID REFERENCES "categories"("id") ON DELETE SET NULL,
    "participant_type" "ParticipantType" NOT NULL DEFAULT 'ATHLETE',
    "name" VARCHAR(255) NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "late_fee_paise" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "effective_from" TIMESTAMPTZ(6),
    "effective_until" TIMESTAMPTZ(6),
    "late_fee_from" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_reg_fees_champ_type" ON "registration_fees"("championship_id", "participant_type");
CREATE INDEX IF NOT EXISTS "idx_reg_fees_category" ON "registration_fees"("category_id");
CREATE INDEX IF NOT EXISTS "idx_reg_fees_active" ON "registration_fees"("is_active");

-- 3. PAYMENT ORDERS TABLE
CREATE TABLE IF NOT EXISTS "payment_orders" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_number" VARCHAR(60) NOT NULL UNIQUE,
    "registration_id" UUID NOT NULL REFERENCES "registrations"("id") ON DELETE RESTRICT,
    "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "provider" VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
    "provider_order_id" VARCHAR(100) NOT NULL UNIQUE,
    "amount_paise" INTEGER NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "fee_snapshot" TEXT NOT NULL,
    "status" "PaymentOrderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_pay_orders_reg" ON "payment_orders"("registration_id");
CREATE INDEX IF NOT EXISTS "idx_pay_orders_user" ON "payment_orders"("user_id");
CREATE INDEX IF NOT EXISTS "idx_pay_orders_provider_id" ON "payment_orders"("provider_order_id");
CREATE INDEX IF NOT EXISTS "idx_pay_orders_status" ON "payment_orders"("status");

-- 4. PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS "payment_transactions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "payment_order_id" UUID NOT NULL REFERENCES "payment_orders"("id") ON DELETE CASCADE,
    "provider_payment_id" VARCHAR(100) NOT NULL UNIQUE,
    "provider_order_id" VARCHAR(100) NOT NULL,
    "signature_verified" BOOLEAN NOT NULL DEFAULT false,
    "amount_paise" INTEGER NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "payment_method" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'CAPTURED',
    "captured_at" TIMESTAMPTZ(6),
    "failure_code" VARCHAR(100),
    "failure_reason" TEXT,
    "raw_response" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_pay_trans_order" ON "payment_transactions"("payment_order_id");
CREATE INDEX IF NOT EXISTS "idx_pay_trans_provider_payment" ON "payment_transactions"("provider_payment_id");
CREATE INDEX IF NOT EXISTS "idx_pay_trans_provider_order" ON "payment_transactions"("provider_order_id");
CREATE INDEX IF NOT EXISTS "idx_pay_trans_status" ON "payment_transactions"("status");

-- 5. PAYMENT WEBHOOK EVENTS TABLE
CREATE TABLE IF NOT EXISTS "payment_webhook_events" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "provider" VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
    "provider_event_id" VARCHAR(100) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload_hash" VARCHAR(64) NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "processing_status" VARCHAR(50) NOT NULL DEFAULT 'PROCESSED',
    "error_message" TEXT,
    CONSTRAINT "uq_pay_webhook_provider_event" UNIQUE ("provider", "provider_event_id")
);

CREATE INDEX IF NOT EXISTS "idx_pay_webhooks_type" ON "payment_webhook_events"("provider", "event_type");
CREATE INDEX IF NOT EXISTS "idx_pay_webhooks_received" ON "payment_webhook_events"("received_at");

-- 6. PAYMENT INVOICES TABLE
CREATE TABLE IF NOT EXISTS "payment_invoices" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "invoice_number" VARCHAR(60) NOT NULL UNIQUE,
    "registration_id" UUID NOT NULL REFERENCES "registrations"("id") ON DELETE RESTRICT,
    "payment_order_id" UUID REFERENCES "payment_orders"("id") ON DELETE SET NULL,
    "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "participant_name" VARCHAR(255) NOT NULL,
    "academy_name" VARCHAR(255),
    "championship_name" VARCHAR(255) NOT NULL,
    "fee_breakdown" TEXT NOT NULL,
    "total_amount_paise" INTEGER NOT NULL,
    "total_amount" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "provider" VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
    "provider_payment_id" VARCHAR(100),
    "payment_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoice_status" VARCHAR(50) NOT NULL DEFAULT 'PAID',
    "receipt_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_pay_inv_reg" ON "payment_invoices"("registration_id");
CREATE INDEX IF NOT EXISTS "idx_pay_inv_order" ON "payment_invoices"("payment_order_id");
CREATE INDEX IF NOT EXISTS "idx_pay_inv_user" ON "payment_invoices"("user_id");

-- 7. PAYMENT REFUNDS TABLE
CREATE TABLE IF NOT EXISTS "payment_refunds" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "payment_order_id" UUID NOT NULL REFERENCES "payment_orders"("id") ON DELETE CASCADE,
    "payment_transaction_id" UUID REFERENCES "payment_transactions"("id") ON DELETE SET NULL,
    "provider_refund_id" VARCHAR(100) UNIQUE,
    "amount_paise" INTEGER NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "initiated_by" UUID,
    "initiated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "error_message" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_pay_refunds_order" ON "payment_refunds"("payment_order_id");
CREATE INDEX IF NOT EXISTS "idx_pay_refunds_status" ON "payment_refunds"("status");
