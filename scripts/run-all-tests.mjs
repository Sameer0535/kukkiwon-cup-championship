// ==============================================================================
// CUMULATIVE REGRESSION TEST RUNNER: PHASES 4 - 18
// Executes all milestone suites and verifies zero regressions
// ==============================================================================

import { execSync } from "child_process";

const SUITES = [
  { phase: "Phase 4", cmd: "npx tsx scripts/test-phase4.mjs", desc: "Document & Media Management" },
  { phase: "Phase 5", cmd: "npx tsx scripts/test-phase5.mjs", desc: "Payment Integration & Reconciliation" },
  { phase: "Phase 6", cmd: "npx tsx scripts/test-phase6.mjs", desc: "Digital Athlete ID Card Generation" },
  { phase: "Phase 7", cmd: "npx tsx scripts/test-phase7.mjs", desc: "QR Verification Hardening" },
  { phase: "Phase 8", cmd: "npx tsx scripts/test-phase8.mjs", desc: "Championship Admin Portal & RBAC" },
  { phase: "Phase 9", cmd: "npx tsx scripts/test-phase9.mjs", desc: "CMS & Live Publishing System" },
  { phase: "Phase 10", cmd: "npx tsx scripts/test-phase10.mjs", desc: "Kyorix Integration Layer" },
  { phase: "Phase 11", cmd: "npx tsx scripts/test-phase11.mjs", desc: "Security Audit & Hardening" },
  { phase: "Phase 12", cmd: "node scripts/test-phase12.mjs", desc: "Responsive & Device Validation" },
  { phase: "Phase 13", cmd: "npx tsx scripts/test-phase13.mjs", desc: "Production Readiness & Deployment" },
  { phase: "Phase 14", cmd: "npx tsx scripts/test-phase14.mjs", desc: "Infrastructure & Deployment Validation" },
  { phase: "Phase 15", cmd: "npx tsx scripts/test-phase15.mjs", desc: "End-to-End UAT & Workflow Validation" },
  { phase: "Phase 16", cmd: "npx tsx scripts/test-phase16.mjs", desc: "Production Infrastructure & Deployment Validation" },
  { phase: "Phase 17", cmd: "npx tsx scripts/test-phase17.mjs", desc: "Production Go-Live & Validation" },
  { phase: "Phase 18", cmd: "npx tsx scripts/test-phase18.mjs", desc: "Production Go-Live Validation" },
];

console.log("==================================================================");
console.log("🏆 EXECUTING CUMULATIVE REGRESSION TEST SUITE (PHASES 4–18)");
console.log("==================================================================\n");

let totalPassed = 0;
let totalFailed = 0;
const results = [];

for (const suite of SUITES) {
  process.stdout.write(`⏳ Running ${suite.phase} (${suite.desc})... `);
  try {
    const output = execSync(suite.cmd, { stdio: "pipe", encoding: "utf-8" });
    
    // Parse pass/fail counts from output
    const passMatches = output.match(/✅ PASS/g) || output.match(/PASS/g);
    let passed = 0;
    
    // Look for standard summary line
    const summaryMatch = output.match(/(\d+)\s+PASSED.*?(\d+)\s+FAILED/i);
    let failed = 0;
    if (summaryMatch) {
      passed = parseInt(summaryMatch[1], 10);
      failed = parseInt(summaryMatch[2], 10);
    } else {
      passed = passMatches ? passMatches.length : 0;
    }

    totalPassed += passed;
    totalFailed += failed;

    results.push({
      phase: suite.phase,
      passed,
      failed,
      status: failed === 0 ? "PASSED" : "FAILED",
    });

    console.log(`✅ ${passed} PASSED, ${failed} FAILED`);
  } catch (err) {
    console.log(`❌ ERROR`);
    const stderr = err.stderr || err.message;
    console.error(stderr);
    totalFailed++;
    results.push({
      phase: suite.phase,
      passed: 0,
      failed: 1,
      status: "FAILED",
    });
  }
}

console.log("\n==================================================================");
console.log("📊 CUMULATIVE REGRESSION TEST SUMMARY");
console.log("==================================================================");
console.table(results);
console.log(`TOTAL PASSED: ${totalPassed}`);
console.log(`TOTAL FAILED: ${totalFailed}`);
console.log("==================================================================");

if (totalFailed > 0) {
  process.exit(1);
}
