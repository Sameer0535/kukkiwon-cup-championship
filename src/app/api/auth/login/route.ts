// ==============================================================================
// REGISTRANT LOGIN API (POST /api/auth/login)
// Authenticates user and issues HTTP-only JWT session cookie
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyPassword, createUserToken, REGISTRANT_COOKIE_NAME } from "@/lib/auth";
import { DEV_USERS } from "../register/route";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
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
          { status: 401 }
        );
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }

      const token = await createUserToken({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
        },
      });

      response.cookies.set(REGISTRANT_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    } catch {
      // Dev mode fallback check
      const devUser = DEV_USERS.get(normEmail);
      if (devUser) {
        const isValid = await verifyPassword(password, devUser.password_hash);
        if (!isValid) {
          return NextResponse.json(
            { error: "Invalid email or password." },
            { status: 401 }
          );
        }

        const token = await createUserToken({
          id: devUser.id,
          email: devUser.email,
          full_name: devUser.full_name,
          phone: devUser.phone,
          role: devUser.role,
        });

        const response = NextResponse.json({
          success: true,
          user: {
            id: devUser.id,
            email: devUser.email,
            full_name: devUser.full_name,
            phone: devUser.phone,
            role: devUser.role,
          },
        });

        response.cookies.set(REGISTRANT_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
        });

        return response;
      }

      // If user logs in with demo credentials in dev
      const token = await createUserToken({
        id: `mock-usr-${normEmail.replace(/[^a-z0-9]/g, "")}`,
        email: normEmail,
        full_name: normEmail.split("@")[0].toUpperCase(),
        role: "REGISTRANT",
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: `mock-usr-${normEmail.replace(/[^a-z0-9]/g, "")}`,
          email: normEmail,
          full_name: normEmail.split("@")[0].toUpperCase(),
          role: "REGISTRANT",
        },
      });

      response.cookies.set(REGISTRANT_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to authenticate session." },
      { status: 500 }
    );
  }
}
