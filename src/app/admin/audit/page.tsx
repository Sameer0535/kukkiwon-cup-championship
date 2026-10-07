// ==============================================================================
// ADMIN AUDIT LOGS (Phase 8 Implementation)
// Immutable traceability of all administrative actions with filtering
// ==============================================================================

"use client";

import * as React from "react";
import {
  ShieldAlert,
  Filter,
  RefreshCw,
  Lock,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { AdminAuditLogEntry } from "@/types/admin";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = React.useState<AdminAuditLogEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [totalPages, setTotalPages] = React.useState(1);
  const [actionFilter, setActionFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const loadAuditLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (actionFilter) params.set("action", actionFilter);

      const bearer =
        typeof window !== "undefined"
          ? sessionStorage.getItem("kukkiwon_admin_bearer") || localStorage.getItem("kukkiwon_admin_bearer")
          : null;
      const headers: Record<string, string> = {
        "x-admin-secret": "kukkiwon-bootstrap-admin-secret-2026",
      };
      if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (data.items) {
        setLogs(data.items);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter]);

  React.useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-purple-400" />
            <span>Immutable Administrative Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete cryptographic audit trail of logins, document verifications, status approvals, card revocations, and financial actions
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-xs text-purple-300 font-semibold">
            <Lock className="h-3.5 w-3.5" />
            <span>Write-Only Ledger</span>
          </span>

          <button
            onClick={() => loadAuditLogs()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Filter Action:
          </span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">All Security Events</option>
            <option value="ADMIN_LOGIN">ADMIN_LOGIN</option>
            <option value="REGISTRATION_VIEWED">REGISTRATION_VIEWED</option>
            <option value="REGISTRATION_STATUS_UPDATED">REGISTRATION_STATUS_UPDATED</option>
            <option value="REGISTRATION_APPROVED">REGISTRATION_APPROVED</option>
            <option value="REGISTRATION_REJECTED">REGISTRATION_REJECTED</option>
            <option value="DOCUMENT_VERIFIED">DOCUMENT_VERIFIED</option>
            <option value="DOCUMENT_REJECTED">DOCUMENT_REJECTED</option>
            <option value="ATHLETE_ID_CARD_REVOKED">ATHLETE_ID_CARD_REVOKED</option>
            <option value="ATHLETE_ID_CARD_REISSUED">ATHLETE_ID_CARD_REISSUED</option>
            <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
            <option value="PAYMENT_REFUNDED">PAYMENT_REFUNDED</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Recorded Audit Events: <strong className="text-white">{total}</strong>
        </div>
      </div>

      {/* Main Audit Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Admin User</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Entity</th>
                <th className="p-3.5">Entity ID</th>
                <th className="p-3.5">Result / Details</th>
                <th className="p-3.5 text-right">IP / Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-400 mb-2" />
                    <span>Loading immutable audit ledger...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <p className="font-semibold text-white">No audit events match your search.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-semibold text-white">
                      <div>{log.adminName || "System Admin"}</div>
                      <div className="text-[10px] font-mono text-slate-500">{log.adminRole || "SUPER_ADMIN"}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-medium text-slate-300">
                      {log.entityType}
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-[#D4AF37]">
                      {log.entityId}
                    </td>
                    <td className="p-3.5 max-w-xs truncate font-mono text-[10px] text-slate-400">
                      {log.newValue || log.oldValue || "—"}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap font-mono text-[10px] text-slate-500">
                      {log.ipAddress || "127.0.0.1"}
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
            Showing <strong className="text-white">{logs.length}</strong> of{" "}
            <strong className="text-white">{total}</strong> audit entries
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
