// ==============================================================================
// ATHLETE ID CARD PRINT / DOWNLOAD ROUTE (Phase 6 Requirement 12)
// GET /api/registrations/[registrationId]/id-card/download
// Returns a print-ready, high-resolution badge document
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/server-auth";
import { IdCardService } from "@/server/services/id-card.service";
import { AuditService } from "@/server/services/audit.service";

interface RouteContext {
  params: Promise<{ registrationId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const adminSession = await getAdminSession(request);
    if (!adminSession) {
      return NextResponse.json(
        { error: "Unauthorized: Athlete ID cards are only generated and downloadable by tournament administrators in the admin portal once payment is verified." },
        { status: 403 }
      );
    }

    const { registrationId } = await context.params;
    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required." },
        { status: 400 }
      );
    }

    // Retrieve or generate card (pass null for registrant userId check since caller is verified admin)
    let card = await IdCardService.getCardByRegistrationId(registrationId, null);
    if (!card) {
      // Attempt generation if eligible
      try {
        card = await IdCardService.generateCard(registrationId, adminSession.user_id);
      } catch (genErr) {
        console.warn("[ID Card Download] Generate card notice:", genErr);
      }
    }

    // Fallback store check from LiveSyncService
    if (!card) {
      const { LiveSyncService } = await import("@/server/services/live-sync.service");
      const store = LiveSyncService.loadStore();
      const reg = store.registrations.find(
        (r) => r.id === registrationId || r.athlete_id === registrationId || r.registration_number === registrationId
      );
      if (reg) {
        card = {
          id: `card-${reg.id}`,
          registrationId: reg.id,
          participantId: `part-${reg.id}`,
          athleteId: reg.athlete_id,
          cardNumber: reg.athlete_id,
          qrToken: `token-${reg.id}`,
          version: 1,
          cardStatus: "GENERATED",
          generatedAt: reg.approved_at || reg.submitted_at || new Date().toISOString(),
          revokedAt: null,
          revocationReason: null,
          qrCodeDataUrl: undefined,
          verificationUrl: `/verify/athlete/token-${reg.id}`,
          athleteName: reg.athlete_name,
          academyName: reg.academy_name,
          categoryName: reg.category_name,
          discipline: reg.discipline || "KYORUGI",
          gender: reg.gender,
          nationality: reg.nationality || "IND",
          championshipName: "Kukkiwon Cup Championship 2026",
          photoUrl: reg.photo_url || null,
          registrationNumber: reg.registration_number,
          kukkiwonId: reg.kukkiwon_id || null,
        };
      }
    }

    if (!card) {
      return NextResponse.json(
        { error: "Athlete ID card not found or athlete registration payment is pending administrative verification." },
        { status: 404 }
      );
    }

    if (card.cardStatus === "REVOKED") {
      return NextResponse.json(
        { error: "This athlete ID card has been revoked and cannot be printed." },
        { status: 403 }
      );
    }

    // Record download audit event
    await AuditService.logAction({
      adminUserId: adminSession.user_id,
      action: "ATHLETE_ID_CARD_DOWNLOADED",
      entityType: "IdCard",
      entityId: card.id,
      newValue: {
        athleteId: card.athleteId,
        downloadedAt: new Date().toISOString(),
      },
    });

    const format = request.nextUrl.searchParams.get("format");
    if (format === "json") {
      return NextResponse.json({
        success: true,
        card,
      });
    }

    const { IdCardTemplateService } = await import("@/server/services/id-card-template.service");
    const templateBgUrl = await IdCardTemplateService.getTemplate();
    const html = IdCardService.generatePrintableHtml(card, templateBgUrl);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="Athlete-ID-${card.athleteId}.html"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[GET /api/registrations/[registrationId]/id-card/download] Error:", error);
    const message = error.message || "Failed to download athlete ID card.";
    const isForbidden =
      message.includes("Unauthorized") ||
      message.includes("permission") ||
      message.includes("Authentication");

    return NextResponse.json(
      { error: message },
      { status: isForbidden ? 403 : 500 }
    );
  }
}
