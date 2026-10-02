// ==============================================================================
// CATEGORIES API (GET /api/categories)
// Returns championship categories filtered by eligibility criteria
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "@/server/services/category.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const discipline = searchParams.get("discipline") || undefined;
    const dob = searchParams.get("dob") || undefined;
    const gender = searchParams.get("gender") || undefined;
    const belt = searchParams.get("belt") || undefined;
    const weightStr = searchParams.get("weight");
    const weight = weightStr ? parseFloat(weightStr) : undefined;

    // If eligibility parameters are provided, return filtered eligible categories
    if (dob || gender || weight !== undefined || belt) {
      const categories = await CategoryService.getEligibleCategories({
        discipline,
        dob,
        gender,
        belt,
        weight,
      });
      return NextResponse.json({ categories });
    }

    // Otherwise return all categories for discipline
    const categories = await CategoryService.listCategories(undefined, discipline);
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load categories." },
      { status: 500 }
    );
  }
}
