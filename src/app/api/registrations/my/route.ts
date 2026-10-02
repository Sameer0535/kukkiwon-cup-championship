// ==============================================================================
// USER REGISTRATIONS DASHBOARD API (GET /api/registrations/my)
// Lists user's registrations enriched with server-side document readiness (Requirement 11)
// ==============================================================================

import { NextResponse } from "next/server";
import { getRegistrantSession } from "@/lib/server-auth";
import { RegistrationFlowService } from "@/server/services/registration-flow.service";
import { DocumentManagementService } from "@/server/services/document-management.service";
import { PaymentService } from "@/server/services/payment.service";

export async function GET(request: Request) {
  try {
    const session = await getRegistrantSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const registrations = await RegistrationFlowService.listUserRegistrations(session.userId);

    // Requirement 11 & Phase 5: Calculate document readiness & payment status for each registration
    const enriched = await Promise.all(
      registrations.map(async (r) => {
        try {
          const [readiness, paymentInfo] = await Promise.all([
            DocumentManagementService.calculateDocumentReadiness(r.id, session.userId).catch(() => undefined),
            PaymentService.getPaymentStatus(r.id, session.userId).catch(() => undefined),
          ]);

          return {
            ...r,
            documentReadiness: readiness,
            paymentStatus: paymentInfo?.paymentStatus || (r.status === "PAID" ? "PAID" : "PENDING"),
            paymentAmountFormatted: paymentInfo?.feeCalculation?.formattedTotal,
            hasInvoice: !!paymentInfo?.invoice,
          };
        } catch {
          return r;
        }
      })
    );

    return NextResponse.json({ success: true, registrations: enriched });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load registrations." },
      { status: 500 }
    );
  }
}
