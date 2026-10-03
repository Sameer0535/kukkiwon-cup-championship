# PRODUCTION ENVIRONMENT CONTRACT — PHASE 16

## Standalone Kukkiwon Cup Championship Platform

> **Security & Boundary Mandate**:
> This platform is an autonomous championship management system operating independently of the legacy tournament manager at `https://kyorix-mgr.vercel.app/`.
> Under no circumstances must credentials, databases, or API keys be shared with or imported from that external system.

---

## 1. Executive Summary

This contract specifies all environment variables required to operate the Kukkiwon Cup Championship platform in staging and production environments. Every variable is classified by scope (public/client vs. private/server), purpose, format specification, and real-world production status as audited during Phase 16.

---

## 2. Environment Variables Specification

| Variable | Required | Scope | Purpose | Example / Format Specification | Production Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | Server | Determines execution environment and activates fail-closed persistence guards | `production` / `staging` / `development` | ✅ Verified in runtime |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Public (Client + Server) | Canonical HTTPS base URL used for QR code generation, absolute redirects, and metadata | `https://kukkiwoncup.org` | ⚠️ Local dev active (`http://localhost:3000`); Custom domain DNS pending |
| `DATABASE_URL` | **Yes** | Private (Server) | Transaction-pooled PostgreSQL 15+ connection URI used by Prisma Client | `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DB]?pgbouncer=true&connection_limit=10&sslmode=require` | ⚠️ **BLOCKED**: Remote PostgreSQL database cluster provisioning required |
| `DIRECT_URL` | **Yes** | Private (Server) | Direct non-pooled PostgreSQL connection URI used for Prisma migrations and DDL operations | `postgresql://postgres:[PASSWORD]@[HOST]:5432/[DB]?sslmode=require` | ⚠️ **BLOCKED**: Remote PostgreSQL database cluster provisioning required |
| `JWT_SECRET` | **Yes** | Private (Server) | Cryptographic secret for signing session JWT tokens, admin cookies, and HMAC signed document URLs | Base64-encoded or hex string >= 32 characters (`openssl rand -base64 48`) | ✅ Staging/dev secret verified; production rotation required at deployment |
| `ADMIN_BOOTSTRAP_SECRET` | **Yes** | Private (Server) | Root setup authorization secret used exclusively for CLI admin initialization | High-entropy string >= 24 characters | ✅ Validated |
| `ADMIN_BOOTSTRAP_EMAIL` | **Yes** | Private (Server) | Email address for initial Super Administrator bootstrap via `scripts/bootstrap-admin.mjs` | `superadmin@kukkiwoncup.org` | ✅ Contract defined |
| `ADMIN_BOOTSTRAP_PASSWORD` | **Yes** | Private (Server) | Initial Super Administrator password (PBKDF2-SHA512 hashed, >= 10 chars) | High-entropy password (CLI-only, never committed) | ✅ Contract defined |
| `ADMIN_BOOTSTRAP_NAME` | No | Private (Server) | Display name for root Super Administrator | `Kukkiwon Cup Super Administrator` | ✅ Default provided |
| `STORAGE_PROVIDER` | **Yes** | Private (Server) | Storage driver selector: `local`, `supabase`, or `s3` | `supabase` or `s3` (for cloud production); `local` (development) | ⚠️ Local driver operational; Cloud object storage provisioning pending |
| `STORAGE_BUCKET_DOCUMENTS` | **Yes** | Private (Server) | Private storage bucket for participant documents (ID proofs, Dan certs) | `participant-documents` | ✅ Configured |
| `STORAGE_BUCKET_PHOTOS` | **Yes** | Private (Server) | Private storage bucket for athlete portrait photographs | `participant-photos` | ✅ Configured |
| `STORAGE_BUCKET_ASSETS` | **Yes** | Private (Server) | Public/cached storage bucket for championship logos, venue maps, and banners | `championship-assets` | ✅ Configured |
| `STORAGE_BUCKET_ID_CARDS` | **Yes** | Private (Server) | Storage bucket for generated printable digital ID cards | `id-cards` | ✅ Configured |
| `STORAGE_SIGNED_URL_EXPIRY_SECONDS` | No | Private (Server) | Expiration time for signed temporary access URLs (defaults to 300 seconds) | `300` | ✅ Validated (default: 300s) |
| `NEXT_PUBLIC_SUPABASE_URL` | Conditional | Public (Client + Server) | Supabase API endpoint (required if `STORAGE_PROVIDER=supabase`) | `https://[PROJECT-REF].supabase.co` | ⚠️ Pending cloud Supabase project setup |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Conditional | Public (Client + Server) | Supabase anon key (required if client upload enabled) | JWT string (`eyJ...`) | ⚠️ Pending cloud Supabase project setup |
| `SUPABASE_SERVICE_ROLE_KEY` | Conditional | Private (Server-Only) | Supabase privileged service role key for private storage operations | JWT string (`eyJ...`) | ⚠️ **BLOCKED**: External Supabase provisioning required |
| `AWS_ACCESS_KEY_ID` | Conditional | Private (Server-Only) | AWS IAM Key ID (required if `STORAGE_PROVIDER=s3`) | 20-character alphanumeric string (`AKIA...`) | ⚠️ Not configured (optional alternative) |
| `AWS_SECRET_ACCESS_KEY` | Conditional | Private (Server-Only) | AWS IAM Secret Key (required if `STORAGE_PROVIDER=s3`) | 40-character secret string | ⚠️ Not configured (optional alternative) |
| `AWS_REGION` | Conditional | Private (Server-Only) | AWS S3 region | `ap-south-1` (Mumbai) | ⚠️ Not configured (optional alternative) |
| `AWS_S3_BUCKET` | Conditional | Private (Server-Only) | Primary AWS S3 bucket name | `kukkiwon-cup-production-storage` | ⚠️ Not configured (optional alternative) |
| `PAYMENT_GATEWAY_PROVIDER` | **Yes** | Private (Server) | Active payment provider: `RAZORPAY`, `STRIPE`, or `MOCK` | `RAZORPAY` (production/staging); `MOCK` (local testing) | ✅ Validated with test fallbacks |
| `NEXT_PUBLIC_PAYMENT_KEY_ID` | **Yes** | Public (Client + Server) | Razorpay public Key ID rendered in browser checkout modal | `rzp_test_[KEY_ID]` (Phase 16); `rzp_live_[KEY_ID]` (Phase 17+) | ⚠️ **BLOCKED**: Real Razorpay credentials required |
| `PAYMENT_KEY_SECRET` | **Yes** | Private (Server-Only) | Razorpay secret key for server-side order creation and payment verification | Server-only secret string | ⚠️ **BLOCKED**: Real Razorpay credentials required |
| `PAYMENT_WEBHOOK_SECRET` | **Yes** | Private (Server-Only) | Secret key for validating incoming Razorpay webhook HMAC-SHA256 signatures | Server-only secret string | ⚠️ **BLOCKED**: Real Razorpay credentials required |
| `KYORIX_INTEGRATION_ENABLED` | **Yes** | Private (Server) | Feature flag for bracket/scoring synchronization | `false` (default/isolated); `true` (when partner credentials exist) | ✅ Standalone decoupled (defaults to `false`) |
| `KYORIX_API_BASE_URL` | Conditional | Private (Server) | Base HTTPS URL for Kyorix partner tournament API | `https://api.kyorix.com/v1` | ⚠️ Isolated / Disconnected |
| `KYORIX_API_KEY` | Conditional | Private (Server-Only) | Kyorix partner API Key | Server-only key string | ⚠️ **BLOCKED**: External partner provisioning required |
| `KYORIX_API_SECRET` | Conditional | Private (Server-Only) | Kyorix partner API Secret | Server-only secret string | ⚠️ **BLOCKED**: External partner provisioning required |
| `KYORIX_WEBHOOK_SECRET` | Conditional | Private (Server-Only) | Webhook verification secret for inbound match updates | Server-only secret string | ⚠️ **BLOCKED**: External partner provisioning required |
| `KYORIX_REQUEST_TIMEOUT_MS` | No | Private (Server) | Request timeout in milliseconds (defaults to 10000ms) | `10000` | ✅ Validated |
| `KYORIX_USE_MOCK` | No | Private (Server) | Mock mode flag for test suites | `false` (production) | ✅ Validated |
| `LOG_LEVEL` | No | Private (Server) | Logging granularity (`error`, `warn`, `info`, `debug`) | `info` (production); `debug` (development) | ✅ Configured |

---

## 3. Secret Isolation & Zero-Leak Audits

1. **Client Bundling Boundary (`NEXT_PUBLIC_*`)**:
   - Only `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PAYMENT_KEY_ID`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are permitted in browser bundles.
   - All other variables (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `PAYMENT_KEY_SECRET`, `PAYMENT_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `KYORIX_*`) are strictly server-only.
   - An automated build scan verifies that 0 server secrets appear in `.next/static/` chunks.

2. **Git Version Control Safeguards**:
   - `.gitignore` explicitly excludes `.env`, `.env.local`, `.env.production`, and `.env*` (preserving only `.env.example`).
   - Private storage directory `/storage/` and `.vercel` directories are strictly excluded.
   - Secret scan verifies 0 hardcoded credentials in tracked files.

3. **Runtime Protection**:
   - `GET /api/health` redacts all credentials and reports configuration booleans (`databaseConfigured: true`, `secretsExposed: false`).
   - Storage URLs are time-limited signed URLs generated via HMAC-SHA256 with zero direct filesystem exposure.
