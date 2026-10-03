// ==============================================================================
// REGISTRANT LOGIN API (POST /api/auth/login)
// Authenticates user and issues HTTP-only JWT session cookie
// Phase 11 Hardened: Rate-limited, brute-force protected, production safe
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyPassword, createUserToken, REGISTRANT_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/server/security/rate-limiter";
import { DEV_USERS } from "../register/route";

export async function POST(req: NextRequest) {
  // 1. Sliding-window Rate Limiting: 20 login requests / minute per client
  const rateLimit = checkRateLimit(req, { maxRequests: 20, windowSeconds: 60 });
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

    const normEmail = email.trim().toLowerCase();

    try {
      const user = await prisma.user.findUnique({
        where: { email: normEmail },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401, headers: rateLimitHeaders }
        );
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401, headers: rateLimitHeaders }
        );
      }

      const token = await createUserToken({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
      });

      const response = NextResponse.json(
        {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            role: user.role,
          },
        },
        { headers: rateLimitHeaders }
      );

      response.cookies.set(REGISTRANT_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    } catch {
      // In production, never fall back to mock users or arbitrary token issuance
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Authentication service temporarily unavailable." },
          { status: 500, headers: rateLimitHeaders }
        );
      }

      // Dev mode fallback check
      const devUser = DEV_USERS.get(normEmail);
      if (devUser) {
        const isValid = await verifyPassword(password, devUser.password_hash);
        if (!isValid) {
          return NextResponse.json(
            { error: "Invalid email or password." },
            { status: 401, headers: rateLimitHeaders }
          );
        }

        const token = await createUserToken({
          id: devUser.id,
          email: devUser.email,
          full_name: devUser.full_name,
          phone: devUser.phone,
          role: devUser.role,
        });

        const response = NextResponse.json(
          {
            success: true,
            user: {
              id: devUser.id,
              email: devUser.email,
              full_name: devUser.full_name,
              phone: devUser.phone,
              role: devUser.role,
            },
          },
          { headers: rateLimitHeaders }
        );

        response.cookies.set(REGISTRANT_COOKIE_NAME, token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
        });

        return response;
      }

      // If user logs in with demo credentials in dev offline
      const token = await createUserToken({
        id: `mock-usr-${normEmail.replace(/[^a-z0-9]/g, "")}`,
        email: normEmail,
        full_name: normEmail.split("@")[0].toUpperCase(),
        role: "REGISTRANT",
      });

      const response = NextResponse.json(
        {
          success: true,
          user: {
            id: `mock-usr-${normEmail.replace(/[^a-z0-9]/g, "")}`,
            email: normEmail,
            full_name: normEmail.split("@")[0].toUpperCase(),
            role: "REGISTRANT",
          },
        },
        { headers: rateLimitHeaders }
      );

      response.cookies.set(REGISTRANT_COOKIE_NAME, token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to authenticate session." },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
