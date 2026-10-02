// ==============================================================================
// REGISTRANT SESSION STATUS API (GET /api/auth/me)
// Returns current authenticated user profile
// ==============================================================================

import { NextResponse } from "next/server";
import { getRegistrantSession } from "@/lib/server-auth";

export async function GET() {
  const session = await getRegistrantSession();

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      fullName: session.fullName,
      phone: session.phone,
      role: session.role,
    },
  });
}
