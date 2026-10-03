// ==============================================================================
// ADMIN CMS FAQ MUTATION & DELETION API (PATCH & DELETE /api/admin/cms/faqs/[id])
// Update and delete championship FAQs
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { CmsService } from "@/server/services/cms.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN"]);
    const { id } = await params;
    const body = await req.json();

    const updated = await CmsService.updateFAQ(id, body, admin);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "FAQ updated successfully.",
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update FAQ." },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN"]);
    const { id } = await params;

    const result = await CmsService.deleteFAQ(id, admin);

    return NextResponse.json({
      message: "FAQ deleted successfully.",
      ...result,
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to delete FAQ." },
      { status }
    );
  }
}
