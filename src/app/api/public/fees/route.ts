// ==============================================================================
// PUBLIC REGISTRATION FEES API (GET /api/public/fees)
// Requirement 14 & 15: Public Sanitized Fee DTOs
// Returns active fee structure from authoritative fee rules
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { CmsService } from "@/server/services/cms.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const championshipId = searchParams.get("championshipId") || "champ-kukkiwon-2026";

    const fees = await CmsService.listFees(championshipId, false);

    return NextResponse.json({
      success: true,
      data: fees,
      total: fees.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load fee structure." },
      { status: 500 }
    );
  }
}
