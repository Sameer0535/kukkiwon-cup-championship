// ==============================================================================
// ADMIN ID CARD REISSUANCE API ROUTE (Phase 6 & 11 Hardened)
// POST /api/admin/id-cards/[cardId]/reissue
// Increments version, rotates QR token, and records immutable audit log
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { IdCardService } from "@/server/services/id-card.service";

interface RouteContext {
  params: Promise<{ cardId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "REGISTRAR",
    ]);

    const { cardId } = await context.params;
    if (!cardId) {
      return NextResponse.json(
        { error: "Card ID or Athlete ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason?.trim() || "Administrative correction and reissuance";

    const card = await IdCardService.reissueCard(cardId, reason, admin.user_id);

    return NextResponse.json({
      success: true,
      message: `Athlete ID card successfully reissued to Version ${card.version}.`,
      card,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    console.error("[POST /api/admin/id-cards/[cardId]/reissue] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reissue athlete ID card." },
      { status: 500 }
    );
  }
}
