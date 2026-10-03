// ==============================================================================
// RETRY FAILED ATHLETE SYNCHRONIZATION ROUTE (Phase 10)
// POST /api/admin/integration/kyorix/athletes/[registrationId]/retry
// ==============================================================================

import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { KyorixSyncService } from "@/server/integrations/kyorix/sync.service";

export async function POST(
  req: Request,
  context: { params: Promise<{ registrationId: string }> }
) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
    ]);

    const { registrationId } = await context.params;

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required." },
        { status: 400 }
      );
    }

    const result = await KyorixSyncService.retryAthleteSync(registrationId, admin);

    return NextResponse.json({
      message: result.success
        ? "Synchronization retry completed successfully."
        : "Synchronization retry failed.",
      ...result,
    });
  } catch (err: unknown) {
    const error = err as AuthError & { message?: string; statusCode?: number };
    const status = error.statusCode || 400;
    return NextResponse.json(
      { error: error.message || "Failed to retry synchronization." },
      { status }
    );
  }
}
