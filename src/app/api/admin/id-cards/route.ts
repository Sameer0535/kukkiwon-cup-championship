// ==============================================================================
// ADMIN ID CARDS LIST API (GET /api/admin/id-cards)
// Requirement 10: ID Card Management with QR verification access
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { AdminService } from "@/server/services/admin.service";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "VIEWER",
    ]);

    const url = new URL(req.url);
    const championshipId = url.searchParams.get("championshipId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const q = url.searchParams.get("q") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "25", 10);

    const result = await AdminService.getIdCards(
      { championshipId, status, q, page, pageSize },
      admin
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load ID cards." },
      { status }
    );
  }
}
