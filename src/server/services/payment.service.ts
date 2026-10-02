// ==============================================================================
// PAYMENT SERVICE (Requirement 12)
// Gateway agnostic payment tracking and server-side verification
// ==============================================================================

import prisma from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

export interface CreatePaymentParams {
  registrationId: string;
  provider: string;
  orderId?: string | null;
  amount: number;
  currency?: string;
}

export interface VerifyPaymentParams {
  paymentDbId: string;
  gatewayPaymentId: string;
  signature?: string | null;
  paymentMethod?: string | null;
  rawGatewayResponse?: Record<string, unknown> | null;
}

export class PaymentService {
  /**
   * Initializes a payment order record
   */
  static async createOrder(params: CreatePaymentParams) {
    return prisma.payment.create({
      data: {
        registration_id: params.registrationId,
        provider: params.provider,
        order_id: params.orderId,
        amount: params.amount,
        currency: params.currency || "INR",
        status: "CREATED",
      },
    });
  }

  /**
   * Server-side payment verification (Never trust raw frontend responses)
   */
  static async recordSuccessfulPayment(params: VerifyPaymentParams) {
    return prisma.$transaction(async (tx) => {
      // 1. Update payment record
      const payment = await tx.payment.update({
        where: { id: params.paymentDbId },
        data: {
          status: "SUCCESS",
          payment_id: params.gatewayPaymentId,
          signature: params.signature,
          payment_method: params.paymentMethod,
          paid_at: new Date(),
          raw_response: params.rawGatewayResponse
            ? JSON.stringify(params.rawGatewayResponse)
            : null,
        },
      });

      // 2. Transition registration status to PAID
      await tx.registration.update({
        where: { id: payment.registration_id },
        data: {
          status: "PAID",
        },
      });

      return payment;
    });
  }

  /**
   * Marks a payment as failed
   */
  static async recordFailedPayment(
    paymentDbId: string,
    rawGatewayResponse?: Record<string, unknown> | null
  ) {
    return prisma.payment.update({
      where: { id: paymentDbId },
      data: {
        status: "FAILED",
        raw_response: rawGatewayResponse
          ? JSON.stringify(rawGatewayResponse)
          : null,
      },
    });
  }
}
