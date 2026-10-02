// ==============================================================================
// PARTICIPANT DOCUMENT DETAIL API (GET & DELETE)
// Authorized temporary access URL generation and deletion checks
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRegistrantSession } from "@/lib/server-auth";
import { DocumentManagementService } from "@/server/services/document-management.service";

interface RouteContext {
  params: Promise<{ registrationId: string; documentId: string }>;
}

/**
 * REQUIREMENT 13 & 15: GET /api/registrations/[registrationId]/documents/[documentId]
 * Retrieve document metadata and private authorized temporary signed URL
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getRegistrantSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { registrationId, documentId } = await context.params;

    const document = await DocumentManagementService.getDocumentDetails({
      userId: session.userId,
      registrationId,
      documentId,
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error: any) {
    const isForbidden = error.message?.includes("Forbidden") || error.message?.includes("denied");
    return NextResponse.json(
      { error: error.message || "Failed to retrieve document." },
      { status: isForbidden ? 403 : 500 }
    );
  }
}

/**
 * REQUIREMENT 13: DELETE /api/registrations/[registrationId]/documents/[documentId]
 * Allows document deletion only where business rules permit (not verified)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getRegistrantSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { registrationId, documentId } = await context.params;

    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    const result = await DocumentManagementService.deleteDocument({
      userId: session.userId,
      registrationId,
      documentId,
      ipAddress: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      readiness: result.readiness,
    });
  } catch (error: any) {
    const isForbidden = error.message?.includes("Forbidden") || error.message?.includes("permission");
    const isConflict = error.message?.includes("Cannot delete");
    return NextResponse.json(
      { error: error.message || "Failed to delete document." },
      { status: isForbidden ? 403 : isConflict ? 409 : 500 }
    );
  }
}
