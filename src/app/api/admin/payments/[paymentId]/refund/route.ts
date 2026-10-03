// ==============================================================================
// ADMIN PAYMENT REFUND API
// POST /api/admin/payments/[paymentId]/refund
// Authoritative full/partial refund execution with reason and audit logging
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { PaymentService } from "@/server/services/payment.service";

interface RouteContext {
  params: Promise<{ paymentId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "FINANCE_ADMIN",
    ]);

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
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    console.error("[POST /api/admin/payments/[paymentId]/refund] Error:", error);
    return NextResponse.json(
      { error: error.message || "Refund execution failed." },
      { status: 400 }
    );
  }
}
