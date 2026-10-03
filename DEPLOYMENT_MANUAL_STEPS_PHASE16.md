# PRODUCTION DEPLOYMENT MANUAL STEPS — PHASE 16

## Standalone Kukkiwon Cup Championship Platform

> **CRITICAL ARCHITECTURAL BOUNDARY**:
> This platform must be deployed as a completely independent system.
> Do NOT connect to or share resources with the legacy manager at `https://kyorix-mgr.vercel.app/`.

This document outlines the step-by-step procedure required for an operations engineer to provision external cloud infrastructure and execute the production/staging deployment of the Kukkiwon Cup Championship platform.

---

## 1. Cloud PostgreSQL Provisioning (Step-by-Step)

The platform requires PostgreSQL 15+ with SSL/TLS enabled and connection pooling support.

### Option A: Supabase (Recommended)
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project** and name it `kukkiwon-cup-championship`.
3. Select region (e.g. `ap-south-1` Mumbai or nearest to venue New Delhi).
4. Set a strong database password (>= 24 characters with symbols).
5. In **Project Settings** → **Database**:
   - Copy the **Connection Pooling** connection string (Port `6543`, transaction mode) for `DATABASE_URL`:
     ```text
     postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
     ```
   - Copy the **Direct Connection** connection string (Port `5432`) for `DIRECT_URL`:
     ```text
     postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
     ```

### Option B: Neon / AWS RDS
- Create a PostgreSQL 15+ database.
- Ensure TLS/SSL is required (`?sslmode=require`).
- Configure connection pooler (e.g., PgBouncer) for application traffic (`DATABASE_URL`) and direct host for migrations (`DIRECT_URL`).

---

## 2. Database Schema Migration & Seeding

Run the following commands from a secure terminal with `DIRECT_URL` and `DATABASE_URL` configured in the environment:

```bash
# 1. Verify remote database connectivity
npx prisma db execute --stdin --url "$DIRECT_URL" <<< "SELECT 1;"

# 2. Generate initial production migration files (if not yet committed)
npx prisma migrate dev --name init_championship_schema

# 3. Apply migrations deterministically in production
npx prisma migrate deploy

# 4. Generate the latest Prisma Client bindings
npx prisma generate

# 5. Execute initial static tournament seed data (Safe: no default admin accounts)
npx tsx prisma/seed.ts
```

> [!IMPORTANT]
> Never execute `prisma db push` or `prisma migrate reset` against a staging or production database.

---

## 3. Super Administrator Initial Bootstrap

To initialize the root administrative user securely with PBKDF2-SHA512 password hashing:

```bash
# Set secure bootstrap credentials via environment variables (do NOT commit these)
export ADMIN_BOOTSTRAP_EMAIL="superadmin@kukkiwoncup.org"
export ADMIN_BOOTSTRAP_PASSWORD="[GENERATE-STRONG-PASSWORD-20-CHARS]"
export ADMIN_BOOTSTRAP_NAME="Kukkiwon Cup Super Administrator"

# Execute the bootstrap script
node scripts/bootstrap-admin.mjs
```

Verify output confirms:
```text
✅ SUPER_ADMIN successfully configured!
   User ID:   ...
   Email:     superadmin@kukkiwoncup.org
   Role:      SUPER_ADMIN
```

---

## 4. Cloud Object Storage Setup (Supabase Storage / AWS S3)

### For Supabase Storage:
1. Navigate to **Storage** in the Supabase Dashboard.
2. Create four private buckets:
   - `participant-documents` (Private — Public access: OFF)
   - `participant-photos` (Private — Public access: OFF)
   - `championship-assets` (Public or private with cache headers)
   - `id-cards` (Private — Public access: OFF)
3. Under **Project Settings** → **API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret key` → `SUPABASE_SERVICE_ROLE_KEY` (Server-only)

---

## 5. Vercel Hosting Deployment

Deploy the Next.js serverless application:

### Step 5.1: Link Project to Vercel
```bash
# Link local repository to a new Vercel project named kukkiwon-cup-championship
npx vercel link --yes --project kukkiwon-cup-championship
```

### Step 5.2: Configure Environment Variables on Vercel
Inject the environment variables through Vercel CLI or the Vercel Web Dashboard:

```bash
# Core Environment
npx vercel env add NODE_ENV production production
npx vercel env add NEXT_PUBLIC_SITE_URL production
# Enter: https://kukkiwoncup.org

# Database
npx vercel env add DATABASE_URL production
npx vercel env add DIRECT_URL production

# Authentication & Security
npx vercel env add JWT_SECRET production
npx vercel env add ADMIN_BOOTSTRAP_SECRET production

# Storage
npx vercel env add STORAGE_PROVIDER production
# Enter: supabase
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Payments (Razorpay TEST Mode for Phase 16)
npx vercel env add PAYMENT_GATEWAY_PROVIDER production
# Enter: RAZORPAY
npx vercel env add NEXT_PUBLIC_PAYMENT_KEY_ID production
# Enter: rzp_test_...
npx vercel env add PAYMENT_KEY_SECRET production
npx vercel env add PAYMENT_WEBHOOK_SECRET production

# Kyorix Standalone Decoupling (DISABLED by default)
npx vercel env add KYORIX_INTEGRATION_ENABLED production
# Enter: false
```

### Step 5.3: Production Deployment Command
```bash
# Deploy to production environment
npx vercel --prod
```

Upon completion, record the assigned Vercel production URL (e.g. `https://kukkiwon-cup-championship.vercel.app`).

---

## 6. Custom Domain & DNS Configuration

1. In the Vercel Dashboard under **Settings** → **Domains**, add:
   - `kukkiwoncup.org` (Primary Domain)
   - `www.kukkiwoncup.org` (Redirect to `kukkiwoncup.org`)
2. In the domain registrar DNS management portal (e.g. Cloudflare, GoDaddy, Namecheap):
   - **Apex Record (`@`)**: Add an `A` record pointing to `76.76.21.21` (or ALIAS/ANAME record to `cname.vercel-dns.com`).
   - **Subdomain (`www`)**: Add a `CNAME` record pointing to `cname.vercel-dns.com`.
3. Wait for DNS propagation and SSL certificate issuance by Let's Encrypt (typically 5–15 minutes).

---

## 7. Razorpay TEST Mode Webhook Registration

1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/) and switch to **Test Mode**.
2. Navigate to **Settings** → **Webhooks** → **Add New Webhook**.
3. Set **Webhook URL** to:
   ```text
   https://kukkiwoncup.org/api/payments/webhook/razorpay
   ```
4. Enter the **Secret** matching `PAYMENT_WEBHOOK_SECRET`.
5. Select active events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `refund.processed`
6. Click **Save Webhook**.

---

## 8. Deployment Health Verification

After DNS and deployment are complete, execute smoke tests against the live endpoint:

```bash
# 1. Verify health endpoint
curl -sS https://kukkiwoncup.org/api/health | jq .

# Expected Response:
# {
#   "status": "HEALTHY",
#   "services": {
#     "database": { "status": "CONNECTED" },
#     "security": { "secretsExposed": false }
#   }
# }

# 2. Verify security headers
curl -I -sS https://kukkiwoncup.org | grep -E "Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|Referrer-Policy"

# 3. Test Admin Portal Login
# Visit https://kukkiwoncup.org/admin/login and authenticate with the bootstrapped SUPER_ADMIN credentials.
```
