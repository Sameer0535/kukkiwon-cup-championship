// ==============================================================================
// REGISTRATION PAYMENT STATUS API
// GET /api/registrations/[registrationId]/payment
// Returns payment status, order details, fee calculation, and invoice
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRegistrantSession } from "@/lib/server-auth";
import { PaymentService } from "@/server/services/payment.service";

interface RouteContext {
  params: Promise<{ registrationId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getRegistrantSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to view payment status." },
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

    const status = await PaymentService.getPaymentStatus(registrationId, session.userId);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    console.error("[GET /api/registrations/[registrationId]/payment] Error:", error);
    const isForbidden =
      error.message?.includes("Unauthorized") ||
      error.message?.includes("permission") ||
      error.message?.includes("Authentication");

    return NextResponse.json(
      { error: error.message || "Failed to retrieve payment status." },
      { status: isForbidden ? 403 : 500 }
    );
  }
}
