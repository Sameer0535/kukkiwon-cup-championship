// ==============================================================================
// ADMIN PAYMENT & DOCUMENT VERIFICATION QUEUE API (GET /api/admin/documents)
// Rebranded and expanded for Payment Verification (UTR inspection & approval)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { LiveSyncService } from "@/server/services/live-sync.service";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "DOCUMENT_ADMIN",
      "FINANCE_ADMIN",
      "VIEWER",
    ]);

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;

    // 1. Fetch live payment verifications from LiveSyncService
    const liveVerifications = LiveSyncService.listPaymentVerifications(status);

    // 2. Map live verifications into unified queue items
    const mappedItems = liveVerifications.map((v) => ({
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
      title: v.participantType === "COACH" ? "Coach Accreditation Fee" : "Athlete Championship Fee (₹2,500)",
      documentType: "PAYMENT_RECEIPT",
      fileName: v.utrNumber ? `UTR: ${v.utrNumber}` : "UPI Payment Proof",
      version: 1,
      uploadedAt: v.submittedAt,
      submittedAt: v.submittedAt,
      verifiedAt: v.verifiedAt,
      verifiedBy: v.verifiedBy,
      rejectionReason: v.rejectionReason,
      championshipName: "Kukkiwon Cup Championship 2026",
    }));

    // 3. If database has participant documents, optionally append them
    try {
      const where: any = {};
      if (status) where.verification_status = status;

      const dbDocs = await prisma.participantDocument.findMany({
        where,
        take: 50,
        orderBy: { uploaded_at: "desc" },
        include: {
          registration: {
            include: {
              participant: true,
              championship: true,
              id_card: true,
            },
          },
        },
      });

      for (const d of dbDocs) {
        if (!mappedItems.some((item) => item.id === d.id)) {
          mappedItems.push({
            id: d.id,
            registrationId: d.registration_id,
            registrationNumber: d.registration?.registration_number || d.registration_id,
            athleteId: d.registration?.id_card?.athlete_id || d.registration?.athlete_id || "—",
            athleteName: d.registration?.participant?.full_name || "Official Competitor",
            participantType: "ATHLETE",
            utrNumber: "DB-VERIFY",
            amountInr: 2500,
            amountFormatted: "₹2,500",
            categoryName: d.registration?.category_id || "Official Entry",
            academyName: d.registration?.participant?.academy_name || "Official Academy",
            kukkiwonId: d.registration?.participant?.kukkiwon_id || "Kukkiwon Dan",
            photoUrl: d.registration?.participant?.photo_url || null,
            email: d.registration?.participant?.email || "",
            phone: d.registration?.participant?.phone || "",
            gender: d.registration?.participant?.gender || "MALE",
            nationality: d.registration?.participant?.nationality || "IND",
            status: d.verification_status as any,
            title: d.document_requirement_id || "Payment & Identity Document",
            documentType: "PAYMENT_RECEIPT",
            fileName: d.original_filename,
            version: d.version,
            uploadedAt: d.uploaded_at.toISOString(),
            submittedAt: d.uploaded_at.toISOString(),
            verifiedAt: d.verified_at?.toISOString() || null,
            verifiedBy: d.verified_by,
            rejectionReason: d.rejection_reason,
            championshipName: d.registration?.championship?.name || "Kukkiwon Cup 2026",
          });
        }
      }
    } catch {
      // Ignore DB errors
    }

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
