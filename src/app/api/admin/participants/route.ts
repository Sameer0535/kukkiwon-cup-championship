// ==============================================================================
// ADMIN MASTER PARTICIPANTS DIRECTORY API (GET /api/admin/participants)
// Live synchronized directory of all registered Athletes and Coaches
// Queries Prisma database, LiveSyncService, and fallback store
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { LiveSyncService, MasterParticipant } from "@/server/services/live-sync.service";
import { RegistrationFlowService } from "@/server/services/registration-flow.service";
import prisma from "@/lib/db";

function getCountryFlag(nationality: string): string {
  const code = (nationality || "").toUpperCase();
  if (code.includes("IND") || code.includes("INDIA")) return "🇮🇳";
  if (code.includes("KOR") || code.includes("KOREA")) return "🇰🇷";
  if (code.includes("USA") || code.includes("AMERICA")) return "🇺🇸";
  if (code.includes("GBR") || code.includes("BRITISH") || code.includes("UK")) return "🇬🇧";
  if (code.includes("NEP") || code.includes("NEPAL")) return "🇳🇵";
  if (code.includes("BHU") || code.includes("BHUTAN")) return "🇧🇹";
  if (code.includes("BGD") || code.includes("BANGLADESH")) return "🇧🇩";
  if (code.includes("LKA") || code.includes("SRI LANKA")) return "🇱🇰";
  if (code.includes("UAE") || code.includes("EMIRATES")) return "🇦🇪";
  return "🌐";
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "DOCUMENT_ADMIN",
      "FINANCE_ADMIN",
      "VIEWER",
    ]);

    const url = new URL(request.url);
    const designation = url.searchParams.get("designation") || undefined;
    const q = url.searchParams.get("q") || undefined;

    const mappedParticipants: MasterParticipant[] = [];
    const seenNames = new Set<string>();

    // 1. Query Prisma Participants
    try {
      const dbParticipants = await prisma.participant.findMany({
        take: 200,
        orderBy: { created_at: "desc" },
        include: {
          registrations: {
            include: {
              category: true,
              academy: true,
              id_card: true,
            },
          },
          academy: true,
        },
      });

      for (const p of dbParticipants) {
        const primaryReg = p.registrations[0];
        let draftData: any = {};
        try {
          if (primaryReg?.draft_data) draftData = JSON.parse(primaryReg.draft_data);
        } catch {}

        const des: "Athlete" | "Coach" = p.designation === "COACH" ? "Coach" : "Athlete";
        const status: "ACTIVE" | "APPROVED" | "PENDING" | "UNDER_REVIEW" =
          primaryReg?.status === "APPROVED" || primaryReg?.status === "CONFIRMED"
            ? "ACTIVE"
            : "PENDING";

        const normName = p.full_name.toLowerCase().trim();
        seenNames.add(normName);

        mappedParticipants.push({
          publicId: p.public_id || `PART-${p.id.slice(0, 8)}`,
          fullName: p.full_name,
          gender: p.gender || "MALE",
          nationality: p.nationality || "IND",
          flag: getCountryFlag(p.nationality || "IND"),
          designation: des,
          academy: p.academy?.name || p.academy_name || draftData.academy_name || "Official Dojang",
          kukkiwonId: p.kukkiwon_id || draftData.kukkiwon_dan_number || "Kukkiwon Dan",
          photoUrl: p.photo_url || draftData.photo_url || null,
          status,
          registrationId: primaryReg?.id,
          categoryName: primaryReg?.category?.name || draftData.weight_category_name || "Official Entry",
          coachRole: draftData.coach_role,
          email: p.email || draftData.email || "",
          phone: p.phone || draftData.phone || "",
        });
      }
    } catch (err) {
      console.warn("[/api/admin/participants] Prisma query notice:", err);
    }

    // 2. Merge with LiveSyncService participants
    try {
      const liveParticipants = LiveSyncService.listMasterParticipants({ designation, q });
      for (const lp of liveParticipants) {
        const normName = lp.fullName.toLowerCase().trim();
        if (!seenNames.has(normName)) {
          seenNames.add(normName);
          mappedParticipants.push(lp);
        }
      }
    } catch {}

    // 3. Merge with fallback store participants
    try {
      const fallbackStore = RegistrationFlowService.getFallbackStore();
      for (const [id, r] of fallbackStore.entries()) {
        let draft: any = {};
        try {
          if (r.draft_data) draft = JSON.parse(r.draft_data);
        } catch {}

        const fullName =
          r.participant_name ||
          (draft.first_name ? `${draft.first_name} ${draft.last_name || ""}`.trim() : "Participant");
        const normName = fullName.toLowerCase().trim();

        if (!seenNames.has(normName)) {
          seenNames.add(normName);
          const des: "Athlete" | "Coach" = r.participant_type === "COACH" ? "Coach" : "Athlete";
          mappedParticipants.push({
            publicId: r.registration_number,
            fullName,
            gender: draft.gender || "MALE",
            nationality: r.nationality || draft.nationality || "IND",
            flag: getCountryFlag(r.nationality || "IND"),
            designation: des,
            academy: r.academy_name || draft.academy_name || "Official Dojang",
            kukkiwonId: r.kukkiwon_id || draft.kukkiwon_dan_number || "Submitted",
            photoUrl: r.photo_url || draft.photo_url || null,
            status: r.status === "APPROVED" ? "ACTIVE" : "PENDING",
            registrationId: id,
            categoryName: r.category_name || draft.weight_category_name || "Official WT Category",
            coachRole: draft.coach_role,
            email: draft.email || "",
            phone: draft.phone || "",
          });
        }
      }
    } catch {}

    // 4. Apply optional designation and text filters
    let filtered = mappedParticipants;
    if (designation) {
      filtered = filtered.filter(
        (p) => p.designation.toLowerCase() === designation.toLowerCase()
      );
    }
    if (q && q.trim().length > 0) {
      const cleanQ = q.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.fullName.toLowerCase().includes(cleanQ) ||
          p.academy.toLowerCase().includes(cleanQ) ||
          p.publicId.toLowerCase().includes(cleanQ) ||
          p.kukkiwonId.toLowerCase().includes(cleanQ)
      );
    }

    return NextResponse.json({
      success: true,
      participants: filtered,
      total: filtered.length,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to load master participants." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
    ]);

    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const id = (url.searchParams.get("id") || body.id || body.registrationId || body.publicId || "") as string;

    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: "Participant ID or Registration ID is required for deletion." },
        { status: 400 }
      );
    }

    const cleanId = id.trim();

    // 1. Permanently erase from LiveSyncService and fallback stores
    LiveSyncService.deleteParticipant(cleanId);

    // 2. Erase from Prisma DB if record exists
    try {
      const dbReg = await prisma.registration.findFirst({
        where: {
          OR: [
            { id: cleanId },
            { registration_number: cleanId },
            { participant_id: cleanId },
            { participant: { public_id: cleanId } },
          ],
        },
      });

      if (dbReg) {
        await prisma.idCard.deleteMany({ where: { registration_id: dbReg.id } });
        await prisma.participantDocument.deleteMany({ where: { registration_id: dbReg.id } });
        await prisma.paymentOrder.deleteMany({ where: { registration_id: dbReg.id } });
        await prisma.registration.delete({ where: { id: dbReg.id } });
        if (dbReg.participant_id) {
          await prisma.participant.delete({ where: { id: dbReg.participant_id } }).catch(() => {});
        }
      }
    } catch (dbErr) {
      console.warn("[/api/admin/participants DELETE] DB notice:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Participant record permanently erased from championship database.",
      deletedId: cleanId,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to delete participant." },
      { status: 500 }
    );
  }
}
