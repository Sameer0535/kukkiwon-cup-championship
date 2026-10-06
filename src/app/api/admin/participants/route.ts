// ==============================================================================
// ADMIN MASTER PARTICIPANTS DIRECTORY API (GET /api/admin/participants)
// Live synchronized directory of all registered Athletes and Coaches
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { LiveSyncService } from "@/server/services/live-sync.service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "DOCUMENT_ADMIN",
      "FINANCE_ADMIN",
      "VIEWER",
    ]);

    const url = new URL(request.url);
    const designation = url.searchParams.get("designation") || undefined;
    const q = url.searchParams.get("q") || undefined;

    const participants = LiveSyncService.listMasterParticipants({
      designation,
      q,
    });

    return NextResponse.json({
      success: true,
      participants,
      total: participants.length,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to load master participants." },
      { status: 500 }
    );
  }
}
