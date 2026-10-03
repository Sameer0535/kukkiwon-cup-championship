// ==============================================================================
// MAP CHAMPIONSHIP TO KYORIX ROUTE (Phase 10)
// POST /api/admin/integration/kyorix/championship
// ==============================================================================

import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { KyorixSyncService } from "@/server/integrations/kyorix/sync.service";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN"]);

    const body = await req.json();
    const { championshipId, kyorixChampionshipId, kyorixChampionshipName, syncMode } = body;

    if (!kyorixChampionshipId?.trim()) {
      return NextResponse.json(
        { error: "Kyorix Championship ID is required." },
        { status: 400 }
      );
    }

    const mapping = await KyorixSyncService.mapChampionship(
      {
        championshipId: championshipId || "champ-kukkiwon-2026",
        kyorixChampionshipId: kyorixChampionshipId.trim(),
        kyorixChampionshipName: kyorixChampionshipName?.trim(),
        syncMode: syncMode === "AUTOMATIC" ? "AUTOMATIC" : "MANUAL",
      },
      admin
    );

    return NextResponse.json({
      success: true,
      message: "Championship successfully mapped to Kyorix event.",
      mapping,
    });
  } catch (err: unknown) {
    const error = err as AuthError & { message?: string };
    const status = error.statusCode || 400;
    return NextResponse.json(
      { error: error.message || "Failed to map championship." },
      { status }
    );
  }
}
