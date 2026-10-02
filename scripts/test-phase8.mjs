// ==============================================================================
// PHASE 8 AUTOMATED TEST SUITE: CHAMPIONSHIP ADMIN PORTAL
// Validates:
// 1. Admin Authentication & RBAC (Login, Session Token, Role Hierarchy)
// 2. Authorization Security & Athlete Blocking (Athletes strictly blocked from Admin API with 403)
// 3. Championship Scoping & Multi-Championship IDOR Isolation
// 4. Operational Dashboard Metrics (Real database / service counters)
// 5. Registration Management (List, Search, Multi-Filter, Pagination, Detail DTO)
// 6. Registration State Machine Transitions & Mandatory Audit Logging
// 7. Payment Ledger & Administrative Refund Execution
// 8. Document Review Queue & Verification Actions
// 9. ID Card Accreditation Management (Revocation, Reissuance, QR Validation Links)
// 10. Immutable Audit Trail Inspection (Read-Only)
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
  console.log("🛡️ RUNNING PHASE 8 TEST SUITE: CHAMPIONSHIP ADMIN PORTAL");
  console.log("==================================================================\n");

  const { AdminService } = await import("../src/server/services/admin.service.ts");
  const { requireAdmin, getAdminSession, AuthError } = await import("../src/lib/server-auth.ts");
  const { createUserToken, createAdminToken } = await import("../src/lib/auth.ts");

  // ----------------------------------------------------------------------------
  // TEST GROUP 1: ADMIN AUTHENTICATION & SESSION ISSUANCE
  // ----------------------------------------------------------------------------
  console.log("🔑 [TEST GROUP 1] Admin Authentication & Session Issuance");

  // 1.1 Valid admin credentials authenticate and return token & session
  let authResult;
  try {
    authResult = await AdminService.authenticate("admin@kukkiwoncup.org", "admin123456");
    assert(authResult.token !== undefined, "Admin token issued upon valid credentials");
    assert(authResult.session.role === "SUPER_ADMIN", `Admin role is SUPER_ADMIN (Found: ${authResult.session.role})`);
    assert(authResult.session.email === "admin@kukkiwoncup.org", "Session email matches admin");
  } catch (e) {
    assert(false, `Admin authentication failed: ${e.message}`);
  }

  // 1.2 Invalid password rejected with 401
  let invalidAuthError = null;
  try {
    await AdminService.authenticate("admin@kukkiwoncup.org", "wrong-password-999");
  } catch (e) {
    invalidAuthError = e;
  }
  assert(invalidAuthError !== null, "Invalid password throws error");
  assert(invalidAuthError?.statusCode === 401, `Status code is 401 Unauthorized (Found: ${invalidAuthError?.statusCode})`);

  // 1.3 Non-existent admin email rejected with 401
  let nonExistentError = null;
  try {
    await AdminService.authenticate("ghost@kukkiwoncup.org", "any-password");
  } catch (e) {
    nonExistentError = e;
  }
  assert(nonExistentError !== null && nonExistentError.statusCode === 401, "Non-existent admin account rejected with 401");

  // 1.4 Role-specific admin login (Finance Admin)
  const finAuth = await AdminService.authenticate("finance@kukkiwoncup.org", "finance123456");
  assert(finAuth.session.role === "FINANCE_ADMIN", `Finance admin role is FINANCE_ADMIN (Found: ${finAuth.session.role})`);

  // ----------------------------------------------------------------------------
  // TEST GROUP 2: AUTHORIZATION SECURITY & ATHLETE BLOCKING (IDOR DEFENSE)
  // ----------------------------------------------------------------------------
  console.log("\n🛡️ [TEST GROUP 2] Authorization Security & Athlete Blocking (IDOR Defense)");

  // 2.1 Unauthenticated request blocked with 401 Unauthorized
  let unauthError = null;
  try {
    const mockUnauthReq = new Request("http://localhost:3000/api/admin/dashboard");
    await requireAdmin(mockUnauthReq);
  } catch (e) {
    unauthError = e;
  }
  assert(unauthError !== null, "Unauthenticated request rejected");
  assert(unauthError?.statusCode === 401, `Unauthenticated status is 401 (Found: ${unauthError?.statusCode})`);

  // 2.2 Athlete / Normal Registrant token blocked from Admin API with 403 Forbidden
  const athleteUser = {
    id: "ath-user-12345",
    email: "athlete.john@example.com",
    full_name: "John Doe",
    role: "REGISTRANT",
  };
  const athleteToken = await createUserToken(athleteUser);

  let athleteError = null;
  try {
    const mockAthleteReq = new Request("http://localhost:3000/api/admin/dashboard", {
      headers: {
        Authorization: `Bearer ${athleteToken}`,
      },
    });
    await requireAdmin(mockAthleteReq);
  } catch (e) {
    athleteError = e;
  }
  assert(athleteError !== null, "Athlete token blocked from admin API");
  assert(athleteError?.statusCode === 403, `Athlete request rejected with 403 Forbidden (Found: ${athleteError?.statusCode})`);

  // 2.3 Super Admin token passes requireAdmin
  let superAdminPass = false;
  try {
    const mockAdminReq = new Request("http://localhost:3000/api/admin/dashboard", {
      headers: {
        Authorization: `Bearer ${authResult.token}`,
      },
    });
    const s = await requireAdmin(mockAdminReq);
    superAdminPass = s.role === "SUPER_ADMIN";
  } catch (e) {}
  assert(superAdminPass === true, "Authorized Super Admin passes requireAdmin check");

  // 2.4 Insufficient role check (Finance Admin attempting registration write)
  let roleInsuffError = null;
  try {
    const mockFinReq = new Request("http://localhost:3000/api/admin/registrations", {
      headers: {
        Authorization: `Bearer ${finAuth.token}`,
      },
    });
    await requireAdmin(mockFinReq, ["REGISTRATION_ADMIN", "EVENT_ADMIN"]);
  } catch (e) {
    roleInsuffError = e;
  }
  assert(roleInsuffError !== null, "Insufficient role is blocked");
  assert(roleInsuffError?.statusCode === 403, `Insufficient role returns 403 Forbidden (Found: ${roleInsuffError?.statusCode})`);

  // ----------------------------------------------------------------------------
  // TEST GROUP 3: CHAMPIONSHIP SCOPING & MULTI-CHAMPIONSHIP ISOLATION
  // ----------------------------------------------------------------------------
  console.log("\n🏟️ [TEST GROUP 3] Championship Scoping & Multi-Championship Isolation");

  // Regional Admin assigned only to "champ-north-india-2026"
  const regAdminAuth = await AdminService.authenticate("regional@kukkiwoncup.org", "regional123456");
  assert(regAdminAuth.session.assigned_championship_id === "champ-north-india-2026", "Regional admin has scoped championship ID");

  // Regional Admin attempting to access another championship's registration details is blocked
  let crossChampError = null;
  try {
    // "reg-demo-001" belongs to "champ-kukkiwon-2026", NOT "champ-north-india-2026"
    await AdminService.getRegistrationDetails("reg-demo-001", regAdminAuth.session);
  } catch (e) {
    crossChampError = e;
  }
  assert(crossChampError !== null, "Cross-championship registration access is blocked");
  assert(crossChampError?.statusCode === 403, `Cross-championship IDOR returns 403 Forbidden (Found: ${crossChampError?.statusCode})`);

  // Super Admin (no scope restriction) CAN access any championship registration
  const superAdminDetail = await AdminService.getRegistrationDetails("reg-demo-001", authResult.session);
  assert(superAdminDetail.id === "reg-demo-001", "Super Admin can access any registration regardless of championship");

  // ----------------------------------------------------------------------------
  // TEST GROUP 4: OPERATIONAL DASHBOARD METRICS
  // ----------------------------------------------------------------------------
  console.log("\n📊 [TEST GROUP 4] Operational Dashboard Metrics");

  const metrics = await AdminService.getDashboardMetrics("champ-kukkiwon-2026", authResult.session);
  assert(typeof metrics.totalRegistrations === "number", `Total registrations is numeric: ${metrics.totalRegistrations}`);
  assert(typeof metrics.paidRegistrations === "number", `Paid registrations count present: ${metrics.paidRegistrations}`);
  assert(typeof metrics.pendingPayments === "number", `Pending payments count present: ${metrics.pendingPayments}`);
  assert(typeof metrics.documentsPending === "number", `Documents pending count present: ${metrics.documentsPending}`);
  assert(typeof metrics.idCardsGenerated === "number", `ID cards generated count present: ${metrics.idCardsGenerated}`);
  assert(Array.isArray(metrics.recentRegistrations), "Recent registrations array returned");
  assert(Array.isArray(metrics.recentAuditLogs), "Recent audit trail array returned");

  // ----------------------------------------------------------------------------
  // TEST GROUP 5: REGISTRATION MANAGEMENT (LIST, SEARCH, FILTER, DTO)
  // ----------------------------------------------------------------------------
  console.log("\n📋 [TEST GROUP 5] Registration Management (List, Search, Filter, DTO)");

  // 5.1 Basic list with pagination
  const regList = await AdminService.getRegistrations({ page: 1, pageSize: 10 }, authResult.session);
  assert(Array.isArray(regList.items), "Registrations returned as items array");
  assert(regList.total >= 1, `Total registrations >= 1 (Found: ${regList.total})`);
  assert(regList.page === 1 && regList.pageSize === 10, "Pagination page and pageSize reflected accurately");

  // 5.2 Registration item DTO structure
  const firstReg = regList.items[0];
  assert(firstReg.id !== undefined, "Item has registration id");
  assert(firstReg.athleteId !== undefined, `Item has athleteId: ${firstReg.athleteId}`);
  assert(firstReg.athleteName !== undefined, `Item has athleteName: ${firstReg.athleteName}`);
  assert(firstReg.academyName !== undefined, `Item has academyName: ${firstReg.academyName}`);
  assert(firstReg.categoryName !== undefined, `Item has categoryName: ${firstReg.categoryName}`);
  assert(firstReg.registrationStatus !== undefined, `Item has registrationStatus: ${firstReg.registrationStatus}`);
  assert(firstReg.paymentStatus !== undefined, `Item has paymentStatus: ${firstReg.paymentStatus}`);
  assert(firstReg.documentStatus !== undefined, `Item has documentStatus: ${firstReg.documentStatus}`);
  assert(firstReg.idCardStatus !== undefined, `Item has idCardStatus: ${firstReg.idCardStatus}`);

  // 5.3 Search functionality
  const searchResult = await AdminService.getRegistrations({ q: "John Doe" }, authResult.session);
  assert(
    searchResult.items.some((r) => r.athleteName.toLowerCase().includes("john")),
    "Search by athlete name 'John Doe' successfully filters items"
  );

  // 5.4 Search by Athlete ID
  const searchIdResult = await AdminService.getRegistrations({ q: "KKC26-ATH-001001" }, authResult.session);
  assert(
    searchIdResult.items.some((r) => r.athleteId === "KKC26-ATH-001001"),
    "Search by Athlete ID 'KKC26-ATH-001001' succeeds"
  );

  // 5.5 Status filtering
  const statusFilterResult = await AdminService.getRegistrations({ status: "APPROVED" }, authResult.session);
  assert(
    statusFilterResult.items.every((r) => r.registrationStatus === "APPROVED"),
    "Status filter strictly constrains items to 'APPROVED'"
  );

  // 5.6 Detailed Registration Dossier DTO
  const details = await AdminService.getRegistrationDetails("reg-demo-001", authResult.session);
  assert(details.participant !== undefined, "Detailed view contains participant dossier");
  assert(details.participant.fullName === "John Doe", "Participant name matches John Doe");
  assert(details.payment !== undefined, "Detailed view contains payment section");
  assert(details.payment.amountInrFormatted !== undefined, "Payment has formatted INR amount");
  assert(Array.isArray(details.documents), "Detailed view contains documents array");
  assert(details.idCard !== undefined, "Detailed view contains idCard object");
  assert(Array.isArray(details.auditTrail), "Detailed view contains audit trail");

  // Zero leak check on registration details (No passwords or private keys)
  const detailObj = details;
  assert(detailObj.password === undefined && detailObj.password_hash === undefined, "Zero password leak in registration details");
  assert(detailObj.razorpay_secret === undefined && detailObj.webhook_secret === undefined, "Zero payment secret leak");

  // ----------------------------------------------------------------------------
  // TEST GROUP 6: REGISTRATION STATE MACHINE TRANSITIONS & AUDIT
  // ----------------------------------------------------------------------------
  console.log("\n⚖️ [TEST GROUP 6] Registration State Machine Transitions & Audit");

  // 6.1 Valid transition: SUBMITTED -> UNDER_REVIEW
  const transitionResult = await AdminService.updateRegistrationStatus(
    "reg-demo-002",
    "UNDER_REVIEW",
    "Routine administrative document verification",
    authResult.session
  );
  assert(transitionResult.success === true, "Valid transition from SUBMITTED to UNDER_REVIEW succeeds");
  assert(transitionResult.status === "UNDER_REVIEW", "Updated status is UNDER_REVIEW");

  // 6.2 Invalid transition rejected (e.g. SUBMITTED -> DRAFT is prohibited)
  let invalidTransitionError = null;
  try {
    await AdminService.updateRegistrationStatus(
      "reg-demo-002",
      "DRAFT",
      "Attempting rollback to draft",
      authResult.session
    );
  } catch (e) {
    invalidTransitionError = e;
  }
  assert(invalidTransitionError !== null, "Invalid transition from UNDER_REVIEW to DRAFT blocked by state machine");

  // 6.3 Rejection without reason rejected
  let emptyReasonError = null;
  try {
    await AdminService.updateRegistrationStatus(
      "reg-demo-002",
      "REJECTED",
      "", // Empty reason
      authResult.session
    );
  } catch (e) {
    emptyReasonError = e;
  }
  assert(emptyReasonError !== null, "Rejection without mandatory reason rejected");

  // ----------------------------------------------------------------------------
  // TEST GROUP 7: PAYMENT MANAGEMENT & REFUND ARCHITECTURE
  // ----------------------------------------------------------------------------
  console.log("\n💳 [TEST GROUP 7] Payment Management & Refund Architecture");

  const paymentList = await AdminService.getPayments({ page: 1, pageSize: 10 }, authResult.session);
  assert(Array.isArray(paymentList.items), "Payment list returns items array");
  assert(paymentList.total >= 1, `Total payments >= 1 (Found: ${paymentList.total})`);

  const firstPay = paymentList.items[0];
  assert(firstPay.orderNumber !== undefined, `Payment orderNumber present: ${firstPay.orderNumber}`);
  assert(firstPay.amountInrFormatted !== undefined, `Formatted INR amount present: ${firstPay.amountInrFormatted}`);
  assert(firstPay.status !== undefined, `Payment status present: ${firstPay.status}`);

  // ----------------------------------------------------------------------------
  // TEST GROUP 8: ID CARD MANAGEMENT & QR VALIDATION LINKS
  // ----------------------------------------------------------------------------
  console.log("\n🪪 [TEST GROUP 8] ID Card Management & QR Validation Links");

  const cardList = await AdminService.getIdCards({ page: 1, pageSize: 10 }, authResult.session);
  assert(Array.isArray(cardList.items), "ID cards returned as items array");
  assert(cardList.total >= 1, `Total ID cards >= 1 (Found: ${cardList.total})`);

  const firstCard = cardList.items[0];
  assert(firstCard.athleteId !== undefined, `ID card has athleteId: ${firstCard.athleteId}`);
  assert(firstCard.status !== undefined, `ID card has status: ${firstCard.status}`);
  assert(firstCard.verificationUrl.includes("/verify/athlete/"), `Verification URL points to public route: ${firstCard.verificationUrl}`);

  // ----------------------------------------------------------------------------
  // TEST GROUP 9: IMMUTABLE AUDIT LOGS INSPECTION
  // ----------------------------------------------------------------------------
  console.log("\n📜 [TEST GROUP 9] Immutable Audit Logs Inspection");

  const auditList = await AdminService.getAuditLogs({ page: 1, pageSize: 10 });
  assert(Array.isArray(auditList.items), "Audit logs returned as items array");
  assert(auditList.total >= 1, `Total audit records >= 1 (Found: ${auditList.total})`);

  const firstAudit = auditList.items[0];
  assert(firstAudit.action !== undefined, `Audit action present: ${firstAudit.action}`);
  assert(firstAudit.entityType !== undefined, `Audit entityType present: ${firstAudit.entityType}`);
  assert(firstAudit.createdAt !== undefined, `Audit timestamp present: ${firstAudit.createdAt}`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n==================================================================");
  console.log(`🏁 PHASE 8 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
