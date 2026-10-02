// ==============================================================================
// KUKKIWON CUP CHAMPIONSHIP - PAYMENT & FINANCIAL TYPES
// Standalone Type System for Registration Fees, Payments, Invoices & Reconciliation
// ==============================================================================

export type PaymentOrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export type RefundStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface FeeItem {
  code: string;
  label: string;
  amountPaise: number;
  isLateFee?: boolean;
  isTax?: boolean;
}

export interface FeeSnapshot {
  championshipId: string;
  championshipName: string;
  registrationId: string;
  registrationNumber: string;
  participantType: string;
  participantName: string;
  categoryCode?: string;
  categoryName?: string;
  discipline?: string;
  baseFeePaise: number;
  lateFeePaise: number;
  additionalFeesPaise: number;
  taxPaise: number;
  totalPaise: number;
  currency: string;
  isLate: boolean;
  items: FeeItem[];
  calculatedAt: string;
}

export interface FeeCalculationResult {
  baseFeePaise: number;
  lateFeePaise: number;
  additionalFeesPaise: number;
  taxPaise: number;
  totalPaise: number;
  currency: string;
  isLate: boolean;
  formattedBaseFee: string;
  formattedLateFee: string;
  formattedAdditionalFees: string;
  formattedTax: string;
  formattedTotal: string;
  items: FeeItem[];
  snapshot: FeeSnapshot;
}

export interface PaymentOrderDetails {
  id: string;
  orderNumber: string;
  registrationId: string;
  userId?: string | null;
  provider: string;
  providerOrderId: string;
  amountPaise: number;
  amountFormatted: string;
  currency: string;
  status: PaymentOrderStatus;
  createdAt: string;
  expiresAt?: string | null;
  paidAt?: string | null;
  feeSnapshot: FeeSnapshot;
}

export interface PaymentTransactionDetails {
  id: string;
  paymentOrderId: string;
  providerPaymentId: string;
  providerOrderId: string;
  signatureVerified: boolean;
  amountPaise: number;
  amountFormatted: string;
  currency: string;
  paymentMethod?: string | null;
  status: string;
  capturedAt?: string | null;
  failureCode?: string | null;
  failureReason?: string | null;
  createdAt: string;
}

export interface PaymentInvoiceDetails {
  id: string;
  invoiceNumber: string;
  registrationId: string;
  paymentOrderId?: string | null;
  userId?: string | null;
  participantName: string;
  academyName?: string | null;
  championshipName: string;
  registrationNumber: string;
  categoryName?: string | null;
  feeBreakdown: FeeSnapshot;
  totalAmountPaise: number;
  totalAmountFormatted: string;
  currency: string;
  provider: string;
  providerPaymentId?: string | null;
  paymentDate: string;
  invoiceStatus: string;
  receiptUrl?: string | null;
  createdAt: string;
}

export interface PaymentRefundDetails {
  id: string;
  paymentOrderId: string;
  paymentTransactionId?: string | null;
  providerRefundId?: string | null;
  amountPaise: number;
  amountFormatted: string;
  currency: string;
  reason: string;
  status: RefundStatus;
  initiatedBy?: string | null;
  initiatedAt: string;
  processedAt?: string | null;
  errorMessage?: string | null;
}

export interface ReconciliationSummary {
  championshipId?: string;
  totalRegistrations: number;
  totalAmountDuePaise: number;
  totalPaidPaise: number;
  totalPendingPaise: number;
  totalFailedPaise: number;
  totalRefundedPaise: number;
  outstandingPaise: number;
  formattedAmountDue: string;
  formattedPaid: string;
  formattedPending: string;
  formattedFailed: string;
  formattedRefunded: string;
  formattedOutstanding: string;
  ordersByStatus: Record<PaymentOrderStatus, number>;
  discrepanciesCount: number;
}

export interface CheckoutConfig {
  orderId: string;
  providerOrderId: string;
  keyId: string;
  amountPaise: number;
  currency: string;
  name: string;
  description: string;
  registrationNumber: string;
  participantName: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  isTestMode?: boolean;
}
