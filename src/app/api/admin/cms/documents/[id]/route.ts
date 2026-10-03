// ==============================================================================
// ADMIN CMS PUBLIC DOCUMENT MUTATION & DELETION API (PATCH & DELETE /api/admin/cms/documents/[id])
// Edit or unpublish public tournament documents
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

    const updated = await CmsService.updatePublicDocument(id, body, admin);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Public document updated successfully.",
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update document." },
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

    const result = await CmsService.deletePublicDocument(id, admin);

    return NextResponse.json({
      message: "Document unpublished successfully.",
      ...result,
    });
  } catch (err: any) {
    const status = err.statusCode || 400;
    return NextResponse.json(
      { error: err.message || "Failed to unpublish document." },
      { status }
    );
  }
}
