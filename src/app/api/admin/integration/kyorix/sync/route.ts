// ==============================================================================
// BULK SYNCHRONIZE ELIGIBLE REGISTRATIONS ROUTE (Phase 10)
// POST /api/admin/integration/kyorix/sync
// ==============================================================================

import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { KyorixSyncService } from "@/server/integrations/kyorix/sync.service";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
    ]);

    let body: { championshipId?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Body optional
    }

    const championshipId = body.championshipId || "champ-kukkiwon-2026";

    // Multi-championship IDOR protection
    if (
      admin.assigned_championship_id &&
      admin.assigned_championship_id !== championshipId
    ) {
      return NextResponse.json(
        { error: "Forbidden: Scoped admin cannot synchronize other championships." },
        { status: 403 }
      );
    }

    const result = await KyorixSyncService.syncEligibleRegistrations(championshipId, admin);

    return NextResponse.json({
      success: true,
      message: `Bulk synchronization completed: ${result.syncedCount} synced, ${result.failedCount} failed out of ${result.totalEligible} eligible.`,
      ...result,
    });
  } catch (err: unknown) {
    const error = err as AuthError & { message?: string; statusCode?: number };
    const status = error.statusCode || 400;
    return NextResponse.json(
      { error: error.message || "Failed to execute bulk synchronization." },
      { status }
    );
  }
}
