// ==============================================================================
// SYNC INDIVIDUAL ATHLETE REGISTRATION ROUTE (Phase 10)
// POST /api/admin/integration/kyorix/athletes/[registrationId]/sync
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
    ]);

    const { registrationId } = await context.params;

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required." },
        { status: 400 }
      );
    }

    const result = await KyorixSyncService.syncAthleteRegistration(registrationId, admin);

    return NextResponse.json({
      message: result.success
        ? "Athlete registration synchronized with Kyorix successfully."
        : "Athlete synchronization failed.",
      ...result,
    });
  } catch (err: unknown) {
    const error = err as AuthError & { message?: string; statusCode?: number };
    const status = error.statusCode || 400;
    return NextResponse.json(
      { error: error.message || "Failed to synchronize athlete." },
      { status }
    );
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ registrationId: string }> }
) {
  try {
    await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "VIEWER",
    ]);

    const { registrationId } = await context.params;
    const record = await KyorixSyncService.getSyncRecord(registrationId);

    return NextResponse.json({
      success: true,
      record,
    });
  } catch (err: unknown) {
    const error = err as AuthError & { message?: string; statusCode?: number };
    const status = error.statusCode || 500;
    return NextResponse.json(
      { error: error.message || "Failed to retrieve sync record." },
      { status }
    );
  }
}
