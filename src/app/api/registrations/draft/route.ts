// ==============================================================================
// REGISTRATION DRAFT API (POST & GET /api/registrations/draft)
// REQUIREMENT 11: Save & Continue Later / Resume Incomplete Registration
// Strict IDOR Protection: User can only access their own drafts
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
        { error: "Authentication required to save registration drafts. Please sign in or create an account." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { registrationId, participantType, championshipId, draftData } = body;

    if (!participantType || !draftData) {
      return NextResponse.json(
        { error: "Missing required draft parameters." },
        { status: 400 }
      );
    }

    const result = await RegistrationFlowService.saveDraft({
      userId: session.userId,
      registrationId,
      participantType: participantType as ParticipantType,
      championshipId,
      draftData,
    });

    return NextResponse.json({
      success: true,
      registrationId: result.registrationId,
      registrationNumber: result.registrationNumber,
      message: "Draft saved successfully. You can return and resume at any time.",
    });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to save registration draft." },
      { status }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getRegistrantSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to resume registration drafts." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const registrationId = searchParams.get("registrationId");

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required." },
        { status: 400 }
      );
    }

    const draft = await RegistrationFlowService.getDraft(registrationId, session.userId);

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, draft });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to load registration draft." },
      { status }
    );
  }
}
