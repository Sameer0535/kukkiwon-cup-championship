// ==============================================================================
// DOCUMENT REPLACE API (POST /api/registrations/[registrationId]/documents/[documentId]/replace)
// Replaces an existing document while preserving audit version history
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRegistrantSession } from "@/lib/server-auth";
import { DocumentManagementService } from "@/server/services/document-management.service";

interface RouteContext {
  params: Promise<{ registrationId: string; documentId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getRegistrantSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { registrationId, documentId } = await context.params;

    // Verify ownership and load existing document
    const existingDoc = await DocumentManagementService.getDocumentDetails({
      userId: session.userId,
      registrationId,
      documentId,
    });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No replacement file provided." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    // Perform replacement (increments version, sets is_current = true on new, false on old)
    const result = await DocumentManagementService.uploadOrReplaceDocument({
      userId: session.userId,
      registrationId,
      documentRequirementId: existingDoc.document_requirement_id,
      fileBuffer,
      originalFilename: file.name,
      declaredMimeType: file.type,
      ipAddress: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      document: result.document,
      readiness: result.readiness,
    });
  } catch (error: any) {
    const isForbidden = error.message?.includes("Forbidden") || error.message?.includes("denied");
    const isValidation = error.message?.includes("limit exceeded") ||
      error.message?.includes("Invalid file") ||
      error.message?.includes("Security Alert") ||
      error.message?.includes("Unsupported file type");

    return NextResponse.json(
      { error: error.message || "Failed to replace document." },
      { status: isForbidden ? 403 : isValidation ? 400 : 500 }
    );
  }
}
