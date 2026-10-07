// ==============================================================================
// ADMIN ID CARDS & QR ACCREDITATION
// Badge generation, template customization, bulk printing & lifecycle controls
// ==============================================================================

"use client";

import * as React from "react";
import {
  IdCard,
  QrCode,
  RefreshCw,
  Download,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Trash2,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Mail,
  Printer,
  X,
  ExternalLink,
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

  // Card View / Preview Modal
  const [viewCard, setViewCard] = React.useState<AdminIdCardSummary | null>(null);
  const [viewModalOpen, setViewModalOpen] = React.useState(false);

  // Template State
  const [templateUrl, setTemplateUrl] = React.useState<string | null>(null);
  const [templateLoading, setTemplateLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Single Card Generation Modal
  const [genModalOpen, setGenModalOpen] = React.useState(false);
  const [genRegId, setGenRegId] = React.useState("");
  const [genLoading, setGenLoading] = React.useState(false);
  const [genError, setGenError] = React.useState<string | null>(null);
  const [genSuccess, setGenSuccess] = React.useState<string | null>(null);

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

  const loadCards = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/id-cards?${params.toString()}`, {
        headers: getAdminHeaders(),
        credentials: "include",
      });
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
  }, [page, pageSize, statusFilter, getAdminHeaders]);

  const loadTemplate = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/id-cards/template", {
        headers: getAdminHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.templateUrl) {
        setTemplateUrl(data.templateUrl);
      } else {
        setTemplateUrl(null);
      }
    } catch {
      // Ignore
    }
  }, [getAdminHeaders]);

  React.useEffect(() => {
    loadCards();
    loadTemplate();
  }, [loadCards, loadTemplate]);

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, or WEBP).");
      return;
    }

    setTemplateLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const headers = {
          ...getAdminHeaders(),
          "Content-Type": "application/json",
        };

        const res = await fetch("/api/admin/id-cards/template", {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ templateUrl: base64 }),
        });

        const data = await res.json();
        if (res.ok) {
          setTemplateUrl(base64);
          alert("ID card background template uploaded successfully!");
        } else {
          if (res.status === 401) {
            alert("Admin authentication is required. Please re-authenticate at /admin/login or provide credentials.");
          } else {
            alert(data.error || "Failed to upload template.");
          }
        }
        setTemplateLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      alert("Error reading file.");
      setTemplateLoading(false);
    }
  };

  const handleRemoveTemplate = async () => {
    if (!confirm("Are you sure you want to remove the custom ID card template? The default institutional design will be restored.")) {
      return;
    }

    setTemplateLoading(true);
    try {
      const res = await fetch("/api/admin/id-cards/template", {
        method: "DELETE",
        headers: getAdminHeaders(),
        credentials: "include",
      });

      if (res.ok) {
        setTemplateUrl(null);
        alert("Custom template removed. Default design restored.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove template.");
      }
    } catch {
      alert("Error removing template.");
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleGenerateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genRegId.trim()) return;

    setGenLoading(true);
    setGenError(null);
    setGenSuccess(null);

    try {
      const headers = {
        ...getAdminHeaders(),
        "Content-Type": "application/json",
      };

      const res = await fetch("/api/admin/id-cards/generate", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ registrationId: genRegId.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate ID card.");
      }

      setGenSuccess(`ID Card successfully generated! Athlete ID: ${data.card.athleteId}`);
      setGenRegId("");
      loadCards();
      setTimeout(() => {
        setGenModalOpen(false);
        setGenSuccess(null);
      }, 2000);
    } catch (err: any) {
      setGenError(err.message || "Failed to generate ID card.");
    } finally {
      setGenLoading(false);
    }
  };

  const handleRevoke = async (athleteId: string) => {
    const reason = window.prompt("Enter mandatory reason for ID Card revocation:");
    if (!reason) return;

    setActionLoading(true);
    try {
      const headers = {
        ...getAdminHeaders(),
        "Content-Type": "application/json",
      };

      const res = await fetch(`/api/admin/id-cards/${encodeURIComponent(athleteId)}/revoke`, {
        method: "POST",
        headers,
        credentials: "include",
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
      const headers = {
        ...getAdminHeaders(),
        "Content-Type": "application/json",
      };

      const res = await fetch(`/api/admin/id-cards/${encodeURIComponent(athleteId)}/reissue`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Reissuance failed.");
        return;
      }

      alert("Card reissued with incremented version.");
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
            <span>Digital ID Cards & Accreditation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Institutional badge generation, background template uploads, and verified bulk printing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setGenModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Generate ID Card</span>
          </button>

          <a
            href="/api/admin/id-cards/bulk-download"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Bulk Download / Print All</span>
          </a>

          <button
            onClick={() => loadCards()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Template Management Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#D4AF37]" />
              <span>ID Card Background Template</span>
            </h3>
            <p className="text-xs text-slate-400">
              Upload a custom tournament graphic template (PNG/JPG 100mm × 150mm). The 5 mandatory fields (Photo, Name, Academy, Athlete ID, Kukkiwon ID) will be rendered over it.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleTemplateUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={templateLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-300 uppercase transition disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{templateUrl ? "Replace Template" : "Upload Template"}</span>
            </button>

            {templateUrl && (
              <button
                onClick={handleRemoveTemplate}
                disabled={templateLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-900/60 bg-rose-950/30 hover:bg-rose-900 text-xs font-bold text-rose-300 uppercase transition disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {templateUrl ? (
          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="relative w-16 h-24 rounded-lg overflow-hidden border border-amber-500/30 bg-slate-900 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={templateUrl}
                alt="ID Card Template Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Custom ID Card Template Active</span>
              </div>
              <p className="text-slate-400">
                All single downloads and bulk print batches will render with this background design.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
            No custom template uploaded. Badges are currently rendered using the standard Kukkiwon Cup navy & gold corporate frame.
          </div>
        )}
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
                <th className="p-3.5">Version</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Generated</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#D4AF37] mb-2" />
                    <span>Loading athlete ID cards...</span>
                  </td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <p className="font-semibold text-white">No ID cards found.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click &ldquo;Generate ID Card&rdquo; above to generate cards for verified/paid registrations.
                    </p>
                  </td>
                </tr>
              ) : (
                cards.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#D4AF37] whitespace-nowrap">
                      {c.athleteId}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-white uppercase">{c.athleteName}</div>
                      <div className="text-[11px] text-amber-400 font-mono flex items-center gap-1 mt-0.5 lowercase">
                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{c.athleteEmail || "No email on record"}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-300 whitespace-nowrap">
                      {c.academyName}
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
                        <button
                          onClick={() => {
                            setViewCard(c);
                            setViewModalOpen(true);
                          }}
                          title="View / Preview Athlete ID Card"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase transition"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </button>

                        <a
                          href={`/api/registrations/${c.registrationId}/id-card/download?admin_secret=kukkiwon-bootstrap-admin-secret-2026&autoprint=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Print / Download Single Card"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bold uppercase transition"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
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

      {/* Manual Generation Modal */}
      {genModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white space-y-5 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <IdCard className="h-5 w-5 text-amber-400" />
                <span>Generate Athlete ID Card</span>
              </h3>
              <p className="text-xs text-slate-400">
                Only registrations with verified payments can be issued an institutional ID card.
              </p>
            </div>

            {genError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{genError}</span>
              </div>
            )}

            {genSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{genSuccess}</span>
              </div>
            )}

            <form onSubmit={handleGenerateCard} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Registration ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. reg_123 or UUID"
                  value={genRegId}
                  onChange={(e) => setGenRegId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGenModalOpen(false);
                    setGenError(null);
                    setGenSuccess(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={genLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase transition disabled:opacity-50"
                >
                  {genLoading ? "Generating..." : "Generate Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View ID Card Accreditation Modal */}
      {viewModalOpen && viewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2">
                <IdCard className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Athlete Accreditation Badge
                </h3>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body / Badge Preview */}
            <div className="p-6 space-y-6">
              {/* Badge Physical Mockup Container */}
              <div className="mx-auto w-full max-w-sm rounded-2xl overflow-hidden border-2 border-amber-400/60 bg-gradient-to-b from-[#0A192F] via-[#0D1F38] to-[#0A192F] shadow-2xl relative text-center">
                {/* Gold Top Banner */}
                <div className="bg-[#D4AF37] py-1 text-[9px] font-black uppercase tracking-widest text-slate-950">
                  Official Competitor Accreditation
                </div>

                {/* Badge Header */}
                <div className="p-4 border-b border-amber-400/30">
                  <h4 className="text-base font-black uppercase tracking-wider text-[#D4AF37]">
                    Kukkiwon Cup 2026
                  </h4>
                  <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest mt-0.5">
                    India North Championship • New Delhi
                  </p>
                </div>

                {/* Badge Content */}
                <div className="p-5 space-y-4">
                  {/* Athlete Photo & Dan Badge */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-slate-800 flex items-center justify-center shadow-lg">
                        {viewCard.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={viewCard.photoUrl}
                            alt={viewCard.athleteName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-2xl font-black text-[#D4AF37] uppercase">
                            {viewCard.athleteName.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#D4AF37] text-slate-950 font-black text-[9px] uppercase tracking-wider whitespace-nowrap shadow">
                        {viewCard.kukkiwonId || "Competitor"}
                      </span>
                    </div>
                  </div>

                  {/* Athlete Name & Registered Email */}
                  <div>
                    <h3 className="text-lg font-black uppercase text-white tracking-wide">
                      {viewCard.athleteName}
                    </h3>
                    <div className="inline-flex items-center gap-1 text-xs text-amber-300/90 font-mono mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/60 border border-amber-400/20">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span>{viewCard.athleteEmail || "No registered email"}</span>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 text-left bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Athlete ID
                      </span>
                      <span className="font-mono font-bold text-[#D4AF37]">
                        {viewCard.athleteId}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Status
                      </span>
                      <span className="font-bold text-emerald-400 uppercase text-[11px]">
                        {viewCard.status}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Academy / Club
                      </span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {viewCard.academyName}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Division / Category
                      </span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {viewCard.categoryName}
                      </span>
                    </div>
                  </div>

                  {/* Verification QR Representation */}
                  <div className="pt-2 flex flex-col items-center justify-center">
                    <div className="p-2 rounded-xl bg-white text-slate-950 shadow">
                      <QrCode className="h-16 w-16 text-slate-950" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-widest">
                      Scan for Digital Verification
                    </span>
                  </div>
                </div>

                {/* Footer Security Watermark */}
                <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[9px] text-slate-400 font-mono flex items-center justify-between">
                  <span>KKC-2026-BADGE</span>
                  <span>v{viewCard.version}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2">
              {viewCard.athleteEmail && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(viewCard.athleteEmail || "");
                    alert(`Copied email to clipboard: ${viewCard.athleteEmail}`);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Copy Email</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Close
                </button>

                <a
                  href={`/api/registrations/${viewCard.registrationId}/id-card/download?admin_secret=kukkiwon-bootstrap-admin-secret-2026&autoprint=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold uppercase transition flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Download Badge</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
