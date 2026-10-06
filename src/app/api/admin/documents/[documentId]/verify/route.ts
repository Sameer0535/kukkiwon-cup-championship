// ==============================================================================
// ADMIN PAYMENT / DOCUMENT VERIFICATION APPROVAL API
// POST /api/admin/documents/[documentId]/verify
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
    const body = await request.json().catch(() => ({}));
    const verifierName = body.verifierName || admin.full_name || "Official Admin";

    // 1. Try LiveSyncService payment approval
    try {
      const syncResult = LiveSyncService.approvePayment(documentId, verifierName);
      return NextResponse.json({
        message: "Payment verified and registration approved successfully.",
        ...syncResult,
      });
    } catch {
      // 2. Fallback to DocumentManagementService if it was a file document ID
      const verifiedDoc = await DocumentManagementService.verifyDocument(
        documentId,
        admin.user_id,
        verifierName
      );

      return NextResponse.json({
        success: true,
        document: verifiedDoc,
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
      { error: error.message || "Failed to verify payment." },
      { status: 500 }
    );
  }
}
