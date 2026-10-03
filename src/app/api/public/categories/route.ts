// ==============================================================================
// PUBLIC CATEGORIES API (GET /api/public/categories)
// Requirement 14 & 15: Public Sanitized Category DTOs
// Returns active competition categories for athlete registration
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { CmsService } from "@/server/services/cms.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const championshipId = searchParams.get("championshipId") || "champ-kukkiwon-2026";
    const discipline = searchParams.get("discipline") || undefined;

    let categories = await CmsService.listCategories(championshipId, false);
    if (discipline) {
      categories = categories.filter((c) => c.discipline.toUpperCase() === discipline.toUpperCase());
    }

    return NextResponse.json({
      success: true,
      data: categories,
      total: categories.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load categories." },
      { status: 500 }
    );
  }
}
