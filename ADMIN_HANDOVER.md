# ADMINISTRATOR OPERATIONAL HANDOVER GUIDE

**Platform**: Standalone Kukkiwon Cup Championship Platform  
**Target Audience**: Tournament Directors, Registrars, Finance Officers, and Technical Administrators  
**Collaboration**: Kukkiwon North India x Kyorix Sports Technology  
**Version**: 1.0.0 (Production Release)  

---

## 1. Role-Based Access Control (RBAC) Architecture

The platform defines strict hierarchical access tiers to ensure separation of duties:

| Role | Access Scope | Intended Operator |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | Universal administrative access across all championship settings, staff management, financial overrides, and audit logs. | Tournament Director / Lead Technical Architect |
| **EVENT_ADMIN** | Championship configuration, categories, division rules, competition dates, and venue settings. | Competition Director / Head of Organizing Committee |
| **REGISTRAR** | Athlete & coach profile verification, academy validation, document approval/rejection, and accreditation issuance. | Chief Registrar / Accreditation Staff |
| **FINANCE_ADMIN** | Order lookup, transaction reconciliation, payment auditing, and manual receipt processing. | Finance Officer / Accounts Manager |
| **VIEWER** | Read-only reporting access across participants, brackets, and statistics. Mutations strictly blocked (`HTTP 403`). | Executive Observers / Media Liaisons |

---

## 2. Admin Authentication & Login

* **Portal URL**: `/admin/login`
* **Session Lifetime**: 7 days (issued via secure, HTTP-only, encrypted cookie).
* **Password Policy**: Minimum 10 characters; cryptographically derived via PBKDF2-SHA512 with 100,000 iterations.
* **Security Controls**: Direct password verification, brute-force mitigation, and timing-attack resistance.
* **Initial Bootstrap**: Provisioned via CLI utility `scripts/bootstrap-admin.mjs` (never committed in source code).

---

## 3. Championship Management Workflow

1. **Accessing Settings**: Navigate to **Admin Portal > Championships**.
2. **Editing Metadata**:
   - Championship Name, Venue, Dates, and Sanction Details.
   - Registration open/close timestamps.
3. **Competition Categories**:
   - Manage Kyorugi (Sparring), Poomsae (Forms), and Demo divisions.
   - Set age limits, weight constraints, and entry fees.

---

## 4. Athlete & Coach Registration Management

1. **Registration Directory**: View all participant entries under **Admin Portal > Registrations**.
2. **Filtering**: Search by Athlete ID, Name, Academy, Category, or Status.
3. **Workflow State Transitions**:
   - `DRAFT`: Participant filling wizard (editable by registrant).
   - `SUBMITTED`: Completed profile awaiting document verification or payment.
   - `PAYMENT_PENDING`: Profile approved; awaiting gateway settlement.
   - `CONFIRMED`: Entry fee settled; accreditation eligible.
   - `APPROVED`: Registrar sign-off complete.
   - `REJECTED`: Ineligible entry (requires documented reason).

---

## 5. Document Verification Workflow

1. Navigate to **Admin Portal > Documents**.
2. **Reviewing Documents**:
   - Click document thumbnail to stream via secure, short-lived signed URL (expires in 5 minutes).
   - Documents are stored privately and cannot be accessed via direct public URL.
3. **Decisioning**:
   - **Verify**: Approves document; advances participant status.
   - **Reject**: Prompts for rejection reason (e.g., "Aadhaar image blurry", "Expired medical certificate").
   - System notifies registrant to re-upload via **My Registration** portal.

---

## 6. Financial Reconciliation & Payment Tracking

1. Navigate to **Admin Portal > Reconciliation**.
2. **Ledger Precision**: All amounts are managed strictly in integer paise (₹1 = 100 paise) to eliminate floating-point rounding errors.
3. **Reconciliation Features**:
   - Aggregate collections breakdown by status (`PAID`, `PENDING`, `FAILED`).
   - Detailed transaction table cross-referencing Razorpay Payment ID and local Order ID.
   - Immutable audit logging on all financial state updates.

---

## 7. Digital ID Cards & QR Verification

1. Navigate to **Admin Portal > ID Cards**.
2. **Card Generation**:
   - System automatically generates high-contrast, official accreditation cards for confirmed athletes.
   - Cards embed a cryptographically secure 32-byte base64url QR verification token.
3. **Token Operations**:
   - **Revoke**: Immediately invalidates accreditation (e.g., failed weigh-in or disciplinary infraction). Scanners display `REVOKED`.
   - **Reissue**: Automatically rotates QR token, generating a fresh card while permanently invalidating the previous token.
4. **On-Site Scanner App**:
   - Security staff scan cards using standard camera devices.
   - Directs to `/verify/athlete/[token]`.
   - **Zero-PII Guarantee**: Displays competitor name, academy, category, and accreditation status. Withholds phone, email, date of birth, and national ID.

---

## 8. CMS & Content Publishing

1. Navigate to **Admin Portal > CMS**.
2. **Announcements**: Draft, schedule, and publish official championship notices. Published notices immediately render on `/api/public/announcements` and the public homepage.
3. **Important Dates**: Schedule weigh-in times, referee clinics, and opening ceremonies.
4. **FAQs**: Add or update competitor questions and answers.

---

## 9. Security Audit Logging

1. Navigate to **Admin Portal > Audit Logs**.
2. Every significant event is recorded in the relational database:
   - Admin logins & logouts
   - Document verifications & rejections
   - ID card issuances, revocations, and reissues
   - Payment webhooks & status transitions
   - CMS content publication
3. Logs capture: Timestamp (UTC), Actor ID, Action, Entity Type, Entity ID, and Redacted Metadata.
