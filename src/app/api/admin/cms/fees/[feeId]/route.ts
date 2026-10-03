// ==============================================================================
// ADMIN CMS FEE MUTATION API (PATCH /api/admin/cms/fees/[feeId])
// Updating fee structure and amounts
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { CmsService } from "@/server/services/cms.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ feeId: string }> }
) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "FINANCE_ADMIN"]);
    const { feeId } = await params;
    const body = await req.json();

    const updated = await CmsService.updateFee(feeId, body, admin);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Fee rule updated successfully.",
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update fee rule." },
      { status }
    );
  }
}
