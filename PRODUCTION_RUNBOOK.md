# PRODUCTION OPERATIONAL RUNBOOK — KUKKIWON CUP PLATFORM

**Platform**: Standalone Kukkiwon Cup Championship Platform  
**Collaboration**: Kukkiwon North India x Kyorix Sports Technology  
**Version**: 1.0.0 (Production Release)  
**Last Updated**: 2026-10-03  

---

## 1. Deployment Procedures

### 1.1 Production Hosting Architecture
* **Target Engine**: Vercel Serverless Edge Platform
* **Node.js Runtime**: Node.js 20.x or 22.x LTS
* **Framework**: Next.js 16.3.8 (Turbopack)

### 1.2 Step-by-Step Vercel Production Deployment
1. **Link Project**:
   ```bash
   npx vercel link
   ```
2. **Inject Production Environment Variables**:
   In the Vercel Dashboard under **Settings > Environment Variables**, configure all variables defined in Section 2.
3. **Execute Production Build & Deploy**:
   ```bash
   npx vercel --prod
   ```
4. **Post-Deployment Smoke Test**:
   Execute the automated post-deployment validation suite:
   ```bash
   TEST_BASE_URL="https://kukkiwoncup.org" npx tsx scripts/test-phase19.mjs
   ```

---

## 2. Environment Configuration

All production variables must be configured in the deployment environment. **Never commit secrets to source control.**

### 2.1 Server-Only Secrets
* `DATABASE_URL`: PostgreSQL connection pool URL (PgBouncer port `6543`) with `?sslmode=require`.
* `DIRECT_URL`: Direct PostgreSQL connection URL (port `5432`) for Prisma migrations.
* `JWT_SECRET`: 64-character high-entropy cryptographic secret for session signing (`openssl rand -base64 48`).
* `STORAGE_PROVIDER`: Storage engine selection (`supabase` or `local`).
* `SUPABASE_SERVICE_ROLE_KEY`: Service role secret for Supabase storage buckets.
* `PAYMENT_GATEWAY_PROVIDER`: Active provider (`RAZORPAY`).
* `PAYMENT_KEY_SECRET`: Razorpay API secret key for HMAC signature verification.
* `PAYMENT_WEBHOOK_SECRET`: Razorpay webhook secret for payload validation.
* `KYORIX_INTEGRATION_ENABLED`: Set to `"false"` in standalone decoupled mode.
* `NODE_ENV`: Set to `"production"` (activates fail-closed persistence guard).

### 2.2 Public Browser Variables
* `NEXT_PUBLIC_SITE_URL`: Canonical public domain (`https://kukkiwoncup.org`).
* `NEXT_PUBLIC_PAYMENT_KEY_ID`: Razorpay public Key ID (`rzp_test_...` or `rzp_live_...`).
* `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (if cloud storage active).
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase client-safe anon key.

---

## 3. Database Management & Migrations

### 3.1 Applying Migrations in Production
Prisma schema migrations are version-controlled and forward-safe:
```bash
# 1. Verify schema definition
npx prisma validate

# 2. Deploy pending migrations safely (never resets or pushes schema)
npx prisma migrate deploy

# 3. Regenerate client bindings if needed
npx prisma generate
```

> [!CAUTION]
> **NEVER** run `npx prisma migrate reset` or `npx prisma db push` against the production database.

### 3.2 Database Connection Pool Sizing
* PgBouncer pool mode: `transaction`
* Default pool size: 20–50 connections depending on serverless concurrency limit
* Timeout: 10,000ms

---

## 4. Cloud Object Storage Configuration

### 4.1 Logical Buckets
The storage provider requires four logical buckets:
1. `participant-documents`: Private (Government IDs, medical waivers, Dan certificates).
2. `participant-photos`: Private (Passport-size athlete headshots).
3. `id-cards`: Private (Generated accreditation cards & QR tokens).
4. `championship-assets`: Public (Championship logos, event banners, rules PDFs).

### 4.2 Signed Access URLs
* All participant documents are accessed strictly through signed URLs targeting `/api/storage/stream`.
* Default signed URL TTL: 300 seconds (5 minutes).

---

## 5. Payment Gateway Configuration (Razorpay)

### 5.1 Test vs Live Mode
* **Test Mode**: Uses `rzp_test_...` keys. Live financial transactions are strictly blocked.
* **Live Mode**: Set only after tournament organizer sign-off.

### 5.2 Webhook Configuration
1. Webhook URL: `https://kukkiwoncup.org/api/payments/webhook/razorpay`
2. Active Events:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
3. Secret: Must match `PAYMENT_WEBHOOK_SECRET`.

