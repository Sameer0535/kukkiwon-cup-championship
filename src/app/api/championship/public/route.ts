// ==============================================================================
// PUBLIC CHAMPIONSHIP CMS API (GET /api/championship/public)
// Authoritative, sanitized endpoint providing live published content to public visitors
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { CmsService } from "@/server/services/cms.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idOrSlug =
      searchParams.get("slug") ||
      searchParams.get("championshipId") ||
      searchParams.get("id") ||
      "champ-kukkiwon-2026";

    const championshipData = await CmsService.getPublicChampionshipDTO(idOrSlug);

    if (!championshipData) {
      return NextResponse.json(
        { error: "Championship information not found or currently unpublished." },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: championshipData,
    });

    // Cache-Control headers for high-concurrency public consumption
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve public championship information." },
      { status: 500 }
    );
  }
}
