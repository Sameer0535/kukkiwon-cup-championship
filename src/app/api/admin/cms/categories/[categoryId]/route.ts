// ==============================================================================
// ADMIN CMS CATEGORY DETAIL & MUTATION API (PATCH /api/admin/cms/categories/[categoryId])
// Category activation, deactivation, and updates
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { CmsService } from "@/server/services/cms.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN"]);
    const { categoryId } = await params;
    const body = await req.json();

    const updated = await CmsService.updateCategory(categoryId, body, admin);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Category updated successfully.",
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update category." },
      { status }
    );
  }
}
