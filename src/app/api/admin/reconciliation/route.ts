// ==============================================================================
// ADMIN FINANCIAL RECONCILIATION API (Phase 5 & 11 Hardened)
// GET /api/admin/reconciliation
// Provides authoritative reconciliation summary, gateway settlements, and discrepancy audits
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { ReconciliationService } from "@/server/services/reconciliation.service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "FINANCE_ADMIN",
      "VIEWER",
    ]);

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
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    console.error("[GET /api/admin/reconciliation] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load financial reconciliation." },
      { status: 500 }
    );
  }
}
