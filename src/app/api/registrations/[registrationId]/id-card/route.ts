// ==============================================================================
// ATHLETE ID CARD API ROUTE (Phase 6 Requirement 12)
// POST: Generates or retrieves existing valid ID card (idempotent)
// GET: Retrieves card metadata, status, and eligibility
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/server-auth";
import { IdCardService } from "@/server/services/id-card.service";

interface RouteContext {
  params: Promise<{ registrationId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const adminSession = await getAdminSession(request);
    if (!adminSession) {
      return NextResponse.json(
        { error: "Unauthorized: Athlete ID cards can only be generated in the admin panel by administrators once payment is verified." },
        { status: 403 }
      );
    }

    const { registrationId } = await context.params;
    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required." },
        { status: 400 }
      );
    }

    const card = await IdCardService.generateCard(registrationId, adminSession.user_id);

    return NextResponse.json({
      success: true,
      card,
    });
  } catch (error: any) {
    console.error("[POST /api/registrations/[registrationId]/id-card] Error:", error);
    const message = error.message || "Failed to generate athlete ID card.";
    const isForbidden =
      message.includes("Unauthorized") ||
      message.includes("permission") ||
      message.includes("Authentication");
    const isEligibilityError =
      message.includes("Cannot generate") ||
      message.includes("not eligible") ||
      message.includes("payment");

    return NextResponse.json(
      { error: message },
      { status: isForbidden ? 403 : isEligibilityError ? 400 : 500 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const adminSession = await getAdminSession(request);
    if (!adminSession) {
      return NextResponse.json(
        { error: "Unauthorized: Athlete ID cards can only be accessed by administrators." },
        { status: 403 }
      );
    }

    const { registrationId } = await context.params;
    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required." },
        { status: 400 }
      );
    }

    const eligibility = await IdCardService.canGenerateAthleteIdCard(registrationId, adminSession.user_id);
    const card = await IdCardService.getCardByRegistrationId(registrationId, adminSession.user_id);

    return NextResponse.json({
      success: true,
      eligibility,
      card,
    });
  } catch (error: any) {
    console.error("[GET /api/registrations/[registrationId]/id-card] Error:", error);
    const message = error.message || "Failed to retrieve athlete ID card.";
    const isForbidden =
      message.includes("Unauthorized") ||
      message.includes("permission") ||
      message.includes("Authentication");

    return NextResponse.json(
      { error: message },
      { status: isForbidden ? 403 : 500 }
    );
  }
}
