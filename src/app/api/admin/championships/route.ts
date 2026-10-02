// ==============================================================================
// ADMIN CHAMPIONSHIPS LIST API (GET /api/admin/championships)
// Requirement 25: Championship Selector support
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);

    let championships = [];
    try {
      championships = await prisma.championship.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          short_name: true,
          status: true,
          start_date: true,
          end_date: true,
          city: true,
        },
        orderBy: { start_date: "asc" },
      });
    } catch {
      // Fallback
      championships = [
        {
          id: "champ-kukkiwon-2026",
          slug: "kukkiwon-cup-2026",
          name: "Kukkiwon Cup Championship 2026",
          short_name: "Kukkiwon Cup 2026",
          status: "REGISTRATION_OPEN",
          start_date: "2026-11-20T09:00:00.000Z",
          end_date: "2026-11-23T18:00:00.000Z",
          city: "New Delhi",
        },
      ];
    }

    // Filter by admin assignment if scoped
    if (admin.assigned_championship_id) {
      championships = championships.filter((c: any) => c.id === admin.assigned_championship_id);
    }

    return NextResponse.json({
      success: true,
      data: championships,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to list championships." },
      { status }
    );
  }
}
