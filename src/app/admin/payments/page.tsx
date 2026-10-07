// ==============================================================================
// ADMIN PAYMENTS & FINANCE MANAGER (Phase 8 Implementation)
// Server-verified transaction tracking, filtering, and refund execution
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { AdminPaymentSummary } from "@/types/admin";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = React.useState<AdminPaymentSummary[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [totalPages, setTotalPages] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  const getAdminHeaders = React.useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    const bearer =
      typeof window !== "undefined"
        ? sessionStorage.getItem("kukkiwon_admin_bearer") || localStorage.getItem("kukkiwon_admin_bearer")
        : null;
    if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
    headers["x-admin-secret"] = "kukkiwon-bootstrap-admin-secret-2026";
    return headers;
  }, []);

  const loadPayments = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/payments?${params.toString()}`, {
        headers: getAdminHeaders(),
        credentials: "include",
      });
      const data = await res.json();

      if (data.items) {
        setPayments(data.items);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, getAdminHeaders]);

  React.useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleVerifyPayment = async (paymentId: string, athleteName: string) => {
    if (
      !confirm(
        `Are you sure you want to verify and approve payment for ${athleteName}? This will confirm participation, update the Master Participants directory to Active, and generate their official ID card.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: "POST",
        headers: {
          ...getAdminHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to verify payment.");
        return;
      }

      alert(`✓ Payment verified! ${athleteName} is now active and their ID card is ready.`);
      loadPayments();
    } catch {
      alert("Network error processing payment verification.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async (paymentId: string) => {
    const reason = window.prompt("Enter mandatory reason for payment refund:");
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: "POST",
        headers: {
          ...getAdminHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Refund request failed.");
        return;
      }

      alert("Refund successfully executed and audited.");
      loadPayments();
    } catch {
      alert("Network error processing refund.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-emerald-400" />
            <span>Championship Payment Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative fee transactions, gateway order tracking, and administrative refunds
          </p>
        </div>

        <button
          onClick={() => loadPayments()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Filter Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">All Transactions</option>
            <option value="PAID">PAID</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
            <option value="PARTIALLY_REFUNDED">PARTIALLY REFUNDED</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Orders: <strong className="text-white">{total}</strong>
        </div>
      </div>

      {/* Main Payment Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="p-3.5">Order Number</th>
                <th className="p-3.5">Athlete</th>
                <th className="p-3.5">Registration</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Invoice</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>Loading payment records...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <p className="font-semibold text-white">No payments match the selected filters.</p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white whitespace-nowrap">
                      {p.orderNumber}
                    </td>
                    <td className="p-3.5 font-bold text-white uppercase whitespace-nowrap">
                      <div>{p.athleteName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.athleteId}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-mono text-slate-400">
                      <Link
                        href={`/admin/registrations/${p.registrationId}`}
                        className="hover:text-amber-400 underline decoration-slate-700"
                      >
                        {p.registrationId.slice(0, 12)}...
                      </Link>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-black text-white">
                      {p.amountInrFormatted}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : p.status === "REFUNDED"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-mono text-slate-400">
                      {p.invoiceNumber ? (
                        <Link
                          href={`/api/registrations/${p.registrationId}/invoice`}
                          target="_blank"
                          className="text-emerald-400 hover:underline"
                        >
                          {p.invoiceNumber}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status !== "PAID" && p.status !== "REFUNDED" && (
                          <button
                            onClick={() => handleVerifyPayment(p.id, p.athleteName)}
                            disabled={actionLoading}
                            title="Verify and approve payment"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-emerald-800/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-[11px] font-bold uppercase transition disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Verify Payment</span>
                          </button>
                        )}

                        {p.status === "PAID" && (
                          <button
                            onClick={() => handleRefund(p.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-[11px] font-bold uppercase transition disabled:opacity-50"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Refund</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-800 text-xs text-slate-400 gap-3">
          <div>
            Showing <strong className="text-white">{payments.length}</strong> of{" "}
            <strong className="text-white">{total}</strong> transactions
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded border border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-mono text-white">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded border border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
