// ==============================================================================
// USER REGISTRATIONS DASHBOARD API (GET /api/registrations/my)
// REQUIREMENT 12: Private endpoint listing only the current user's registrations
// ==============================================================================

import { NextResponse } from "next/server";
import { getRegistrantSession } from "@/lib/server-auth";
import { RegistrationFlowService } from "@/server/services/registration-flow.service";

export async function GET() {
  try {
    const session = await getRegistrantSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const registrations = await RegistrationFlowService.listUserRegistrations(session.userId);

    return NextResponse.json({ success: true, registrations });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load registrations." },
      { status: 500 }
    );
  }
}
