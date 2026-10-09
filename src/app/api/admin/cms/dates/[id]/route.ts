// ==============================================================================
// ADMIN CMS DATE MUTATION & DELETION API (PATCH & DELETE /api/admin/cms/dates/[id])
// Update and delete championship dates
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { CmsService } from "@/server/services/cms.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "CONTENT_ADMIN",
      "REGISTRATION_ADMIN",
    ]);
    const { id } = await params;
    const body = await req.json();

    const updated = await CmsService.updateDate(id, body, admin);

    try {
      revalidatePath("/");
      revalidatePath("/admin/cms");
      revalidatePath("/championship/[slug]");
    } catch {}

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Important date updated successfully.",
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update important date." },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "CONTENT_ADMIN",
      "REGISTRATION_ADMIN",
    ]);
    const { id } = await params;

    const result = await CmsService.deleteDate(id, admin);

    return NextResponse.json({
      message: "Important date deleted successfully.",
      ...result,
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to delete important date." },
      { status }
    );
  }
}
