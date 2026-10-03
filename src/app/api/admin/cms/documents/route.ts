// ==============================================================================
// ADMIN CMS PUBLIC DOCUMENTS API (GET & POST /api/admin/cms/documents)
// Administrative publishing of official prospectus and guidance documents
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { CmsService } from "@/server/services/cms.service";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN", "REGISTRAR", "VIEWER"]);
    const { searchParams } = new URL(req.url);
    const championshipId = searchParams.get("championshipId") || admin.assigned_championship_id || "champ-kukkiwon-2026";

    if (admin.assigned_championship_id && admin.assigned_championship_id !== championshipId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view documents for this championship." },
        { status: 403 }
      );
    }

    const documents = await CmsService.listPublicDocuments(championshipId, true);

    return NextResponse.json({
      success: true,
      data: documents,
      total: documents.length,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load public documents." },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN"]);
    const body = await req.json();

    const created = await CmsService.createPublicDocument(body, admin);

    return NextResponse.json({
      success: true,
      data: created,
      message: "Public document published successfully.",
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to publish document." },
      { status }
    );
  }
}
