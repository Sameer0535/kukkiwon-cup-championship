// ==============================================================================
// ADMIN ID CARDS & QR ACCREDITATION (Phase 8 Implementation)
// Digital ID badge generation, revocation, reissuance & public QR validation links
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import {
  IdCard,
  QrCode,
  ExternalLink,
  RefreshCw,
  Ban,
  RotateCw,
  Download,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { AdminIdCardSummary } from "@/types/admin";

export default function AdminIdCardsPage() {
  const [cards, setCards] = React.useState<AdminIdCardSummary[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [totalPages, setTotalPages] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  const loadCards = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (statusFilter) params.set("status", statusFilter);

      const bearer = sessionStorage.getItem("kukkiwon_admin_bearer");
      const headers: Record<string, string> = {};
      if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

      const res = await fetch(`/api/admin/id-cards?${params.toString()}`, { headers });
      const data = await res.json();
      if (data.items) {
        setCards(data.items);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  React.useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleRevoke = async (athleteId: string) => {
    const reason = window.prompt("Enter mandatory reason for ID Card revocation:");
    if (!reason) return;

    setActionLoading(true);
    try {
      const bearer = sessionStorage.getItem("kukkiwon_admin_bearer");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

      const res = await fetch(`/api/admin/id-cards/${encodeURIComponent(athleteId)}/revoke`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Revocation failed.");
        return;
      }

      alert("ID card revoked.");
      loadCards();
    } catch {
      alert("Network error revoking card.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReissue = async (athleteId: string) => {
    const reason = window.prompt("Enter reason for card reissuance:");
    if (!reason) return;

    setActionLoading(true);
    try {
      const bearer = sessionStorage.getItem("kukkiwon_admin_bearer");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

      const res = await fetch(`/api/admin/id-cards/${encodeURIComponent(athleteId)}/reissue`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Reissuance failed.");
        return;
      }

      alert("Card reissued with incremented version and rotated QR token.");
      loadCards();
    } catch {
      alert("Network error reissuing card.");
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
            <IdCard className="h-6 w-6 text-[#D4AF37]" />
            <span>Digital ID Cards & QR Accreditation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official badge credential lifecycle, public QR verification links, and versioning controls
          </p>
        </div>

        <button
          onClick={() => loadCards()}
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
            Card Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">All Card Statuses</option>
            <option value="GENERATED">GENERATED</option>
            <option value="REISSUED">REISSUED</option>
            <option value="READY">READY</option>
            <option value="REVOKED">REVOKED</option>
            <option value="NOT_ELIGIBLE">NOT ELIGIBLE</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Cards: <strong className="text-white">{total}</strong>
        </div>
      </div>

      {/* Main ID Card Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="p-3.5">Athlete ID</th>
                <th className="p-3.5">Athlete Name</th>
                <th className="p-3.5">Academy</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Version</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Generated</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#D4AF37] mb-2" />
                    <span>Loading athlete ID cards...</span>
                  </td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <p className="font-semibold text-white">No ID cards found.</p>
                  </td>
                </tr>
              ) : (
                cards.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#D4AF37] whitespace-nowrap">
                      {c.athleteId}
                    </td>
                    <td className="p-3.5 font-bold text-white uppercase whitespace-nowrap">
                      {c.athleteName}
                    </td>
                    <td className="p-3.5 text-slate-300 whitespace-nowrap">
                      {c.academyName}
                    </td>
                    <td className="p-3.5 text-slate-300 whitespace-nowrap">
                      {c.categoryName}
                    </td>
                    <td className="p-3.5 font-mono text-white font-bold whitespace-nowrap">
                      v{c.version}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === "GENERATED" || c.status === "REISSUED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : c.status === "REVOKED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(c.generatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Phase 8 Requirement 11: Direct Public QR Verification Link */}
                        <a
                          href={c.verificationUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="View Public QR Verification"
                          className="p-1.5 rounded bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 transition"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </a>

                        <a
                          href={`/api/registrations/${c.registrationId}/id-card/download`}
                          target="_blank"
                          title="Download Printable Badge"
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>

                        {c.status === "GENERATED" || c.status === "REISSUED" ? (
                          <button
                            onClick={() => handleRevoke(c.athleteId)}
                            disabled={actionLoading}
                            title="Revoke Card"
                            className="px-2 py-1 rounded border border-rose-900/60 bg-rose-950/30 hover:bg-rose-900 text-rose-300 text-[10px] font-bold uppercase transition"
                          >
                            Revoke
                          </button>
                        ) : c.status === "REVOKED" ? (
                          <button
                            onClick={() => handleReissue(c.athleteId)}
                            disabled={actionLoading}
                            title="Reissue Card"
                            className="px-2 py-1 rounded border border-emerald-900/60 bg-emerald-950/30 hover:bg-emerald-900 text-emerald-300 text-[10px] font-bold uppercase transition"
                          >
                            Reissue
                          </button>
                        ) : null}
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
            Showing <strong className="text-white">{cards.length}</strong> of{" "}
            <strong className="text-white">{total}</strong> accreditation cards
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
