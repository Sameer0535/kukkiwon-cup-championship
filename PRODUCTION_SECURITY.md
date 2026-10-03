# PRODUCTION SECURITY ARCHITECTURE & POLICIES

**Platform**: Standalone Kukkiwon Cup Championship Platform  
**Collaboration**: Kukkiwon North India x Kyorix Sports Technology  
**Version**: 1.0.0 (Production Release)  
**Security Standard**: Enterprise Hardened (Zero Trust, Least Privilege, Fail-Closed)  

---

## 1. Authentication & Password Security

### 1.1 Password Hashing Specification
* **Algorithm**: PBKDF2 (Password-Based Key Derivation Function 2)
* **Underlying Digest**: SHA-512
* **Iteration Count**: 100,000 rounds
* **Salt**: 16-byte cryptographically secure random bytes generated via `crypto.randomBytes(16)`
* **Format**: `${salt}:${derivedKey}`
* **Password Policy**: Minimum 10 characters required; no weak default passwords permitted in seed scripts.

### 1.2 Session Management
* **Token Format**: Signed JSON Web Tokens (JWT) using HS256 algorithm via `jose`.
* **Cookie Flags**:
  - `HttpOnly: true` (Strictly inaccessible to JavaScript; prevents XSS session theft).
  - `Secure: true` (Enforced in production; transmitted only over HTTPS).
  - `SameSite: "lax"` (Mitigates Cross-Site Request Forgery).
* **Token Expiration**: 7 days with server-side validation.

---

## 2. Role-Based Access Control (RBAC)

The system enforces strict permission boundaries in both middleware and API route handlers:

```text
SUPER_ADMIN (Level 100) ──► Full Administrative Control
     │
EVENT_ADMIN (Level 80) ────► Championships, Rules, Categories, Dates
     │
FINANCE_ADMIN (Level 60) ──► Orders, Reconciliation, Receipts, Refunds
     │
REGISTRAR (Level 20) ──────► Athlete Review, Document Verify, ID Cards
     │
VIEWER (Level 10) ─────────► Read-Only Visibility (Mutations Blocked HTTP 403)
```

---

## 3. Storage Security & File Upload Hardening

### 3.1 Magic-Byte Validation
File types are validated via their binary header signatures rather than trusting client-provided file extensions or MIME types:
* **JPEG**: `0xFF 0xD8 0xFF 0xE0` (or `0xE1` Exif)
* **PNG**: `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`
* **PDF**: `%PDF-` (`0x25 0x50 0x44 0x46`)

### 3.2 Executable & Double-Extension Rejection
* Windows PE/MZ executables (`0x4D 0x5A`) are strictly rejected.
* Dangerous double extensions (e.g. `exploit.exe.jpg`, `script.php.png`) are detected and blocked.
* Maximum upload size: 10MB per document.

### 3.3 Path Traversal Prevention
Storage keys are sanitized to prevent directory escape attacks:
* Paths containing `../`, `..\\`, `%2e%2e%2f`, or absolute roots (`/etc/...`) are rejected.
* Files are constrained strictly to their designated logical bucket partition.

### 3.4 Signed Access URLs
* All participant identity documents are stored privately.
* Access is granted solely through cryptographic HMAC-SHA256 signed URLs with a 300-second TTL.

---

## 4. Digital ID Card & QR Verification Security

### 4.1 High-Entropy Token Generation
* QR accreditation tokens are generated using 32 cryptographically secure random bytes (`crypto.randomBytes(32)`), encoded as URL-safe base64url strings.
* Tokens are non-sequential and mathematically impossible to guess or brute-force.

### 4.2 Zero-PII Public Verification Guarantee
When scanned by event security or the public at `/verify/athlete/[token]`, the verification API guarantees:
* **Exposed Data**: Athlete Name, Club / Academy Name, Division / Category Name, Discipline, Country, and Accreditation Status.
* **Redacted Data**: Email address, phone number, date of birth, national ID / Aadhaar number, and home address are **strictly undefined** in public DTOs.

### 4.3 Immediate Revocation & Rotation
* Revoking an accreditation immediately changes card status to `REVOKED`, returning `isValid: false` to all subsequent scans.
* Reissuing an ID card rotates the 32-byte QR token, rendering the previous token permanently invalid.

---

## 5. Payment Security (Razorpay TEST Mode)

### 5.1 Real-Money Safeguard
* Live real-currency payments are strictly blocked in Phase 19. All transactions run in Razorpay TEST mode (`rzp_test_...`).

### 5.2 Integer Paise Arithmetic
* All entry fees are calculated and stored in integer minor units (paise). Example: ₹1,500 = 150000 paise. Floating-point arithmetic is strictly prohibited.

### 5.3 HMAC Signature Verification
* Client-side checkout responses are verified on the server by computing HMAC-SHA256 over `${order_id}|${payment_id}` using `PAYMENT_KEY_SECRET`.
* Webhook notifications verify the `X-Razorpay-Signature` header over the raw JSON payload.
* Webhook deduplication prevents duplicate registration crediting.

---

## 6. HTTP Security Headers

Production HTTP responses configure enterprise security headers:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; frame-src https://api.razorpay.com; ...
```

---

## 7. Sensitive Data Redaction & Zero-Leak Audits

1. **Automated Static Bundle Scan**: Production client JavaScript bundles (`.next/static/`) are scanned to ensure zero server-only secrets (`DATABASE_URL`, `JWT_SECRET`, `PAYMENT_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) are bundled into client code.
2. **Logging Sanitization**: Structured logs redact passwords, payment tokens, and authentication cookies.
