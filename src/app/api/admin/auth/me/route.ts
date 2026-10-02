// ==============================================================================
// ADMIN CURRENT SESSION API (GET /api/admin/auth/me)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    return NextResponse.json({
      authenticated: true,
      admin,
    });
  } catch (err: any) {
    const status = err.statusCode || 401;
    return NextResponse.json(
      { authenticated: false, error: err.message },
      { status }
    );
  }
}
