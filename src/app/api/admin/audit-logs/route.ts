// ==============================================================================
// ADMIN AUDIT LOGS API (GET /api/admin/audit-logs)
// Requirement 14: Immutable audit trail listing
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { AdminService } from "@/server/services/admin.service";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN"]);

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || undefined;
    const entityType = url.searchParams.get("entityType") || undefined;
    const entityId = url.searchParams.get("entityId") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "25", 10);

    const result = await AdminService.getAuditLogs({
      action,
      entityType,
      entityId,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load audit logs." },
      { status }
    );
  }
}
