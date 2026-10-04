// ==============================================================================
// REGISTRATION PAYMENT & CHECKOUT PAGE (Phase 5)
// /my-registration/[registrationId]/payment
// Authoritative fee breakdown, Razorpay checkout, verification & printable receipt
// ==============================================================================

"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  FileText,
  BadgeAlert,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { PaymentInvoiceDetails, FeeCalculationResult } from "@/types/payment";

interface PageProps {
  params: Promise<{ registrationId: string }>;
}

export default function RegistrationPaymentPage({ params }: PageProps) {
  const { registrationId } = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [paymentStatus, setPaymentStatus] = useState<string>("PENDING");
  const [feeCalculation, setFeeCalculation] = useState<FeeCalculationResult | null>(null);
  const [invoice, setInvoice] = useState<PaymentInvoiceDetails | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(true);

  // Load payment status and authoritative fee calculation
  const loadPaymentStatus = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/registrations/${registrationId}/payment`);
      if (res.status === 401) {
        router.push("/register");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load payment details");
      }

      setPaymentStatus(data.paymentStatus);
      setFeeCalculation(data.feeCalculation);
      setInvoice(data.invoice || null);

      if (data.currentOrder?.provider) {
        setIsTestMode(
          !process.env.NEXT_PUBLIC_PAYMENT_KEY_ID ||
            process.env.NEXT_PUBLIC_PAYMENT_KEY_ID.includes("mock") ||
            process.env.NEXT_PUBLIC_PAYMENT_KEY_ID.startsWith("rzp_test")
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to load payment details.");
    } finally {
      setIsLoading(false);
    }
  }, [registrationId, router]);

  useEffect(() => {
    loadPaymentStatus();
  }, [loadPaymentStatus]);

  // Handle Pay Now with Razorpay
  const handlePayNow = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Create order on server
      const orderRes = await fetch(`/api/registrations/${registrationId}/payment/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to initiate payment order");
      }

      const { checkout, order } = orderData;

      // 2. If Razorpay checkout script is loaded and not a pure mock key, open Razorpay popup
      const isRazorpayLoaded = typeof window !== "undefined" && !!(window as any).Razorpay;
      const isRealRazorpay = checkout.keyId && !checkout.keyId.includes("mock");

      if (isRazorpayLoaded && isRealRazorpay) {
        const options = {
          key: checkout.keyId,
          amount: checkout.amountPaise,
          currency: checkout.currency,
          name: checkout.name,
          description: checkout.description,
          order_id: checkout.providerOrderId,
          prefill: checkout.prefill,
          theme: checkout.theme,
          handler: async function (response: any) {
            // Verify payment on server
            await verifyPayment({
              paymentOrderId: order.id,
              providerOrderId: response.razorpay_order_id,
              providerPaymentId: response.razorpay_payment_id,
              providerSignature: response.razorpay_signature,
              paymentMethod: "RAZORPAY_POPUP",
            });
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Test simulator fallback when test keys or offline
        await simulateTestPayment(order);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Payment initiation failed.");
      setIsProcessing(false);
    }
  };

  // Instant simulator for test mode
  const simulateTestPayment = async (order: any) => {
    try {
      const mockPaymentId = `pay_mock_${Date.now()}`;
      // In mock/test mode, the server computes or verifies the signature
      const verifyRes = await fetch(`/api/registrations/${registrationId}/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentOrderId: order.id,
          providerOrderId: order.providerOrderId,
          providerPaymentId: mockPaymentId,
          providerSignature: "mock_sig_verified_for_test",
          paymentMethod: "UPI_SIMULATOR",
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Verification failed");
      }

      setSuccessMsg("Payment completed and verified successfully!");
      setPaymentStatus("PAID");
      setInvoice(verifyData.invoice);
      await loadPaymentStatus();
    } catch (err: any) {
      setErrorMsg(err.message || "Test payment verification failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Complete cryptographic verification
  const verifyPayment = async (payload: {
    paymentOrderId: string;
    providerOrderId: string;
    providerPaymentId: string;
    providerSignature: string;
    paymentMethod: string;
  }) => {
    try {
      const verifyRes = await fetch(`/api/registrations/${registrationId}/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setSuccessMsg("Payment verified and recorded successfully!");
      setPaymentStatus("PAID");
      setInvoice(data.invoice);
      await loadPaymentStatus();
    } catch (err: any) {
      setErrorMsg(err.message || "Payment verification failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const snapshot = feeCalculation?.snapshot;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <PublicHeader />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/my-registration"
            className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registrations Dashboard
          </Link>

          <button
            onClick={loadPaymentStatus}
            disabled={isLoading}
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Status
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Payment Error: </span>
              {errorMsg}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-start gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Success: </span>
              {successMsg}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !feeCalculation ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Loading authoritative registration fee details...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200 mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Kukkiwon Cup 2026 Official Payment
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    Registration Fee Checkout
                  </h1>
                  <p className="text-slate-600 text-sm mt-1">
                    Championship: <strong className="text-slate-900">{snapshot?.championshipName}</strong>
                  </p>
                </div>

                {/* Status Badge */}
                <div className="text-left sm:text-right">
                  <div className="text-xs uppercase font-semibold text-slate-500 mb-1">Payment Status</div>
                  {paymentStatus === "PAID" ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      PAYMENT COMPLETE
                    </span>
                  ) : paymentStatus === "REFUNDED" ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                      <BadgeAlert className="w-4 h-4" />
                      REFUNDED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="w-4 h-4" />
                      UNPAID / PENDING
                    </span>
                  )}
                </div>
              </div>

              {/* Registration Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="text-xs uppercase font-semibold text-slate-500">Participant</div>
                  <div className="text-base font-bold text-slate-900 mt-1">{snapshot?.participantName}</div>
                  <div className="text-xs text-slate-500 mt-0.5 capitalize">{snapshot?.participantType?.toLowerCase()}</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="text-xs uppercase font-semibold text-slate-500">Registration Number</div>
                  <div className="text-base font-mono font-bold text-blue-600 mt-1">
                    {snapshot?.registrationNumber}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Authoritative Ref</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="text-xs uppercase font-semibold text-slate-500">Category & Discipline</div>
                  <div className="text-base font-bold text-slate-900 mt-1">
                    {snapshot?.categoryName || snapshot?.discipline || "Open Designation"}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{snapshot?.categoryCode || "Standard"}</div>
                </div>
              </div>
            </div>

            {/* Fee Breakdown & Checkout Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Fee Breakdown Table (2 cols) */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Authoritative Fee Breakdown
                </h2>

                <div className="divide-y divide-slate-200 border-y border-slate-200">
                  {feeCalculation?.items.map((item, idx) => (
                    <div key={idx} className="py-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                        {item.isLateFee && (
                          <div className="text-xs font-semibold text-amber-600 mt-0.5">
                            Late registration fee rule applied
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        ₹{(item.amountPaise / 100).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Total */}
                <div className="mt-6 pt-4 bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase font-semibold text-slate-600">Total Amount Payable</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      All inclusive • Integer minor precision
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                      {feeCalculation?.formattedTotal}
                    </div>
                    <div className="text-xs text-slate-500 uppercase font-semibold">
                      {feeCalculation?.currency}
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-xs text-slate-500 leading-relaxed">
                  Fee calculations are server-side authoritative snapshots. All online payments are cryptographically
                  verified and settled via official Razorpay integration.
                </div>
              </div>

              {/* Action Sidebar (1 col) */}
              <div className="space-y-6">
                {paymentStatus === "PAID" ? (
                  /* Paid State Card */
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-6 shadow-sm text-center">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-300">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Payment Successful!</h3>
                    <p className="text-xs text-slate-600 mb-6">
                      Your fee has been verified, recorded, and settled.
                    </p>

                    {invoice && (
                      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 text-left space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Invoice:</span>
                          <span className="font-mono font-bold text-slate-800">{invoice.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Paid Amount:</span>
                          <span className="font-bold text-emerald-600">{invoice.totalAmountFormatted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Gateway Ref:</span>
                          <span className="font-mono text-slate-600">{invoice.providerPaymentId || "Verified"}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <a
                        href={`/api/registrations/${registrationId}/invoice?format=html`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all shadow-sm"
                      >
                        <Printer className="w-4 h-4" />
                        Print / Download PDF Receipt
                      </a>

                      <Link
                        href={`/my-registration/${registrationId}/documents`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors border border-slate-300"
                      >
                        Proceed to Documents
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Pay Now Card */
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      Complete Payment
                    </h3>
                    <p className="text-xs text-slate-500 mb-6">
                      Secure payment with UPI, Credit/Debit Cards, or NetBanking via Razorpay.
                    </p>

                    <button
                      onClick={handlePayNow}
                      disabled={isProcessing}
                      className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-base tracking-wide flex items-center justify-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-white" />
                          PAY NOW ({feeCalculation?.formattedTotal})
                        </>
                      )}
                    </button>

                    {/* Test simulator button in test mode */}
                    {isTestMode && (
                      <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                        <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-2">
                          Development / Test Mode Active
                        </div>
                        <button
                          onClick={handlePayNow}
                          disabled={isProcessing}
                          className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors border border-slate-300"
                        >
                          ⚡ 1-Click Test Checkout Simulator
                        </button>
                      </div>
                    )}

                    <div className="mt-6 flex items-center justify-center gap-4 text-slate-500 text-xs">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        256-Bit SSL
                      </span>
                      <span>•</span>
                      <span>Razorpay Verified</span>
                      <span>•</span>
                      <span>Instant Receipt</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
