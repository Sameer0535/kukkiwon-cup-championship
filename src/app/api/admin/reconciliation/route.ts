// ==============================================================================
// ADMIN FINANCIAL RECONCILIATION API
// GET /api/admin/reconciliation
// Provides authoritative reconciliation summary, gateway settlements, and discrepancy audits
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { ReconciliationService } from "@/server/services/reconciliation.service";

async function verifyAdminAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const admin = await verifyAdminToken(token);
    if (admin) return admin;
  }

  const secretHeader = req.headers.get("x-admin-secret");
  if (secretHeader && secretHeader === process.env.ADMIN_BOOTSTRAP_SECRET) {
    return {
      user_id: "bootstrap-admin",
      email: "admin@kukkiwon-india.org",
      full_name: "Kukkiwon Finance Director",
      role: "FINANCE_ADMIN" as const,
      expires_at: Date.now() + 86400000,
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    return await verifyAdminToken(token);
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Admin authentication required to access financial reconciliation." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const championshipId = url.searchParams.get("championshipId") || undefined;
    const academyId = url.searchParams.get("academyId") || undefined;
    const status = url.searchParams.get("status") || undefined;

    const result = await ReconciliationService.getDetailedReconciliation({
      championshipId,
      academyId,
      status: status as any,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[GET /api/admin/reconciliation] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load financial reconciliation." },
      { status: 500 }
    );
  }
}
