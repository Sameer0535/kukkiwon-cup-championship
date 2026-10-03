// ==============================================================================
// ADMIN PAYMENTS LIST API (Phase 5 & 11 Hardened)
// GET /api/admin/payments
// List and filter payment orders for administrative finance management
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import prisma from "@/lib/db";
import { formatPaiseToInr } from "@/server/services/fee.service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "FINANCE_ADMIN",
      "REGISTRAR",
      "VIEWER",
    ]);

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || undefined;
    const registrationId = url.searchParams.get("registrationId") || undefined;

    let orders: any[] = [];
    try {
      orders = await prisma.paymentOrder.findMany({
        where: {
          status: status as any,
          registration_id: registrationId,
        },
        orderBy: { created_at: "desc" },
        take: 100,
        include: {
          registration: {
            include: {
              participant: true,
              category: true,
            },
          },
          transactions: true,
          refunds: true,
        },
      });
    } catch {
      // Fallback
    }

    const formatted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      registrationId: o.registration_id,
      registrationNumber: o.registration?.registration_number,
      participantName: o.registration?.participant?.full_name,
      categoryName: o.registration?.category?.name,
      amountPaise: o.amount_paise,
      amountFormatted: formatPaiseToInr(o.amount_paise, o.currency),
      currency: o.currency,
      status: o.status,
      provider: o.provider,
      providerOrderId: o.provider_order_id,
      createdAt: o.created_at,
      paidAt: o.paid_at,
      transactionsCount: o.transactions?.length || 0,
      refundsCount: o.refunds?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      orders: formatted,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to load payments." },
      { status: 500 }
    );
  }
}
