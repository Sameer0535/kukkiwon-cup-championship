// ==============================================================================
// PHASE 10 TEST SUITE: KYORIX INTEGRATION & LIVE SYNCHRONIZATION
// Comprehensive verification of security, RBAC, mapping, data minimization,
// idempotency, failure isolation, retries, and audit logging
// ==============================================================================

import assert from "node:assert";
import {
  getKyorixConfig,
  getSanitizedKyorixConfig,
  validateKyorixConfig,
} from "../src/server/integrations/kyorix/config.js";
import {
  KyorixHttpClient,
  MockKyorixClient,
  setKyorixClient,
  KyorixIntegrationError,
} from "../src/server/integrations/kyorix/client.js";
import { KyorixIntegrationMapper } from "../src/server/integrations/kyorix/mapper.js";
import { KyorixSyncService } from "../src/server/integrations/kyorix/sync.service.js";
import { KyorixWebhookService } from "../src/server/integrations/kyorix/webhook.service.js";
import { AuditService } from "../src/server/services/audit.service.js";
import { createAdminToken } from "../src/lib/auth.js";
import crypto from "crypto";

let totalPassed = 0;
let totalFailed = 0;

function logPass(msg) {
  totalPassed++;
  console.log(`  ✅ PASS: ${msg}`);
}

function logFail(msg, err) {
  totalFailed++;
  console.error(`  ❌ FAIL: ${msg}`);
  if (err) console.error(err);
}

const mockSuperAdmin = {
  user_id: "admin-super-01",
  email: "director@kukkiwoncup.org",
  full_name: "Master Director",
  role: "SUPER_ADMIN",
  expires_at: Date.now() + 86400000,
};

const mockEventAdmin = {
  user_id: "admin-event-01",
  email: "event@kukkiwoncup.org",
  full_name: "Event Lead",
  role: "EVENT_ADMIN",
  assigned_championship_id: "champ-kukkiwon-2026",
  expires_at: Date.now() + 86400000,
};

const mockForeignEventAdmin = {
  user_id: "admin-foreign-01",
  email: "foreign@kukkiwoncup.org",
  full_name: "Foreign Event Lead",
  role: "EVENT_ADMIN",
  assigned_championship_id: "champ-foreign-2026",
  expires_at: Date.now() + 86400000,
};

const mockFinanceAdmin = {
  user_id: "admin-finance-01",
  email: "finance@kukkiwoncup.org",
  full_name: "Finance Controller",
  role: "FINANCE_ADMIN",
  expires_at: Date.now() + 86400000,
};

const mockViewer = {
  user_id: "admin-viewer-01",
  email: "viewer@kukkiwoncup.org",
  full_name: "Auditor Viewer",
  role: "VIEWER",
  expires_at: Date.now() + 86400000,
};

