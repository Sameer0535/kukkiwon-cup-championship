// ==============================================================================
// ADMIN DOCUMENT REJECTION API (Phase 4 & 11 Hardened)
// POST /api/admin/documents/[documentId]/reject
// Requirement 16: Admin document rejection with mandatory reason
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
    const body = await request.json();
    const rejectionReason = body.rejectionReason || body.reason;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return NextResponse.json(
        { error: "A rejection reason is mandatory." },
        { status: 400 }
      );
    }

    const verifierName = body.verifierName || admin.full_name || "Official Admin";

    const rejectedDoc = await DocumentManagementService.rejectDocument(
      documentId,
      admin.user_id,
      rejectionReason,
      verifierName
    );

    return NextResponse.json({
      success: true,
      document: rejectedDoc,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to reject document." },
      { status: 500 }
    );
  }
}
