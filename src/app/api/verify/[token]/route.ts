// ==============================================================================
// QR VERIFICATION API ROUTE (Requirement 14)
// Validates cryptographic token and returns privacy-preserving accreditation status
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { IdCardService } from "@/server/services/id-card.service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token || token.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid verification token." },
        { status: 400 }
      );
    }

    // Demo token fallback for Phase 1 verification preview
    if (token === "demo-token") {
      return NextResponse.json({
        success: true,
        data: {
          is_valid: true,
          card_status: "GENERATED",
          card_number: "CARD-KC26-DEMO01",
          participant_name: "Master Rahul Sharma",
          designation: "Athlete",
          nationality: "India",
          flag_identifier: "🇮🇳",
          championship_name: "Kukkiwon Cup Championship 2026",
          registration_number: "REG-KC26-A1001",
          verified_at: new Date().toISOString(),
          message: "Official Kukkiwon Cup accreditation verified.",
        },
      });
    }

    const verificationResult = await IdCardService.verifyByQrToken(token);

    return NextResponse.json({
      success: true,
      data: verificationResult,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Verification system error." },
      { status: 500 }
    );
  }
}
