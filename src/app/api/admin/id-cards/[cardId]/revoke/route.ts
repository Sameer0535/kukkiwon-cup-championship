// ==============================================================================
// ADMIN ID CARD REVOCATION API ROUTE (Phase 6 Requirements 13, 14 & 15)
// POST /api/admin/id-cards/[cardId]/revoke
// Marks ID card REVOKED with mandatory reason, recording immutable audit log
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { IdCardService } from "@/server/services/id-card.service";

interface RouteContext {
  params: Promise<{ cardId: string }>;
}

async function verifyAdminAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const admin = await verifyAdminToken(token);
    if (admin) return admin;
  }

  const secretHeader = req.headers.get("x-admin-secret");
  if (secretHeader && secretHeader === process.env.ADMIN_BOOTSTRAP_SECRET) {
    return {
      user_id: "bootstrap-admin",
      email: "admin@kukkiwon-india.org",
      full_name: "Kukkiwon Championship Director",
      role: "SUPER_ADMIN" as const,
      expires_at: Date.now() + 86400000,
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    return await verifyAdminToken(token);
  }

  return null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Administrative authentication required." },
        { status: 401 }
      );
    }

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
    console.error("[POST /api/admin/id-cards/[cardId]/revoke] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke athlete ID card." },
      { status: 500 }
    );
  }
}
