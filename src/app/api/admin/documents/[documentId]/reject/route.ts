// ==============================================================================
// ADMIN DOCUMENT REJECTION API (POST /api/admin/documents/[documentId]/reject)
// Requirement 16: Admin document rejection with mandatory reason
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
    return NextResponse.json(
      { error: error.message || "Failed to reject document." },
      { status: 500 }
    );
  }
}
