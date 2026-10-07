// ==============================================================================
// ADMIN CMS DASHBOARD & CONTENT API (GET & PATCH /api/admin/cms)
// Authoritative administration of championship content, hero, and publication
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
    const championshipId =
      searchParams.get("championshipId") ||
      admin.assigned_championship_id ||
      "champ-kukkiwon-2026";

    if (admin.assigned_championship_id && admin.assigned_championship_id !== championshipId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view content for this championship." },
        { status: 403 }
      );
    }

    const [content, dates, faqs, announcements, championship, registrationState] = await Promise.all([
      CmsService.getContent(championshipId),
      CmsService.listDates(championshipId, true),
      CmsService.listFAQs(championshipId, true),
      CmsService.listAnnouncements(championshipId, true),
      CmsService.getChampionship(championshipId, true),
      CmsService.getRegistrationState(championshipId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        content,
        championship,
        registrationState,
        dates,
        faqs,
        announcements,
      },
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load CMS content." },
      { status }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "CONTENT_ADMIN",
      "REGISTRATION_ADMIN",
    ]);
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const championshipId =
      body.championshipId ||
      searchParams.get("championshipId") ||
      admin.assigned_championship_id ||
      "champ-kukkiwon-2026";

    if (admin.assigned_championship_id && admin.assigned_championship_id !== championshipId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to update content for this championship." },
        { status: 403 }
      );
    }

    // Update Championship content via CmsService
    const updatedContent = await CmsService.updateContent(championshipId, body, admin);

    // Also sync core championship metadata if provided
    if (
      body.name ||
      body.shortName ||
      body.startDate ||
      body.endDate ||
      body.registrationOpen ||
      body.registrationClose ||
      body.venue ||
      body.city ||
      body.bannerUrl !== undefined
    ) {
      await CmsService.updateChampionship(championshipId, body, admin);
    }

    return NextResponse.json({
      success: true,
      data: updatedContent,
      message: "Championship CMS content updated successfully.",
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update CMS content." },
      { status }
    );
  }
}
