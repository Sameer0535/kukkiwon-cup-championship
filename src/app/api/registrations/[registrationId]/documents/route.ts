// ==============================================================================
// REGISTRATION DOCUMENTS API (GET & POST /api/registrations/[registrationId]/documents)
// Secure listing, requirements resolution, and validated document uploads
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRegistrantSession } from "@/lib/server-auth";
import { DocumentManagementService } from "@/server/services/document-management.service";

interface RouteContext {
  params: Promise<{ registrationId: string }>;
}

/**
 * REQUIREMENT 13: GET /api/registrations/[registrationId]/documents
 * List requirements, current documents, and readiness summary for the authenticated owner
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

    const { registrationId } = await context.params;

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required." },
        { status: 400 }
      );
    }

    // Verify ownership and load requirements with attached current documents
    const requirements = await DocumentManagementService.getRegistrationRequirements(
      registrationId,
      session.userId
    );

    // Calculate document completion and readiness
    const readiness = await DocumentManagementService.calculateDocumentReadiness(
      registrationId,
      session.userId
    );

    return NextResponse.json({
      success: true,
      requirements,
      readiness,
    });
  } catch (error: any) {
    const isForbidden = error.message?.includes("Forbidden") || error.message?.includes("permission");
    return NextResponse.json(
      { error: error.message || "Failed to load document requirements." },
      { status: isForbidden ? 403 : 500 }
    );
  }
}

/**
 * REQUIREMENT 13: POST /api/registrations/[registrationId]/documents
 * Upload document with server-side validation and versioning
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getRegistrantSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { registrationId } = await context.params;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentRequirementId = (formData.get("documentRequirementId") as string) || (formData.get("requirementId") as string);

    if (!file) {
      return NextResponse.json(
        { error: "No file provided for upload." },
        { status: 400 }
      );
    }

    if (!documentRequirementId) {
      return NextResponse.json(
        { error: "Document requirement ID is required." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    // Upload / Replace with version incrementing & audit logging
    const result = await DocumentManagementService.uploadOrReplaceDocument({
      userId: session.userId,
      registrationId,
      documentRequirementId,
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
    const isForbidden = error.message?.includes("Forbidden") || error.message?.includes("permission");
    const isValidation = error.message?.includes("limit exceeded") ||
      error.message?.includes("Invalid file") ||
      error.message?.includes("Security Alert") ||
      error.message?.includes("Unsupported file type");

    return NextResponse.json(
      { error: error.message || "Failed to upload document." },
      { status: isForbidden ? 403 : isValidation ? 400 : 500 }
    );
  }
}
