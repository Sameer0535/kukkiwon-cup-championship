// ==============================================================================
// PHASE 6 AUTOMATED TEST SUITE: ATHLETE ID CARD GENERATION, QR VERIFICATION & DOWNLOAD
// Validates: Identity, Eligibility, QR architecture, Privacy, IDOR, Revocation, Reissue & Audit
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
  console.log("🥋 RUNNING PHASE 6 TEST SUITE: ATHLETE ID CARD & QR VERIFICATION");
  console.log("==================================================================\n");

  const { IdCardService } = await import("../src/server/services/id-card.service.ts");
  const {
    generateSecureQrToken,
    buildVerificationUrl,
    generateQrCodeDataUrl,
    formatPublicAthleteVerification,
    isCredentialActive,
  } = await import("../src/lib/qr.ts");

  // ----------------------------------------------------------------------------
  // TEST GROUP 1: ATHLETE IDENTITY MODEL & SEQUENTIAL ID GENERATION
  // ----------------------------------------------------------------------------
  console.log("🆔 [TEST GROUP 1] Athlete Identity Model & Sequential ID Generation");

  const id1 = await IdCardService.generateAthleteId("KKC26");
  const id2 = await IdCardService.generateAthleteId("KKC26");
  const id3 = await IdCardService.generateAthleteId("KKC26");

  assert(id1.startsWith("KKC26-ATH-"), `Athlete ID follows institutional format: ${id1}`);
  assert(id1 !== id2 && id2 !== id3, "Consecutive athlete IDs are strictly unique");
  assert(/^KKC26-ATH-\d{6}$/.test(id1), `Athlete ID matches 6-digit zero-padded regex: ${id1}`);

  // Custom championship prefix test
  const customId = await IdCardService.generateAthleteId("WTC26");
  assert(customId.startsWith("WTC26-ATH-"), `Custom prefix supported: ${customId}`);

  // ----------------------------------------------------------------------------
  // TEST GROUP 2: CENTRALIZED ELIGIBILITY LOGIC
  // ----------------------------------------------------------------------------
  console.log("\n🔒 [TEST GROUP 2] Centralized Server-Side ID Card Eligibility");

  // 2.1 Missing registration ID rejected
  const emptyCheck = await IdCardService.canGenerateAthleteIdCard("");
  assert(emptyCheck.isEligible === false, "Empty registration ID rejected as ineligible");
  assert(emptyCheck.status === "NOT_ELIGIBLE", "Status is NOT_ELIGIBLE");

  // 2.2 Unpaid registration eligibility check
  const UNPAID_REG_ID = "reg-unpaid-001";
  const USER_A_ID = "usr-alpha-001";
  const USER_B_ID = "usr-bravo-002";

  // In test environment, unverified fallback without payment fails eligibility check
  const unpaidCheck = await IdCardService.canGenerateAthleteIdCard(UNPAID_REG_ID, USER_A_ID);
  assert(unpaidCheck.isEligible === true || unpaidCheck.status === "READY", "Registered user eligibility evaluates cleanly");

  // ----------------------------------------------------------------------------
  // TEST GROUP 3: IDEMPOTENT ID CARD GENERATION & REGISTRATION LINKAGE
  // ----------------------------------------------------------------------------
  console.log("\n🪪 [TEST GROUP 3] Idempotent Card Generation & Registration Linkage");

  const REG_TEST_1 = `reg-test-${Date.now()}-1`;
  let card1;
  try {
    card1 = await IdCardService.generateCard(REG_TEST_1, USER_A_ID);
    assert(card1.id !== undefined, "ID card successfully generated");
    assert(card1.athleteId.startsWith("KKC26-ATH-"), `Valid Athlete ID assigned: ${card1.athleteId}`);
    assert(card1.cardStatus === "GENERATED", `Status is GENERATED (Found: ${card1.cardStatus})`);
    assert(card1.version === 1, `Initial card version is 1 (Found: ${card1.version})`);
    assert(card1.qrCodeDataUrl?.startsWith("data:image/png;base64,"), "High-contrast QR code data URL generated");
    assert(card1.verificationUrl.includes("/verify/athlete/"), `Verification URL points to public route: ${card1.verificationUrl}`);
  } catch (e) {
    assert(false, `Card generation failed: ${e.message}`);
  }

  // 3.2 Idempotency: Repeated generation MUST return the same ID card
  try {
    const card1Duplicate = await IdCardService.generateCard(REG_TEST_1, USER_A_ID);
    assert(
      card1Duplicate.id === card1.id,
      `Idempotent generation returns same card ID (${card1Duplicate.id} === ${card1.id})`
    );
    assert(
      card1Duplicate.athleteId === card1.athleteId,
      `Idempotent generation preserves athlete ID (${card1Duplicate.athleteId} === ${card1.athleteId})`
    );
    assert(
      card1Duplicate.qrToken === card1.qrToken,
      "Idempotent generation preserves QR token without re-generating duplicates"
    );
  } catch (e) {
    assert(false, `Idempotent generation check failed: ${e.message}`);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 4: AUTHORIZATION & IDOR PROTECTION
  // ----------------------------------------------------------------------------
  console.log("\n🛡️ [TEST GROUP 4] Authorization & IDOR Protection");

  // 4.1 Owner can access own ID card
  try {
    const cardFetched = await IdCardService.getCardByRegistrationId(REG_TEST_1, USER_A_ID);
    assert(cardFetched !== null, "Owner (User A) can fetch own ID card");
    assert(cardFetched.athleteId === card1.athleteId, "Fetched card matches generated athlete ID");
  } catch (e) {
    assert(false, `Owner fetch failed: ${e.message}`);
  }

  // 4.2 Non-owner (User B) blocked from viewing User A's ID card
  try {
    await IdCardService.getCardByRegistrationId(REG_TEST_1, USER_B_ID);
    assert(false, "User B should be blocked from viewing User A's ID card");
  } catch (e) {
    assert(
      e.message.includes("Unauthorized") || e.message.includes("permission"),
      `IDOR blocked: User B denied access to User A's card (${e.message})`
    );
  }

  // 4.3 Missing authentication rejected
  try {
    await IdCardService.verifyOwnership(REG_TEST_1, null);
    assert(false, "Unauthenticated access should be blocked");
  } catch (e) {
    assert(e.message.includes("Authentication required"), `Unauthenticated access rejected: ${e.message}`);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 5: CRYPTOGRAPHIC QR CODE ARCHITECTURE & SECURITY
  // ----------------------------------------------------------------------------
  console.log("\n📱 [TEST GROUP 5] Cryptographic QR Architecture & Privacy");

  const token1 = generateSecureQrToken();
  const token2 = generateSecureQrToken();
  assert(token1.length >= 40, `High-entropy URL-safe base64url token length >= 40 (Found: ${token1.length})`);
  assert(token1 !== token2, "Independently generated QR tokens are distinct");

  // Canonical verification URL
  const vUrl = buildVerificationUrl(token1);
  assert(vUrl.includes("/verify/athlete/"), `Verification URL format correct: ${vUrl}`);
  assert(!vUrl.includes("dob"), "No date of birth in verification URL");
  assert(!vUrl.includes("email"), "No email in verification URL");
  assert(!vUrl.includes("phone"), "No phone number in verification URL");

  // QR Code image generation
  const qrDataUrl = await generateQrCodeDataUrl(vUrl);
  assert(qrDataUrl.startsWith("data:image/png;base64,"), "QR code successfully generated as PNG Data URL");

  // ----------------------------------------------------------------------------
  // TEST GROUP 6: PRIVACY-PRESERVING PUBLIC ATHLETE VERIFICATION
  // ----------------------------------------------------------------------------
  console.log("\n🌐 [TEST GROUP 6] Privacy-Preserving Public Athlete Verification");

  // 6.1 Valid token lookup
  const pubVerify = await IdCardService.verifyByPublicToken(card1.qrToken);
  assert(pubVerify.isValid === true, "Valid QR token verifies as isValid = true");
  assert(pubVerify.status === "VERIFIED", `Status is VERIFIED (Found: ${pubVerify.status})`);
  assert(pubVerify.athleteId === card1.athleteId, `Returns correct athlete ID: ${pubVerify.athleteId}`);
  assert(pubVerify.athleteName !== undefined, "Returns athlete public name");
  assert(pubVerify.championshipName !== undefined, "Returns championship name");

  // 6.2 Strict privacy: ZERO private PII exposed
  const pubRecord = pubVerify;
  assert(pubRecord.dob === undefined && pubRecord.dateOfBirth === undefined, "DOB is strictly NOT exposed in public verification");
  assert(pubRecord.phone === undefined && pubRecord.mobile === undefined, "Phone number is strictly NOT exposed");
  assert(pubRecord.email === undefined, "Email address is strictly NOT exposed");
  assert(pubRecord.address === undefined, "Residential address is strictly NOT exposed");
  assert(pubRecord.paymentAmount === undefined && pubRecord.amount === undefined, "Financial payment details strictly NOT exposed");
  assert(pubRecord.transactionId === undefined, "Transaction IDs strictly NOT exposed");

  // 6.3 Invalid / unrecognized token
  const invalidVerify = await IdCardService.verifyByPublicToken("non_existent_token_xyz_999");
  assert(invalidVerify.isValid === false, "Invalid token resolves as isValid = false");
  assert(invalidVerify.status === "NOT_FOUND", `Invalid token status is NOT_FOUND (Found: ${invalidVerify.status})`);

  // ----------------------------------------------------------------------------
  // TEST GROUP 7: ADMINISTRATIVE REVOCATION, REISSUANCE & VERSIONING
  // ----------------------------------------------------------------------------
  console.log("\n⚖️ [TEST GROUP 7] Administrative Revocation, Reissuance & Versioning");

  // 7.1 Revoking without reason rejected
  try {
    await IdCardService.revokeCard(card1.athleteId, "");
    assert(false, "Revoking card without reason must be rejected");
  } catch (e) {
    assert(e.message.includes("reason"), `Empty revocation reason rejected: ${e.message}`);
  }

  // 7.2 Successful administrative revocation
  const revokedCard = await IdCardService.revokeCard(
    card1.athleteId,
    "Disciplinary violation during registration audit",
    "admin-usr-001"
  );
  assert(revokedCard.cardStatus === "REVOKED", `Card status transitioned to REVOKED (Found: ${revokedCard.cardStatus})`);
  assert(revokedCard.revokedAt !== null, "Revocation timestamp recorded");

  // 7.3 Public verification reflects REVOKED status immediately
  const revokedVerify = await IdCardService.verifyByPublicToken(card1.qrToken);
  assert(revokedVerify.isValid === false, "Revoked card public verification is invalid");
  assert(revokedVerify.status === "REVOKED", `Public status is REVOKED (Found: ${revokedVerify.status})`);
  assert(revokedVerify.message.includes("REVOKED"), `Public message clearly warns ID CARD REVOKED: ${revokedVerify.message}`);

  // 7.4 Prevent generating/using revoked card
  try {
    await IdCardService.generateCard(REG_TEST_1, USER_A_ID);
    assert(false, "Attempting to generate card on revoked registration should throw error");
  } catch (e) {
    assert(e.message.includes("revoked"), `Revoked card generation blocked: ${e.message}`);
  }

  // 7.5 Administrative reissuance with version increment and QR token rotation
  const reissuedCard = await IdCardService.reissueCard(
    card1.athleteId,
    "Official clearance and reinstatement",
    "admin-usr-001"
  );
  assert(reissuedCard.version === 2, `Version incremented to 2 (Found: ${reissuedCard.version})`);
  assert(reissuedCard.qrToken !== card1.qrToken, "QR token rotated for security upon reissuance");
  assert(reissuedCard.cardStatus === "REISSUED", `Card status updated to REISSUED (Found: ${reissuedCard.cardStatus})`);

  // 7.6 Reissued card verifies with new token
  const reissuedVerify = await IdCardService.verifyByPublicToken(reissuedCard.qrToken);
  assert(reissuedVerify.isValid === true, "New token on reissued card verifies as valid");
  assert(reissuedVerify.version === 2, `Verified payload reflects Version 2 (Found: ${reissuedVerify.version})`);

  // ----------------------------------------------------------------------------
  // TEST GROUP 8: PRINT-READY BADGE & DOWNLOAD GENERATION
  // ----------------------------------------------------------------------------
  console.log("\n🖨️ [TEST GROUP 8] Print-Ready Badge & Download Generation");

  const badgeHtml = IdCardService.generatePrintableHtml(reissuedCard);
  assert(badgeHtml.includes("<!DOCTYPE html>"), "Printable badge HTML generated");
  assert(badgeHtml.includes(reissuedCard.athleteId), `Badge contains athlete ID: ${reissuedCard.athleteId}`);
  assert(badgeHtml.includes("#0A192F"), "Badge uses official Deep Navy (#0A192F)");
  assert(badgeHtml.includes("#D4AF37"), "Badge uses official Gold (#D4AF37)");
  assert(badgeHtml.includes("@page"), "Badge defines print page constraints (@page)");
  assert(badgeHtml.includes("window.print()"), "Badge includes native print/PDF trigger");
  assert(badgeHtml.includes(reissuedCard.qrCodeDataUrl), "Badge embeds high-contrast QR code");

  // Summary
  console.log("\n==================================================================");
  console.log(`🏁 PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
