// ==============================================================================
// PUBLIC DOCUMENTS API (GET /api/public/documents)
// Requirement 14 & 15: Public Sanitized Documents DTOs
// Returns published downloadable guidelines and prospectus documents
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { CmsService } from "@/server/services/cms.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const championshipId = searchParams.get("championshipId") || "champ-kukkiwon-2026";

    const documents = await CmsService.listPublicDocuments(championshipId, false);

    return NextResponse.json({
      success: true,
      data: documents,
      total: documents.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load public documents." },
      { status: 500 }
    );
  }
}
