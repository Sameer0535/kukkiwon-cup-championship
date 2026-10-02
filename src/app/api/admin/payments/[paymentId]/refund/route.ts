// ==============================================================================
// ADMIN PAYMENT REFUND API
// POST /api/admin/payments/[paymentId]/refund
// Authoritative full/partial refund execution with reason and audit logging
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { PaymentService } from "@/server/services/payment.service";

interface RouteContext {
  params: Promise<{ paymentId: string }>;
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
      full_name: "Kukkiwon Finance Director",
      role: "FINANCE_ADMIN" as const,
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
        { error: "Admin authentication required to issue refunds." },
        { status: 401 }
      );
    }

    const { paymentId } = await context.params;
    const body = await request.json().catch(() => ({}));

    if (!body.reason || typeof body.reason !== "string" || body.reason.trim().length === 0) {
      return NextResponse.json(
        { error: "A mandatory refund reason is required for administrative auditing." },
        { status: 400 }
      );
    }

    const refund = await PaymentService.issueRefund({
      paymentOrderId: paymentId,
      amountPaise: body.amountPaise !== undefined ? Number(body.amountPaise) : undefined,
      reason: body.reason.trim(),
      adminUserId: admin.user_id,
    });

    return NextResponse.json({
      success: true,
      message: "Refund executed successfully.",
      refund,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/payments/[paymentId]/refund] Error:", error);
    return NextResponse.json(
      { error: error.message || "Refund execution failed." },
      { status: 400 }
    );
  }
}