---

## 6. Custom Domain & DNS Requirements

Configure DNS records with the domain registrar for `kukkiwoncup.org`:

| Type | Name / Host | Value / Target | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `A` | `@` (Apex) | `76.76.21.21` | Automatic / 300 | Vercel Anycast IP |
| `CNAME` | `www` | `cname.vercel-dns.com` | Automatic / 300 | Subdomain redirect |

* SSL certificates are automatically provisioned and renewed via Let's Encrypt at edge.

---

## 7. Observability & Monitoring

### 7.1 Health Diagnostic Route
* **Endpoint**: `GET /api/health`
* **Response Contract**:
  ```json
  {
    "status": "HEALTHY",
    "timestamp": "2026-10-03T...",
    "environment": "production",
    "services": {
      "database": { "status": "CONNECTED" },
      "security": { "secretsExposed": false }
    }
  }
  ```

### 7.2 Application Error Tracking
* Structured logs include ISO timestamps, request paths, user IDs, and error descriptions.
* Secrets and passwords are automatically redacted.

---

## 8. Backup & Disaster Recovery

### 8.1 Automated Snapshot Schedule
* Frequency: Daily full snapshot at 02:00 UTC.
* Retention: 7 daily snapshots, 4 weekly snapshots.
* Point-In-Time-Recovery (PITR): Enabled for 7 days.

### 8.2 Emergency Logical Database Export
```bash
pg_dump --format=custom --no-owner --no-privileges "$DIRECT_URL" > "backup_$(date +%Y%m%d_%H%M%S).dump"
```

---

## 9. Rollback Procedures

### 9.1 Instant Vercel Edge Rollback (< 2 Minutes)
1. Navigate to **Vercel Dashboard > Project > Deployments**.
2. Locate the previous stable deployment SHA.
3. Click **Promote to Production**.
4. Edge CDN traffic shifts instantly to the previous build.

### 9.2 Emergency Registration Freeze
If an issue occurs during registration, tournament admins can pause registrations without taking down the website:
* In Admin Portal: **Settings > Registration Status > CLOSED**.
* Or set environment variable: `REGISTRATIONS_FROZEN=true`.

---

## 10. Incident Response Playbook

| Scenario | Immediate Action | Secondary Action |
| :--- | :--- | :--- |
| **Website Unavailable (5xx)** | Check Vercel status page; execute Vercel rollback to previous deployment SHA. | Review serverless error logs in Vercel Dashboard. |
| **Database Connection Failure** | Verify PostgreSQL cloud cluster health; check connection pool limits. | Platform runs fail-closed; reads continue via cache where applicable. |
| **Payment Webhook Errors** | Verify `PAYMENT_WEBHOOK_SECRET` matches Razorpay Dashboard; check idempotency table. | Failed webhook events are safely logged for manual reconciliation. |
| **Storage Upload Failures** | Verify storage quota and `SUPABASE_SERVICE_ROLE_KEY` permissions. | Inspect upload mime-type and file-size restrictions (max 10MB). |
| **QR Scan Failures** | Verify `NEXT_PUBLIC_SITE_URL` points to canonical production domain. | Check whether participant accreditation card status is `REVOKED`. |
| **Authentication Locked Out** | Re-run `node scripts/bootstrap-admin.mjs` with new credentials. | Audit logs record bootstrap events for accountability. |

---

## 11. Operational Security Requirements

1. **Principle of Least Privilege**: Grant only minimum necessary admin roles (`SUPER_ADMIN`, `EVENT_ADMIN`, `REGISTRAR`, `FINANCE_ADMIN`, `VIEWER`).
2. **Secret Rotation**: Rotate `JWT_SECRET` and `PAYMENT_KEY_SECRET` bi-annually or immediately upon suspected compromise.
3. **Audit Trail**: Every administrative mutation, status change, and payment verification is immutably logged to the database `AuditLog` table.
