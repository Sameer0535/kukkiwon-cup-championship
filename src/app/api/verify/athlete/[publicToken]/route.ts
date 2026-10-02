// ==============================================================================
// PUBLIC ATHLETE VERIFICATION API ROUTE (Phase 7 Hardened)
// GET /api/verify/athlete/[publicToken]
// Public accreditation lookup: rate-limited, privacy-hardened, anti-enumeration,
// cache-restricted, and strictly non-indexed
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { IdCardService } from "@/server/services/id-card.service";
import {
  checkRateLimit,
  getAnonymizedClientIdentifier,
  getRateLimitHeaders,
} from "@/server/security/rate-limiter";
import { AuditService } from "@/server/services/audit.service";

interface RouteContext {
  params: Promise<{ publicToken: string }>;
}

/**
 * Standard hardened security & anti-caching headers for verification responses
 */
function getSecurityHeaders(rateLimitHeaders: Record<string, string>): HeadersInit {
  return {
    ...rateLimitHeaders,
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const clientId = getAnonymizedClientIdentifier(request);

  // 1. Sliding-window Rate Limiting: 60 requests / minute per client
  const rateLimit = checkRateLimit(clientId, { maxRequests: 60, windowMs: 60 * 1000 });
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many verification requests. Please try again later.",
        data: {
          isValid: false,
          status: "NOT_FOUND",
          message: "Rate limit exceeded. Please wait before retrying.",
        },
      },
      {
        status: 429,
        headers: getSecurityHeaders(rateLimitHeaders),
      }
    );
  }

  try {
    const { publicToken } = await context.params;

    // 2. Anti-enumeration token validation: reject malformed or non-token strings cleanly
    if (!publicToken || publicToken.trim().length === 0 || publicToken.length > 256) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid accreditation token format.",
          data: {
            isValid: false,
            status: "NOT_FOUND",
            message: "ACCREDITATION NOT FOUND",
          },
        },
        {
          status: 400,
          headers: getSecurityHeaders(rateLimitHeaders),
        }
      );
    }

    // 3. Resolve credential
    const verification = await IdCardService.verifyByPublicToken(publicToken.trim());

    // 4. Record audit event with safe privacy-preserving metadata
    AuditService.logAction({
      action:
        verification.status === "VERIFIED"
          ? "PUBLIC_ATHLETE_VERIFICATION"
          : "PUBLIC_ATHLETE_VERIFICATION_FAILED",
      entityType: "IdCard",
      entityId: verification.athleteId || "unresolved",
      newValue: {
        status: verification.status,
        clientHash: clientId,
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {});

    // 5. Response status mapping
    const httpStatus =
      verification.status === "VERIFIED"
        ? 200
        : verification.status === "REVOKED"
        ? 200 // 200 with unambiguous REVOKED payload
        : 404;

    return NextResponse.json(
      {
        success: verification.isValid,
        data: verification,
      },
      {
        status: httpStatus,
        headers: getSecurityHeaders(rateLimitHeaders),
      }
    );
  } catch (error) {
    // 6. Generic sanitized failure: never expose stack traces, database details, or file paths
    console.error("[GET /api/verify/athlete/[publicToken]] Internal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Accreditation verification service temporarily unavailable.",
        data: {
          isValid: false,
          status: "NOT_FOUND",
          message: "ACCREDITATION NOT FOUND",
        },
      },
      {
        status: 500,
        headers: getSecurityHeaders(rateLimitHeaders),
      }
    );
  }
}
