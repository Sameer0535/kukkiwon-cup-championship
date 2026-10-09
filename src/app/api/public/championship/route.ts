// ==============================================================================
// PUBLIC CHAMPIONSHIP API (GET /api/public/championship)
// Requirement 14 & 15: Public Sanitized Championship DTO
// Returns only published championship content
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { CmsService } from "@/server/services/cms.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || searchParams.get("id") || "kukkiwon-cup-2026";
    const packageMode = searchParams.get("package") === "true";

    const noCacheHeaders = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    };

    if (packageMode) {
      const fullPackage = await CmsService.getPublicChampionshipPackage(slug);
      if (!fullPackage) {
        return NextResponse.json(
          { error: "Published championship content not found." },
          { status: 404, headers: noCacheHeaders }
        );
      }
      return NextResponse.json(
        {
          success: true,
          data: fullPackage,
        },
        { headers: noCacheHeaders }
      );
    }

    const championship = await CmsService.getChampionship(slug, false);
    if (!championship) {
      return NextResponse.json(
        { error: "Published championship not found." },
        { status: 404, headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: championship,
      },
      { headers: noCacheHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load championship content." },
      { status: 500 }
    );
  }
}
