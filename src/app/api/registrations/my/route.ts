// ==============================================================================
// USER REGISTRATIONS DASHBOARD API (GET /api/registrations/my)
// Lists user's registrations enriched with server-side document readiness,
// payment status, and athlete ID card eligibility (Phases 4, 5, 6)
// ==============================================================================

import { NextResponse } from "next/server";
import { getRegistrantSession } from "@/lib/server-auth";
import { RegistrationFlowService } from "@/server/services/registration-flow.service";
import { DocumentManagementService } from "@/server/services/document-management.service";
import { PaymentService } from "@/server/services/payment.service";
import { IdCardService } from "@/server/services/id-card.service";

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

    // Enriched with documents, payments, and Phase 6 athlete ID card status
    const enriched = await Promise.all(
      registrations.map(async (r) => {
        try {
          const [readiness, paymentInfo, cardInfo] = await Promise.all([
            DocumentManagementService.calculateDocumentReadiness(r.id, session.userId).catch(() => undefined),
            PaymentService.getPaymentStatus(r.id, session.userId).catch(() => undefined),
            IdCardService.canGenerateAthleteIdCard(r.id, session.userId).catch(() => undefined),
          ]);

          return {
            ...r,
            athlete_id: r.athlete_id || cardInfo?.athleteId || null,
            idCardStatus: cardInfo?.status || "NOT_ELIGIBLE",
            idCardEligible: cardInfo?.isEligible || false,
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
