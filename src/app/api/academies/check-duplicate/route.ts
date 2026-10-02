// ==============================================================================
// ACADEMY DUPLICATE DETECTION API (POST /api/academies/check-duplicate)
// REQUIREMENT 9: Proactive duplicate prevention before academy creation
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { AcademyService } from "@/server/services/academy.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, country, city, email } = body;

    if (!name || !city) {
      return NextResponse.json({ isDuplicate: false, matches: [] });
    }

    const result = await AcademyService.checkDuplicate({
      name,
      country: country || "India",
      city,
      email,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Duplicate check failed." },
      { status: 500 }
    );
  }
}
