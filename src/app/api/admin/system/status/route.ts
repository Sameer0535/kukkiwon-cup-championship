// ==============================================================================
// SYSTEM DATABASE & CONNECTIVITY DIAGNOSTICS (/api/admin/system/status)
// Reports live PostgreSQL / Supabase connection status and data persistence health
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { LiveSyncService } from "@/server/services/live-sync.service";
import { RegistrationFlowService } from "@/server/services/registration-flow.service";

export async function GET(_req: NextRequest) {
  let dbOnline = false;
  let dbError: string | null = null;

  try {
    // Quick probe query with short timeout tolerance
    await prisma.$queryRaw`SELECT 1`;
    dbOnline = true;
  } catch (err: any) {
    dbOnline = false;
    dbError = err?.message?.split("\n")[0] || "Database unreachable";
  }

  const liveRegistrations = LiveSyncService.listRegistrations();
  const fallbackStore = RegistrationFlowService.getFallbackStore();
  const totalInMemory = Math.max(liveRegistrations.length, fallbackStore.size);

  let totalDbRegistrations = 0;
  if (dbOnline) {
    try {
      totalDbRegistrations = await prisma.registration.count();
    } catch {}
  }

  return NextResponse.json({
    success: true,
    dbOnline,
    mode: dbOnline ? "DATABASE_CONNECTED" : "SERVERLESS_FALLBACK",
    message: dbOnline
      ? "Connected to PostgreSQL / Supabase database. Cross-device synchronization active."
      : "Running in serverless fallback mode. Submissions from other devices will not persist across Vercel containers until a live PostgreSQL (Supabase/Neon) connection string is added to DATABASE_URL in Vercel Settings.",
    errorDetails: dbError,
    totalRecords: dbOnline ? totalDbRegistrations : totalInMemory,
    timestamp: new Date().toISOString(),
  });
}
