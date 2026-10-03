// ==============================================================================
// ADMIN CMS FEES API (GET & POST /api/admin/cms/fees)
// Administrative management of registration fee rules
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { CmsService } from "@/server/services/cms.service";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN", "FINANCE_ADMIN", "VIEWER"]);
    const { searchParams } = new URL(req.url);
    const championshipId = searchParams.get("championshipId") || admin.assigned_championship_id || "champ-kukkiwon-2026";

    if (admin.assigned_championship_id && admin.assigned_championship_id !== championshipId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view fees for this championship." },
        { status: 403 }
      );
    }

    const fees = await CmsService.listFees(championshipId, true);

    return NextResponse.json({
      success: true,
      data: fees,
      total: fees.length,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load fee configuration." },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "FINANCE_ADMIN"]);
    const body = await req.json();

    const created = await CmsService.createFee(body, admin);

    return NextResponse.json({
      success: true,
      data: created,
      message: "Fee rule created successfully.",
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to create fee rule." },
      { status }
    );
  }
}
