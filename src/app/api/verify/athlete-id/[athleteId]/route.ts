import { NextRequest, NextResponse } from "next/server";
import { IdCardService } from "@/server/services/id-card.service";
import { checkRateLimit } from "@/server/security/rate-limiter";
import { AuditService } from "@/server/services/audit.service";
import { createHash } from "crypto";

// ==============================================================================
// PUBLIC ATHLETE MANUAL VERIFICATION BY ATHLETE ID (Phase 7 Requirement 14)
// GET /api/verify/athlete-id/[athleteId]
// Allows on-site officials to manually verify an athlete via sequential Athlete ID
// Strictly rate-limited (30 req/min) to prevent brute-force enumeration.
// Exposes ONLY public accreditation data, never private PII or payment info.
// ==============================================================================

const SECURITY_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ athleteId: string }> }
) {
  // 1. Rate Limiting (Conservative 30 req/min for manual lookup to prevent enumeration)
  const rateLimit = checkRateLimit(req, {
    maxRequests: 30,
    windowSeconds: 60,
  });

  const responseHeaders = {
    ...SECURITY_HEADERS,
    ...rateLimit.headers,
  };

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Too many verification requests.",
        retryAfter: rateLimit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          ...responseHeaders,
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  const clientFingerprint = createHash("sha256")
    .update(
      req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") ||
      "anonymous-client"
    )
    .digest("hex")
    .substring(0, 16);

  try {
    const { athleteId } = await params;

    // 2. Input validation (Athlete IDs are alphanumeric with hyphens, e.g. KKC26-ATH-000001)
    if (!athleteId || typeof athleteId !== "string" || !/^[A-Z0-9-]{3,32}$/i.test(athleteId.trim())) {
      return NextResponse.json(
        {
          isValid: false,
          status: "NOT_FOUND",
          message: "ACCREDITATION NOT FOUND",
          verifiedAt: new Date().toISOString(),
        },
        { status: 404, headers: responseHeaders }
      );
    }

    const cleanAthleteId = athleteId.trim().toUpperCase();

    // 3. Service Lookup
    const result = await IdCardService.verifyByAthleteId(cleanAthleteId);

    // 4. Safe Privacy-Preserving Audit Logging
    AuditService.logAction({
      action: result.isValid
        ? "PUBLIC_ATHLETE_VERIFICATION"
        : "PUBLIC_ATHLETE_VERIFICATION_FAILED",
      entityType: "IdCard",
      entityId: result.athleteId || cleanAthleteId,
      newValue: {
        method: "MANUAL_ATHLETE_ID",
        status: result.status,
        clientHash: clientFingerprint,
      },
    }).catch(() => {});

    // 5. Response handling
    if (result.status === "NOT_FOUND") {
      return NextResponse.json(result, {
        status: 404,
        headers: responseHeaders,
      });
    }

    if (result.status === "REVOKED") {
      return NextResponse.json(result, {
        status: 200,
        headers: responseHeaders,
      });
    }

    return NextResponse.json(result, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    // Phase 7 Requirement 20: Never expose internal technical errors
    return NextResponse.json(
      {
        isValid: false,
        status: "NOT_FOUND",
        message: "ACCREDITATION NOT FOUND",
        verifiedAt: new Date().toISOString(),
      },
      { status: 404, headers: responseHeaders }
    );
  }
}
