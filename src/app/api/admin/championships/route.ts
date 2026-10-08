// ==============================================================================
// ADMIN CHAMPIONSHIPS MANAGEMENT API (GET, POST, PUT)
// Multi-edition tournament creation, live editing, and disk persistence
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { CmsService } from "@/server/services/cms.service";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    let championships = await CmsService.listChampionships(true);

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

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN"]);
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Championship Name is required." },
        { status: 400 }
      );
    }

    const created = await CmsService.createChampionship(body, admin);

    return NextResponse.json({
      success: true,
      message: `Championship "${created.name}" created successfully.`,
      data: created,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to create championship." },
      { status }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN"]);
    const body = await req.json();
    const { championshipId, ...input } = body;

    const targetId = championshipId || admin.assigned_championship_id || "champ-kukkiwon-2026";
    const updated = await CmsService.updateChampionship(targetId, input, admin);

    return NextResponse.json({
      success: true,
      message: `Championship "${updated.name}" updated successfully.`,
      data: updated,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to update championship." },
      { status }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN"]);
    let championshipId = req.nextUrl.searchParams.get("id") || req.nextUrl.searchParams.get("championshipId");

    if (!championshipId) {
      try {
        const body = await req.json();
        championshipId = body.id || body.championshipId;
      } catch {}
    }

    if (!championshipId) {
      return NextResponse.json(
        { error: "Championship ID is required for deletion." },
        { status: 400 }
      );
    }

    const result = await CmsService.deleteChampionship(championshipId, admin);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to delete championship." },
      { status }
    );
  }
}

