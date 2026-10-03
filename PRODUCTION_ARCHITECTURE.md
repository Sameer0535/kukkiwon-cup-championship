# PRODUCTION ARCHITECTURE SPECIFICATION — KUKKIWON CUP PLATFORM

**Platform**: Standalone Kukkiwon Cup Championship Platform  
**Collaboration**: Kukkiwon North India x Kyorix Sports Technology  
**Version**: 1.0.0 (Production Architecture)  
**Status**: Autonomous Independent Platform (Decoupled from legacy tournament managers)  

---

## 1. High-Level System Architecture

The Kukkiwon Cup Championship Platform is an enterprise full-stack Next.js web application running on a serverless edge architecture, backed by a relational PostgreSQL database and private cloud object storage.

```text
                                 INTERNET CLIENTS
                   (Desktop Web, Mobile Browsers, QR Scanners)
                                        │
                                        ▼
                         Custom Domain: kukkiwoncup.org
                                        │
                                        ▼
                            Edge CDN & SSL Termination
                        (Let's Encrypt / HSTS / TLS 1.3)
                                        │
                                        ▼
                         Vercel Serverless Hosting
                     ┌──────────────────┴──────────────────┐
                     │                                     │
                     ▼                                     ▼
             Next.js App Router                    API Routes & Handlers
             (SSR / Static / RSC)               (Auth, Webhooks, Storage)
                     │                                     │
                     └──────────────────┬──────────────────┘
                                        │
                          Prisma Client / PgBouncer
                                        │
                                        ▼
                           PostgreSQL 15+ Cluster
                  ┌─────────────────────┼─────────────────────┐
                  │                     │                     │
                  ▼                     ▼                     ▼
             Participants            Payments             Audit Logs
                                        │
                                        ▼
                         Private Cloud Object Storage
                 (participant-docs, participant-photos, id-cards)
                                        │
                                        ▼
                          Payment Gateway (Razorpay)
                    (TEST Mode: Integer Paise Arithmetic)
                                        │
                                        ▼
                       Kyorix Integration Boundary (Decoupled)
                     (KYORIX_INTEGRATION_ENABLED=false: Standalone)
```

---

## 2. Component Architecture

### 2.1 Frontend Tier
* **Framework**: Next.js 16.3.8 (React 19, App Router, React Server Components).
* **Styling**: Modern Tailwind CSS, custom design tokens, Kukkiwon navy (`#0A192F`) and gold (`#C5A059`) palette.
* **Responsive Layout**: Fluid mobile-first layout tested across viewport breakpoints (360px mobile to 1920px desktop).
* **Routes**: 82 optimized routes (prerendered public marketing pages, dynamic registration wizard, admin portal, and API routes).

### 2.2 Backend & API Tier
* **Runtime**: Node.js Serverless Edge Functions.
* **Authentication**: Stateless JWT session tokens signed with HS256, verified via `jose` in middleware and route handlers.
* **Role-Based Access Control (RBAC)**: Centralized authorization matrix (`SUPER_ADMIN`, `EVENT_ADMIN`, `REGISTRAR`, `FINANCE_ADMIN`, `VIEWER`).
* **Persistence Guard**: Fail-closed persistence architecture ensuring writes are refused when database connectivity is compromised in production.

### 2.3 Database Tier
* **Engine**: PostgreSQL 15+ with standard ACID compliance.
* **ORM**: Prisma Client with 29 relational models.
* **Connection Pooling**: Supported via PgBouncer on port `6543` for application traffic (`DATABASE_URL`).
* **DDL Migrations**: Direct port `5432` execution (`DIRECT_URL`).

### 2.4 Cloud Storage Tier
* **Engine**: Pluggable storage architecture (`STORAGE_PROVIDER="supabase" | "s3" | "local"`).
* **Access Control**: Zero public bucket exposure for participant identity documents or photos; access mediated exclusively through time-limited HMAC-SHA256 signed URLs.
* **File Validation**: Strict magic-byte inspection (JPEG, PNG, PDF), Windows PE/MZ executable rejection, and directory traversal defense.

### 2.5 Payment Gateway Tier
* **Engine**: Razorpay Payment Gateway.
* **Execution Mode**: **TEST MODE ONLY** (`rzp_test_...`). Real money is strictly blocked.
* **Currency Arithmetic**: 100% integer paise minor units (₹1 = 100 paise) preventing floating-point errors.
* **Webhook Security**: Raw payload HMAC-SHA256 signature verification with deduplication idempotency.

### 2.6 Digital ID & QR Accreditation Tier
* **Accreditation**: Sequential athlete IDs (`KKC26-ATH-xxxxxx`) and unique card numbers.
* **Token Entropy**: 32-byte cryptographically secure random base64url QR verification tokens.
* **Zero-PII Guarantee**: Verification route (`/verify/athlete/[token]`) exposes strictly competitor name, academy, category, and status. Completely withholds date of birth, phone, email, and national IDs.

### 2.7 Kyorix Integration Boundary Tier
* **Architecture**: Standalone, decoupled, and isolated.
* **Toggle**: `KYORIX_INTEGRATION_ENABLED="false"`.
* **Autonomy**: 100% of championship operations (registrations, verification, ID cards, payments, CMS) run independently without Kyorix runtime dependencies.

---

## 3. Data Flow & Lifecycles

### 3.1 Athlete Registration Flow
```text
1. Competitor opens /register/athlete
   ↓
2. Step 1: Personal Details & Kukkiwon Dan Certificate
   ↓
3. Step 2: Category & Discipline Selection (Age/Gender Validated)
   ↓
4. Step 3: Academy Affiliation (Directory Lookup)
   ↓
5. Step 4: Identity & Medical Document Upload (Magic-Byte Inspected)
   ↓
6. Step 5: Terms Acceptance (Versioned Legal Consent)
   ↓
7. Submission: Draft converted to SUBMITTED status
   ↓
8. Payment: Razorpay Order created in integer paise
   ↓
9. Settlement: Webhook confirms payment → CONFIRMED status
   ↓
10. Accreditation: High-entropy Digital ID Card & QR generated
```

---

## 4. Disaster Recovery & Backup Strategy

1. **Automated Daily Snapshots**: Cloud database cluster retains daily backups for 7 days.
2. **Point-In-Time-Recovery (PITR)**: Enables recovery to any second within the retention window.
3. **Pre-Deployment Logical Dumps**: `pg_dump` execution prior to database schema migrations.
4. **Vercel Instant Rollback**: Edge CDN routing allows immediate reversion to previous deployment SHAs (< 2 minutes).
