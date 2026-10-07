// ==============================================================================
// ADMIN PAYMENT VERIFICATION QUEUE
// Rebranded and upgraded from Document Verification to Payment Verification
// Authoritative inspection of UTR / UPI fee transactions and accreditation approvals
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import {
  CreditCard,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  Award,
  ArrowRight,
  Eye,
  Camera,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminPaymentVerificationPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

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

  const loadQueue = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/documents?${params.toString()}`, {
        headers: getAdminHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [statusFilter, getAdminHeaders]);

  React.useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleApprove = async (itemId: string, participantName: string) => {
    if (!confirm(`Are you sure you want to verify and approve payment for ${participantName}? This will instantly update Payments, Registrations, and ID Cards.`)) {
      return;
    }

    setActionLoadingId(itemId);
    setSuccessBanner(null);
    try {
      const res = await fetch(`/api/admin/documents/${itemId}/verify`, {
        method: "POST",
        headers: {
          ...getAdminHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify payment.");
      }

      setSuccessBanner(
        `✓ Payment approved for ${participantName}! Details have been synchronized to Payments, Registrations, and ID Cards sections.`
      );
      loadQueue();
    } catch (err: any) {
      alert(err.message || "Failed to verify payment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (itemId: string, participantName: string) => {
    const reason = window.prompt(`Enter mandatory reason for rejecting payment for ${participantName}:`);
    if (!reason) return;

    setActionLoadingId(itemId);
    setSuccessBanner(null);
    try {
      const res = await fetch(`/api/admin/documents/${itemId}/reject`, {
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
        throw new Error(data.error || "Failed to reject payment.");
      }

      setSuccessBanner(`Payment rejected for ${participantName}.`);
      loadQueue();
    } catch (err: any) {
      alert(err.message || "Failed to reject payment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-emerald-400" />
            <span>Payment Verification Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative verification of tournament fees (₹2,500) and submitted UTR / UPI transaction references.
          </p>
        </div>

        <button
          onClick={() => loadQueue()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Verification Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="">All Verification Requests</option>
            <option value="UNDER_REVIEW">UNDER REVIEW (Pending)</option>
            <option value="VERIFIED">VERIFIED (Approved)</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Queue Total: <strong className="text-white">{items.length}</strong>
        </div>
      </div>

      {/* Main Payment Verification Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="p-3.5">Participant</th>
                <th className="p-3.5">Submitted UTR Reference</th>
                <th className="p-3.5">Fee Amount</th>
                <th className="p-3.5">Division / Academy</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Submitted</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>Loading payment verification queue...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500/60 mb-2" />
                    <p className="font-semibold text-white">All payments verified.</p>
                    <p className="text-xs text-slate-500 mt-1">No pending transaction verification requests at this time.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Participant Details */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {item.photoUrl ? (
                          <div className="relative w-10 h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.photoUrl}
                              alt={item.athleteName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-12 rounded-lg border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center text-slate-600 shrink-0">
                            <Camera className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white uppercase text-xs">
                            {item.athleteName}
                          </div>
                          <div className="text-[10px] font-mono text-[#D4AF37]">
                            {item.athleteId || item.registrationNumber}
                          </div>
                          {item.kukkiwonId && (
                            <div className="text-[10px] font-mono text-slate-400">
                              {item.kukkiwonId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Submitted UTR Reference */}
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/30 inline-block tracking-wider">
                          {item.utrNumber || "OFFLINE-MANUAL"}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {item.participantType === "COACH" ? "Coach Accreditation" : "UPI / Net Banking"}
                        </div>
                      </div>
                    </td>

                    {/* Fee Amount */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="text-sm font-black text-white">
                        {item.amountFormatted || "₹2,500"}
                      </span>
                    </td>

                    {/* Division / Academy */}
                    <td className="p-3.5">
                      <div className="text-xs text-slate-200 font-medium">
                        {item.categoryName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        <span>{item.academyName}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === "VERIFIED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : item.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {item.status === "UNDER_REVIEW" ? "PENDING VERIFICATION" : item.status}
                      </span>
                    </td>

                    {/* Submitted Date */}
                    <td className="p-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(item.submittedAt || item.uploadedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/registrations/${item.registrationId}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition inline-flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Dossier</span>
                        </Link>

                        {item.status !== "VERIFIED" && (
                          <button
                            onClick={() => handleApprove(item.id, item.athleteName)}
                            disabled={actionLoadingId === item.id}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase transition inline-flex items-center gap-1 shadow-sm disabled:opacity-50"
                          >
                            {actionLoadingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3 stroke-[3]" />
                            )}
                            <span>Approve Payment</span>
                          </button>
                        )}

                        {item.status !== "REJECTED" && (
                          <button
                            onClick={() => handleReject(item.id, item.athleteName)}
                            disabled={actionLoadingId === item.id}
                            className="px-2.5 py-1 rounded border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900 text-rose-300 text-[11px] font-bold uppercase transition disabled:opacity-50"
                          >
                            Reject
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
      </div>
    </div>
  );
}
