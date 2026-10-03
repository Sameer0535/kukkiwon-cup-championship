// ==============================================================================
// KYORIX SYNCHRONIZATION RECORDS LIST ROUTE (Phase 10)
// GET /api/admin/integration/kyorix/records
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    // Multi-Championship IDOR Isolation
    if (
      admin.assigned_championship_id &&
      admin.assigned_championship_id !== championshipId
    ) {
      return NextResponse.json(
        { error: "Forbidden: Scoped admin cannot view other championship records." },
        { status: 403 }
      );
    }

    const result = await KyorixSyncService.listSyncRecords(championshipId, {
      page,
      pageSize,
      status,
      search,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const error = err as AuthError & { message?: string; statusCode?: number };
    const status = error.statusCode || 500;
    return NextResponse.json(
      { error: error.message || "Failed to list synchronization records." },
      { status }
    );
  }
}
