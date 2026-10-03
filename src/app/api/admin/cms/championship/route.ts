// ==============================================================================
// ADMIN CMS CHAMPIONSHIP API (GET & PUT /api/admin/cms/championship)
// Authenticated and authorized administrative management of championship information
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { CmsService } from "@/server/services/cms.service";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN", "VIEWER", "FINANCE_ADMIN", "REGISTRAR"]);
    const { searchParams } = new URL(req.url);
    const championshipId = searchParams.get("id") || admin.assigned_championship_id || "champ-kukkiwon-2026";

    // Championship scoping
    if (admin.assigned_championship_id && admin.assigned_championship_id !== championshipId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this championship." },
        { status: 403 }
      );
    }

    const championship = await CmsService.getChampionship(championshipId, true);
    if (!championship) {
      return NextResponse.json(
        { error: "Championship not found." },
        { status: 404 }
      );
    }

    const availability = await CmsService.getRegistrationAvailability(championshipId);

    return NextResponse.json({
      success: true,
      data: championship,
      availability,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load championship details." },
      { status }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN"]);
    const body = await req.json();
    const { championshipId, ...input } = body;

    const targetId = championshipId || admin.assigned_championship_id || "champ-kukkiwon-2026";

    const updated = await CmsService.updateChampionship(targetId, input, admin);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Championship details updated successfully.",
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update championship." },
      { status }
    );
  }
}
