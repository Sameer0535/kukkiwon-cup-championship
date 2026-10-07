// ==============================================================================
// ADMIN CMS ANNOUNCEMENTS API (GET & POST /api/admin/cms/announcements)
// Administrative management of official announcements
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
    const championshipId = searchParams.get("championshipId") || admin.assigned_championship_id || "champ-kukkiwon-2026";

    if (admin.assigned_championship_id && admin.assigned_championship_id !== championshipId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view announcements for this championship." },
        { status: 403 }
      );
    }

    const announcements = await CmsService.listAnnouncements(championshipId, true);

    return NextResponse.json({
      success: true,
      data: announcements,
      total: announcements.length,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load announcements." },
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

    const created = await CmsService.createAnnouncement(body, admin);

    return NextResponse.json({
      success: true,
      data: created,
      message: "Announcement created successfully.",
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to create announcement." },
      { status }
    );
  }
}
