// ==============================================================================
// REGISTRATION SUBMISSION API (POST /api/registrations/submit)
// REQUIREMENT 14: Server-side validation and atomic status transition to SUBMITTED
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRegistrantSession } from "@/lib/server-auth";
import { RegistrationFlowService } from "@/server/services/registration-flow.service";
import { ParticipantType } from "@/types/registration";

export async function POST(req: NextRequest) {
  try {
    const session = await getRegistrantSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to submit championship registration." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { registrationId, participantType, draftData } = body;

    if (!participantType || !draftData) {
      return NextResponse.json(
        { error: "Missing required registration parameters." },
        { status: 400 }
      );
    }

    const result = await RegistrationFlowService.submitRegistration({
      registrationId,
      userId: session.userId,
      participantType: participantType as ParticipantType,
      draftData,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized")
      ? 403
      : error.message?.includes("Eligibility") || error.message?.includes("Missing")
      ? 400
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to submit championship registration." },
      { status }
    );
  }
}
