// ==============================================================================
// ADMIN CMS PUBLISH API (POST /api/admin/cms/publish)
// Publishes championship CMS content and triggers live public revalidation
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { CmsService } from "@/server/services/cms.service";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN"]);
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable
    }

    const { searchParams } = new URL(req.url);
    const championshipId =
      body.championshipId ||
      searchParams.get("championshipId") ||
      admin.assigned_championship_id ||
      "champ-kukkiwon-2026";

    if (admin.assigned_championship_id && admin.assigned_championship_id !== championshipId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to publish content for this championship." },
        { status: 403 }
      );
    }

    const action = body.action || "PUBLISH"; // PUBLISH or UNPUBLISH

    let result;
    if (action === "UNPUBLISH") {
      result = await CmsService.unpublishChampionshipContent(championshipId, admin);
    } else {
      result = await CmsService.publishChampionshipContent(championshipId, admin);
    }

    return NextResponse.json({
      message: action === "UNPUBLISH" ? "Championship unpublished to draft." : "Championship published successfully.",
      ...result,
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to publish championship content." },
      { status }
    );
  }
}
