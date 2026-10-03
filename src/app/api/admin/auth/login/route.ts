// ==============================================================================
// ADMIN AUTHENTICATION LOGIN API (POST /api/admin/auth/login)
// Requirement 1 & Phase 11 Hardened: Rate limited, brute-force protected
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/server/services/admin.service";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/server/security/rate-limiter";

export async function POST(req: NextRequest) {
  // 1. Sliding-window Rate Limiting: 15 login requests / minute per client IP
  const rateLimit = checkRateLimit(req, { maxRequests: 15, windowSeconds: 60 });
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait before retrying." },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const { token, session } = await AdminService.authenticate(
      email,
      password,
      ip,
      userAgent
    );

    const response = NextResponse.json(
      {
        success: true,
        session,
        token,
      },
      { headers: rateLimitHeaders }
    );

    // Set secure HTTP-only admin session cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    const status = err.statusCode || 401;
    return NextResponse.json(
      { error: err.message || "Authentication failed." },
      { status, headers: rateLimitHeaders }
    );
  }
}
