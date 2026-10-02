// ==============================================================================
// ADMIN DOCUMENT VERIFICATION API (POST /api/admin/documents/[documentId]/verify)
// Requirement 16: Admin verification foundation
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { DocumentManagementService } from "@/server/services/document-management.service";

interface RouteContext {
  params: Promise<{ documentId: string }>;
}

async function verifyAdminAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const admin = await verifyAdminToken(token);
    if (admin) return admin;
  }

  // Also support admin bootstrap secret header for system operations
  const secretHeader = req.headers.get("x-admin-secret");
  if (secretHeader && secretHeader === process.env.ADMIN_BOOTSTRAP_SECRET) {
    return {
      user_id: "bootstrap-admin",
      email: "admin@kukkiwon-india.org",
      full_name: "Kukkiwon Tournament Director",
      role: "SUPER_ADMIN" as const,
      expires_at: Date.now() + 86400000,
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    return await verifyAdminToken(token);
  }

  return null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Admin authentication required." },
        { status: 401 }
      );
    }

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
    return NextResponse.json(
      { error: error.message || "Failed to verify document." },
      { status: 500 }
    );
  }
}
