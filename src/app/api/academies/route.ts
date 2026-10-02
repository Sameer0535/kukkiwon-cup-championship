// ==============================================================================
// ACADEMIES API (GET /api/academies & POST /api/academies)
// Search recognized academies and register new academy organizations
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { AcademyService } from "@/server/services/academy.service";
import { getRegistrantSession } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

    const academies = await AcademyService.search(query, limit);
    return NextResponse.json({ academies });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to search academies." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRegistrantSession();
    const body = await req.json();
    const {
      name,
      short_name,
      country,
      state,
      city,
      address,
      email,
      phone,
      website,
      head_coach_name,
      representative_name,
      representative_email,
      representative_phone,
      representative_role,
    } = body;

    if (!name || !state || !city) {
      return NextResponse.json(
        { error: "Academy name, state, and city are mandatory." },
        { status: 400 }
      );
    }

    const academy = await AcademyService.create(
      {
        name,
        short_name,
        country: country || "India",
        state,
        city,
        address,
        email,
        phone,
        website,
        head_coach_name,
        representative_name,
        representative_email,
        representative_phone,
        representative_role,
      },
      session?.userId
    );

    return NextResponse.json({ success: true, academy });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to register academy." },
      { status: 500 }
    );
  }
}
