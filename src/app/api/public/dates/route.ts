// ==============================================================================
// PUBLIC IMPORTANT DATES API (GET /api/public/dates)
// Returns published chronological deadlines with no-cache guarantees
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { CmsService } from "@/server/services/cms.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const championshipId =
      searchParams.get("championshipId") ||
      searchParams.get("id") ||
      searchParams.get("slug") ||
      "champ-kukkiwon-2026";

    const dates = await CmsService.listDates(championshipId, false);

    return NextResponse.json(
      {
        success: true,
        data: dates,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load public championship dates." },
      { status: 500 }
    );
  }
}
