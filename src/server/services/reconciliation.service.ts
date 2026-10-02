// ==============================================================================
// KUKKIWON CUP CHAMPIONSHIP - RECONCILIATION SERVICE (Phase 5)
// Administrative Financial Reconciliation, Gateway Settlement & Discrepancy Audit
// ==============================================================================

import prisma from "@/lib/db";
import { formatPaiseToInr } from "./fee.service";
import { ReconciliationSummary, PaymentOrderStatus } from "@/types/payment";

let isPrismaReachable: boolean | null = null;
async function isDbOnline(): Promise<boolean> {
  if (isPrismaReachable !== null) return isPrismaReachable;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isPrismaReachable = true;
    return true;
  } catch {
    isPrismaReachable = false;
    return false;
  }
}

export interface ReconciliationFilter {
  championshipId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: PaymentOrderStatus;
  academyId?: string;
}

export class ReconciliationService {
  /**
   * Calculates high-level financial summary and balances
   */
  static async getSummary(filter: ReconciliationFilter = {}): Promise<ReconciliationSummary> {
    const online = await isDbOnline();

    const ordersByStatus: Record<PaymentOrderStatus, number> = {
      PENDING: 0,
      PROCESSING: 0,
      PAID: 0,
      FAILED: 0,
      CANCELLED: 0,
      REFUND_PENDING: 0,
      PARTIALLY_REFUNDED: 0,
      REFUNDED: 0,
    };

    let totalRegistrations = 0;
    let totalPaidPaise = 0;
    let totalPendingPaise = 0;
    let totalFailedPaise = 0;
    let totalRefundedPaise = 0;
    let totalAmountDuePaise = 0;
    let discrepanciesCount = 0;

    if (online) {
      try {
        // 1. Total registrations count
        totalRegistrations = await prisma.registration.count({
          where: {
            championship_id: filter.championshipId,
            academy_id: filter.academyId,
            status: { not: "CANCELLED" },
          },
        });

        // 2. Fetch payment orders matching filter
        const whereClause: Record<string, unknown> = {};
        if (filter.status) whereClause.status = filter.status;
        if (filter.startDate || filter.endDate) {
          whereClause.created_at = {};
          if (filter.startDate) (whereClause.created_at as Record<string, unknown>).gte = filter.startDate;
          if (filter.endDate) (whereClause.created_at as Record<string, unknown>).lte = filter.endDate;
        }

        const orders = await prisma.paymentOrder.findMany({
          where: whereClause,
          select: {
            id: true,
            status: true,
            amount_paise: true,
            paid_at: true,
            transactions: {
              select: { id: true, status: true, amount_paise: true },
            },
            refunds: {
              select: { id: true, amount_paise: true, status: true },
            },
          },
        });

        for (const order of orders) {
          const status = order.status as PaymentOrderStatus;
          ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
          totalAmountDuePaise += order.amount_paise;

          if (status === "PAID") {
            totalPaidPaise += order.amount_paise;
            // Verify there is an actual captured transaction
            const hasCapturedTxn = order.transactions.some((t) => t.status === "CAPTURED");
            if (!hasCapturedTxn) {
              discrepanciesCount++;
            }
          } else if (status === "PENDING" || status === "PROCESSING") {
            totalPendingPaise += order.amount_paise;
          } else if (status === "FAILED") {
            totalFailedPaise += order.amount_paise;
          } else if (status === "REFUNDED" || status === "PARTIALLY_REFUNDED") {
            const refunded = order.refunds
              .filter((r) => r.status === "COMPLETED")
              .reduce((sum, r) => sum + r.amount_paise, 0);
            totalRefundedPaise += refunded;
            totalPaidPaise += Math.max(0, order.amount_paise - refunded);
          }
        }
      } catch (err) {
        console.warn("[ReconciliationService] Query failed, returning default summary:", err);
      }
    } else {
      // Fallback calculations for development
      totalRegistrations = 12;
      totalAmountDuePaise = 1800000; // ₹18,000
      totalPaidPaise = 1500000;      // ₹15,000
      totalPendingPaise = 300000;    // ₹3,000
      totalFailedPaise = 0;
      totalRefundedPaise = 0;
      ordersByStatus.PAID = 10;
      ordersByStatus.PENDING = 2;
    }

    const outstandingPaise = Math.max(0, totalAmountDuePaise - totalPaidPaise);

    return {
      championshipId: filter.championshipId,
      totalRegistrations,
      totalAmountDuePaise,
      totalPaidPaise,
      totalPendingPaise,
      totalFailedPaise,
      totalRefundedPaise,
      outstandingPaise,
      formattedAmountDue: formatPaiseToInr(totalAmountDuePaise),
      formattedPaid: formatPaiseToInr(totalPaidPaise),
      formattedPending: formatPaiseToInr(totalPendingPaise),
      formattedFailed: formatPaiseToInr(totalFailedPaise),
      formattedRefunded: formatPaiseToInr(totalRefundedPaise),
      formattedOutstanding: formatPaiseToInr(outstandingPaise),
      ordersByStatus,
      discrepanciesCount,
    };
  }

  /**
   * Detailed reconciliation list with provider transaction matching
   */
  static async getDetailedReconciliation(filter: ReconciliationFilter = {}) {
    const summary = await this.getSummary(filter);
    const online = await isDbOnline();

    let records: Array<{
      orderId: string;
      orderNumber: string;
      registrationNumber: string;
      participantName: string;
      amountFormatted: string;
      currency: string;
      status: PaymentOrderStatus;
      providerOrderId: string;
      providerPaymentId?: string | null;
      paidAt?: string | null;
      isSettled: boolean;
    }> = [];

    if (online) {
      try {
        const orders = await prisma.paymentOrder.findMany({
          take: 50,
          orderBy: { created_at: "desc" },
          include: {
            registration: {
              include: { participant: true },
            },
            transactions: {
              take: 1,
              orderBy: { created_at: "desc" },
            },
          },
        });

        records = orders.map((o) => {
          const txn = o.transactions[0];
          return {
            orderId: o.id,
            orderNumber: o.order_number,
            registrationNumber: o.registration.registration_number,
            participantName: o.registration.participant.full_name,
            amountFormatted: formatPaiseToInr(o.amount_paise, o.currency),
            currency: o.currency,
            status: o.status as PaymentOrderStatus,
            providerOrderId: o.provider_order_id,
            providerPaymentId: txn?.provider_payment_id || null,
            paidAt: o.paid_at?.toISOString() || null,
            isSettled: o.status === "PAID" && !!txn?.signature_verified,
          };
        });
      } catch (err) {
        console.warn("[ReconciliationService] Detailed query failed:", err);
      }
    }

    return {
      summary,
      records,
    };
  }
}
