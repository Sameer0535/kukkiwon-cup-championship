// ==============================================================================
// ADMIN REGISTRATION DETAIL API (GET /api/admin/registrations/[registrationId])
// Requirement 6: Detailed view with championship-scoping and IDOR protection
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { AdminService } from "@/server/services/admin.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "VIEWER",
    ]);

    const { registrationId } = await params;
    const details = await AdminService.getRegistrationDetails(registrationId, admin);

    return NextResponse.json({
      success: true,
      data: details,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load registration details." },
      { status }
    );
  }
}
