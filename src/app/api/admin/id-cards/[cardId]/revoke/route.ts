// ==============================================================================
// ADMIN ID CARD REVOCATION API ROUTE (Phase 6 & 11 Hardened)
// POST /api/admin/id-cards/[cardId]/revoke
// Marks ID card REVOKED with mandatory reason, recording immutable audit log
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
    const reason = body.reason?.trim();
    if (!reason) {
      return NextResponse.json(
        { error: "A valid revocation reason is required." },
        { status: 400 }
      );
    }

    const card = await IdCardService.revokeCard(cardId, reason, admin.user_id);

    return NextResponse.json({
      success: true,
      message: "Athlete ID card has been successfully revoked.",
      card,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    console.error("[POST /api/admin/id-cards/[cardId]/revoke] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke athlete ID card." },
      { status: 500 }
    );
  }
}
