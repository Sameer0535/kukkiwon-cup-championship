// ==============================================================================
// REGISTRATION CLIENT SYNC API (POST /api/registrations/sync)
// Ensures registrations submitted from browser survive serverless restarts
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { LiveSyncService } from "@/server/services/live-sync.service";
import { RegistrationFlowService } from "@/server/services/registration-flow.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const registrations = Array.isArray(body?.registrations) ? body.registrations : [];

    for (const reg of registrations) {
      if (!reg || !reg.registrationNumber) continue;

      LiveSyncService.recordSubmission({
        registrationId: reg.id || reg.registrationId,
        registrationNumber: reg.registrationNumber,
        userId: reg.userId || `usr-${reg.id || Date.now()}`,
        participantType: reg.participantType || "ATHLETE",
        athleteName: reg.athleteName || reg.participantName || "Competitor",
        email: reg.email || "",
        phone: reg.phone || "",
        gender: reg.gender || "MALE",
        dob: reg.dob || "2000-01-01",
        country: reg.country || "India",
        nationality: reg.nationality || "IND",
        state: reg.state || "",
        city: reg.city || "",
        academyName: reg.academyName || "Independent Dojang",
        kukkiwonId: reg.kukkiwonId || "KKID-PENDING",
        photoUrl: reg.photoUrl || null,
        categoryName: reg.categoryName || "Official Entry",
        discipline: reg.discipline || "KYORUGI",
        coachRole: reg.coachRole,
        qualification: reg.qualification,
        beltRank: reg.beltRank,
        division: reg.division,
        weightKg: reg.weightKg,
        utrNumber: reg.utrNumber,
        paymentMethod: reg.paymentMethod || "OFFLINE_UPI",
        feeAmountInr: reg.amountInr || reg.feeAmountInr || 2500,
        status: reg.status,
        paymentStatus: reg.paymentStatus,
        documentStatus: reg.documentStatus,
        idCardStatus: reg.idCardStatus,
        verifiedAt: reg.verifiedAt,
        verifiedBy: reg.verifiedBy,
        documentsUploaded: reg.documentsUploaded || {},
        offlineSlip: reg.offlineSlip || null,
        rawDraftData: reg.rawDraftData || reg,
      });

      // Also ensure it is in fallback store
      try {
        const fallbackStore = RegistrationFlowService.getFallbackStore();
        if (!fallbackStore.has(reg.id || reg.registrationId)) {
          fallbackStore.set(reg.id || reg.registrationId, {
            id: reg.id || reg.registrationId,
            user_id: reg.userId || `usr-${reg.id}`,
            registration_number: reg.registrationNumber,
            championship_id: "champ-kukkiwon-2026",
            participant_id: `part-${reg.id || Date.now()}`,
            participant_type: reg.participantType || "ATHLETE",
            status: reg.status || "SUBMITTED",
            discipline: reg.discipline || "KYORUGI",
            category_id: reg.categoryId || null,
            academy_id: reg.academyId || null,
            draft_data: JSON.stringify(reg),
            registered_at: new Date(reg.submittedAt || Date.now()),
            submitted_at: new Date(reg.submittedAt || Date.now()),
            terms_version: "v1.0",
            terms_accepted_at: new Date(reg.submittedAt || Date.now()),
            created_at: new Date(reg.submittedAt || Date.now()),
            updated_at: new Date(),
            participant_name: reg.athleteName || reg.participantName || "Competitor",
            category_name: reg.categoryName || "Official Entry",
            academy_name: reg.academyName || "Independent Dojang",
            kukkiwon_id: reg.kukkiwonId || "KKID-PENDING",
            photo_url: reg.photoUrl || null,
            nationality: reg.nationality || "IND",
          });
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      syncedCount: registrations.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to sync client registrations." },
      { status: 500 }
    );
  }
}
