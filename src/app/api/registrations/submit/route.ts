// ==============================================================================
// REGISTRATION SUBMISSION API (POST /api/registrations/submit)
// REQUIREMENT 14: Server-side validation and atomic status transition to SUBMITTED
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRegistrantSession } from "@/lib/server-auth";
import { RegistrationFlowService } from "@/server/services/registration-flow.service";
import { ParticipantType } from "@/types/registration";

import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getRegistrantSession();
    const body = await req.json();
    const { registrationId, participantType, draftData } = body;

    if (!participantType || !draftData) {
      return NextResponse.json(
        { error: "Missing required registration parameters." },
        { status: 400 }
      );
    }

    let userId = session?.userId;
    if (!userId) {
      const email = (draftData.email || "").trim().toLowerCase() || `athlete_${Date.now()}@kukkiwoncup.local`;
      const name = `${draftData.first_name || ""} ${draftData.last_name || ""}`.trim() || "Competitor";
      try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          userId = existing.id;
        } else {
          const created = await prisma.user.create({
            data: {
              email,
              full_name: name,
              phone: draftData.phone || null,
              password_hash: "direct_" + Date.now(),
              role: "ATHLETE",
            },
          });
          userId = created.id;
        }
      } catch {
        userId = `guest-${Buffer.from(email).toString("hex").slice(0, 16) || "anon"}`;
      }
    }

    const result = await RegistrationFlowService.submitRegistration({
      registrationId,
      userId,
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
