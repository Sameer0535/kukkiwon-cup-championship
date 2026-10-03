// ==============================================================================
// ADMIN DOCUMENT VERIFICATION API (Phase 4 & 11 Hardened)
// POST /api/admin/documents/[documentId]/verify
// Requirement 16: Admin verification foundation
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { DocumentManagementService } from "@/server/services/document-management.service";

interface RouteContext {
  params: Promise<{ documentId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "DOCUMENT_ADMIN",
      "REGISTRATION_ADMIN",
      "REGISTRAR",
    ]);

    const { documentId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const verifierName = body.verifierName || admin.full_name || "Official Admin";

    const verifiedDoc = await DocumentManagementService.verifyDocument(
      documentId,
      admin.user_id,
      verifierName
    );

    return NextResponse.json({
      success: true,
      document: verifiedDoc,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to verify document." },
      { status: 500 }
    );
  }
}
