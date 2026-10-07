// ==============================================================================
// ADMIN PAYMENT & DOCUMENT VERIFICATION QUEUE API (GET /api/admin/documents)
// Rebranded and expanded for Payment Verification (UTR inspection & approval)
// Fully queries Prisma registrations, live sync service, and fallback stores
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { LiveSyncService, PaymentVerificationItem } from "@/server/services/live-sync.service";
import { RegistrationFlowService } from "@/server/services/registration-flow.service";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "DOCUMENT_ADMIN",
      "FINANCE_ADMIN",
      "VIEWER",
    ]);

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;

    const mappedItems: any[] = [];
    const seenRegIds = new Set<string>();
    const seenRegNumbers = new Set<string>();

    // 1. Fetch live registrations directly from Prisma database
    try {
      const regWhere: any = {};
      if (status === "VERIFIED") {
        regWhere.status = { in: ["APPROVED", "CONFIRMED"] };
      } else if (status === "REJECTED") {
        regWhere.status = "REJECTED";
      } else if (status === "UNDER_REVIEW") {
        regWhere.status = { in: ["SUBMITTED", "UNDER_REVIEW", "PENDING_PAYMENT"] };
      }

      const dbRegs = await prisma.registration.findMany({
        where: regWhere,
        take: 100,
        orderBy: { created_at: "desc" },
        include: {
          participant: true,
          championship: true,
          category: true,
          academy: true,
          payment_orders: true,
          documents: true,
          id_card: true,
        },
      });

      for (const r of dbRegs) {
        seenRegIds.add(r.id);
        if (r.registration_number) seenRegNumbers.add(r.registration_number);

        let draftData: any = {};
        try {
          if (r.draft_data) draftData = JSON.parse(r.draft_data);
        } catch {}

        const utr =
          r.payment_orders[0]?.provider_order_id ||
          draftData.offline_utr ||
          "OFFLINE-UPI";

        const itemStatus: "UNDER_REVIEW" | "VERIFIED" | "REJECTED" =
          r.status === "APPROVED" || r.status === "CONFIRMED"
            ? "VERIFIED"
            : r.status === "REJECTED"
            ? "REJECTED"
            : "UNDER_REVIEW";

        const amount =
          draftData.fee_amount ||
          (r.payment_orders[0]?.amount_paise ? r.payment_orders[0].amount_paise / 100 : 2500);

        const athleteName =
          r.participant?.full_name ||
          (draftData.first_name ? `${draftData.first_name || ""} ${draftData.last_name || ""}`.trim() : "Official Competitor");

        mappedItems.push({
          id: r.id,
          registrationId: r.id,
          registrationNumber: r.registration_number || `KKC26-ATH-${r.id.slice(0, 6)}`,
          athleteId: r.id_card?.athlete_id || r.athlete_id || r.registration_number || `KKC26-ATH-${r.id.slice(0, 6)}`,
          athleteName,
          participantType: (r.participant_type as any) || "ATHLETE",
          utrNumber: utr,
          amountInr: amount,
          amountFormatted: `₹${amount.toLocaleString("en-IN")}`,
          categoryName: r.category?.name || draftData.weight_category_name || "Official WT Category",
          academyName: r.academy?.name || r.participant?.academy_name || draftData.academy_name || "Official Dojang",
          kukkiwonId: r.participant?.kukkiwon_id || draftData.kukkiwon_dan_number || draftData.kukkiwon_id || "Submitted",
          photoUrl: r.participant?.photo_url || draftData.photo_url || null,
          email: r.participant?.email || draftData.email || "",
          phone: r.participant?.phone || draftData.phone || "",
          gender: r.participant?.gender || draftData.gender || "MALE",
          nationality: r.participant?.nationality || draftData.nationality || "IND",
          status: itemStatus,
          title: r.participant_type === "COACH" ? "Coach Accreditation Fee" : `Athlete Championship Fee (₹${amount.toLocaleString("en-IN")})`,
          documentType: "PAYMENT_RECEIPT",
          fileName: `UTR: ${utr}`,
          version: 1,
          uploadedAt: r.submitted_at ? r.submitted_at.toISOString() : r.created_at.toISOString(),
          submittedAt: r.submitted_at ? r.submitted_at.toISOString() : r.created_at.toISOString(),
          verifiedAt: r.status === "APPROVED" ? r.updated_at.toISOString() : null,
          verifiedBy: r.status === "APPROVED" ? "Tournament Organizing Committee" : null,
          rejectionReason: null,
          championshipName: r.championship?.name || "Kukkiwon Cup Championship 2026",
        });
      }
    } catch (dbErr) {
      console.warn("[/api/admin/documents] Prisma query notice:", dbErr);
    }

    // 2. Fetch live payment verifications from LiveSyncService
    try {
      const liveVerifications = LiveSyncService.listPaymentVerifications(status);
      for (const v of liveVerifications) {
        if (!seenRegIds.has(v.registrationId) && !seenRegNumbers.has(v.registrationNumber)) {
          seenRegIds.add(v.registrationId);
          seenRegNumbers.add(v.registrationNumber);
          mappedItems.push({
            id: v.id,
            registrationId: v.registrationId,
            registrationNumber: v.registrationNumber,
            athleteId: v.athleteId,
            athleteName: v.participantName,
            participantType: v.participantType,
            utrNumber: v.utrNumber,
            amountInr: v.amountInr,
            amountFormatted: `₹${v.amountInr.toLocaleString("en-IN")}`,
            categoryName: v.categoryName,
            academyName: v.academyName,
            kukkiwonId: v.kukkiwonId,
            photoUrl: v.photoUrl,
            email: v.email,
            phone: v.phone,
            gender: v.gender,
            nationality: v.nationality,
            status: v.status,
            title: v.participantType === "COACH" ? "Coach Accreditation Fee" : `Athlete Championship Fee (₹${v.amountInr.toLocaleString("en-IN")})`,
            documentType: "PAYMENT_RECEIPT",
            fileName: v.utrNumber ? `UTR: ${v.utrNumber}` : "UPI Payment Proof",
            version: 1,
            uploadedAt: v.submittedAt,
            submittedAt: v.submittedAt,
            verifiedAt: v.verifiedAt,
            verifiedBy: v.verifiedBy,
            rejectionReason: v.rejectionReason,
            championshipName: "Kukkiwon Cup Championship 2026",
          });
        }
      }
    } catch {}

    // 3. Check fallback registrations store if running without active database
    try {
      const fallbackStore = RegistrationFlowService.getFallbackStore();
      for (const [id, r] of fallbackStore.entries()) {
        if (!seenRegIds.has(id) && !seenRegNumbers.has(r.registration_number)) {
          seenRegIds.add(id);
          seenRegNumbers.add(r.registration_number);
          let draft: any = {};
          try {
            if (r.draft_data) draft = JSON.parse(r.draft_data);
          } catch {}
          const utr = draft.offline_utr || "OFFLINE-MANUAL";
          const itemStatus = r.status === "APPROVED" ? "VERIFIED" : "UNDER_REVIEW";

          if (!status || status === "ALL" || status === itemStatus) {
            mappedItems.push({
              id,
              registrationId: id,
              registrationNumber: r.registration_number,
              athleteId: r.registration_number,
              athleteName: r.participant_name || `${draft.first_name || ""} ${draft.last_name || ""}`.trim() || "Competitor",
              participantType: r.participant_type as any,
              utrNumber: utr,
              amountInr: draft.fee_amount || 2500,
              amountFormatted: "₹2,500",
              categoryName: r.category_name || draft.weight_category_name || "Official WT Category",
              academyName: r.academy_name || draft.academy_name || "Official Dojang",
              kukkiwonId: r.kukkiwon_id || draft.kukkiwon_dan_number || "Submitted",
              photoUrl: r.photo_url || draft.photo_url || null,
              email: draft.email || "",
              phone: draft.phone || "",
              gender: draft.gender || "MALE",
              nationality: r.nationality || draft.nationality || "IND",
              status: itemStatus,
              title: r.participant_type === "COACH" ? "Coach Accreditation Fee" : "Athlete Championship Fee (₹2,500)",
              documentType: "PAYMENT_RECEIPT",
              fileName: `UTR: ${utr}`,
              version: 1,
              uploadedAt: r.submitted_at ? r.submitted_at.toISOString() : new Date().toISOString(),
              submittedAt: r.submitted_at ? r.submitted_at.toISOString() : new Date().toISOString(),
              verifiedAt: null,
              verifiedBy: null,
              rejectionReason: null,
              championshipName: "Kukkiwon Cup Championship 2026",
            });
          }
        }
      }
    } catch {}

    return NextResponse.json({
      success: true,
      items: mappedItems,
      total: mappedItems.length,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load payment verification queue." },
      { status }
    );
  }
}
