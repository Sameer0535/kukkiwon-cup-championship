// ==============================================================================
// ADMIN CMS DATES API (GET & POST /api/admin/cms/dates)
// Management of championship timeline, schedule milestones, and deadlines
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { CmsService } from "@/server/services/cms.service";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "CONTENT_ADMIN",
      "REGISTRATION_ADMIN",
      "DOCUMENT_ADMIN",
      "FINANCE_ADMIN",
      "REGISTRAR",
      "VIEWER",
    ]);
    const { searchParams } = new URL(req.url);
    const championshipId =
      searchParams.get("championshipId") ||
      admin.assigned_championship_id ||
      "champ-kukkiwon-2026";

    if (admin.assigned_championship_id && admin.assigned_championship_id !== championshipId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view dates for this championship." },
        { status: 403 }
      );
    }

    const dates = await CmsService.listDates(championshipId, true);

    return NextResponse.json({
      success: true,
      data: dates,
      total: dates.length,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load important dates." },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "CONTENT_ADMIN",
      "REGISTRATION_ADMIN",
    ]);
    const body = await req.json();

    if (!body.championshipId) {
      body.championshipId = admin.assigned_championship_id || "champ-kukkiwon-2026";
    }

    const created = await CmsService.createDate(body, admin);

    return NextResponse.json({
      success: true,
      data: created,
      message: "Important date created successfully.",
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to create important date." },
      { status }
    );
  }
}
