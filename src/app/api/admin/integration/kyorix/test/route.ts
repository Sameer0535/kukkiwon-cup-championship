// ==============================================================================
// TEST KYORIX CONNECTION ROUTE (Phase 10)
// POST /api/admin/integration/kyorix/test
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

    const result = await KyorixSyncService.testConnection(admin);

    return NextResponse.json({
      ...result,
    });
  } catch (err: unknown) {
    const error = err as AuthError & { message?: string };
    const status = error.statusCode || 500;
    return NextResponse.json(
      { error: error.message || "Failed to test Kyorix connection." },
      { status }
    );
  }
}
