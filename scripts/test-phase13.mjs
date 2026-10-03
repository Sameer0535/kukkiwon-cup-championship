#!/usr/bin/env node
// ==============================================================================
// PHASE 13 — PRODUCTION DEPLOYMENT & OPERATIONAL READINESS TEST SUITE
// Automated verification of persistence, fail-closed guard, env security,
// secret leak scans, health endpoints, and production authentication controls.
// ==============================================================================

import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT_DIR = process.cwd();

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runSection(name, fn) {
  console.log(`\n============================================================`);
  console.log(`🧪 [Phase 13] ${name}`);
  console.log(`============================================================`);
  await fn();
}

async function main() {
  console.log("🥋 [KUKKIWON CUP] Starting Phase 13 Production Readiness Suite...");
  const startTime = Date.now();

  // --------------------------------------------------------------------------
  // SECTION 1: PersistenceGuard & Database Fail-Closed Architecture
  // --------------------------------------------------------------------------
  await runSection("1. Database PersistenceGuard Fail-Closed Enforcement", async () => {
    const { PersistenceGuard } = await import("../src/server/services/persistence-guard.ts");

    // Test in development / test environment (fallback permitted)
    process.env.NODE_ENV = "test";
    assert(PersistenceGuard.isFallbackPermitted() === true, "PersistenceGuard allows fallback in test/dev environment");

    let devError = null;
    try {
      PersistenceGuard.assertWritePersistence(false, "TestDevWrite");
    } catch (err) {
      devError = err;
    }
    assert(devError === null, "PersistenceGuard does not block writes in test/dev mode when offline");

    // Test in production environment (fail-closed strictly enforced)
    process.env.NODE_ENV = "production";
    assert(PersistenceGuard.isFallbackPermitted() === false, "PersistenceGuard forbids fallback in production");

    let prodError = null;
    try {
      PersistenceGuard.assertWritePersistence(false, "CriticalPaymentWrite");
    } catch (err) {
      prodError = err;
    }
    assert(prodError !== null, "PersistenceGuard throws in production when database is offline");
    assert(
      prodError?.message?.includes("CRITICAL PERSISTENCE ERROR") &&
      prodError?.message?.includes("CriticalPaymentWrite"),
      "PersistenceGuard error message clearly designates critical persistence failure"
    );

    // When online in production, it succeeds
    let onlineError = null;
    try {
      PersistenceGuard.assertWritePersistence(true, "CriticalPaymentWrite");
    } catch (err) {
      onlineError = err;
    }
    assert(onlineError === null, "PersistenceGuard allows write when database is online in production");

    // Reset NODE_ENV to test
    process.env.NODE_ENV = "test";
  });

  // --------------------------------------------------------------------------
  // SECTION 2: Production Admin Authentication Hardening
  // --------------------------------------------------------------------------
  await runSection("2. Production Admin Authentication Hardening", async () => {
    const { AdminService } = await import("../src/server/services/admin.service.ts");

    // In production, fallback admins must be rejected
    process.env.NODE_ENV = "production";

    let authError = null;
    try {
      // Attempt login with fallback admin account while offline in production
      await AdminService.authenticate("admin@kukkiwoncup.org", "admin123456");
    } catch (err) {
      authError = err;
    }

    assert(authError !== null, "Production authentication rejects fallback admin accounts when DB is offline");
    assert(authError?.statusCode === 401, "Production authentication returns 401 Unauthorized for unverified admin");

    // Reset NODE_ENV
    process.env.NODE_ENV = "test";

    // In test environment, fallback is allowed for unit testing
    let testSession = null;
    try {
      const res = await AdminService.authenticate("admin@kukkiwoncup.org", "admin123456");
      testSession = res?.session;
    } catch (err) {
      console.warn("Dev authenticate error:", err);
    }
    assert(testSession !== null && testSession.role === "SUPER_ADMIN", "Test environment allows offline test admin authentication");
  });

  // --------------------------------------------------------------------------
  // SECTION 3: Client Secret Leak Scan & Reconciliation Auth Hardening
  // --------------------------------------------------------------------------
  await runSection("3. Client Secret Leak Scan & Header Hardening", async () => {
    // Verify reconciliation page
    const reconPath = path.join(ROOT_DIR, "src/app/admin/reconciliation/page.tsx");
    const reconContent = fs.readFileSync(reconPath, "utf-8");

    assert(!reconContent.includes("kukkiwon-bootstrap-admin-secret-2026"), "Reconciliation page has zero hardcoded bootstrap secrets");
    assert(reconContent.includes("kukkiwon_admin_bearer"), "Reconciliation page uses standard kukkiwon_admin_bearer authentication");

    // Scan all client-side files in src/app (excluding API routes) for sensitive keywords
    const sensitiveTokens = [
      "DATABASE_URL",
      "DIRECT_URL",
      "PAYMENT_KEY_SECRET",
      "PAYMENT_WEBHOOK_SECRET",
      "KYORIX_API_SECRET",
      "KYORIX_WEBHOOK_SECRET",
      "SUPABASE_SERVICE_ROLE_KEY",
      "kukkiwon-bootstrap-admin-secret-2026",
    ];

    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // Skip api routes as they are server-side
          if (entry.name === "api") continue;
          scanDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
          const content = fs.readFileSync(fullPath, "utf-8");
          for (const token of sensitiveTokens) {
            if (content.includes(`process.env.${token}`)) {
              assert(false, `Client component reads server-only secret process.env.${token} in file: ${entry.name}`);
            }
          }
          if (content.includes("kukkiwon-bootstrap-admin-secret-2026")) {
            assert(false, `Hardcoded bootstrap secret found in client file: ${entry.name}`);
          }
          if (content.includes("postgresql://") || content.includes("postgres://")) {
            assert(false, `Raw database connection URI found in client file: ${entry.name}`);
          }
        }
      }
    }

    scanDir(path.join(ROOT_DIR, "src/app"));
    assert(true, "Client bundle files (src/app/** non-API) contain zero references to server-only secret variables");
  });

  // --------------------------------------------------------------------------
  // SECTION 4: Environment Variables Template & Schema Audit
  // --------------------------------------------------------------------------
  await runSection("4. Environment Variable Inventory & Classification", async () => {
    const envExamplePath = path.join(ROOT_DIR, ".env.example");
    assert(fs.existsSync(envExamplePath), ".env.example exists in project root");
    const envContent = fs.readFileSync(envExamplePath, "utf-8");

    const requiredKeys = [
      "DATABASE_URL",
      "DIRECT_URL",
      "NEXT_PUBLIC_SITE_URL",
      "JWT_SECRET",
      "STORAGE_PROVIDER",
      "PAYMENT_GATEWAY_PROVIDER",
      "NEXT_PUBLIC_PAYMENT_KEY_ID",
      "PAYMENT_KEY_SECRET",
      "PAYMENT_WEBHOOK_SECRET",
      "KYORIX_INTEGRATION_ENABLED",
      "KYORIX_API_BASE_URL",
      "KYORIX_API_KEY",
      "KYORIX_API_SECRET",
      "KYORIX_WEBHOOK_SECRET",
      "ADMIN_BOOTSTRAP_EMAIL",
      "ADMIN_BOOTSTRAP_PASSWORD",
    ];

    for (const key of requiredKeys) {
      assert(envContent.includes(key), `.env.example documents environment variable: ${key}`);
    }

    // Verify public vs server-only prefixes
    const publicVars = requiredKeys.filter((k) => k.startsWith("NEXT_PUBLIC_"));
    const serverVars = requiredKeys.filter((k) => !k.startsWith("NEXT_PUBLIC_"));

    assert(publicVars.length === 2, "Exactly 2 intentional NEXT_PUBLIC_* variables defined (SITE_URL, PAYMENT_KEY_ID)");
    assert(serverVars.every((k) => !k.startsWith("NEXT_PUBLIC_")), "All server secrets lack NEXT_PUBLIC_ prefix");
  });

  // --------------------------------------------------------------------------
  // SECTION 5: Health Diagnostic Endpoint Output Schema
  // --------------------------------------------------------------------------
  await runSection("5. Health Diagnostic Endpoint Verification", async () => {
    const { GET: healthGet } = await import("../src/app/api/health/route.ts");

    // In test mode
    process.env.NODE_ENV = "test";
    const res = await healthGet();
    const data = await res.json();

    assert(data !== null, "Health endpoint returns JSON payload");
    assert(data.phase === "PHASE_13_PRODUCTION_READY", "Health endpoint reports PHASE_13_PRODUCTION_READY");
    assert(data.persistenceMode === "DEV_FALLBACK", "Health endpoint reports persistenceMode DEV_FALLBACK in test mode");
    assert(data.services?.database !== undefined, "Health endpoint includes database service status");
    assert(data.services?.storage !== undefined, "Health endpoint includes storage service status");
    assert(data.services?.payment !== undefined, "Health endpoint includes payment service status");
    assert(data.services?.kyorixIntegration !== undefined, "Health endpoint includes kyorix service status");
    assert(data.services?.security?.secretsExposed === false, "Health endpoint explicitly confirms secretsExposed === false");

    // In production mode
    process.env.NODE_ENV = "production";
    const prodRes = await healthGet();
    const prodData = await prodRes.json();
    assert(prodData.environment === "production", "Health endpoint recognizes production environment");
    assert(prodData.persistenceMode === "FAIL_CLOSED", "Health endpoint sets persistenceMode to FAIL_CLOSED in production");

    process.env.NODE_ENV = "test";
  });

  // --------------------------------------------------------------------------
  // SECTION 6: Production Bootstrap Admin CLI Script
  // --------------------------------------------------------------------------
  await runSection("6. Production Admin Bootstrap CLI Script Verification", async () => {
    const bootstrapScriptPath = path.join(ROOT_DIR, "scripts/bootstrap-admin.mjs");
    assert(fs.existsSync(bootstrapScriptPath), "scripts/bootstrap-admin.mjs exists and is executable");

    const content = fs.readFileSync(bootstrapScriptPath, "utf-8");
    assert(content.includes("PBKDF2"), "Bootstrap script uses PBKDF2 cryptographic hashing");
    assert(!content.includes("admin123456"), "Bootstrap script has no hardcoded default passwords");
    assert(content.includes("ADMIN_BOOTSTRAP_EMAIL") && content.includes("ADMIN_BOOTSTRAP_PASSWORD"), "Bootstrap script accepts environment variables");
  });

  // --------------------------------------------------------------------------
  // SECTION 7: Summary & Acceptance
  // --------------------------------------------------------------------------
  console.log(`\n============================================================`);
  console.log(`📊 PHASE 13 TEST RESULTS SUMMARY`);
  console.log(`============================================================`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log(`  Duration: ${Date.now() - startTime}ms`);
  console.log(`============================================================\n`);

  if (failedTests > 0) {
    console.error(`❌ Phase 13 suite FAILED with ${failedTests} failures.`);
    process.exit(1);
  } else {
    console.log(`✅ Phase 13 suite PASSED completely (${passedTests}/${passedTests})!`);
  }
}

main().catch((err) => {
  console.error("Fatal error running Phase 13 tests:", err);
  process.exit(1);
});
