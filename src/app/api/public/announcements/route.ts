// ==============================================================================
// PUBLIC ANNOUNCEMENTS API (GET /api/public/announcements)
// Requirement 14 & 15: Public Sanitized Announcement DTOs
// Returns published, non-expired announcements only (drafts strictly excluded)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { CmsService } from "@/server/services/cms.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const championshipId = searchParams.get("championshipId") || "champ-kukkiwon-2026";

    const announcements = await CmsService.listAnnouncements(championshipId, false);

    return NextResponse.json({
      success: true,
      data: announcements,
      total: announcements.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load announcements." },
      { status: 500 }
    );
  }
}
