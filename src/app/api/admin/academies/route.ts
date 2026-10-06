// ==============================================================================
// ADMIN ACADEMIES DIRECTORY API (GET /api/admin/academies)
// Real-time metrics and directory of all registered academies and dojangs
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
    const q = url.searchParams.get("q") || undefined;

    const data = LiveSyncService.listAcademies({ q });

    return NextResponse.json({
      success: true,
      academies: data.academies,
      metrics: data.metrics,
      total: data.academies.length,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to load academies directory." },
      { status: 500 }
    );
  }
}
