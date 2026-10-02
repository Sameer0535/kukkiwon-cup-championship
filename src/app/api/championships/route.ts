// ==============================================================================
// PUBLIC CHAMPIONSHIPS API ROUTE
// Lists public championships without exposing administrative details
// ==============================================================================

import { NextResponse } from "next/server";
import { ChampionshipService } from "@/server/services/championship.service";

export async function GET() {
  try {
    const championships = await ChampionshipService.listPublicChampionships();
    return NextResponse.json({ success: true, data: championships });
  } catch (error: any) {
    // Never expose raw SQL errors to clients (Requirement 26)
    return NextResponse.json(
      { success: false, error: "Unable to retrieve championships at this time." },
      { status: 500 }
    );
  }
}
