// ==============================================================================
// ADMIN CMS FAQS API (GET & POST /api/admin/cms/faqs)
// Management of public frequently asked questions and official guidance
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { CmsService } from "@/server/services/cms.service";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN", "REGISTRAR", "VIEWER"]);
    const { searchParams } = new URL(req.url);
    const championshipId =
      searchParams.get("championshipId") ||
      admin.assigned_championship_id ||
      "champ-kukkiwon-2026";

    if (admin.assigned_championship_id && admin.assigned_championship_id !== championshipId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view FAQs for this championship." },
        { status: 403 }
      );
    }

    const faqs = await CmsService.listFAQs(championshipId, true);

    return NextResponse.json({
      success: true,
      data: faqs,
      total: faqs.length,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load FAQs." },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN"]);
    const body = await req.json();

    if (!body.championshipId) {
      body.championshipId = admin.assigned_championship_id || "champ-kukkiwon-2026";
    }

    const created = await CmsService.createFAQ(body, admin);

    return NextResponse.json({
      success: true,
      data: created,
      message: "FAQ created successfully.",
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to create FAQ." },
      { status }
    );
  }
}
