// ==============================================================================
// REGISTRATION PAYMENT VERIFY API
// POST /api/registrations/[registrationId]/payment/verify
// Cryptographic payment signature verification, state transition, and invoice generation
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRegistrantSession } from "@/lib/server-auth";
import { PaymentService } from "@/server/services/payment.service";

interface RouteContext {
  params: Promise<{ registrationId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getRegistrantSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to verify payment." },
        { status: 401 }
      );
    }

    const { registrationId } = await context.params;
    const body = await request.json().catch(() => ({}));

    const {
      paymentOrderId,
      providerOrderId,
      providerPaymentId,
      providerSignature,
      paymentMethod,
    } = body;

    if (!paymentOrderId || !providerOrderId || !providerPaymentId || !providerSignature) {
      return NextResponse.json(
        { error: "Missing required verification parameters (order ID, payment ID, signature)." },
        { status: 400 }
      );
    }

    const result = await PaymentService.verifyAndRecordPayment({
      registrationId,
      userId: session.userId,
      paymentOrderId,
      providerOrderId,
      providerPaymentId,
      providerSignature,
      paymentMethod,
    });

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and recorded.",
      order: result.order,
      invoice: result.invoice,
    });
  } catch (error: any) {
    console.error("[POST /api/registrations/[registrationId]/payment/verify] Error:", error);
    const isInvalidSig = error.message?.includes("Invalid payment signature");
    const isForbidden =
      error.message?.includes("Unauthorized") ||
      error.message?.includes("permission") ||
      error.message?.includes("Authentication");

    return NextResponse.json(
      { error: error.message || "Payment verification failed." },
      { status: isInvalidSig ? 400 : isForbidden ? 403 : 500 }
    );
  }
}
