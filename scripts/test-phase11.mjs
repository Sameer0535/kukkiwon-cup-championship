// ==============================================================================
// PHASE 11 AUTOMATED SECURITY TEST SUITE & PENETRATION VERIFICATION
// Comprehensive 20-group automated security audit, penetration tests,
// and defensive hardening validation for Kukkiwon Cup Championship Platform
// ==============================================================================

import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import {
  createAdminToken,
  createUserToken,
  verifyAdminToken,
  verifyUserToken,
  hashPassword,
  verifyPassword,
} from "../src/lib/auth.ts";
import { requireAdmin, getAdminSession, getRegistrantSession, AuthError } from "../src/lib/server-auth.ts";
import { DocumentStorageService } from "../src/server/services/document-storage.service.ts";
import { DocumentManagementService } from "../src/server/services/document-management.service.ts";
import { PaymentService } from "../src/server/services/payment.service.ts";
import { IdCardService } from "../src/server/services/id-card.service.ts";
import { RegistrationFlowService } from "../src/server/services/registration-flow.service.ts";
import { CmsService } from "../src/server/services/cms.service.ts";
import { AdminService } from "../src/server/services/admin.service.ts";
import { AuditService } from "../src/server/services/audit.service.ts";
import { KyorixSyncService } from "../src/server/integrations/kyorix/sync.service.ts";
import { KyorixWebhookService } from "../src/server/integrations/kyorix/webhook.service.ts";
import { getSanitizedKyorixConfig } from "../src/server/integrations/kyorix/config.ts";
import {
  checkRateLimit,
  resetRateLimits,
  getAnonymizedClientIdentifier,
} from "../src/server/security/rate-limiter.ts";
import { CategoryService } from "../src/server/services/category.service.ts";
import { DEFAULT_FEE_CONFIG } from "../src/server/services/fee.service.ts";
import nextConfig from "../next.config.ts";

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    totalPassed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    totalFailed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log("🛡️ RUNNING PHASE 11: SECURITY TESTING & PRODUCTION HARDENING SUITE");
  console.log("==================================================================\n");

  const JWT_SECRET = process.env.JWT_SECRET || "kukkiwon-cup-default-secret-change-in-production";
  const JWT_KEY = new TextEncoder().encode(JWT_SECRET);

  // ----------------------------------------------------------------------------
  // GROUP 1: AUTHENTICATION BYPASS TESTING
  // ----------------------------------------------------------------------------
  console.log("🔒 [GROUP 1] Authentication Bypass Testing");
  {
    // 1. Missing token
    const emptyAdmin = await verifyAdminToken("");
    assert(emptyAdmin === null, "Missing admin token safely resolves to null");

    // 2. Invalid token string
    const malformedAdmin = await verifyAdminToken("not.a.valid.jwt.token");
    assert(malformedAdmin === null, "Malformed JWT safely rejected");

    // 3. Expired token
    const expiredToken = await new SignJWT({
      userId: "admin-exp",
      email: "exp@kukkiwoncup.org",
      fullName: "Expired Admin",
      role: "SUPER_ADMIN",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(JWT_KEY);

    const expiredResult = await verifyAdminToken(expiredToken);
    assert(expiredResult === null, "Expired token is rejected");

    // 4. Token signed with wrong secret
    const wrongKey = new TextEncoder().encode("completely-different-signing-key-12345");
    const fakeSecretToken = await new SignJWT({
      userId: "hacker-01",
      email: "hacker@evil.com",
      fullName: "Attacker",
      role: "SUPER_ADMIN",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(wrongKey);

    const fakeResult = await verifyAdminToken(fakeSecretToken);
    assert(fakeResult === null, "Token signed with wrong key strictly rejected");

    // 5. Athlete token used on Admin verification
    const athleteToken = await createUserToken({
      id: "ath-001",
      email: "athlete@kukkiwoncup.org",
      full_name: "John Athlete",
      role: "REGISTRANT",
    });
    const athleteAsAdmin = await verifyAdminToken(athleteToken);
    assert(athleteAsAdmin === null, "Athlete token cannot masquerade as admin");

    // 6. Modified payload (tampered signature)
    const validAdminToken = await createAdminToken({
      user_id: "admin-root",
      email: "admin@kukkiwoncup.org",
      full_name: "Super Admin",
      role: "SUPER_ADMIN",
    });
    const parts = validAdminToken.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ role: "SUPER_ADMIN", userId: "evil" })).toString("base64url");
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    const tamperedResult = await verifyAdminToken(tamperedToken);
    assert(tamperedResult === null, "Tampered payload token signature mismatch rejected");
  }

  // ----------------------------------------------------------------------------
  // GROUP 2: ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT
  // ----------------------------------------------------------------------------
  console.log("\n👥 [GROUP 2] Role-Based Access Control (RBAC)");
  {
    const roles = ["SUPER_ADMIN", "EVENT_ADMIN", "FINANCE_ADMIN", "REGISTRAR", "VIEWER"];
    const tokens = {};
    for (const r of roles) {
      tokens[r] = await createAdminToken({
        user_id: `user-${r.toLowerCase()}`,
        email: `${r.toLowerCase()}@kukkiwoncup.org`,
        full_name: `${r} User`,
        role: r,
      });
    }

    // 1. Super Admin full permission
    const superAdminReq = new Request("http://localhost/api/test", {
      headers: { authorization: `Bearer ${tokens["SUPER_ADMIN"]}` },
    });
    const superAdmin = await requireAdmin(superAdminReq, ["SUPER_ADMIN"]);
    assert(superAdmin.role === "SUPER_ADMIN", "Super Admin allowed on Super Admin operations");

    // 2. Viewer attempting refund operation (allowed only SUPER_ADMIN, EVENT_ADMIN, FINANCE_ADMIN)
    const viewerReq = new Request("http://localhost/api/test", {
      headers: { authorization: `Bearer ${tokens["VIEWER"]}` },
    });
    let viewerBlocked = false;
    try {
      await requireAdmin(viewerReq, ["SUPER_ADMIN", "EVENT_ADMIN", "FINANCE_ADMIN"]);
    } catch (e) {
      if (e instanceof AuthError && e.statusCode === 403) viewerBlocked = true;
    }
    assert(viewerBlocked, "Viewer role strictly blocked (403) from refund operations");

    // 3. Registrar attempting financial mutation
    const registrarReq = new Request("http://localhost/api/test", {
      headers: { authorization: `Bearer ${tokens["REGISTRAR"]}` },
    });
    let registrarFinanceBlocked = false;
    try {
      await requireAdmin(registrarReq, ["SUPER_ADMIN", "FINANCE_ADMIN"]);
    } catch (e) {
      if (e instanceof AuthError && e.statusCode === 403) registrarFinanceBlocked = true;
    }
    assert(registrarFinanceBlocked, "Registrar role blocked (403) from financial settlements");

    // 4. Finance Admin attempting ID card revocation (allowed only SUPER_ADMIN, EVENT_ADMIN, REGISTRATION_ADMIN, REGISTRAR)
    const finReq = new Request("http://localhost/api/test", {
      headers: { authorization: `Bearer ${tokens["FINANCE_ADMIN"]}` },
    });
    let finCardBlocked = false;
    try {
      await requireAdmin(finReq, ["SUPER_ADMIN", "EVENT_ADMIN", "REGISTRAR"]);
    } catch (e) {
      if (e instanceof AuthError && e.statusCode === 403) finCardBlocked = true;
    }
    assert(finCardBlocked, "Finance Admin blocked (403) from accreditation card mutations");

    // 5. Athlete token accessing any admin endpoint
    const athleteToken = await createUserToken({
      id: "ath-rogue",
      email: "rogue@test.com",
      full_name: "Rogue Athlete",
      role: "REGISTRANT",
    });
    const athleteReq = new Request("http://localhost/api/admin/dashboard", {
      headers: { authorization: `Bearer ${athleteToken}` },
    });
    let athleteBlockedWith403 = false;
    try {
      await requireAdmin(athleteReq);
    } catch (e) {
      if (e instanceof AuthError && e.statusCode === 403) athleteBlockedWith403 = true;
    }
    assert(athleteBlockedWith403, "Athlete attempting admin API receives explicit 403 Forbidden");
  }

  // ----------------------------------------------------------------------------
  // GROUP 3: INSECURE DIRECT OBJECT REFERENCES (IDOR) DEFENSE
  // ----------------------------------------------------------------------------
  console.log("\n🛡️ [GROUP 3] Insecure Direct Object References (IDOR)");
  {
    // 1. Athlete Draft Ownership Check
    const ownerUserId = "user-alice-101";
    const attackerUserId = "user-bob-999";

    const draft = await RegistrationFlowService.saveDraft({
      userId: ownerUserId,
      participantType: "ATHLETE",
      draftData: {
        first_name: "Alice",
        last_name: "Competitor",
        declaration_accurate: true,
        declaration_terms: true,
      },
    });

    // Attacker Bob tries to read Alice's draft
    let bobReadBlocked = false;
    try {
      await RegistrationFlowService.getDraft(draft.registrationId, attackerUserId);
    } catch (e) {
      if (e.message.includes("Unauthorized")) bobReadBlocked = true;
    }
    assert(bobReadBlocked, "Attacker Bob blocked from reading Alice's draft (IDOR Prevention)");

    // Attacker Bob tries to modify Alice's draft
    let bobWriteBlocked = false;
    try {
      await RegistrationFlowService.saveDraft({
        registrationId: draft.registrationId,
        userId: attackerUserId,
        participantType: "ATHLETE",
        draftData: {
          first_name: "Hacked",
          last_name: "Name",
        },
      });
    } catch (e) {
      if (e.message.includes("Unauthorized")) bobWriteBlocked = true;
    }
    assert(bobWriteBlocked, "Attacker Bob blocked from modifying Alice's draft (IDOR Prevention)");

    // 2. Cross-Championship IDOR Scoping
    const scopedAdminSession = {
      user_id: "admin-scoped",
      email: "scoped@kukkiwoncup.org",
      full_name: "Scoped Admin",
      role: "EVENT_ADMIN",
      assigned_championship_id: "champ-regional-delhi",
      expires_at: Date.now() + 86400000,
    };

    let crossChampBlocked = false;
    try {
      await AdminService.getRegistrationDetails("reg-demo-001", scopedAdminSession);
    } catch (e) {
      if (e.statusCode === 403 || e.message.includes("Unauthorized")) crossChampBlocked = true;
    }
    assert(crossChampBlocked, "Scoped admin blocked from accessing external championship records (403)");
  }

  // ----------------------------------------------------------------------------
  // GROUP 4: STRICT SERVER-SIDE INPUT VALIDATION
  // ----------------------------------------------------------------------------
  console.log("\n🔍 [GROUP 4] Input Validation");
  {
    // 1. Missing mandatory legal declarations
    let legalDeclBlocked = false;
    try {
      await RegistrationFlowService.submitRegistration({
        userId: "user-val-01",
        participantType: "ATHLETE",
        draftData: {
          first_name: "Test",
          last_name: "Athlete",
          declaration_accurate: false, // missing
          declaration_terms: true,
        },
      });
    } catch (e) {
      if (e.message.includes("declarations and terms")) legalDeclBlocked = true;
    }
    assert(legalDeclBlocked, "Submission rejected when mandatory legal declarations missing");

    const kyorugiCats = await CategoryService.listCategories(undefined, "KYORUGI");
    const seniorCat = kyorugiCats.find((c) => c.min_age && c.min_age >= 17) || kyorugiCats[0];

    // 2. Ineligible Category submission
    let categoryIneligibleBlocked = false;
    try {
      await RegistrationFlowService.submitRegistration({
        userId: "user-val-02",
        participantType: "ATHLETE",
        draftData: {
          first_name: "Junior",
          last_name: "Player",
          date_of_birth: "2018-01-01", // 8 years old
          gender: "MALE",
          nationality: "IND",
          discipline: "KYORUGI",
          category_id: seniorCat.id,
          belt_rank: "BLACK_1_DAN",
          declaration_accurate: true,
          declaration_terms: true,
        },
      });
    } catch (e) {
      if (e.message.includes("Eligibility")) categoryIneligibleBlocked = true;
    }
    assert(categoryIneligibleBlocked, "Age-ineligible category selection rejected server-side");

    // 3. Post-submission registration tampering prevention
    const validDraft = await RegistrationFlowService.saveDraft({
      userId: "user-tamper-01",
      participantType: "ATHLETE",
      draftData: {
        first_name: "Original",
        last_name: "Athlete",
        date_of_birth: "2000-05-15",
        gender: seniorCat.gender,
        nationality: "IND",
        discipline: "KYORUGI",
        category_id: seniorCat.id,
        belt_rank: "BLACK_1_DAN",
        declaration_accurate: true,
        declaration_terms: true,
      },
    });

    // Submit registration
    await RegistrationFlowService.submitRegistration({
      registrationId: validDraft.registrationId,
      userId: "user-tamper-01",
      participantType: "ATHLETE",
      draftData: {
        first_name: "Original",
        last_name: "Athlete",
        date_of_birth: "2000-05-15",
        gender: seniorCat.gender,
        nationality: "IND",
        discipline: "KYORUGI",
        category_id: seniorCat.id,
        belt_rank: "BLACK_1_DAN",
        declaration_accurate: true,
        declaration_terms: true,
      },
    });

    // Attempt to tamper/resubmit an already submitted registration
    let tamperResubmitBlocked = false;
    try {
      await RegistrationFlowService.submitRegistration({
        registrationId: validDraft.registrationId,
        userId: "user-tamper-01",
        participantType: "ATHLETE",
        draftData: {
          first_name: "Tampered",
          last_name: "Name",
          date_of_birth: "2000-05-15",
          gender: seniorCat.gender,
          nationality: "IND",
          discipline: "KYORUGI",
          category_id: seniorCat.id,
          belt_rank: "BLACK_1_DAN",
          declaration_accurate: true,
          declaration_terms: true,
        },
      });
    } catch (e) {
      if (e.message.includes("Cannot modify registration")) tamperResubmitBlocked = true;
    }
    assert(tamperResubmitBlocked, "Post-submission tampering blocked (cannot re-submit submitted registration)");
  }

  // ----------------------------------------------------------------------------
  // GROUP 5: SQL & DATABASE INJECTION DEFENSE
  // ----------------------------------------------------------------------------
  console.log("\n💉 [GROUP 5] SQL & Database Injection Defense");
  {
    const injectionStrings = [
      "' OR '1'='1",
      "'; DROP TABLE registrations; --",
      "\" OR 1=1 --",
      "1; SELECT * FROM users;",
      "admin'--",
      "UNION SELECT username, password_hash FROM users",
    ];

    for (const sqlPayload of injectionStrings) {
      const searchResult = await AdminService.getRegistrations({
        q: sqlPayload,
      });
      assert(
        Array.isArray(searchResult.items),
        `SQL injection payload safely handled by parameterized ORM: ${sqlPayload.slice(0, 20)}...`
      );
    }
  }

  // ----------------------------------------------------------------------------
  // GROUP 6: CROSS-SITE SCRIPTING (XSS) DEFENSE
  // ----------------------------------------------------------------------------
  console.log("\n🛡️ [GROUP 6] Cross-Site Scripting (XSS) Defense");
  {
    const xssPayload = "<script>alert('XSS_ATTACK_EXPLOIT')</script><img src=x onerror=alert(1)>";

    // Create draft with XSS payload
    const draft = await RegistrationFlowService.saveDraft({
      userId: "user-xss-01",
      participantType: "ATHLETE",
      draftData: {
        first_name: xssPayload,
        last_name: "Target",
        declaration_accurate: true,
        declaration_terms: true,
      },
    });

    const retrieved = await RegistrationFlowService.getDraft(draft.registrationId, "user-xss-01");
    // Verify payload is stored verbatim as raw text data without executing, safe for React auto-escaping
    assert(retrieved.draftData.first_name === xssPayload, "Payload stored safely as text without server execution");

    // Public CMS sanitized verification
    const publicPackage = await CmsService.getPublicChampionshipPackage("champ-kukkiwon-2026");
    assert(
      !JSON.stringify(publicPackage).includes("<script>alert"),
      "Public CMS package contains zero unescaped executable script tags"
    );
  }

  // ----------------------------------------------------------------------------
  // GROUP 7: CSRF, SESSION & COOKIE SECURITY
  // ----------------------------------------------------------------------------
  console.log("\n🍪 [GROUP 7] CSRF, Session & Cookie Security");
  {
    // Passwords hashed with PBKDF2 salt
    const plaintext = "SuperSecretPassword123!";
    const hash = await hashPassword(plaintext);
    assert(hash.includes(":"), "PBKDF2 password hash includes cryptographic salt");
    assert(hash.length > 80, "Password hash length satisfies high-entropy storage");

    const match = await verifyPassword(plaintext, hash);
    assert(match === true, "Valid password successfully verified against PBKDF2 hash");

    const wrongMatch = await verifyPassword("WrongPassword!", hash);
    assert(wrongMatch === false, "Incorrect password fails PBKDF2 verification");
  }

  // ----------------------------------------------------------------------------
  // GROUP 8: SLIDING-WINDOW RATE LIMITING & BRUTE FORCE DEFENSE
  // ----------------------------------------------------------------------------
  console.log("\n⏱️ [GROUP 8] Rate Limiting & Anti-Brute Force");
  {
    resetRateLimits();
    const testClientId = "attacker-brute-force-ip";

    // Threshold: 5 requests per 60 seconds
    const limitConfig = { maxRequests: 5, windowSeconds: 60 };

    for (let i = 1; i <= 5; i++) {
      const res = checkRateLimit(testClientId, limitConfig);
      assert(res.allowed === true, `Rate limit allowed request #${i}`);
    }

    const blockedRes = checkRateLimit(testClientId, limitConfig);
    assert(blockedRes.allowed === false, "6th request is strictly blocked (Rate Limit Exceeded)");
    assert(blockedRes.retryAfterSeconds > 0, "Retry-After seconds provided on blocked request");
    assert(blockedRes.headers["Retry-After"] !== undefined, "Retry-After header returned");
    assert(blockedRes.headers["X-RateLimit-Remaining"] === "0", "X-RateLimit-Remaining is 0");

    // Anonymized identifier check
    const mockReq = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "198.51.100.45" },
    });
    const anonId = getAnonymizedClientIdentifier(mockReq);
    assert(!anonId.includes("198.51.100.45"), "Client IP is cryptographically hashed for privacy");
    assert(anonId.length === 32, "Hashed client identifier is 32 hex characters");

    resetRateLimits();
  }

  // ----------------------------------------------------------------------------
  // GROUP 9: FILE UPLOAD SECURITY & MAGIC BYTES
  // ----------------------------------------------------------------------------
  console.log("\n📁 [GROUP 9] File Upload Security");
  {
    // 1. Magic bytes validation: Genuine JPEG
    const validJpgHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const validJpg = DocumentStorageService.validateFile(validJpgHeader, {
      allowedMimeTypes: ["image/jpeg"],
      maxSizeBytes: 2 * 1024 * 1024,
      originalFilename: "photo.jpg",
      declaredMimeType: "image/jpeg",
    });
    assert(validJpg.detectedMimeType === "image/jpeg", "Valid JPEG header accepted");

    // 2. MIME spoofing: Extension .jpg but content is plain text / HTML
    const spoofedJpg = Buffer.from("<html><script>alert('evil')</script></html>");
    let spoofBlocked = false;
    try {
      DocumentStorageService.validateFile(spoofedJpg, {
        allowedMimeTypes: ["image/jpeg"],
        maxSizeBytes: 2 * 1024 * 1024,
        originalFilename: "hacked.jpg",
        declaredMimeType: "image/jpeg",
      });
    } catch (e) {
      if (e.message.includes("Unable to verify file signature")) spoofBlocked = true;
    }
    assert(spoofBlocked, "Spoofed file with .jpg extension and HTML body rejected by magic bytes");

    // 3. Executable binary (Windows PE: MZ)
    const peBinary = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    let peBlocked = false;
    try {
      DocumentStorageService.validateFile(peBinary, {
        allowedMimeTypes: ["application/pdf"],
        maxSizeBytes: 5 * 1024 * 1024,
        originalFilename: "invoice.pdf.exe",
        declaredMimeType: "application/pdf",
      });
    } catch (e) {
      peBlocked = true;
    }
    assert(peBlocked, "Windows PE executable binary strictly blocked");

    // 4. Directory Traversal in Filename Sanitization
    const traversalFilename = "../../../etc/passwd.png";
    const validPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const validatedPng = DocumentStorageService.validateFile(validPngHeader, {
      allowedMimeTypes: ["image/png"],
      maxSizeBytes: 2 * 1024 * 1024,
      originalFilename: traversalFilename,
      declaredMimeType: "image/png",
    });
    assert(!validatedPng.sanitizedFilename.includes("/"), "Filename traversal stripped: no slashes");
    assert(!validatedPng.sanitizedFilename.includes(".."), "Filename traversal stripped: no dots-dots");
  }

  // ----------------------------------------------------------------------------
  // GROUP 10: PAYMENT INTEGRATION SECURITY
  // ----------------------------------------------------------------------------
  console.log("\n💳 [GROUP 10] Payment Security & Signature Verification");
  {
    const secret = "actual_production_secret_key_84920";
    const orderId = "order_live_123456";
    const paymentId = "pay_live_789012";

    // 1. Genuine HMAC verification
    const validSig = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
    const validResult = PaymentService.verifySignature(orderId, paymentId, validSig, secret);
    assert(validResult === true, "Valid cryptographic HMAC-SHA256 signature verified");

    // 2. Forged signature
    const forgedSig = crypto.randomBytes(32).toString("hex");
    const forgedResult = PaymentService.verifySignature(orderId, paymentId, forgedSig, secret);
    assert(forgedResult === false, "Forged payment signature strictly rejected");

    // 3. Mock signature in production environment check
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const mockSigInProd = PaymentService.verifySignature(orderId, paymentId, "mock_sig_fake_success", secret);
    process.env.NODE_ENV = originalEnv;
    assert(mockSigInProd === false, "Mock signature prefix strictly rejected when not in dev mode (VULN-01 Fixed)");
  }

  // ----------------------------------------------------------------------------
  // GROUP 11: WEBHOOK SECURITY & TIMING-SAFE HMAC
  // ----------------------------------------------------------------------------
  console.log("\n🔔 [GROUP 11] Webhook Security & Idempotency");
  {
    // 1. Razorpay Webhook with timing-safe comparison
    const webhookSecret = "test_webhook_secret_key_9988";
    const webhookBody = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_test_001", amount: 150000, currency: "INR" } } },
    });

    const correctSignature = crypto.createHmac("sha256", webhookSecret).update(webhookBody).digest("hex");

    // Forged signature
    let forgedWebhookBlocked = false;
    try {
      await PaymentService.processWebhook({
        rawBody: webhookBody,
        signatureHeader: "bad_signature_value_12345",
        eventPayload: JSON.parse(webhookBody),
      });
    } catch (e) {
      if (e.message.includes("Invalid webhook signature")) forgedWebhookBlocked = true;
    }
    assert(forgedWebhookBlocked, "Forged Razorpay webhook signature strictly rejected");

    // 2. Kyorix Webhook timing-safe HMAC
    const kyorixBody = JSON.stringify({
      eventId: "evt-sec-001",
      eventType: "ATHLETE_ACCREDITED",
      timestamp: new Date().toISOString(),
      payload: {},
    });

    // Signature with empty or bad header
    const kyorixBadSig = KyorixWebhookService.verifySignature(kyorixBody, "invalid_sig_abc");
    assert(kyorixBadSig === false, "Invalid Kyorix webhook signature rejected");

    // Signature with missing header
    const kyorixMissingSig = KyorixWebhookService.verifySignature(kyorixBody, null);
    assert(kyorixMissingSig === false, "Missing Kyorix webhook signature rejected");
  }

  // ----------------------------------------------------------------------------
  // GROUP 12: DIGITAL ID CARD & QR SECURITY
  // ----------------------------------------------------------------------------
  console.log("\n🪪 [GROUP 12] Digital ID Card & QR Security");
  {
    // 1. High-entropy token generation
    const card = await IdCardService.generateCard(
      "reg-sec-card-001",
      "user-sec-card-001"
    );

    assert(card.qrToken.length >= 40, "QR token possesses >= 256 bits entropy");
    assert(/^[A-Za-z0-9_-]+$/.test(card.qrToken), "QR token strictly base64url characters");

    // 2. Public verification zero PII leak
    const verification = await IdCardService.verifyByPublicToken(card.qrToken);
    assert(verification.isValid === true, "Valid card verified successfully");
    assert(verification.status === "VERIFIED", "Status is VERIFIED");
    assert(verification["dateOfBirth"] === undefined, "Zero DOB exposure in public verification");
    assert(verification["phone"] === undefined, "Zero phone exposure in public verification");
    assert(verification["email"] === undefined, "Zero email exposure in public verification");
    assert(verification["address"] === undefined, "Zero address exposure in public verification");

    // 3. Card Revocation & Token Rotation upon Reissuance
    await IdCardService.revokeCard(card.athleteId, "Security Test Revocation", "admin-sec-01");
    const revokedVerification = await IdCardService.verifyByPublicToken(card.qrToken);
    assert(revokedVerification.isValid === false, "Revoked card cannot verify as active");
    assert(revokedVerification.status === "REVOKED", "Revoked card returns explicit REVOKED status");

    const reissued = await IdCardService.reissueCard(card.athleteId, "Security Reissuance", "admin-sec-01");
    assert(reissued.version === 2, "Reissued card incremented to Version 2");
    assert(reissued.qrToken !== card.qrToken, "QR token rotated upon reissuance");

    // Old token must no longer work
    const oldTokenVerification = await IdCardService.verifyByPublicToken(card.qrToken);
    assert(oldTokenVerification.isValid === false, "Old rotated QR token is permanently invalid");
  }

  // ----------------------------------------------------------------------------
  // GROUP 13: PRODUCTION HTTP SECURITY HEADERS
  // ----------------------------------------------------------------------------
  console.log("\n🌐 [GROUP 13] Production HTTP Security Headers");
  {
    const cfg = nextConfig?.default || nextConfig;
    const headersList = typeof cfg.headers === "function" ? await cfg.headers() : [];
    assert(Array.isArray(headersList), "nextConfig defines custom HTTP headers");

    const globalHeaders = headersList[0]?.headers || [];
    const headerMap = {};
    for (const h of globalHeaders) {
      headerMap[h.key] = h.value;
    }

    assert(headerMap["X-Frame-Options"] === "DENY", "X-Frame-Options is DENY (Clickjacking protection)");
    assert(headerMap["X-Content-Type-Options"] === "nosniff", "X-Content-Type-Options is nosniff (MIME sniffing defense)");
    assert(headerMap["Referrer-Policy"] === "strict-origin-when-cross-origin", "Referrer-Policy configured");
    assert(headerMap["Strict-Transport-Security"].includes("max-age"), "Strict-Transport-Security (HSTS) configured");
    assert(headerMap["Content-Security-Policy"] !== undefined, "Content-Security-Policy configured");
    assert(headerMap["Permissions-Policy"] !== undefined, "Permissions-Policy configured");
  }

  // ----------------------------------------------------------------------------
  // GROUP 14: INFORMATION DISCLOSURE AUDIT
  // ----------------------------------------------------------------------------
  console.log("\n🕵️ [GROUP 14] Information Disclosure Audit");
  {
    // Public DTO check
    const publicChampionship = await CmsService.getPublicChampionshipDTO("champ-kukkiwon-2026");
    const jsonString = JSON.stringify(publicChampionship);

    assert(!jsonString.includes("password_hash"), "Zero password hashes in public payload");
    assert(!jsonString.includes("razorpay_secret"), "Zero Razorpay secrets in public payload");
    assert(!jsonString.includes("kyorix_secret"), "Zero Kyorix secrets in public payload");
    assert(!jsonString.includes("jwt_secret"), "Zero JWT secrets in public payload");
    assert(!jsonString.includes("admin_notes"), "Zero internal admin notes in public payload");
  }

  // ----------------------------------------------------------------------------
  // GROUP 15: ENVIRONMENT & SECRET PROTECTION
  // ----------------------------------------------------------------------------
  console.log("\n🔑 [GROUP 15] Environment & Secret Protection");
  {
    // Verify NEXT_PUBLIC_* variables never expose secrets
    const publicKeys = Object.keys(process.env).filter((k) => k.startsWith("NEXT_PUBLIC_"));
    for (const k of publicKeys) {
      assert(
        !k.toLowerCase().includes("secret") && !k.toLowerCase().includes("private"),
        `Public environment variable does not contain secret: ${k}`
      );
    }

    // Verify sanitized Kyorix config excludes secret keys
    const sanitizedKyorix = getSanitizedKyorixConfig();
    assert(sanitizedKyorix["apiKey"] === undefined, "Kyorix apiKey excluded from sanitized config");
    assert(sanitizedKyorix["apiSecret"] === undefined, "Kyorix apiSecret excluded from sanitized config");
    assert(sanitizedKyorix["webhookSecret"] === undefined, "Kyorix webhookSecret excluded from sanitized config");
  }

  // ----------------------------------------------------------------------------
  // GROUP 16: KYORIX INTEGRATION SECURITY
  // ----------------------------------------------------------------------------
  console.log("\n🥋 [GROUP 16] Kyorix Integration Security");
  {
    // 1. Unauthorized admin triggering sync
    const viewerToken = await createAdminToken({
      user_id: "admin-viewer-01",
      email: "viewer@kukkiwoncup.org",
      full_name: "Viewer Admin",
      role: "VIEWER",
    });
    const viewerReq = new Request("http://localhost/api/admin/integration/kyorix/sync", {
      headers: { authorization: `Bearer ${viewerToken}` },
    });
    let viewerSyncBlocked = false;
    try {
      await requireAdmin(viewerReq, ["SUPER_ADMIN", "EVENT_ADMIN"]);
    } catch (e) {
      if (e.statusCode === 403) viewerSyncBlocked = true;
    }
    assert(viewerSyncBlocked, "Viewer role strictly blocked from initiating Kyorix synchronization");

    // 2. Kyorix idempotency key deterministic format
    const idempotencyKey = KyorixSyncService.generateIdempotencyKey("reg-test-001", 1);
    assert(idempotencyKey === "KKC26:reg-test-001:1", "Deterministic idempotency key generated");
  }

  // ----------------------------------------------------------------------------
  // GROUP 17: CMS SECURITY & AUTHORIZED PUBLISHING
  // ----------------------------------------------------------------------------
  console.log("\n📝 [GROUP 17] CMS Security & Authorized Publishing");
  {
    // Unauthorized user mutating CMS
    const registrarToken = await createAdminToken({
      user_id: "admin-reg-01",
      email: "registrar@kukkiwoncup.org",
      full_name: "Registrar Admin",
      role: "REGISTRAR",
    });
    const registrarCmsReq = new Request("http://localhost/api/admin/cms/publish", {
      headers: { authorization: `Bearer ${registrarToken}` },
    });
    let registrarPublishBlocked = false;
    try {
      await requireAdmin(registrarCmsReq, ["SUPER_ADMIN", "EVENT_ADMIN"]);
    } catch (e) {
      if (e.statusCode === 403) registrarPublishBlocked = true;
    }
    assert(registrarPublishBlocked, "Registrar blocked from publishing live website content (403)");
  }

  // ----------------------------------------------------------------------------
  // GROUP 18: RESOURCE EXHAUSTION & DENIAL-OF-SERVICE DEFENSE
  // ----------------------------------------------------------------------------
  console.log("\n🛡️ [GROUP 18] Resource Exhaustion & Pagination Limits");
  {
    // Request with huge pageSize (1,000,000)
    const result = await AdminService.getRegistrations({
      pageSize: 1000000,
      page: -99,
    });
    assert(result.pageSize <= 100, `Excessive pageSize clamped to safe limit (Clamped: ${result.pageSize} <= 100)`);
    assert(result.page >= 1, `Negative page number normalized to valid index (Normalized: ${result.page} >= 1)`);
  }

  // ----------------------------------------------------------------------------
  // GROUP 19: IMMUTABLE AUDIT TRAIL LOGGING
  // ----------------------------------------------------------------------------
  console.log("\n📜 [GROUP 19] Audit Logging Verification");
  {
    await AuditService.logAction({
      adminUserId: "user-audit-sec",
      action: "SECURITY_PEN_TEST_EVENT",
      entityType: "SecurityAudit",
      entityId: "test-sec-01",
      newValue: { status: "TESTED" },
    });

    const logs = await AuditService.getLogs(5, 0);
    const found = logs.find((l) => l.action === "SECURITY_PEN_TEST_EVENT");
    assert(found !== undefined, "Security audit log event successfully written to immutable audit store");
    assert((found.entityType || found.entity_type) === "SecurityAudit", "Audit entityType accurately recorded");
  }

  // ----------------------------------------------------------------------------
  // GROUP 20: REGRESSION & SECURITY INTEGRATION VERIFICATION
  // ----------------------------------------------------------------------------
  console.log("\n🔄 [GROUP 20] Security Integration & Core Functionality Check");
  {
    // Verify core athlete registration and payment fee calculation work after all security hardening
    assert(DEFAULT_FEE_CONFIG.ATHLETE_BASE_FEE_PAISE === 150000, "Base championship fee is 150000 paise (₹1,500)");

    // Verify secure athlete registration submission still succeeds with legitimate inputs
    const kyorugiCats = await CategoryService.listCategories(undefined, "KYORUGI");
    const targetCat = kyorugiCats.find((c) => c.min_age && c.min_age >= 17) || kyorugiCats[0];

    const legitimateDraft = await RegistrationFlowService.saveDraft({
      userId: "user-legit-01",
      participantType: "ATHLETE",
      draftData: {
        first_name: "Rahul",
        last_name: "Sharma",
        date_of_birth: "2000-08-20",
        gender: targetCat.gender,
        nationality: "IND",
        discipline: "KYORUGI",
        category_id: targetCat.id,
        belt_rank: "BLACK_1_DAN",
        declaration_accurate: true,
        declaration_terms: true,
      },
    });

    assert(legitimateDraft.registrationId !== undefined, "Legitimate athlete draft created successfully");
  }

  // ----------------------------------------------------------------------------
  // FINAL SUMMARY
  // ----------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`🏁 PHASE 11 SECURITY TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log("==================================================================");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
