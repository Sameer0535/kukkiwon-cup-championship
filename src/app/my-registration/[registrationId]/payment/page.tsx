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
    <div className="min-h-screen flex flex-col bg-[#0A192F] text-slate-100">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <PublicHeader />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/my-registration"
            className="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registrations Dashboard
          </Link>

          <button
            onClick={loadPaymentStatus}
            disabled={isLoading}
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Status
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/70 border border-red-800 text-red-200 rounded-lg flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Payment Error: </span>
              {errorMsg}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-950/70 border border-emerald-800 text-emerald-200 rounded-lg flex items-start gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Success: </span>
              {successMsg}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !feeCalculation ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37] mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading authoritative registration fee details...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Kukkiwon Cup 2026 Official Payment
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Registration Fee Checkout
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">
                    Championship: <strong className="text-slate-200">{snapshot?.championshipName}</strong>
                  </p>
                </div>

                {/* Status Badge */}
                <div className="text-left sm:text-right">
                  <div className="text-xs uppercase font-semibold text-slate-400 mb-1">Payment Status</div>
                  {paymentStatus === "PAID" ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <CheckCircle2 className="w-4 h-4" />
                      PAYMENT COMPLETE
                    </span>
                  ) : paymentStatus === "REFUNDED" ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-purple-500/20 text-purple-400 border border-purple-500/40">
                      <BadgeAlert className="w-4 h-4" />
                      REFUNDED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      <Clock className="w-4 h-4" />
                      UNPAID / PENDING
                    </span>
                  )}
                </div>
              </div>

              {/* Registration Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
                  <div className="text-xs uppercase font-semibold text-slate-500">Participant</div>
                  <div className="text-base font-bold text-white mt-1">{snapshot?.participantName}</div>
                  <div className="text-xs text-slate-400 mt-0.5 capitalize">{snapshot?.participantType?.toLowerCase()}</div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
                  <div className="text-xs uppercase font-semibold text-slate-500">Registration Number</div>
                  <div className="text-base font-mono font-bold text-[#D4AF37] mt-1">
                    {snapshot?.registrationNumber}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Authoritative Ref</div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
                  <div className="text-xs uppercase font-semibold text-slate-500">Category & Discipline</div>
                  <div className="text-base font-bold text-white mt-1">
                    {snapshot?.categoryName || snapshot?.discipline || "Open Designation"}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{snapshot?.categoryCode || "Standard"}</div>
                </div>
              </div>
            </div>

            {/* Fee Breakdown & Checkout Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Fee Breakdown Table (2 cols) */}
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-[#D4AF37]" />
                  Authoritative Fee Breakdown
                </h2>

                <div className="divide-y divide-slate-800/80 border-y border-slate-800/80">
                  {feeCalculation?.items.map((item, idx) => (
                    <div key={idx} className="py-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-200">{item.label}</div>
                        {item.isLateFee && (
                          <div className="text-xs font-semibold text-amber-400 mt-0.5">
                            Late registration fee rule applied
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-bold text-slate-100">
                        ₹{(item.amountPaise / 100).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Total */}
                <div className="mt-6 pt-4 bg-slate-950/50 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase font-semibold text-slate-400">Total Amount Payable</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      All inclusive • Integer minor precision
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37]">
                      {feeCalculation?.formattedTotal}
                    </div>
                    <div className="text-xs text-slate-400 uppercase font-semibold">
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
                  <div className="bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-800/50 rounded-xl p-6 shadow-xl text-center">
                    <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Payment Successful!</h3>
                    <p className="text-xs text-slate-400 mb-6">
                      Your fee has been verified, recorded, and settled.
                    </p>

                    {invoice && (
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 mb-6 text-left space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Invoice:</span>
                          <span className="font-mono font-bold text-slate-200">{invoice.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Paid Amount:</span>
                          <span className="font-bold text-emerald-400">{invoice.totalAmountFormatted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Gateway Ref:</span>
                          <span className="font-mono text-slate-400">{invoice.providerPaymentId || "Verified"}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <a
                        href={`/api/registrations/${registrationId}/invoice?format=html`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#D4AF37] hover:bg-[#C29F2D] text-slate-950 font-bold rounded-lg text-sm transition-all shadow-lg shadow-[#D4AF37]/10"
                      >
                        <Printer className="w-4 h-4" />
                        Print / Download PDF Receipt
                      </a>

                      <Link
                        href={`/my-registration/${registrationId}/documents`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors"
                      >
                        Proceed to Documents
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Pay Now Card */
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                      Complete Payment
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">
                      Secure payment with UPI, Credit/Debit Cards, or NetBanking via Razorpay.
                    </p>

                    <button
                      onClick={handlePayNow}
                      disabled={isProcessing}
                      className="w-full py-4 px-6 bg-gradient-to-r from-[#D4AF37] to-[#C29F2D] hover:from-[#E5BF42] hover:to-[#D4AF37] text-slate-950 font-black rounded-xl text-base tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-[#D4AF37]/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-slate-950" />
                          PAY NOW ({feeCalculation?.formattedTotal})
                        </>
                      )}
                    </button>

                    {/* Test simulator button in test mode */}
                    {isTestMode && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
                        <div className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-2">
                          Development / Test Mode Active
                        </div>
                        <button
                          onClick={handlePayNow}
                          disabled={isProcessing}
                          className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold rounded-lg text-xs transition-colors border border-slate-700"
                        >
                          ⚡ 1-Click Test Checkout Simulator
                        </button>
                      </div>
                    )}

                    <div className="mt-6 flex items-center justify-center gap-4 text-slate-500 text-xs">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
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
