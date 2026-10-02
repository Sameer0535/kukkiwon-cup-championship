// ==============================================================================
// ADMIN DASHBOARD METRICS API (GET /api/admin/dashboard)
// Requirement 4 & 15: Database-backed operational metrics
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { AdminService } from "@/server/services/admin.service";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const url = new URL(req.url);
    const championshipId = url.searchParams.get("championshipId") || undefined;

    const metrics = await AdminService.getDashboardMetrics(championshipId, admin);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load dashboard metrics." },
      { status }
    );
  }
}
