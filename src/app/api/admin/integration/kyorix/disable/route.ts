// ==============================================================================
// DISABLE KYORIX INTEGRATION ROUTE (Phase 10)
// POST /api/admin/integration/kyorix/disable
// ==============================================================================

import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { KyorixSyncService } from "@/server/integrations/kyorix/sync.service";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN"]);

    let body: { championshipId?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Body optional
    }

    const championshipId = body.championshipId || "champ-kukkiwon-2026";
    const result = await KyorixSyncService.disableIntegration(championshipId, admin);

    return NextResponse.json({
      message: "Kyorix integration successfully disabled.",
      ...result,
    });
  } catch (err: unknown) {
    const error = err as AuthError & { message?: string };
    const status = error.statusCode || 400;
    return NextResponse.json(
      { error: error.message || "Failed to disable Kyorix integration." },
      { status }
    );
  }
}