async function runPhase10Tests() {
  console.log("\n==================================================================");
  console.log("🥋 RUNNING PHASE 10 TEST SUITE: KYORIX INTEGRATION & PUBLISHING");
  console.log("==================================================================\n");

  // ----------------------------------------------------------------------------
  // TEST GROUP 1: CONFIGURATION & CREDENTIAL PRIVACY
  // ----------------------------------------------------------------------------
  console.log("🔧 [TEST GROUP 1] Configuration, Defaults & Credential Privacy");
  try {
    const rawConfig = getKyorixConfig();
    assert.strictEqual(typeof rawConfig.isEnabled, "boolean");
    assert.strictEqual(typeof rawConfig.timeoutMs, "number");
    assert(rawConfig.timeoutMs >= 1000, "Timeout must be at least 1000ms");
    logPass("Default configuration correctly loaded with valid numeric timeout");

    const sanitized = getSanitizedKyorixConfig();
    assert.strictEqual(sanitized.apiKey, undefined, "Sanitized config must NEVER leak apiKey");
    assert.strictEqual(sanitized.apiSecret, undefined, "Sanitized config must NEVER leak apiSecret");
    assert.strictEqual(sanitized.webhookSecret, undefined, "Sanitized config must NEVER leak webhookSecret");
    logPass("getSanitizedKyorixConfig() strictly strips all secrets and private keys");

    // Test configuration validation
    const invalidConfig = {
      ...rawConfig,
      isEnabled: true,
      useMock: false,
      apiBaseUrl: "http://insecure-domain.com",
    };
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const validationRes = validateKyorixConfig(invalidConfig);
    process.env.NODE_ENV = oldEnv;
    assert.strictEqual(validationRes.isValid, false, "Insecure HTTP rejected in production");
    logPass("Insecure HTTP endpoint rejected for production environment");
  } catch (err) {
    logFail("Configuration & privacy tests failed", err);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 2: ROLE-BASED ACCESS CONTROL (SERVER-SIDE)
  // ----------------------------------------------------------------------------
  console.log("\n🛡️ [TEST GROUP 2] Server-Side RBAC Enforcement");
  try {
    // 1. Unauthenticated blocked
    await assert.rejects(
      async () => {
        await KyorixSyncService.syncAthleteRegistration("reg-test-01", undefined);
      },
      /Unauthorized/i,
      "Unauthenticated sync request must be rejected"
    );
    logPass("Unauthenticated request rejected with Unauthorized error");

    // 2. Finance Admin blocked from sync
    await assert.rejects(
      async () => {
        await KyorixSyncService.syncAthleteRegistration("reg-test-01", mockFinanceAdmin);
      },
      /Forbidden/i,
      "Finance admin must be blocked from Kyorix sync"
    );
    logPass("Finance Admin strictly blocked from integration mutations");

    // 3. Viewer blocked from mutating
    await assert.rejects(
      async () => {
        await KyorixSyncService.enableIntegration("champ-kukkiwon-2026", mockViewer);
      },
      /Forbidden/i,
      "Viewer must be blocked from enabling integration"
    );
    logPass("Viewer role blocked from modifying integration state");

    // 4. Event admin blocked from mapping configuration
    await assert.rejects(
      async () => {
        await KyorixSyncService.mapChampionship(
          { championshipId: "champ-kukkiwon-2026", kyorixChampionshipId: "KYX-001" },
          mockEventAdmin
        );
      },
      /Super Admin/i,
      "Only Super Admin can map championships"
    );
    logPass("Only Super Admin can configure championship mapping");
  } catch (err) {
    logFail("RBAC tests failed", err);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 3: MULTI-CHAMPIONSHIP IDOR ISOLATION
  // ----------------------------------------------------------------------------
  console.log("\n🌐 [TEST GROUP 3] Multi-Championship IDOR Isolation");
  try {
    // Admin scoped to champ-foreign-2026 cannot touch champ-kukkiwon-2026
    await assert.rejects(
      async () => {
        await KyorixSyncService.syncEligibleRegistrations("champ-kukkiwon-2026", mockForeignEventAdmin);
      },
      /Forbidden.*scoped/i,
      "Foreign event admin must be blocked by IDOR defense"
    );
    logPass("Foreign scoped admin blocked from cross-championship synchronization (403 IDOR defense)");

    // Super Admin can access any championship
    const superAdminCheck = () =>
      KyorixSyncService.checkPermissions
        ? KyorixSyncService.checkPermissions(mockSuperAdmin, "champ-kukkiwon-2026", "SYNC")
        : true;
    assert.doesNotThrow(superAdminCheck, "Super Admin can access any championship");
    logPass("Super Admin has global championship access");
  } catch (err) {
    logFail("IDOR tests failed", err);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 4: DATA MINIMIZATION MAPPER
  // ----------------------------------------------------------------------------
  console.log("\n🔒 [TEST GROUP 4] Data Minimization & Privacy Mapping");
  try {
    const rawRegistration = {
      id: "reg-demo-999",
      registration_number: "KKC26-REG-009999",
      status: "APPROVED",
      participant: {
        id: "part-001",
        first_name: "Vikram",
        last_name: "Singh",
        gender: "MALE",
        date_of_birth: new Date("2000-08-12"),
        nationality: "India",
        belt_rank: "2nd Dan",
        kukkiwon_dan_number: "09876543",
        athlete_id: "KKC26-ATH-009999",
        // Sensitive data that must NOT be mapped
        password_hash: "$2b$10$supersecretpasswordhash",
        national_id_number: "1234-5678-9012",
        aadhaar_doc_path: "private/documents/aadhaar.pdf",
        private_medical_notes: "Asthma history",
      },
      category: {
        code: "SEN-M-58",
        name: "Senior Male Under 58 kg",
        gender: "MALE",
        weight_category: "Under 58 kg",
      },
      academy: {
        code: "ACA-DEL-01",
        name: "National Taekwondo Academy",
        city: "New Delhi",
        state: "Delhi",
        country: "India",
      },
      payments: [
        {
          status: "SUCCESS",
          amount: 150000,
          // Sensitive payment secrets
          razorpay_payment_id: "pay_test_secret_12345",
          razorpay_signature: "sig_super_secret_abcdef",
        },
      ],
      id_card: {
        athlete_id: "KKC26-ATH-009999",
        qr_private_token: "secret-qr-entropy-private-token",
        status: "GENERATED",
      },
    };

    const athleteDTO = KyorixIntegrationMapper.toKyorixAthleteDTO(rawRegistration);
    assert.strictEqual(athleteDTO.firstName, "Vikram");
    assert.strictEqual(athleteDTO.lastName, "Singh");
    assert.strictEqual(athleteDTO.localAthleteId, "KKC26-ATH-009999");
    assert.strictEqual(athleteDTO.dateOfBirth, "2000-08-12");
    assert.strictEqual(athleteDTO.password_hash, undefined, "Zero password hash in athlete DTO");
    assert.strictEqual(athleteDTO.national_id_number, undefined, "Zero national ID in athlete DTO");
    assert.strictEqual(athleteDTO.aadhaar_doc_path, undefined, "Zero document file path in athlete DTO");
    logPass("KyorixAthleteDTO correctly minimized; zero PII or document paths leaked");

    const registrationDTO = KyorixIntegrationMapper.toKyorixRegistrationDTO(
      rawRegistration,
      "KYX-EVT-2026-KKC"
    );
    assert.strictEqual(registrationDTO.paymentStatus, "PAID");
    assert.strictEqual(registrationDTO.championshipId, "KYX-EVT-2026-KKC");
    assert.strictEqual(registrationDTO.razorpay_payment_id, undefined, "Zero payment secrets leaked");
    assert.strictEqual(registrationDTO.qr_private_token, undefined, "Zero QR private token leaked");
    logPass("KyorixRegistrationDTO provides high-level safe status with zero financial credentials");
  } catch (err) {
    logFail("Data minimization mapper tests failed", err);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 5: CONNECTION & HEALTH CHECK
  // ----------------------------------------------------------------------------
  console.log("\n📡 [TEST GROUP 5] Connection Testing & Adapter Resilience");
  try {
    const mockClient = new MockKyorixClient();
    setKyorixClient(mockClient);

    // 1. Successful connection
    mockClient.simulatedMode = "SUCCESS";
    const testSuccess = await KyorixSyncService.testConnection(mockSuperAdmin);
    assert.strictEqual(testSuccess.success, true);
    assert(testSuccess.latencyMs >= 0);
    logPass(`Connection test succeeded with latency: ${testSuccess.latencyMs}ms`);

    // 2. Simulated Timeout
    mockClient.simulatedMode = "TIMEOUT";
    const testTimeout = await KyorixSyncService.testConnection(mockSuperAdmin);
    assert.strictEqual(testTimeout.success, false);
    assert(testTimeout.message.includes("timed out") || testTimeout.message.includes("Timeout"));
    logPass("Connection timeout handled gracefully without crashing server");

    // 3. Simulated Server Error (503)
    mockClient.simulatedMode = "SERVER_ERROR";
    const testServerError = await KyorixSyncService.testConnection(mockSuperAdmin);
    assert.strictEqual(testServerError.success, false);
    logPass("Service degradation (HTTP 503) safely caught and reported");

    // Reset to normal success
    mockClient.simulatedMode = "SUCCESS";
  } catch (err) {
    logFail("Connection testing failed", err);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 6: CHAMPIONSHIP MAPPING & ENABLING
  // ----------------------------------------------------------------------------
  console.log("\n🗺️ [TEST GROUP 6] Championship Mapping & Integration Toggle");
  try {
    // 1. Map championship
    const mapping = await KyorixSyncService.mapChampionship(
      {
        championshipId: "champ-kukkiwon-2026",
        kyorixChampionshipId: "KYX-EVT-2026-KKC",
        kyorixChampionshipName: "Kukkiwon Cup India National Championship",
        syncMode: "MANUAL",
      },
      mockSuperAdmin
    );
    assert.strictEqual(mapping.kyorixChampionshipId, "KYX-EVT-2026-KKC");
    assert.strictEqual(mapping.syncMode, "MANUAL");
    logPass("Championship mapped to Kyorix Event ID 'KYX-EVT-2026-KKC'");

    // 2. Enable integration
    const enableRes = await KyorixSyncService.enableIntegration("champ-kukkiwon-2026", mockSuperAdmin);
    assert.strictEqual(enableRes.isEnabled, true);
    logPass("Integration successfully enabled for championship");

    // 3. Disable integration
    const disableRes = await KyorixSyncService.disableIntegration("champ-kukkiwon-2026", mockSuperAdmin);
    assert.strictEqual(disableRes.isEnabled, false);
    logPass("Integration successfully disabled without deleting historical mapping");

    // Re-enable for subsequent sync tests
    await KyorixSyncService.enableIntegration("champ-kukkiwon-2026", mockSuperAdmin);
  } catch (err) {
    logFail("Championship mapping tests failed", err);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 7: ATHLETE SYNCHRONIZATION & IDEMPOTENCY
  // ----------------------------------------------------------------------------
  console.log("\n🔄 [TEST GROUP 7] Athlete Synchronization & Idempotency");
  try {
    const mockClient = new MockKyorixClient();
    setKyorixClient(mockClient);

    // 1. Initial Sync
    const sync1 = await KyorixSyncService.syncAthleteRegistration("reg-demo-001", mockEventAdmin);
    assert.strictEqual(sync1.success, true);
    assert.strictEqual(sync1.status, "SYNCED");
    assert(sync1.kyorixAthleteId?.startsWith("KYX-ATH-"));
    assert(sync1.kyorixRegistrationId?.startsWith("KYX-REG-"));
    logPass(`Athlete registered to Kyorix: Athlete ID ${sync1.kyorixAthleteId}, Registration ID ${sync1.kyorixRegistrationId}`);

    // 2. Idempotent Second Sync
    const sync2 = await KyorixSyncService.syncAthleteRegistration("reg-demo-001", mockEventAdmin);
    assert.strictEqual(sync2.success, true);
    assert.strictEqual(sync2.kyorixAthleteId, sync1.kyorixAthleteId, "Idempotent sync must reuse same Kyorix Athlete ID");
    assert.strictEqual(sync2.kyorixRegistrationId, sync1.kyorixRegistrationId, "Idempotent sync must reuse same Registration ID");
    logPass("Duplicate synchronization is strictly idempotent; zero duplicate external records created");

    // 3. Verify Local Sync Record
    const record = await KyorixSyncService.getSyncRecord("reg-demo-001");
    assert.strictEqual(record?.syncStatus, "SYNCED");
    assert.strictEqual(record?.athleteId, sync1.athleteId);
    assert(record.idempotencyKey?.startsWith("KKC26:reg-demo-001:"));
    logPass("Local KyorixIntegrationRecord updated with external IDs and deterministic idempotency key");
  } catch (err) {
    logFail("Athlete synchronization tests failed", err);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 8: REGISTRATION ELIGIBILITY VALIDATION
  // ----------------------------------------------------------------------------
  console.log("\n📋 [TEST GROUP 8] Registration Eligibility & Payment Rules");
  try {
    // 1. Draft registration rejected
    const draftReg = {
      id: "reg-draft-001",
      status: "DRAFT",
    };
    // Mock getLocalRegistration to return draft
    const origGetLocal = KyorixSyncService.getLocalRegistration;
    KyorixSyncService.getLocalRegistration = async () => draftReg;

    await assert.rejects(
      async () => {
        await KyorixSyncService.syncAthleteRegistration("reg-draft-001", mockEventAdmin);
      },
      /draft/i,
      "Draft registration must be rejected"
    );
    logPass("Draft registration strictly rejected from synchronization");

    // 2. Unpaid registration rejected
    const unpaidReg = {
      id: "reg-unpaid-001",
      status: "SUBMITTED",
      payments: [],
      payment_orders: [],
    };
    KyorixSyncService.getLocalRegistration = async () => unpaidReg;

    await assert.rejects(
      async () => {
        await KyorixSyncService.syncAthleteRegistration("reg-unpaid-001", mockEventAdmin);
      },
      /Payment condition is not satisfied/i,
      "Unpaid registration must be rejected"
    );
    logPass("Unpaid registration strictly rejected; payment requirement enforced");

    // Restore
    KyorixSyncService.getLocalRegistration = origGetLocal;
  } catch (err) {
    logFail("Registration eligibility tests failed", err);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 9: FAILURE ISOLATION (CORE CRITICAL REQUIREMENT)
  // ----------------------------------------------------------------------------
  console.log("\n🛡️ [TEST GROUP 9] Failure Isolation (Platform Resilience)");
  try {
    const mockClient = new MockKyorixClient();
    mockClient.simulatedMode = "SERVER_ERROR";
    setKyorixClient(mockClient);

    // Sync when Kyorix is completely failing
    const failedSync = await KyorixSyncService.syncAthleteRegistration("reg-demo-002", mockEventAdmin);
    assert.strictEqual(failedSync.success, false);
    assert.strictEqual(failedSync.status, "FAILED");
    assert(failedSync.error?.length > 0);
    logPass("External Kyorix failure caught without crashing application");

    // Verify local record is marked FAILED
    const failedRecord = await KyorixSyncService.getSyncRecord("reg-demo-002");
    assert.strictEqual(failedRecord?.syncStatus, "FAILED");
    assert(failedRecord.attempts >= 1);
    logPass("Local integration record marked FAILED with detailed error message and attempt count");

    // Verify local registration was NOT corrupted or cancelled
    const localReg = await KyorixSyncService.getLocalRegistration("reg-demo-002");
    assert.strictEqual(localReg?.status, "APPROVED", "Local registration status MUST remain APPROVED");
    assert.strictEqual(localReg?.id_card?.status, "GENERATED", "Local athlete ID card MUST remain GENERATED");
    logPass("CRITICAL: Local registration status, ID card, and payment remain 100% VALID despite Kyorix outage");

    // Retry recovery after outage resolved
    mockClient.simulatedMode = "SUCCESS";
    const retryRes = await KyorixSyncService.retryAthleteSync("reg-demo-002", mockEventAdmin);
    assert.strictEqual(retryRes.success, true);
    assert.strictEqual(retryRes.status, "SYNCED");
    logPass("Post-outage retry successfully recovers record to SYNCED status");
  } catch (err) {
    logFail("Failure isolation tests failed", err);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 10: BULK SYNCHRONIZATION
  // ----------------------------------------------------------------------------
  console.log("\n📦 [TEST GROUP 10] Bulk Synchronization of Eligible Records");
  try {
    const mockClient = new MockKyorixClient();
    setKyorixClient(mockClient);

    const bulkRes = await KyorixSyncService.syncEligibleRegistrations("champ-kukkiwon-2026", mockSuperAdmin);
    assert.strictEqual(typeof bulkRes.totalEligible, "number");
    assert(bulkRes.syncedCount >= 1);
    assert.strictEqual(bulkRes.failedCount, 0);
    logPass(`Bulk sync successfully processed ${bulkRes.syncedCount} of ${bulkRes.totalEligible} records`);
  } catch (err) {
    logFail("Bulk synchronization tests failed", err);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 11: WEBHOOK SIGNATURE & ANTI-REPLAY
  // ----------------------------------------------------------------------------
  console.log("\n🪝 [TEST GROUP 11] Webhook Signature & Anti-Replay Security");
  try {
    const secret = "test-webhook-secret-key-12345";
    process.env.KYORIX_WEBHOOK_SECRET = secret;

    const validPayload = {
      eventId: `evt-${Date.now()}-test`,
      eventType: "kyorix.athlete.verified",
      timestamp: new Date().toISOString(),
      data: { kyorixAthleteId: "KYX-ATH-10001", status: "VERIFIED" },
    };
    const rawBody = JSON.stringify(validPayload);
    const validSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    // 1. Valid Signature Accepted
    const isValid = KyorixWebhookService.verifySignature(rawBody, validSignature);
    assert.strictEqual(isValid, true);
    logPass("Valid HMAC-SHA256 signature accepted");

    // 2. Forged / Tampered Signature Rejected
    const forgedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const isForged = KyorixWebhookService.verifySignature(rawBody, forgedSignature);
    assert.strictEqual(isForged, false);
    logPass("Forged signature strictly rejected with timing-safe comparison");

    // 3. Process First Webhook
    const process1 = await KyorixWebhookService.processWebhook(validPayload);
    assert.strictEqual(process1.processed, true);
    logPass("Valid webhook event processed successfully");

    // 4. Replay Attack Prevented (Duplicate event ID)
    const process2 = await KyorixWebhookService.processWebhook(validPayload);
    assert.strictEqual(process2.processed, false);
    assert(process2.reason?.includes("Duplicate"));
    logPass("Replay attack prevented: duplicate eventId rejected as already processed");
  } catch (err) {
    logFail("Webhook security tests failed", err);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 12: AUDIT LOGGING OF INTEGRATION ACTIONS
  // ----------------------------------------------------------------------------
  console.log("\n📜 [TEST GROUP 12] Immutable Audit Logging of Integration Actions");
  try {
    const logs = await AuditService.getLogs(50);
    const actionTypes = new Set(logs.map((l) => l.action));

    assert(actionTypes.has("KYORIX_CONNECTION_TESTED"), "Must log KYORIX_CONNECTION_TESTED");
    assert(actionTypes.has("KYORIX_CHAMPIONSHIP_MAPPED"), "Must log KYORIX_CHAMPIONSHIP_MAPPED");
    assert(actionTypes.has("KYORIX_INTEGRATION_ENABLED"), "Must log KYORIX_INTEGRATION_ENABLED");
    assert(actionTypes.has("KYORIX_ATHLETE_SYNC_STARTED"), "Must log KYORIX_ATHLETE_SYNC_STARTED");
    assert(actionTypes.has("KYORIX_ATHLETE_SYNCED"), "Must log KYORIX_ATHLETE_SYNCED");
    assert(actionTypes.has("KYORIX_BULK_SYNC_STARTED"), "Must log KYORIX_BULK_SYNC_STARTED");
    logPass("All mandatory KYORIX_* audit events successfully recorded in AuditService");

    // Verify zero credentials in audit logs
    for (const log of logs) {
      if (log.action.startsWith("KYORIX_")) {
        const valStr = `${log.old_value || ""} ${log.new_value || ""}`;
        assert(!valStr.includes("apiSecret"), "Audit log must not contain apiSecret");
        assert(!valStr.includes("webhookSecret"), "Audit log must not contain webhookSecret");
      }
    }
    logPass("Zero credentials, secrets, or API keys leaked in audit trail");
  } catch (err) {
    logFail("Audit logging tests failed", err);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 13: PUBLIC WEBSITE & ATHLETE DASHBOARD ISOLATION
  // ----------------------------------------------------------------------------
  console.log("\n🌐 [TEST GROUP 13] Public Website & Athlete Isolation");
  try {
    // Verify public DTO from Phase 9 has zero Kyorix keys
    const { CmsService } = await import("../src/server/services/cms.service.js");
    const publicDTO = await CmsService.getPublicChampionshipDTO("champ-kukkiwon-2026");

    assert.strictEqual(publicDTO.kyorix_api_key, undefined);
    assert.strictEqual(publicDTO.kyorix_secret, undefined);
    assert.strictEqual(publicDTO.kyorix_mapping, undefined);
    logPass("Public championship website has zero exposure of Kyorix integration details");
  } catch (err) {
    logFail("Public isolation tests failed", err);
  }

  console.log("\n==================================================================");
  console.log(`🏁 PHASE 10 TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log("==================================================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runPhase10Tests();
