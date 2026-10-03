// ==============================================================================
// ADMIN KYORIX INTEGRATION STATUS ROUTE (Phase 10)
// GET /api/admin/integration/kyorix
// ==============================================================================

import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { KyorixSyncService } from "@/server/integrations/kyorix/sync.service";

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "VIEWER",
    ]);

    const { searchParams } = new URL(req.url);
    const championshipId = searchParams.get("championshipId") || "champ-kukkiwon-2026";

    // Multi-Championship IDOR Isolation
    if (
      admin.assigned_championship_id &&
      admin.assigned_championship_id !== championshipId
    ) {
      return NextResponse.json(
        { error: "Forbidden: Scoped admin cannot inspect other championships." },
        { status: 403 }
      );
    }

    const status = await KyorixSyncService.getIntegrationStatus(championshipId);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (err: unknown) {
    const error = err as AuthError & { message?: string };
    const status = error.statusCode || 500;
    return NextResponse.json(
      { error: error.message || "Failed to retrieve integration status." },
      { status }
    );
  }
}
