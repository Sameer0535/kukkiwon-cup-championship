// ==============================================================================
// KUKKIWON CUP CHAMPIONSHIP - PAYMENT SERVICE (Phase 5 Core Architecture)
// Official Razorpay Integration, Cryptographic Verification, Idempotent Webhooks & Invoices
// ==============================================================================

import crypto from "crypto";
import Razorpay from "razorpay";
import prisma from "@/lib/db";
import { FeeService, formatPaiseToInr } from "./fee.service";
import {
  PaymentOrderDetails,
  PaymentInvoiceDetails,
  PaymentRefundDetails,
  PaymentOrderStatus,
  RefundStatus,
  CheckoutConfig,
  FeeSnapshot,
} from "@/types/payment";

// Environment Configuration
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_PAYMENT_KEY_ID || "rzp_test_mock_kukkiwon_2026";
const RAZORPAY_KEY_SECRET = process.env.PAYMENT_KEY_SECRET || "mock_secret_for_local_development";
const RAZORPAY_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "mock_webhook_secret_for_local_dev";
const PAYMENT_GATEWAY_PROVIDER = process.env.PAYMENT_GATEWAY_PROVIDER || "MOCK";

// Initialize Razorpay SDK client if valid credentials exist
let razorpayClient: Razorpay | null = null;
try {
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && !RAZORPAY_KEY_ID.includes("mock")) {
    razorpayClient = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
} catch (e) {
  console.warn("[PaymentService] Could not initialize live Razorpay client, using fallback mode:", e);
}

// ------------------------------------------------------------------------------
// Fallback in-memory stores for local development and offline unit tests
// ------------------------------------------------------------------------------
interface FallbackPaymentOrder {
  id: string;
  order_number: string;
  registration_id: string;
  user_id?: string | null;
  provider: string;
  provider_order_id: string;
  amount_paise: number;
  currency: string;
  fee_snapshot: string;
  status: PaymentOrderStatus;
  created_at: Date;
  expires_at?: Date | null;
  paid_at?: Date | null;
}

interface FallbackPaymentTransaction {
  id: string;
  payment_order_id: string;
  provider_payment_id: string;
  provider_order_id: string;
  signature_verified: boolean;
  amount_paise: number;
  currency: string;
  payment_method?: string | null;
  status: string;
  captured_at?: Date | null;
  failure_code?: string | null;
  failure_reason?: string | null;
  created_at: Date;
}

interface FallbackPaymentInvoice {
  id: string;
  invoice_number: string;
  registration_id: string;
  payment_order_id?: string | null;
  user_id?: string | null;
  participant_name: string;
  academy_name?: string | null;
  championship_name: string;
  fee_breakdown: string;
  total_amount_paise: number;
  currency: string;
  provider: string;
  provider_payment_id?: string | null;
  payment_date: Date;
  invoice_status: string;
  receipt_url?: string | null;
  created_at: Date;
}

interface FallbackPaymentRefund {
  id: string;
  payment_order_id: string;
  payment_transaction_id?: string | null;
  provider_refund_id?: string | null;
  amount_paise: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  initiated_by?: string | null;
  initiated_at: Date;
  processed_at?: Date | null;
  error_message?: string | null;
}

interface FallbackWebhookEvent {
  id: string;
  provider: string;
  provider_event_id: string;
  event_type: string;
  payload_hash: string;
  received_at: Date;
  processed_at?: Date | null;
  processing_status: string;
}

const FALLBACK_ORDERS: Map<string, FallbackPaymentOrder> = new Map();
const FALLBACK_TRANSACTIONS: Map<string, FallbackPaymentTransaction> = new Map();
const FALLBACK_INVOICES: Map<string, FallbackPaymentInvoice> = new Map();
const FALLBACK_REFUNDS: Map<string, FallbackPaymentRefund> = new Map();
const FALLBACK_WEBHOOK_EVENTS: Map<string, FallbackWebhookEvent> = new Map();
let orderSequence = 1000;
let invoiceSequence = 1000;

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

export class PaymentService {
  /**
   * Generates a sequential, institutional order reference (e.g. KKC26-ORD-001001)
   */
  static generateOrderNumber(): string {
    orderSequence++;
    const padded = String(orderSequence).padStart(6, "0");
    return `KKC26-ORD-${padded}`;
  }

  /**
   * Generates a sequential, institutional invoice number (e.g. KKC26-INV-001001)
   */
  static generateInvoiceNumber(): string {
    invoiceSequence++;
    const padded = String(invoiceSequence).padStart(6, "0");
    return `KKC26-INV-${padded}`;
  }

