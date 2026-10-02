// ==============================================================================
// ADMIN DOCUMENT VERIFICATION QUEUE (Phase 8 Implementation)
// Review participant documents, execute approval/rejection with audit logs
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileCheck,
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Eye,
} from "lucide-react";

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  const loadDocuments = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const bearer = sessionStorage.getItem("kukkiwon_admin_bearer");
      const headers: Record<string, string> = {};
      if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

      const res = await fetch(`/api/admin/documents?${params.toString()}`, { headers });
      const data = await res.json();
      if (data.items) {
        setDocuments(data.items);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleApprove = async (docId: string) => {
    setActionLoading(true);
    try {
      const bearer = sessionStorage.getItem("kukkiwon_admin_bearer");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

      await fetch(`/api/admin/documents/${docId}/verify`, { method: "POST", headers });
      loadDocuments();
    } catch {
      alert("Failed to verify document.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (docId: string) => {
    const reason = window.prompt("Enter mandatory reason for document rejection:");
    if (!reason) return;

    setActionLoading(true);
    try {
      const bearer = sessionStorage.getItem("kukkiwon_admin_bearer");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

      await fetch(`/api/admin/documents/${docId}/reject`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason }),
      });
      loadDocuments();
    } catch {
      alert("Failed to reject document.");
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
            <FileCheck className="h-6 w-6 text-amber-400" />
            <span>Document Verification Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative inspection of athlete identity proof, Kukkiwon Dan certificates, and medical clearances
          </p>
        </div>

        <button
          onClick={() => loadDocuments()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Review Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">All Documents</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="UPLOADED">UPLOADED</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Queue Size: <strong className="text-white">{documents.length}</strong>
        </div>
      </div>

      {/* Main Document Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="p-3.5">Athlete</th>
                <th className="p-3.5">Document Type</th>
                <th className="p-3.5">File Details</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Uploaded</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-400 mb-2" />
                    <span>Loading documents in review queue...</span>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <p className="font-semibold text-white">No documents require review.</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-white uppercase whitespace-nowrap">
                      <div>{doc.athleteName}</div>
                      <div className="text-[10px] font-mono text-[#D4AF37]">{doc.athleteId}</div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-200 whitespace-nowrap">
                      <span>{doc.title}</span>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        v{doc.version}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {doc.fileName}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.status === "VERIFIED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : doc.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/registrations/${doc.registrationId}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                        >
                          Dossier
                        </Link>

                        {doc.status !== "VERIFIED" && (
                          <button
                            onClick={() => handleApprove(doc.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase transition"
                          >
                            Approve
                          </button>
                        )}

                        {doc.status !== "REJECTED" && (
                          <button
                            onClick={() => handleReject(doc.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900 text-rose-300 text-[11px] font-bold uppercase transition"
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
