// ==============================================================================
// REGISTRANT SIGN-UP API (POST /api/auth/register)
// Creates new participant/registrant account with secure PBKDF2 hashing
// Phase 11 Hardened: Rate-limited, brute-force protected, production safe
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, createUserToken, REGISTRANT_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/server/security/rate-limiter";

// In-memory fallback user store for dev mode
interface FallbackUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string | null;
  role: string;
}
export const DEV_USERS: Map<string, FallbackUser> = new Map();

export async function POST(req: NextRequest) {
  // 1. Sliding-window Rate Limiting: 15 registration requests / minute per client
  const rateLimit = checkRateLimit(req, { maxRequests: 15, windowSeconds: 60 });
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please wait before retrying." },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, full_name, phone } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, password, and full name are required." },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const normEmail = email.trim().toLowerCase();
    if (!normEmail.includes("@") || !normEmail.includes(".")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const passwordHash = await hashPassword(password);

    try {
      // Check existing in DB
      const existing = await prisma.user.findUnique({
        where: { email: normEmail },
      });

      if (existing) {
        return NextResponse.json(
          { error: "An account with this email address already exists. Please sign in instead." },
          { status: 409, headers: rateLimitHeaders }
        );
      }

      const user = await prisma.user.create({
        data: {
          email: normEmail,
          password_hash: passwordHash,
          full_name: full_name.trim(),
          phone: phone?.trim() || null,
          role: "REGISTRANT",
        },
      });

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
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return response;
    } catch {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Registration service temporarily unavailable." },
          { status: 500, headers: rateLimitHeaders }
        );
      }

      // Dev mode fallback
      if (DEV_USERS.has(normEmail)) {
        return NextResponse.json(
          { error: "An account with this email address already exists. Please sign in instead." },
          { status: 409, headers: rateLimitHeaders }
        );
      }

      const mockUser: FallbackUser = {
        id: `usr-${Date.now()}`,
        email: normEmail,
        password_hash: passwordHash,
        full_name: full_name.trim(),
        phone: phone?.trim() || null,
        role: "REGISTRANT",
      };
      DEV_USERS.set(normEmail, mockUser);

      const token = await createUserToken({
        id: mockUser.id,
        email: mockUser.email,
        full_name: mockUser.full_name,
        phone: mockUser.phone,
        role: mockUser.role,
      });

      const response = NextResponse.json(
        {
          success: true,
          user: {
            id: mockUser.id,
            email: mockUser.email,
            full_name: mockUser.full_name,
            phone: mockUser.phone,
            role: mockUser.role,
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
      { error: error.message || "Failed to create registrant account." },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
