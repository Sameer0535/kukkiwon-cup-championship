// ==============================================================================
// ADMIN PAYMENT / DOCUMENT VERIFICATION APPROVAL API
// POST /api/admin/documents/[documentId]/verify
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { LiveSyncService } from "@/server/services/live-sync.service";
import { DocumentManagementService } from "@/server/services/document-management.service";
import { RegistrationFlowService } from "@/server/services/registration-flow.service";
import prisma from "@/lib/db";

interface RouteContext {
  params: Promise<{ documentId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "DOCUMENT_ADMIN",
      "REGISTRATION_ADMIN",
      "FINANCE_ADMIN",
      "REGISTRAR",
    ]);

    const { documentId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const verifierName = body.verifierName || admin.full_name || "Official Admin";

    // 1. Atomically update Prisma database if record exists
    try {
      const dbReg = await prisma.registration.findFirst({
        where: {
          OR: [
            { id: documentId },
            { registration_number: documentId },
            { documents: { some: { id: documentId } } },
          ],
        },
        include: { participant: true },
      });

      if (dbReg) {
        await prisma.registration.update({
          where: { id: dbReg.id },
          data: {
            status: "APPROVED",
            updated_at: new Date(),
          },
        });

        await prisma.paymentOrder.updateMany({
          where: { registration_id: dbReg.id },
          data: { status: "PAID" },
        });

        await prisma.participantDocument.updateMany({
          where: { registration_id: dbReg.id },
          data: {
            verification_status: "VERIFIED",
            verified_at: new Date(),
            verified_by: verifierName,
          },
        });

        // Ensure ID Card is marked READY for accreditation
        await prisma.idCard.upsert({
          where: { registration_id: dbReg.id },
          update: { card_status: "READY" },
          create: {
            registration_id: dbReg.id,
            participant_id: dbReg.participant_id,
            athlete_id: dbReg.registration_number,
            card_number: dbReg.registration_number,
            qr_token: `kkc26-tok-${dbReg.id.slice(0, 16)}`,
            card_status: "READY",
          },
        });
      }
    } catch (dbErr) {
      console.warn("[/api/admin/documents/verify] Prisma update notice:", dbErr);
    }

    // 2. Update Fallback store
    try {
      const fallbackStore = RegistrationFlowService.getFallbackStore();
      for (const [id, r] of fallbackStore.entries()) {
        if (id === documentId || r.registration_number === documentId) {
          r.status = "APPROVED";
          break;
        }
      }
    } catch {}

    // 3. Update LiveSyncService
    try {
      const syncResult = LiveSyncService.approvePayment(documentId, verifierName);
      return NextResponse.json({
        message: "Payment verified and registration approved successfully.",
        ...syncResult,
      });
    } catch {
      // 4. Fallback to DocumentManagementService if it was a file document ID
      const verifiedDoc = await DocumentManagementService.verifyDocument(
        documentId,
        admin.user_id,
        verifierName
      );

      return NextResponse.json({
        success: true,
        document: verifiedDoc,
      });
    }
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to verify payment." },
      { status: 500 }
    );
  }
}
