// ==============================================================================
// ADMIN REGISTRATION STATUS TRANSITION API (POST /api/admin/registrations/[registrationId]/status)
// Requirement 16: State machine transition with mandatory audit and reasons
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { AdminService } from "@/server/services/admin.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
    ]);

    const { registrationId } = await params;
    const body = await req.json().catch(() => ({}));
    const { status, reason } = body;

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { error: "Target status is required." },
        { status: 400 }
      );
    }

    const result = await AdminService.updateRegistrationStatus(
      registrationId,
      status.toUpperCase(),
      reason || "",
      admin
    );

    return NextResponse.json(result);
  } catch (err: any) {
    const statusCode = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update registration status." },
      { status: statusCode }
    );
  }
}
