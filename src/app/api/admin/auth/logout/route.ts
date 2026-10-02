// ==============================================================================
// ADMIN LOGOUT API (POST /api/admin/auth/logout)
// ==============================================================================

import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Admin session cleared.",
  });

  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
