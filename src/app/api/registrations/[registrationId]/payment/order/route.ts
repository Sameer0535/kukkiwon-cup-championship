// ==============================================================================
// REGISTRATION PAYMENT ORDER API
// POST /api/registrations/[registrationId]/payment/order
// Authoritative server-side order creation with Razorpay and immutable fee snapshots
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
        { error: "Authentication required to initiate payment." },
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

    const result = await PaymentService.createPaymentOrder({
      registrationId,
      userId: session.userId,
    });

    return NextResponse.json({
      success: true,
      order: result.order,
      checkout: result.checkout,
    });
  } catch (error: any) {
    console.error("[POST /api/registrations/[registrationId]/payment/order] Error:", error);
    const isForbidden =
      error.message?.includes("Unauthorized") ||
      error.message?.includes("permission") ||
      error.message?.includes("Authentication");
    const isAlreadyPaid = error.message?.includes("already been fully paid");

    return NextResponse.json(
      { error: error.message || "Failed to create payment order." },
      { status: isForbidden ? 403 : isAlreadyPaid ? 409 : 500 }
    );
  }
}
