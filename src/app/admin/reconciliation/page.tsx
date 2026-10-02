// ==============================================================================
// ADMINISTRATIVE FINANCIAL RECONCILIATION PAGE (Phase 5)
// /admin/reconciliation
// Authoritative revenue reconciliation, settlement auditing, and refund management
// ==============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowUpRight,
  TrendingUp,
  RotateCcw,
  ShieldCheck,
  Search,
  Filter,
} from "lucide-react";
import { ReconciliationSummary, PaymentOrderStatus } from "@/types/payment";

export default function AdminReconciliationPage() {
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Refund Modal State
  const [refundModalOrder, setRefundModalOrder] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmountPaise, setRefundAmountPaise] = useState<string>("");
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundFeedback, setRefundFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const url =
        selectedStatus !== "ALL"
          ? `/api/admin/reconciliation?status=${selectedStatus}`
          : `/api/admin/reconciliation`;

      const res = await fetch(url, {
        headers: {
          "x-admin-secret": "kukkiwon-bootstrap-admin-secret-2026",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load financial reconciliation data");
      }

      setSummary(data.summary);
      setRecords(data.records || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load financial reconciliation.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Refund Execution
  const handleExecuteRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalOrder || !refundReason.trim()) return;

    setIsRefunding(true);
    setRefundFeedback(null);
    try {
      const payload: any = {
        reason: refundReason.trim(),
      };
      if (refundAmountPaise && Number(refundAmountPaise) > 0) {
        payload.amountPaise = Number(refundAmountPaise) * 100; // Convert to paise
      }

      const res = await fetch(`/api/admin/payments/${refundModalOrder.orderId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": "kukkiwon-bootstrap-admin-secret-2026",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Refund execution failed");
      }

      setRefundFeedback("Refund successfully executed and recorded.");
      setTimeout(() => {
        setRefundModalOrder(null);
        setRefundReason("");
        setRefundAmountPaise("");
        setRefundFeedback(null);
        loadData();
      }, 1500);
    } catch (err: any) {
      setRefundFeedback(`Error: ${err.message}`);
    } finally {
      setIsRefunding(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.registrationNumber?.toLowerCase().includes(q) ||
      r.participantName?.toLowerCase().includes(q) ||
      r.orderNumber?.toLowerCase().includes(q) ||
      r.providerPaymentId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 text-slate-100 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Financial Audit & Settlement
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
            Financial Reconciliation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative comparison of application registration balances against verified Razorpay settlements.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/70 border border-red-800 text-red-200 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase text-slate-500">Registrations</div>
            <div className="text-2xl font-black text-white mt-1">{summary.totalRegistrations}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Total Records</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase text-slate-500">Total Expected</div>
            <div className="text-2xl font-black text-slate-200 mt-1">{summary.formattedAmountDue}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Calculated Fees</div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase text-emerald-400 flex items-center justify-between">
              <span>Verified Paid</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">{summary.formattedPaid}</div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">Settled via Gateway</div>
          </div>

          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase text-amber-400 flex items-center justify-between">
              <span>Pending</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{summary.formattedPending}</div>
            <div className="text-[10px] text-amber-500/80 mt-0.5">Awaiting Checkout</div>
          </div>

          <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase text-purple-400 flex items-center justify-between">
              <span>Refunded</span>
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black text-purple-300 mt-1">{summary.formattedRefunded}</div>
            <div className="text-[10px] text-purple-500/80 mt-0.5">Processed Refunds</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase text-slate-500">Outstanding</div>
            <div className="text-2xl font-black text-[#D4AF37] mt-1">{summary.formattedOutstanding}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Balance Receivable</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search participant, ref, order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-400">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Reconciliation Ledger Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Order Ref</th>
                <th className="py-3.5 px-4">Registration</th>
                <th className="py-3.5 px-4">Participant</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Gateway Reference</th>
                <th className="py-3.5 px-4">Settlement Check</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No payment orders match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#D4AF37]">{r.orderNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{r.registrationNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{r.participantName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">{r.amountFormatted}</td>
                    <td className="py-3.5 px-4">
                      {r.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          PAID
                        </span>
                      ) : r.status === "REFUNDED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">
                          REFUNDED
                        </span>
                      ) : r.status === "PARTIALLY_REFUNDED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">
                          PARTIAL REFUND
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          {r.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{r.providerPaymentId || "—"}</td>
                    <td className="py-3.5 px-4">
                      {r.isSettled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Reconciled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status === "PAID" && (
                        <button
                          onClick={() => {
                            setRefundModalOrder(r);
                            setRefundReason("");
                            setRefundAmountPaise("");
                            setRefundFeedback(null);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REFUND MODAL */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0C1222] p-6 shadow-2xl text-slate-100 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-purple-400" />
              Administrative Refund Execution
            </h3>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs space-y-1">
              <div>Order: <strong className="text-[#D4AF37]">{refundModalOrder.orderNumber}</strong></div>
              <div>Participant: <strong>{refundModalOrder.participantName}</strong></div>
              <div>Original Amount: <strong className="text-emerald-400">{refundModalOrder.amountFormatted}</strong></div>
            </div>

            {refundFeedback && (
              <div
                className={`p-3 rounded text-xs ${
                  refundFeedback.startsWith("Error")
                    ? "bg-red-950/80 text-red-200 border border-red-800"
                    : "bg-emerald-950/80 text-emerald-200 border border-emerald-800"
                }`}
              >
                {refundFeedback}
              </div>
            )}

            <form onSubmit={handleExecuteRefund} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Mandatory Audit Reason *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Ineligible category, duplicate submission, medical withdrawal"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Refund Amount (₹ INR) — Optional (Leave empty for full refund)
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder="Full amount by default"
                  value={refundAmountPaise}
                  onChange={(e) => setRefundAmountPaise(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModalOrder(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isRefunding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
