// ==============================================================================
// RAZORPAY PAYMENT WEBHOOK API
// POST /api/payments/webhook/razorpay
// Secure HMAC webhook processing with strict idempotency and event audit logging
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/server/services/payment.service";

export async function POST(request: NextRequest) {
  try {
    const signatureHeader = request.headers.get("x-razorpay-signature");
    if (!signatureHeader) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header." },
        { status: 400 }
      );
    }

    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json(
        { error: "Empty request payload." },
        { status: 400 }
      );
    }

    let eventPayload: Record<string, unknown>;
    try {
      eventPayload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON webhook payload." },
        { status: 400 }
      );
    }

    const result = await PaymentService.processWebhook({
      rawBody,
      signatureHeader,
      eventPayload,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[POST /api/payments/webhook/razorpay] Webhook Error:", error);
    const isSigError = error.message?.includes("signature");
    return NextResponse.json(
      { error: error.message || "Webhook processing failed." },
      { status: isSigError ? 400 : 500 }
    );
  }
}
