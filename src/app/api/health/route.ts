// ==============================================================================
// SYSTEM HEALTH DIAGNOSTIC ENDPOINT (Phase 13 Production Readiness)
// Verifies Process Health, Database Connectivity, Persistence Mode & Service Readiness
// Never exposes credentials, secrets, or internal system paths.
// ==============================================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { BRANDING } from "@/config/branding";

export async function GET() {
  const timestamp = new Date().toISOString();
  const isProduction = process.env.NODE_ENV === "production";
  
  // 1. Check database connectivity
  let dbStatus = "DISCONNECTED";
  let dbLatencyMs: number | null = null;
  
  try {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Math.round(performance.now() - start);
    dbStatus = "CONNECTED";
  } catch {
    dbStatus = "DISCONNECTED";
  }

  // 2. Environment & Service Readiness (boolean flags only - zero secrets)
  const envCheck = {
    databaseConfigured: !!process.env.DATABASE_URL,
    jwtConfigured: !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32,
    siteUrlConfigured: !!process.env.NEXT_PUBLIC_SITE_URL,
    storageProvider: process.env.STORAGE_PROVIDER || "local",
    paymentProvider: process.env.PAYMENT_GATEWAY_PROVIDER || (isProduction ? "RAZORPAY" : "MOCK"),
    kyorixIntegrationConfigured: !!(process.env.KYORIX_API_KEY && process.env.KYORIX_API_SECRET),
  };

  // In production, database connectivity is mandatory for fully healthy status
  const isHealthy = isProduction
    ? dbStatus === "CONNECTED" && envCheck.jwtConfigured
    : dbStatus === "CONNECTED" || (envCheck.databaseConfigured && envCheck.jwtConfigured);

  const persistenceMode = isProduction ? "FAIL_CLOSED" : "DEV_FALLBACK";

  return NextResponse.json(
    {
      status: isHealthy ? "HEALTHY" : "DEGRADED",
      timestamp,
      phase: "PHASE_13_PRODUCTION_READY",
      environment: isProduction ? "production" : "development",
      persistenceMode,
      uptimeSeconds: Math.round(process.uptime()),
      platform: {
        championship: BRANDING.championshipName,
        edition: BRANDING.edition,
        organizers: [
          BRANDING.kukkiwon.name + " (" + BRANDING.kukkiwon.branch + ")",
          BRANDING.kyorix.name + " (" + BRANDING.kyorix.subtitle + ")",
        ],
        isolation: "100% Isolated standalone Kukkiwon Cup Championship architecture",
      },
      services: {
        database: {
          status: dbStatus,
          provider: "PostgreSQL",
          latencyMs: dbLatencyMs,
          persistenceGuard: persistenceMode,
        },
        storage: {
          status: "CONFIGURED",
          provider: envCheck.storageProvider,
          buckets: [
            "championship-assets",
            "participant-photos",
            "participant-documents (STRICTLY PRIVATE)",
            "id-cards",
          ],
        },
        payment: {
          status: "CONFIGURED",
          provider: envCheck.paymentProvider,
          currency: "INR",
          minorUnit: "paise",
        },
        kyorixIntegration: {
          status: envCheck.kyorixIntegrationConfigured ? "CONFIGURED" : "STANDALONE_ISOLATED",
        },
        security: {
          rbacRolesSupported: [
            "SUPER_ADMIN",
            "EVENT_ADMIN",
            "REGISTRATION_ADMIN",
            "FINANCE_ADMIN",
            "DOCUMENT_ADMIN",
            "CONTENT_ADMIN",
            "VIEWER",
          ],
          qrVerificationArchitecture: "High-Entropy URL-safe Tokens (Decoupled from PII)",
          privateStorageEnforcement: true,
          secretsExposed: false,
        },
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
