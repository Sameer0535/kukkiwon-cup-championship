// ==============================================================================
// PUBLIC ATHLETE VERIFICATION API ROUTE (Phase 6 Requirements 4, 5 & 12)
// GET /api/verify/athlete/[publicToken]
// Public accreditation lookup: returns safe public profile, never leaks private PII
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { IdCardService } from "@/server/services/id-card.service";

interface RouteContext {
  params: Promise<{ publicToken: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { publicToken } = await context.params;

    if (!publicToken || publicToken.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Verification token is required.",
          data: {
            isValid: false,
            status: "NOT_FOUND",
            message: "Missing verification token.",
          },
        },
        { status: 400 }
      );
    }

    const verification = await IdCardService.verifyByPublicToken(publicToken);

    const httpStatus =
      verification.status === "VERIFIED"
        ? 200
        : verification.status === "REVOKED"
        ? 200 // 200 with clear REVOKED status payload
        : 404;

    return NextResponse.json(
      {
        success: verification.isValid,
        data: verification,
      },
      { status: httpStatus }
    );
  } catch (error) {
    console.error("[GET /api/verify/athlete/[publicToken]] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Verification service temporarily unavailable.",
        data: {
          isValid: false,
          status: "NOT_FOUND",
          message: "Internal verification error.",
        },
      },
      { status: 500 }
    );
  }
}