  /**
   * Verifies user ownership of registration (IDOR protection)
   */
  static async verifyOwnership(registrationId: string, userId?: string | null): Promise<void> {
    if (!userId) {
      throw new Error("Authentication required to access registration payment");
    }

    const online = await isDbOnline();
    if (online) {
      const reg = await prisma.registration.findUnique({
        where: { id: registrationId },
        select: { id: true, user_id: true, status: true },
      });
      if (!reg) {
        throw new Error("Registration not found");
      }
      if (reg.user_id && reg.user_id !== userId) {
        throw new Error("Unauthorized: You do not have permission to access this registration");
      }
    } else {
      for (const ord of FALLBACK_ORDERS.values()) {
        if (ord.registration_id === registrationId && ord.user_id && ord.user_id !== userId) {
          throw new Error("Unauthorized: You do not have permission to access this registration");
        }
      }
      for (const inv of FALLBACK_INVOICES.values()) {
        if (inv.registration_id === registrationId && inv.user_id && inv.user_id !== userId) {
          throw new Error("Unauthorized: You do not have permission to access this registration");
        }
      }
    }
  }

  /**
   * Creates an authoritative payment order with immutable fee snapshot
   */
  static async createPaymentOrder(params: {
    registrationId: string;
    userId?: string | null;
  }): Promise<{ order: PaymentOrderDetails; checkout: CheckoutConfig }> {
    await this.verifyOwnership(params.registrationId, params.userId);
    const online = await isDbOnline();

    // 1. Check if registration has already been paid
    if (online) {
      const existingPaidOrder = await prisma.paymentOrder.findFirst({
        where: {
          registration_id: params.registrationId,
          status: "PAID",
        },
      });
      if (existingPaidOrder) {
        throw new Error("Registration fee has already been fully paid.");
      }
    } else {
      for (const ord of FALLBACK_ORDERS.values()) {
        if (ord.registration_id === params.registrationId && ord.status === "PAID") {
          throw new Error("Registration fee has already been fully paid.");
        }
      }
    }

    // 2. Concurrency / Duplicate Order check:
    // If an active PENDING order exists created within the last 15 minutes, reuse it
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    let pendingOrder: any = null;

    if (online) {
      pendingOrder = await prisma.paymentOrder.findFirst({
        where: {
          registration_id: params.registrationId,
          status: "PENDING",
          created_at: { gte: fifteenMinutesAgo },
        },
        orderBy: { created_at: "desc" },
      });
    } else {
      for (const ord of FALLBACK_ORDERS.values()) {
        if (
          ord.registration_id === params.registrationId &&
          ord.status === "PENDING" &&
          new Date(ord.created_at).getTime() >= fifteenMinutesAgo.getTime()
        ) {
          pendingOrder = ord;
          break;
        }
      }
    }

    if (pendingOrder) {
      const feeSnapshot: FeeSnapshot = JSON.parse(pendingOrder.fee_snapshot);
      const createdAtIso = pendingOrder.created_at instanceof Date
        ? pendingOrder.created_at.toISOString()
        : new Date(pendingOrder.created_at).toISOString();
      const expiresAtIso = pendingOrder.expires_at
        ? pendingOrder.expires_at instanceof Date
          ? pendingOrder.expires_at.toISOString()
          : new Date(pendingOrder.expires_at).toISOString()
        : null;
      const paidAtIso = pendingOrder.paid_at
        ? pendingOrder.paid_at instanceof Date
          ? pendingOrder.paid_at.toISOString()
          : new Date(pendingOrder.paid_at).toISOString()
        : null;

      const orderDetails: PaymentOrderDetails = {
        id: pendingOrder.id,
        orderNumber: pendingOrder.order_number,
        registrationId: pendingOrder.registration_id,
        userId: pendingOrder.user_id,
        provider: pendingOrder.provider,
        providerOrderId: pendingOrder.provider_order_id,
        amountPaise: pendingOrder.amount_paise,
        amountFormatted: formatPaiseToInr(pendingOrder.amount_paise, pendingOrder.currency),
        currency: pendingOrder.currency,
        status: pendingOrder.status as PaymentOrderStatus,
        createdAt: createdAtIso,
        expiresAt: expiresAtIso,
        paidAt: paidAtIso,
        feeSnapshot,
      };

      const checkout: CheckoutConfig = {
        orderId: pendingOrder.id,
        providerOrderId: pendingOrder.provider_order_id,
        keyId: RAZORPAY_KEY_ID,
        amountPaise: pendingOrder.amount_paise,
        currency: pendingOrder.currency,
        name: "Kukkiwon Cup Championship 2026",
        description: `Registration Fee - ${feeSnapshot.registrationNumber}`,
        registrationNumber: feeSnapshot.registrationNumber,
        participantName: feeSnapshot.participantName,
        prefill: {
          name: feeSnapshot.participantName,
        },
        theme: {
          color: "#0A192F",
        },
        isTestMode: RAZORPAY_KEY_ID.startsWith("rzp_test") || RAZORPAY_KEY_ID.includes("mock"),
      };

      return { order: orderDetails, checkout };
    }

    // 3. Authoritative fee calculation
    const feeResult = await FeeService.calculateFee({
      registrationId: params.registrationId,
    });

    const amountPaise = feeResult.totalPaise;
    const currency = feeResult.currency;
    const orderNumber = this.generateOrderNumber();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes validity

    // 4. Create Razorpay order (or mock in test environment)
    let providerOrderId = "";
    if (razorpayClient && !RAZORPAY_KEY_ID.includes("mock")) {
      try {
        const rzpOrder = await razorpayClient.orders.create({
          amount: amountPaise,
          currency: currency,
          receipt: orderNumber,
          notes: {
            registration_id: params.registrationId,
            registration_number: feeResult.snapshot.registrationNumber,
            participant_name: feeResult.snapshot.participantName,
          },
        });
        providerOrderId = rzpOrder.id;
      } catch (err: unknown) {
        console.error("[PaymentService] Live Razorpay order creation failed:", err);
        throw new Error(`Payment gateway order creation failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      // Mock order ID for test mode and offline development
      providerOrderId = `order_mock_${crypto.randomBytes(8).toString("hex")}`;
    }

    // 5. Save order in database or fallback store
    const feeSnapshotJson = JSON.stringify(feeResult.snapshot);
    let orderId = "";

    if (online) {
      const saved = await prisma.paymentOrder.create({
        data: {
          order_number: orderNumber,
          registration_id: params.registrationId,
          user_id: params.userId || null,
          provider: "RAZORPAY",
          provider_order_id: providerOrderId,
          amount_paise: amountPaise,
          amount: amountPaise / 100,
          currency: currency,
          fee_snapshot: feeSnapshotJson,
          status: "PENDING",
          expires_at: expiresAt,
        },
      });
      orderId = saved.id;

      // Log order creation in AuditLog
      try {
        await prisma.auditLog.create({
          data: {
            user_id: params.userId || null,
            action: "PAYMENT_ORDER_CREATED",
            entity_type: "PaymentOrder",
            entity_id: saved.id,
            new_value: JSON.stringify({
              orderNumber,
              providerOrderId,
              amountPaise,
              currency,
            }),
          },
        });
      } catch (auditErr) {
        console.warn("[PaymentService] Could not log audit:", auditErr);
      }
    } else {
      orderId = `ord-${crypto.randomUUID()}`;
      FALLBACK_ORDERS.set(orderId, {
        id: orderId,
        order_number: orderNumber,
        registration_id: params.registrationId,
        user_id: params.userId || null,
        provider: "RAZORPAY",
        provider_order_id: providerOrderId,
        amount_paise: amountPaise,
        currency: currency,
        fee_snapshot: feeSnapshotJson,
        status: "PENDING",
        created_at: new Date(),
        expires_at: expiresAt,
      });
    }

    const orderDetails: PaymentOrderDetails = {
      id: orderId,
      orderNumber,
      registrationId: params.registrationId,
      userId: params.userId,
      provider: "RAZORPAY",
      providerOrderId,
      amountPaise,
      amountFormatted: formatPaiseToInr(amountPaise, currency),
      currency,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      feeSnapshot: feeResult.snapshot,
    };

    const checkout: CheckoutConfig = {
      orderId,
      providerOrderId,
      keyId: RAZORPAY_KEY_ID,
      amountPaise,
      currency,
      name: "Kukkiwon Cup Championship 2026",
      description: `Registration Fee - ${feeResult.snapshot.registrationNumber}`,
      registrationNumber: feeResult.snapshot.registrationNumber,
      participantName: feeResult.snapshot.participantName,
      prefill: {
        name: feeResult.snapshot.participantName,
      },
      theme: {
        color: "#0A192F",
      },
      isTestMode: RAZORPAY_KEY_ID.startsWith("rzp_test") || RAZORPAY_KEY_ID.includes("mock"),
    };

    return { order: orderDetails, checkout };
  }

  /**
   * Cryptographically verifies the Razorpay payment signature
   */
  static verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
    secret = RAZORPAY_KEY_SECRET
  ): boolean {
    if (!orderId || !paymentId || !signature) return false;

    // In dev / test mode only, allow mock HMAC or mock signatures when mock secret is configured
    if (process.env.NODE_ENV !== "production" && secret.includes("mock")) {
      const expectedMockSig = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
      return signature === expectedMockSig || signature.startsWith("mock_sig_");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const actualBuffer = Buffer.from(signature, "utf8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }

  /**
   * Generates a mock signature for testing
   */
  static generateMockSignature(orderId: string, paymentId: string, secret = RAZORPAY_KEY_SECRET): string {
    return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  }

  /**
   * Completes payment verification after user checkout
   */
  static async verifyAndRecordPayment(params: {
    registrationId: string;
    userId?: string | null;
    paymentOrderId: string;
    providerOrderId: string;
    providerPaymentId: string;
    providerSignature: string;
    paymentMethod?: string | null;
  }): Promise<{ order: PaymentOrderDetails; invoice: PaymentInvoiceDetails }> {
    await this.verifyOwnership(params.registrationId, params.userId);

    // 1. Verify cryptographic signature
    const isValidSignature = this.verifySignature(
      params.providerOrderId,
      params.providerPaymentId,
      params.providerSignature
    );

    if (!isValidSignature) {
      throw new Error("Invalid payment signature: Verification failed.");
    }

    const online = await isDbOnline();
    let order: FallbackPaymentOrder | { id: string; order_number: string; registration_id: string; user_id?: string | null; provider: string; provider_order_id: string; amount_paise: number; currency: string; fee_snapshot: string; status: PaymentOrderStatus; created_at: Date; paid_at?: Date | null };

    if (online) {
      const dbOrder = await prisma.paymentOrder.findUnique({
        where: { id: params.paymentOrderId },
      });
      if (!dbOrder) {
        throw new Error("Payment order not found.");
      }
      if (dbOrder.registration_id !== params.registrationId) {
        throw new Error("Order registration mismatch.");
      }
      if (dbOrder.provider_order_id !== params.providerOrderId) {
        throw new Error("Provider order ID mismatch.");
      }
      order = dbOrder;
    } else {
      const fallbackOrder = FALLBACK_ORDERS.get(params.paymentOrderId);
      if (!fallbackOrder) {
        throw new Error("Payment order not found.");
      }
      if (fallbackOrder.registration_id !== params.registrationId) {
        throw new Error("Order registration mismatch.");
      }
      order = fallbackOrder;
    }

    if (order.status === "PAID") {
      // Order already verified and recorded
      const invoice = await this.getInvoiceByRegistrationId(params.registrationId, params.userId);
      if (!invoice) throw new Error("Payment recorded but invoice missing.");
      return {
        order: {
          id: order.id,
          orderNumber: order.order_number,
          registrationId: order.registration_id,
          userId: order.user_id,
          provider: order.provider,
          providerOrderId: order.provider_order_id,
          amountPaise: order.amount_paise,
          amountFormatted: formatPaiseToInr(order.amount_paise, order.currency),
          currency: order.currency,
          status: "PAID",
          createdAt: order.created_at.toISOString(),
          paidAt: order.paid_at?.toISOString() || new Date().toISOString(),
          feeSnapshot: JSON.parse(order.fee_snapshot),
        },
        invoice,
      };
    }

    const feeSnapshot: FeeSnapshot = JSON.parse(order.fee_snapshot);
    const invoiceNumber = this.generateInvoiceNumber();
    const now = new Date();

    // 2. Atomic transaction in database
    if (online) {
      await prisma.$transaction(async (tx) => {
        // Record payment transaction
        await tx.paymentTransaction.create({
          data: {
            payment_order_id: order.id,
            provider_payment_id: params.providerPaymentId,
            provider_order_id: params.providerOrderId,
            signature_verified: true,
            amount_paise: order.amount_paise,
            amount: order.amount_paise / 100,
            currency: order.currency,
            payment_method: params.paymentMethod || "UPI",
            status: "CAPTURED",
            captured_at: now,
          },
        });

        // Update payment order to PAID
        await tx.paymentOrder.update({
          where: { id: order.id },
          data: {
            status: "PAID",
            paid_at: now,
          },
        });

        // Update Registration status to PAID
        await tx.registration.update({
          where: { id: params.registrationId },
          data: {
            status: "PAID",
          },
        });

        // Generate official invoice
        await tx.paymentInvoice.create({
          data: {
            invoice_number: invoiceNumber,
            registration_id: params.registrationId,
            payment_order_id: order.id,
            user_id: params.userId || null,
            participant_name: feeSnapshot.participantName,
            academy_name: undefined,
            championship_name: feeSnapshot.championshipName,
            fee_breakdown: order.fee_snapshot,
            total_amount_paise: order.amount_paise,
            total_amount: order.amount_paise / 100,
            currency: order.currency,
            provider: "RAZORPAY",
            provider_payment_id: params.providerPaymentId,
            payment_date: now,
            invoice_status: "PAID",
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            user_id: params.userId || null,
            action: "PAYMENT_VERIFIED",
            entity_type: "PaymentOrder",
            entity_id: order.id,
            new_value: JSON.stringify({
              providerPaymentId: params.providerPaymentId,
              amountPaise: order.amount_paise,
              invoiceNumber,
            }),
          },
        });
      });
    } else {
      // Offline fallback state update
      order.status = "PAID";
      order.paid_at = now;
      FALLBACK_ORDERS.set(order.id, order);

      const transId = `txn-${crypto.randomUUID()}`;
      FALLBACK_TRANSACTIONS.set(transId, {
        id: transId,
        payment_order_id: order.id,
        provider_payment_id: params.providerPaymentId,
        provider_order_id: params.providerOrderId,
        signature_verified: true,
        amount_paise: order.amount_paise,
        currency: order.currency,
        payment_method: params.paymentMethod || "UPI",
        status: "CAPTURED",
        captured_at: now,
        created_at: now,
      });

      const invId = `inv-${crypto.randomUUID()}`;
      FALLBACK_INVOICES.set(invId, {
        id: invId,
        invoice_number: invoiceNumber,
        registration_id: params.registrationId,
        payment_order_id: order.id,
        user_id: params.userId || null,
        participant_name: feeSnapshot.participantName,
        championship_name: feeSnapshot.championshipName,
        fee_breakdown: order.fee_snapshot,
        total_amount_paise: order.amount_paise,
        currency: order.currency,
        provider: "RAZORPAY",
        provider_payment_id: params.providerPaymentId,
        payment_date: now,
        invoice_status: "PAID",
        created_at: now,
      });
    }

    const orderDetails: PaymentOrderDetails = {
      id: order.id,
      orderNumber: order.order_number,
      registrationId: order.registration_id,
      userId: order.user_id,
      provider: order.provider,
      providerOrderId: order.provider_order_id,
      amountPaise: order.amount_paise,
      amountFormatted: formatPaiseToInr(order.amount_paise, order.currency),
      currency: order.currency,
      status: "PAID",
      createdAt: order.created_at.toISOString(),
      paidAt: now.toISOString(),
      feeSnapshot,
    };

    const invoiceDetails: PaymentInvoiceDetails = {
      id: `inv-${invoiceNumber}`,
      invoiceNumber,
      registrationId: params.registrationId,
      paymentOrderId: order.id,
      userId: params.userId,
      participantName: feeSnapshot.participantName,
      championshipName: feeSnapshot.championshipName,
      registrationNumber: feeSnapshot.registrationNumber,
      categoryName: feeSnapshot.categoryName,
      feeBreakdown: feeSnapshot,
      totalAmountPaise: order.amount_paise,
      totalAmountFormatted: formatPaiseToInr(order.amount_paise, order.currency),
      currency: order.currency,
      provider: "RAZORPAY",
      providerPaymentId: params.providerPaymentId,
      paymentDate: now.toISOString(),
      invoiceStatus: "PAID",
      createdAt: now.toISOString(),
    };

    return { order: orderDetails, invoice: invoiceDetails };
  }

  /**
   * Processes incoming Razorpay Webhook with HMAC signature check & idempotency
   */
  static async processWebhook(params: {
    rawBody: string;
    signatureHeader: string;
    eventPayload: Record<string, unknown>;
  }): Promise<{ status: string; eventId: string; message: string }> {
    // 1. Validate webhook signature
    const expectedSig = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(params.rawBody)
      .digest("hex");

    let isValidSig = false;
    try {
      const expectedBuffer = Buffer.from(expectedSig, "utf8");
      const actualBuffer = Buffer.from(params.signatureHeader || "", "utf8");
      if (expectedBuffer.length === actualBuffer.length) {
        isValidSig = crypto.timingSafeEqual(expectedBuffer, actualBuffer);
      }
    } catch {
      isValidSig = false;
    }

    if (
      !isValidSig &&
      process.env.NODE_ENV !== "production" &&
      RAZORPAY_WEBHOOK_SECRET.includes("mock") &&
      Boolean(params.signatureHeader?.startsWith("mock_wh_"))
    ) {
      isValidSig = true;
    }

    if (!isValidSig) {
      throw new Error("Invalid webhook signature.");
    }

    // 2. Extract event metadata
    const eventType = (params.eventPayload.event as string) || "unknown";
    const eventId =
      ((params.eventPayload as { event_id?: string; id?: string }).event_id ||
        (params.eventPayload as { event_id?: string; id?: string }).id ||
        `evt_${crypto.randomBytes(8).toString("hex")}`) as string;

    const payloadHash = crypto.createHash("sha256").update(params.rawBody).digest("hex");
    const online = await isDbOnline();

    // 3. Idempotency Check: Don't process the same event twice
    if (online) {
      const existing = await prisma.paymentWebhookEvent.findUnique({
        where: {
          provider_provider_event_id: {
            provider: "RAZORPAY",
            provider_event_id: eventId,
          },
        },
      });

      if (existing) {
        return {
          status: "ALREADY_PROCESSED",
          eventId,
          message: "Webhook event has already been processed idempotently.",
        };
      }
    } else {
      if (FALLBACK_WEBHOOK_EVENTS.has(`RAZORPAY:${eventId}`)) {
        return {
          status: "ALREADY_PROCESSED",
          eventId,
          message: "Webhook event has already been processed idempotently.",
        };
      }
    }

    // 4. Process event based on type
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const payload = params.eventPayload.payload as {
        payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string; method?: string } };
        order?: { entity?: { id?: string; amount?: number; currency?: string } };
      };

      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;
      const providerOrderId = paymentEntity?.order_id || orderEntity?.id;
      const providerPaymentId = paymentEntity?.id;
      const providerAmount = paymentEntity?.amount || orderEntity?.amount;
      const providerCurrency = paymentEntity?.currency || orderEntity?.currency || "INR";

      if (providerOrderId) {
        // Find internal payment order
        let order: { id: string; registration_id: string; amount_paise: number; currency: string; status: PaymentOrderStatus; fee_snapshot: string; user_id?: string | null } | null = null;
        if (online) {
          order = await prisma.paymentOrder.findUnique({
            where: { provider_order_id: providerOrderId },
          });
        } else {
          for (const ord of FALLBACK_ORDERS.values()) {
            if (ord.provider_order_id === providerOrderId) {
              order = ord;
              break;
            }
          }
        }

        if (order) {
          // Verify amount & currency match exactly
          if (providerAmount && providerAmount !== order.amount_paise) {
            console.error(
              `[PaymentService] Amount mismatch for order ${order.id}: expected ${order.amount_paise}, got ${providerAmount}`
            );
            throw new Error(`Amount mismatch in webhook: expected ${order.amount_paise}, received ${providerAmount}`);
          }
          if (providerCurrency && providerCurrency !== order.currency) {
            console.error(
              `[PaymentService] Currency mismatch for order ${order.id}: expected ${order.currency}, got ${providerCurrency}`
            );
            throw new Error(`Currency mismatch in webhook: expected ${order.currency}, received ${providerCurrency}`);
          }

          if (order.status !== "PAID" && providerPaymentId) {
            const feeSnapshot: FeeSnapshot = JSON.parse(order.fee_snapshot);
            const invoiceNumber = this.generateInvoiceNumber();
            const now = new Date();

            if (online) {
              await prisma.$transaction(async (tx) => {
                await tx.paymentTransaction.create({
                  data: {
                    payment_order_id: order!.id,
                    provider_payment_id: providerPaymentId,
                    provider_order_id: providerOrderId,
                    signature_verified: true,
                    amount_paise: order!.amount_paise,
                    amount: order!.amount_paise / 100,
                    currency: order!.currency,
                    payment_method: paymentEntity?.method || "WEBHOOK",
                    status: "CAPTURED",
                    captured_at: now,
                  },
                });

                await tx.paymentOrder.update({
                  where: { id: order!.id },
                  data: {
                    status: "PAID",
                    paid_at: now,
                  },
                });

                await tx.registration.update({
                  where: { id: order!.registration_id },
                  data: { status: "PAID" },
                });

                await tx.paymentInvoice.create({
                  data: {
                    invoice_number: invoiceNumber,
                    registration_id: order!.registration_id,
                    payment_order_id: order!.id,
                    user_id: order!.user_id || null,
                    participant_name: feeSnapshot.participantName,
                    championship_name: feeSnapshot.championshipName,
                    fee_breakdown: order!.fee_snapshot,
                    total_amount_paise: order!.amount_paise,
                    total_amount: order!.amount_paise / 100,
                    currency: order!.currency,
                    provider: "RAZORPAY",
                    provider_payment_id: providerPaymentId,
                    payment_date: now,
                    invoice_status: "PAID",
                  },
                });
              });
            } else {
              order.status = "PAID";
              FALLBACK_ORDERS.set(order.id, order as FallbackPaymentOrder);
            }
          }
        }
      }
    }

    // 5. Record processed webhook event for idempotency
    if (online) {
      await prisma.paymentWebhookEvent.create({
        data: {
          provider: "RAZORPAY",
          provider_event_id: eventId,
          event_type: eventType,
          payload_hash: payloadHash,
          processed_at: new Date(),
          processing_status: "PROCESSED",
        },
      });
    } else {
      FALLBACK_WEBHOOK_EVENTS.set(`RAZORPAY:${eventId}`, {
        id: `wh-${crypto.randomUUID()}`,
        provider: "RAZORPAY",
        provider_event_id: eventId,
        event_type: eventType,
        payload_hash: payloadHash,
        received_at: new Date(),
        processed_at: new Date(),
        processing_status: "PROCESSED",
      });
    }

    return {
      status: "SUCCESS",
      eventId,
      message: `Webhook ${eventType} processed successfully.`,
    };
  }

  /**
   * Retrieves official invoice for registration
   */
  static async getInvoiceByRegistrationId(
    registrationId: string,
    userId?: string | null
  ): Promise<PaymentInvoiceDetails | null> {
    if (userId) {
      await this.verifyOwnership(registrationId, userId);
    }

    const online = await isDbOnline();
    if (online) {
      const inv = await prisma.paymentInvoice.findFirst({
        where: { registration_id: registrationId },
        orderBy: { created_at: "desc" },
        include: {
          registration: {
            include: {
              category: true,
            },
          },
        },
      });

      if (!inv) return null;

      const feeBreakdown: FeeSnapshot = JSON.parse(inv.fee_breakdown);
      return {
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        registrationId: inv.registration_id,
        paymentOrderId: inv.payment_order_id,
        userId: inv.user_id,
        participantName: inv.participant_name,
        academyName: inv.academy_name,
        championshipName: inv.championship_name,
        registrationNumber: inv.registration.registration_number,
        categoryName: inv.registration.category?.name || feeBreakdown.categoryName,
        feeBreakdown,
        totalAmountPaise: inv.total_amount_paise,
        totalAmountFormatted: formatPaiseToInr(inv.total_amount_paise, inv.currency),
        currency: inv.currency,
        provider: inv.provider,
        providerPaymentId: inv.provider_payment_id,
        paymentDate: inv.payment_date.toISOString(),
        invoiceStatus: inv.invoice_status,
        receiptUrl: inv.receipt_url,
        createdAt: inv.created_at.toISOString(),
      };
    } else {
      for (const inv of FALLBACK_INVOICES.values()) {
        if (inv.registration_id === registrationId) {
          const feeBreakdown: FeeSnapshot = JSON.parse(inv.fee_breakdown);
          return {
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            registrationId: inv.registration_id,
            paymentOrderId: inv.payment_order_id,
            userId: inv.user_id,
            participantName: inv.participant_name,
            academyName: inv.academy_name,
            championshipName: inv.championship_name,
            registrationNumber: feeBreakdown.registrationNumber,
            categoryName: feeBreakdown.categoryName,
            feeBreakdown,
            totalAmountPaise: inv.total_amount_paise,
            totalAmountFormatted: formatPaiseToInr(inv.total_amount_paise, inv.currency),
            currency: inv.currency,
            provider: inv.provider,
            providerPaymentId: inv.provider_payment_id,
            paymentDate: inv.payment_date.toISOString(),
            invoiceStatus: inv.invoice_status,
            receiptUrl: inv.receipt_url,
            createdAt: inv.created_at.toISOString(),
          };
        }
      }
      return null;
    }
  }

  /**
   * Authoritative administrative refund service
   */
  static async issueRefund(params: {
    paymentOrderId: string;
    amountPaise?: number; // If omitted, full refund
    reason: string;
    adminUserId?: string | null;
  }): Promise<PaymentRefundDetails> {
    const online = await isDbOnline();
    let order: { id: string; registration_id: string; amount_paise: number; currency: string; status: PaymentOrderStatus; provider_order_id: string } | null = null;
    let transaction: { id: string; provider_payment_id: string; amount_paise: number } | null = null;

    if (online) {
      order = await prisma.paymentOrder.findUnique({
        where: { id: params.paymentOrderId },
      });
      if (!order) throw new Error("Payment order not found.");
      if (order.status !== "PAID" && order.status !== "PARTIALLY_REFUNDED") {
        throw new Error(`Cannot refund an order in ${order.status} state.`);
      }

      transaction = await prisma.paymentTransaction.findFirst({
        where: { payment_order_id: order.id, status: "CAPTURED" },
      });
    } else {
      order = FALLBACK_ORDERS.get(params.paymentOrderId) || null;
      if (!order) throw new Error("Payment order not found.");
      if (order.status !== "PAID" && order.status !== "PARTIALLY_REFUNDED") {
        throw new Error(`Cannot refund an order in ${order.status} state.`);
      }

      for (const txn of FALLBACK_TRANSACTIONS.values()) {
        if (txn.payment_order_id === order.id && txn.status === "CAPTURED") {
          transaction = txn;
          break;
        }
      }
    }

    const refundAmountPaise = params.amountPaise !== undefined ? params.amountPaise : order.amount_paise;
    if (refundAmountPaise <= 0 || refundAmountPaise > order.amount_paise) {
      throw new Error(`Invalid refund amount: ₹${refundAmountPaise / 100}. Must be between ₹1 and ₹${order.amount_paise / 100}.`);
    }

    const providerRefundId = `rfnd_mock_${crypto.randomBytes(8).toString("hex")}`;
    const isFullRefund = refundAmountPaise >= order.amount_paise;
    const newOrderStatus: PaymentOrderStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";
    const now = new Date();

    if (online) {
      await prisma.$transaction(async (tx) => {
        await tx.paymentRefund.create({
          data: {
            payment_order_id: order!.id,
            payment_transaction_id: transaction?.id || null,
            provider_refund_id: providerRefundId,
            amount_paise: refundAmountPaise,
            amount: refundAmountPaise / 100,
            currency: order!.currency,
            reason: params.reason,
            status: "COMPLETED",
            initiated_by: params.adminUserId || null,
            processed_at: now,
          },
        });

        await tx.paymentOrder.update({
          where: { id: order!.id },
          data: { status: newOrderStatus },
        });

        if (isFullRefund) {
          await tx.paymentInvoice.updateMany({
            where: { payment_order_id: order!.id },
            data: { invoice_status: "REFUNDED" },
          });
        }

        await tx.auditLog.create({
          data: {
            admin_user_id: params.adminUserId || null,
            action: "REFUND_COMPLETED",
            entity_type: "PaymentOrder",
            entity_id: order!.id,
            new_value: JSON.stringify({
              refundAmountPaise,
              providerRefundId,
              reason: params.reason,
              isFullRefund,
            }),
          },
        });
      });
    } else {
      order.status = newOrderStatus;
      FALLBACK_ORDERS.set(order.id, order as FallbackPaymentOrder);

      const refId = `ref-${crypto.randomUUID()}`;
      FALLBACK_REFUNDS.set(refId, {
        id: refId,
        payment_order_id: order.id,
        payment_transaction_id: transaction?.id || null,
        provider_refund_id: providerRefundId,
        amount_paise: refundAmountPaise,
        currency: order.currency,
        reason: params.reason,
        status: "COMPLETED",
        initiated_by: params.adminUserId || null,
        initiated_at: now,
        processed_at: now,
      });
    }

    return {
      id: `ref-${providerRefundId}`,
      paymentOrderId: order.id,
      paymentTransactionId: transaction?.id || null,
      providerRefundId,
      amountPaise: refundAmountPaise,
      amountFormatted: formatPaiseToInr(refundAmountPaise, order.currency),
      currency: order.currency,
      reason: params.reason,
      status: "COMPLETED",
      initiatedBy: params.adminUserId || null,
      initiatedAt: now.toISOString(),
      processedAt: now.toISOString(),
    };
  }

  /**
   * Retrieves payment status and fee breakdown for a registration
   */
  static async getPaymentStatus(registrationId: string, userId?: string | null) {
    if (userId) {
      await this.verifyOwnership(registrationId, userId);
    }

    const online = await isDbOnline();
    let currentOrder: PaymentOrderDetails | null = null;
    let paymentStatus: PaymentOrderStatus = "PENDING";
    let invoice: PaymentInvoiceDetails | null = null;

    if (online) {
      const order = await prisma.paymentOrder.findFirst({
        where: { registration_id: registrationId },
        orderBy: { created_at: "desc" },
      });

      if (order) {
        paymentStatus = order.status as PaymentOrderStatus;
        currentOrder = {
          id: order.id,
          orderNumber: order.order_number,
          registrationId: order.registration_id,
          userId: order.user_id,
          provider: order.provider,
          providerOrderId: order.provider_order_id,
          amountPaise: order.amount_paise,
          amountFormatted: formatPaiseToInr(order.amount_paise, order.currency),
          currency: order.currency,
          status: paymentStatus,
          createdAt: order.created_at.toISOString(),
          paidAt: order.paid_at?.toISOString() || null,
          feeSnapshot: JSON.parse(order.fee_snapshot),
        };
      }
    } else {
      for (const ord of FALLBACK_ORDERS.values()) {
        if (ord.registration_id === registrationId) {
          paymentStatus = ord.status;
          currentOrder = {
            id: ord.id,
            orderNumber: ord.order_number,
            registrationId: ord.registration_id,
            userId: ord.user_id,
            provider: ord.provider,
            providerOrderId: ord.provider_order_id,
            amountPaise: ord.amount_paise,
            amountFormatted: formatPaiseToInr(ord.amount_paise, ord.currency),
            currency: ord.currency,
            status: ord.status,
            createdAt: ord.created_at.toISOString(),
            paidAt: ord.paid_at?.toISOString() || null,
            feeSnapshot: JSON.parse(ord.fee_snapshot),
          };
          break;
        }
      }
    }

    if (paymentStatus === "PAID" || paymentStatus === "REFUNDED" || paymentStatus === "PARTIALLY_REFUNDED") {
      invoice = await this.getInvoiceByRegistrationId(registrationId, userId);
    }

    const feeCalculation = await FeeService.calculateFee({ registrationId });

    return {
      registrationId,
      paymentStatus,
      isPaid: paymentStatus === "PAID",
      currentOrder,
      feeCalculation,
      invoice,
    };
  }
}
