// ==============================================================================
// ADMIN PAYMENT VERIFY & APPROVE API
// POST /api/admin/payments/[paymentId]/verify
// Transitions payment order to PAID, registration to APPROVED, ID card to READY
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { LiveSyncService } from "@/server/services/live-sync.service";
import prisma from "@/lib/db";

interface RouteContext {
  params: Promise<{ paymentId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "FINANCE_ADMIN",
      "REGISTRAR",
    ]);

    const { paymentId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const verifierName = body.verifierName || admin.full_name || "Official Tournament Admin";

    // 1. Prisma database synchronization if database is available
    try {
      // Find matching payment order or registration
      const cleanId = paymentId.replace(/^pay-|^po-/, "");
      const order = await prisma.paymentOrder.findFirst({
        where: {
          OR: [
            { id: cleanId },
            { id: paymentId },
            { order_number: paymentId },
            { registration_id: cleanId },
            { registration_id: paymentId },
          ],
        },
        include: { registration: true },
      });

      if (order) {
        await prisma.paymentOrder.update({
          where: { id: order.id },
          data: {
            status: "PAID",
            paid_at: new Date(),
          },
        });

        if (order.registration_id) {
          await prisma.registration.update({
            where: { id: order.registration_id },
            data: {
              status: "APPROVED",
              updated_at: new Date(),
            },
          });

          // Mark ID card as ready
          await prisma.idCard.upsert({
            where: { registration_id: order.registration_id },
            update: { card_status: "READY" },
            create: {
              registration_id: order.registration_id,
              participant_id: order.registration.participant_id,
              athlete_id: order.registration.registration_number,
              card_number: order.registration.registration_number,
              qr_token: `token-${order.registration_id.slice(0, 16)}`,
              card_status: "READY",
            },
          });
        }
      } else {
        // Check if paymentId is a registration ID directly
        const reg = await prisma.registration.findFirst({
          where: {
            OR: [
              { id: cleanId },
              { id: paymentId },
              { registration_number: paymentId },
            ],
          },
        });

        if (reg) {
          await prisma.registration.update({
            where: { id: reg.id },
            data: { status: "APPROVED", updated_at: new Date() },
          });

          await prisma.paymentOrder.updateMany({
            where: { registration_id: reg.id },
            data: { status: "PAID", paid_at: new Date() },
          });

          await prisma.idCard.upsert({
            where: { registration_id: reg.id },
            update: { card_status: "READY" },
            create: {
              registration_id: reg.id,
              participant_id: reg.participant_id,
              athlete_id: reg.registration_number,
              card_number: reg.registration_number,
              qr_token: `token-${reg.id.slice(0, 16)}`,
              card_status: "READY",
            },
          });
        }
      }
    } catch (dbErr) {
      console.warn("[/api/admin/payments/verify] Prisma update notice:", dbErr);
    }

    // 2. Synchronize with LiveSyncService (in-memory + disk persistence)
    const syncResult = LiveSyncService.approvePayment(paymentId, verifierName);

    return NextResponse.json({
      message: "Payment successfully verified and approved. Registration is now ACTIVE and ID card is GENERATED.",
      ...syncResult,
    });
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
