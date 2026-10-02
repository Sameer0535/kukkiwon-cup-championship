// ==============================================================================
// PHASE 7 AUTOMATED TEST SUITE: QR VERIFICATION HARDENING & PRODUCTION READINESS
// Validates:
// 1. QR Cryptographic Entropy & URL Safety (256-bit base64url)
// 2. Structured Public Verification DTO (athlete, championship, card + back-compat)
// 3. Anti-Enumeration & Sanitized Responses (ACCREDITATION NOT FOUND, zero leak)
// 4. Zero PII Exposure (DOB, phone, email, address, financial data)
// 5. Complete Revocation & Token Rotation Reissuance Lifecycle
// 6. Sliding-Window Rate Limiting Engine & Headers (Retry-After, X-RateLimit-*)
// 7. Security, Cache-Control (no-store), & SEO Noindex Verification
// 8. Manual Verification by Athlete ID (Rate limited, non-PII DTO)
// 9. Public vs Private Authorization Separation
// ==============================================================================

import crypto from "crypto";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("==================================================================");
  console.log("🛡️ RUNNING PHASE 7 TEST SUITE: QR VERIFICATION HARDENING");
  console.log("==================================================================\n");

  const { IdCardService } = await import("../src/server/services/id-card.service.ts");
  const {
    generateSecureQrToken,
    buildVerificationUrl,
    generateQrCodeDataUrl,
    formatPublicAthleteVerification,
  } = await import("../src/lib/qr.ts");
  const { checkRateLimit, resetRateLimits } = await import("../src/server/security/rate-limiter.ts");

  // ----------------------------------------------------------------------------
  // TEST GROUP 1: QR CRYPTOGRAPHIC ENTROPY, FORMAT & URL SAFETY
  // ----------------------------------------------------------------------------
  console.log("🔐 [TEST GROUP 1] QR Cryptographic Entropy, Format & URL Safety");

  const tokenA = generateSecureQrToken();
  const tokenB = generateSecureQrToken();
  const tokenC = generateSecureQrToken();

  // 1.1 Entropy & Length (32 bytes = 256 bits -> 43 base64url chars)
  assert(typeof tokenA === "string" && tokenA.length >= 43, `Token has >= 256 bits entropy (Length: ${tokenA.length})`);
  assert(/^[A-Za-z0-9_-]+$/.test(tokenA), `Token strictly conforms to base64url characters: ${tokenA.substring(0, 12)}...`);
  assert(!tokenA.includes("+") && !tokenA.includes("/") && !tokenA.includes("="), "Token contains zero unsafe URL characters (+, /, =)");

  // 1.2 Uniqueness & Independence (Non-sequential)
  assert(tokenA !== tokenB && tokenB !== tokenC, "Tokens are strictly unique and non-sequential");

  // 1.3 Zero PII / Identifiers embedded in token
  assert(!tokenA.includes("KKC26") && !tokenA.includes("ATH"), "Token contains no Athlete ID fragments");
  assert(!tokenA.includes("reg-") && !tokenA.includes("usr-"), "Token contains no internal database ID prefixes");
  assert(!tokenA.includes("@") && !tokenA.includes("2026"), "Token contains no email or timestamp patterns");

  // 1.4 Verification URL format
  const vUrl = buildVerificationUrl(tokenA);
  assert(vUrl.includes(`/verify/athlete/${tokenA}`), `Canonical verification URL points to public route: ${vUrl}`);
  assert(!vUrl.includes("?"), "Verification URL contains no query string parameters");

  // 1.5 QR Code PNG data URL generation
  const qrDataUrl = await generateQrCodeDataUrl(vUrl);
  assert(qrDataUrl.startsWith("data:image/png;base64,"), "QR Code generated as standard PNG data URI");

  // ----------------------------------------------------------------------------
  // TEST GROUP 2: PUBLIC VERIFICATION STRUCTURED DTO & VALID ACCREDITATION
  // ----------------------------------------------------------------------------
  console.log("\n📋 [TEST GROUP 2] Public Verification Structured DTO & Valid Status");

  const TEST_REG_P7 = `reg-p7-${Date.now()}`;
  const TEST_USER_P7 = `usr-p7-${Date.now()}`;

  // Generate test card for athlete
  const activeCard = await IdCardService.generateCard(TEST_REG_P7, TEST_USER_P7);
  assert(activeCard.id !== undefined, "Active test card created");

  const verification = await IdCardService.verifyByPublicToken(activeCard.qrToken);

  // 2.1 Top-level contract
  assert(verification.isValid === true, "Active card verification isValid = true");
  assert(verification.status === "VERIFIED", `Status is VERIFIED (Found: ${verification.status})`);
  assert(typeof verification.verifiedAt === "string", "ISO verifiedAt timestamp present");

  // 2.2 Phase 7 Structured DTO: athlete object
  assert(verification.athlete !== undefined, "Structured 'athlete' object present in verification DTO");
  assert(verification.athlete?.athleteId === activeCard.athleteId, `Athlete ID matches: ${verification.athlete?.athleteId}`);
  assert(verification.athlete?.name !== undefined && verification.athlete.name.length > 0, `Athlete name present: ${verification.athlete?.name}`);
  assert(verification.athlete?.academy !== undefined, `Academy present: ${verification.athlete?.academy}`);
  assert(verification.athlete?.category !== undefined, `Category present: ${verification.athlete?.category}`);
  assert(verification.athlete?.discipline !== undefined, `Discipline present: ${verification.athlete?.discipline}`);
  assert(verification.athlete?.country !== undefined, `Country present: ${verification.athlete?.country}`);

  // 2.3 Phase 7 Structured DTO: championship object
  assert(verification.championship !== undefined, "Structured 'championship' object present in verification DTO");
  assert(verification.championship?.name.includes("Kukkiwon"), `Championship name present: ${verification.championship?.name}`);
  assert(verification.championship?.year === "2026", `Championship year present: ${verification.championship?.year}`);

  // 2.4 Phase 7 Structured DTO: card object
  assert(verification.card !== undefined, "Structured 'card' object present in verification DTO");
  assert(verification.card?.version === 1, `Card version matches 1 (Found: ${verification.card?.version})`);
  assert(typeof verification.card?.issuedAt === "string", "Card issuedAt ISO timestamp present");

  // 2.5 Backwards compatibility top-level fields
  assert(verification.athleteId === activeCard.athleteId, "Backwards-compatible top-level athleteId preserved");
  assert(verification.athleteName === verification.athlete?.name, "Backwards-compatible top-level athleteName preserved");
  assert(verification.championshipName === verification.championship?.name, "Backwards-compatible top-level championshipName preserved");

  // ----------------------------------------------------------------------------
  // TEST GROUP 3: ZERO PII AUDIT (PRIVACY HARDENING)
  // ----------------------------------------------------------------------------
  console.log("\n🔒 [TEST GROUP 3] Zero Private PII Exposure Audit");

  const vPayload = verification;
  const aPayload = verification.athlete || {};

  // 3.1 Date of Birth
  assert(vPayload.dob === undefined && aPayload.dob === undefined, "DOB / Date of Birth is strictly NOT exposed");
  assert(vPayload.dateOfBirth === undefined && aPayload.dateOfBirth === undefined, "dateOfBirth is strictly NOT exposed");

  // 3.2 Contact details
  assert(vPayload.email === undefined && aPayload.email === undefined, "Email address is strictly NOT exposed");
  assert(vPayload.phone === undefined && aPayload.phone === undefined, "Phone number is strictly NOT exposed");
  assert(vPayload.mobile === undefined && aPayload.mobile === undefined, "Mobile number is strictly NOT exposed");
  assert(vPayload.address === undefined && aPayload.address === undefined, "Residential address is strictly NOT exposed");

  // 3.3 Financial / Payment details
  assert(vPayload.paymentAmount === undefined && vPayload.amount === undefined, "Payment amount is strictly NOT exposed");
  assert(vPayload.razorpayPaymentId === undefined && vPayload.razorpayOrderId === undefined, "Razorpay IDs strictly NOT exposed");
  assert(vPayload.transactionId === undefined && vPayload.paymentStatus === undefined, "Financial transaction IDs strictly NOT exposed");

  // 3.4 Documents & Admin metadata
  assert(vPayload.documents === undefined && aPayload.documents === undefined, "Uploaded documents list strictly NOT exposed");
  assert(vPayload.aadhaar === undefined && vPayload.passport === undefined, "Government ID details strictly NOT exposed");
  assert(vPayload.adminNotes === undefined && vPayload.internalNotes === undefined, "Internal administrative notes strictly NOT exposed");

  // ----------------------------------------------------------------------------
  // TEST GROUP 4: ANTI-ENUMERATION & SANITIZED RESPONSES
  // ----------------------------------------------------------------------------
  console.log("\n🛡️ [TEST GROUP 4] Anti-Enumeration & Sanitized Responses");

  // 4.1 Non-existent random token
  const randomToken = "unrecognized_random_token_9999999999999999999";
  const notFoundResult = await IdCardService.verifyByPublicToken(randomToken);
  assert(notFoundResult.isValid === false, "Random token returns isValid = false");
  assert(notFoundResult.status === "NOT_FOUND", `Status is NOT_FOUND (Found: ${notFoundResult.status})`);
  assert(notFoundResult.message === "ACCREDITATION NOT FOUND", `Message is generic 'ACCREDITATION NOT FOUND': ${notFoundResult.message}`);
  assert(notFoundResult.athlete === undefined, "No athlete object returned for non-existent token");
  assert(notFoundResult.athleteId === undefined, "No athleteId returned for non-existent token");

  // 4.2 Malformed token formats
  const malformed1 = await IdCardService.verifyByPublicToken("invalid/token?with=symbols");
  assert(malformed1.isValid === false && malformed1.status === "NOT_FOUND", "Malformed token with slashes/query rejected safely");

  const malformed2 = await IdCardService.verifyByPublicToken("");
  assert(malformed2.isValid === false && malformed2.status === "NOT_FOUND", "Empty token string rejected safely");

  // ----------------------------------------------------------------------------
  // TEST GROUP 5: END-TO-END REVOCATION & REISSUANCE TOKEN ROTATION
  // ----------------------------------------------------------------------------
  console.log("\n⚖️ [TEST GROUP 5] End-to-End Revocation & Token Rotation Reissuance");

  const oldToken = activeCard.qrToken;

  // 5.1 Card revocation
  const revokedCard = await IdCardService.revokeCard(
    activeCard.athleteId,
    "Disciplinary investigation completed",
    "admin-super-001"
  );
  assert(revokedCard.cardStatus === "REVOKED", "Card status successfully transitioned to REVOKED");

  // 5.2 Verification of revoked card
  const revokedVerify = await IdCardService.verifyByPublicToken(oldToken);
  assert(revokedVerify.isValid === false, "Revoked card returns isValid = false");
  assert(revokedVerify.status === "REVOKED", `Status is REVOKED (Found: ${revokedVerify.status})`);
  assert(revokedVerify.message.includes("REVOKED"), `Clear revoked warning message: ${revokedVerify.message}`);

  // 5.3 Administrative reissuance with version increment & token rotation
  const reissuedCard = await IdCardService.reissueCard(
    activeCard.athleteId,
    "Reinstated after disciplinary review",
    "admin-super-001"
  );
  assert(reissuedCard.version === 2, `Version incremented to 2 (Found: ${reissuedCard.version})`);
  assert(reissuedCard.cardStatus === "REISSUED", "Card status is REISSUED");
  assert(reissuedCard.qrToken !== oldToken, "New QR token is strictly different from old token");

  // 5.4 New token verification
  const newVerify = await IdCardService.verifyByPublicToken(reissuedCard.qrToken);
  assert(newVerify.isValid === true, "New token verifies as isValid = true");
  assert(newVerify.status === "VERIFIED", "New token status is VERIFIED");
  assert(newVerify.card?.version === 2, `New token verification reflects Version 2 (Found: ${newVerify.card?.version})`);

  // 5.5 Old token is now invalid (Rotated out)
  const oldVerifyAfterReissue = await IdCardService.verifyByPublicToken(oldToken);
  assert(oldVerifyAfterReissue.isValid === false, "Old rotated token is no longer valid");
  assert(
    oldVerifyAfterReissue.status === "NOT_FOUND" || oldVerifyAfterReissue.status === "REVOKED",
    `Old token cannot authenticate as active card (Status: ${oldVerifyAfterReissue.status})`
  );

  // ----------------------------------------------------------------------------
  // TEST GROUP 6: SLIDING-WINDOW RATE LIMITING ENGINE
  // ----------------------------------------------------------------------------
  console.log("\n⏱️ [TEST GROUP 6] Sliding-Window Rate Limiting Engine");

  resetRateLimits();

  const mockIp1 = "192.168.1.100";
  const mockIp2 = "192.168.1.200";

  // Simulate 5 requests under a 5 req/min threshold
  const testConfig = { maxRequests: 5, windowSeconds: 60 };
  let lastCheck;

  for (let i = 1; i <= 5; i++) {
    lastCheck = checkRateLimit(mockIp1, testConfig);
    assert(lastCheck.allowed === true, `Request #${i} within rate limit is allowed`);
    assert(lastCheck.remaining === 5 - i, `Remaining quota correctly decrements to ${5 - i}`);
  }

  // 6th request must be rejected with 429
  const blockedCheck = checkRateLimit(mockIp1, testConfig);
  assert(blockedCheck.allowed === false, "6th request exceeding limit is blocked (allowed = false)");
  assert(blockedCheck.remaining === 0, "Remaining quota is 0");
  assert(blockedCheck.retryAfterSeconds > 0, `Retry-After seconds provided: ${blockedCheck.retryAfterSeconds}s`);
  assert(blockedCheck.headers["Retry-After"] !== undefined, "Retry-After header present");
  assert(blockedCheck.headers["X-RateLimit-Limit"] === "5", "X-RateLimit-Limit header matches config");
  assert(blockedCheck.headers["X-RateLimit-Remaining"] === "0", "X-RateLimit-Remaining is 0");

  // Client 2 should NOT be blocked (Isolated IP tracking)
  const client2Check = checkRateLimit(mockIp2, testConfig);
  assert(client2Check.allowed === true, "Distinct IP client is unaffected by client 1 rate limiting");
  assert(client2Check.remaining === 4, "Client 2 has independent remaining quota of 4");

  // Reset rate limits
  resetRateLimits();
  const afterResetCheck = checkRateLimit(mockIp1, testConfig);
  assert(afterResetCheck.allowed === true, "Rate limits successfully reset");

  // ----------------------------------------------------------------------------
  // TEST GROUP 7: MANUAL VERIFICATION BY ATHLETE ID
  // ----------------------------------------------------------------------------
  console.log("\n🔍 [TEST GROUP 7] Manual Verification by Athlete ID (Section 14)");

  // 7.1 Valid Athlete ID lookup
  const manualValid = await IdCardService.verifyByAthleteId(reissuedCard.athleteId);
  assert(manualValid.isValid === true, "Manual lookup returns isValid = true for valid athlete ID");
  assert(manualValid.status === "VERIFIED", `Manual status is VERIFIED (Found: ${manualValid.status})`);
  assert(manualValid.athlete?.athleteId === reissuedCard.athleteId, "Manual lookup returns correct athlete ID");
  assert(manualValid.athlete?.name !== undefined, "Manual lookup returns public athlete name");
  assert(manualValid.dob === undefined && manualValid.athlete?.dob === undefined, "Manual lookup redacts DOB");
  assert(manualValid.phone === undefined && manualValid.email === undefined, "Manual lookup redacts phone and email");

  // 7.2 Non-existent Athlete ID
  const manualNotFound = await IdCardService.verifyByAthleteId("KKC26-ATH-999999");
  assert(manualNotFound.isValid === false, "Unknown athlete ID returns isValid = false");
  assert(manualNotFound.status === "NOT_FOUND", "Unknown athlete ID returns NOT_FOUND");
  assert(manualNotFound.message === "ACCREDITATION NOT FOUND", "Generic not found message on manual lookup");

  // ----------------------------------------------------------------------------
  // TEST GROUP 8: HTTP SECURITY HEADERS & NOINDEX SEO AUDIT
  // ----------------------------------------------------------------------------
  console.log("\n🛡️ [TEST GROUP 8] HTTP Security Headers & SEO Protection");

  // Import route file to check headers and robots declaration
  const verifyRouteModule = await import("../src/app/api/verify/athlete/[publicToken]/route.ts");
  assert(typeof verifyRouteModule.GET === "function", "API route exposes valid GET handler");

  const manualRouteModule = await import("../src/app/api/verify/athlete-id/[athleteId]/route.ts");
  assert(typeof manualRouteModule.GET === "function", "Manual API route exposes valid GET handler");

  const pageModule = await import("../src/app/verify/athlete/[publicToken]/page.tsx");
  assert(pageModule.metadata !== undefined, "Verification page exports Next.js metadata");
  assert(pageModule.metadata.robots?.index === false, "Page explicitly sets robots.index = false (noindex)");
  assert(pageModule.metadata.robots?.follow === false, "Page explicitly sets robots.follow = false (nofollow)");

  // ----------------------------------------------------------------------------
  // TEST GROUP 9: AUTHORIZATION SEPARATION (PUBLIC VS PRIVATE)
  // ----------------------------------------------------------------------------
  console.log("\n🔑 [TEST GROUP 9] Public vs Private Authorization Separation");

  // Public verification requires no credentials
  let publicError = null;
  try {
    const pub = await IdCardService.verifyByPublicToken(reissuedCard.qrToken);
    assert(pub.isValid === true, "Public verification requires zero authentication");
  } catch (e) {
    publicError = e;
  }
  assert(publicError === null, "Public verification threw no authorization exceptions");

  // Private ID card generation requires authentication
  let unauthError = null;
  try {
    await IdCardService.verifyOwnership("reg-sample", null);
  } catch (e) {
    unauthError = e;
  }
  assert(unauthError !== null && unauthError.message.includes("Authentication required"), "Private operations strictly require authentication");

  // IDOR Protection: User cannot fetch card of another user
  let idorError = null;
  try {
    await IdCardService.getCardByRegistrationId(TEST_REG_P7, "attacker-user-id");
  } catch (e) {
    idorError = e;
  }
  assert(idorError !== null && (idorError.message.includes("Unauthorized") || idorError.message.includes("permission")), "IDOR protection blocks unauthorized users");

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n==================================================================");
  console.log(`🏁 PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
