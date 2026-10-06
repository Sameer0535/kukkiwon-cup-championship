// ==============================================================================
// ADMIN PAYMENT / DOCUMENT REJECTION API
// POST /api/admin/documents/[documentId]/reject
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { LiveSyncService } from "@/server/services/live-sync.service";
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
      "FINANCE_ADMIN",
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

    // 1. Try LiveSyncService rejection
    try {
      const syncResult = LiveSyncService.rejectPayment(documentId, rejectionReason, verifierName);
      return NextResponse.json({
        message: "Payment rejected.",
        ...syncResult,
      });
    } catch {
      // 2. Fallback to DocumentManagementService
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
    }
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to reject payment." },
      { status: 500 }
    );
  }
}
