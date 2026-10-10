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
  Download,
  FileText,
  X,
  ExternalLink,
  ShieldCheck,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminPaymentVerificationPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);
  const [selectedDossier, setSelectedDossier] = React.useState<any | null>(null);
  const [previewDocModal, setPreviewDocModal] = React.useState<{ title: string; url: string; fileName?: string } | null>(null);
  const [previewPhotoModal, setPreviewPhotoModal] = React.useState<string | null>(null);

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
      let queueItems: any[] = Array.isArray(data?.items) ? data.items : [];

      // Merge local client-stored registrations so they never disappear on serverless restarts
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("kukkiwon_client_registrations");
          if (raw) {
            const clientList: any[] = JSON.parse(raw);
            const seenIds = new Set(queueItems.map((i: any) => i.registrationId || i.id));
            const seenRegNums = new Set(queueItems.map((i: any) => i.registrationNumber));

            for (const c of clientList) {
              if (!c || !c.registrationNumber) continue;
              if (!seenIds.has(c.id) && !seenRegNums.has(c.registrationNumber)) {
                const cStatus =
                  c.paymentStatus === "PAID" || c.status === "APPROVED"
                    ? "VERIFIED"
                    : c.status === "REJECTED" || c.paymentStatus === "REJECTED"
                    ? "REJECTED"
                    : "UNDER_REVIEW";

                if (!statusFilter || statusFilter === cStatus) {
                  queueItems.unshift({
                    id: c.id,
                    registrationId: c.id,
                    registrationNumber: c.registrationNumber,
                    athleteId: c.athleteId || c.registrationNumber,
                    athleteName: c.athleteName || c.participantName || "Competitor",
                    participantType: c.participantType || "ATHLETE",
                    utrNumber: c.utrNumber || "OFFLINE-MANUAL",
                    amountInr: c.amountInr || 2500,
                    amountFormatted: c.amountFormatted || `₹${(c.amountInr || 2500).toLocaleString("en-IN")}`,
                    categoryName: c.categoryName || "Official WT Category",
                    academyName: c.academyName || "Official Dojang",
                    kukkiwonId: c.kukkiwonId || "Submitted",
                    photoUrl: c.photoUrl || null,
                    email: c.email || "",
                    phone: c.phone || "",
                    gender: c.gender || "MALE",
                    nationality: c.nationality || "IND",
                    state: c.state || "",
                    city: c.city || "",
                    beltRank: c.beltRank || "",
                    division: c.division || "",
                    documentsUploaded: c.documentsUploaded || {},
                    offlineSlip: c.offlineSlip || null,
                    rawDraftData: c.rawDraftData || {},
                    status: cStatus,
                    title: `Athlete Championship Fee (${c.amountFormatted || "₹2,500"})`,
                    documentType: "PAYMENT_RECEIPT",
                    fileName: `UTR: ${c.utrNumber || "N/A"}`,
                    version: 1,
                    uploadedAt: c.submittedAt || new Date().toISOString(),
                    submittedAt: c.submittedAt || new Date().toISOString(),
                    verifiedAt: c.verifiedAt || null,
                    verifiedBy: c.verifiedBy || null,
                    rejectionReason: c.rejectionReason || null,
                    championshipName: "Kukkiwon Cup Championship 2026",
                  });
                }
              }
            }
          }
        } catch {}
      }

      setItems(queueItems);
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

      // Update client-side persistence so approved status survives refreshes & serverless restarts
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("kukkiwon_client_registrations");
          if (raw) {
            const list: any[] = JSON.parse(raw);
            const updated = list.map((c: any) => {
              if (c.id === itemId || c.registrationId === itemId || c.registrationNumber === itemId) {
                return {
                  ...c,
                  paymentStatus: "PAID",
                  status: "APPROVED",
                  verifiedAt: new Date().toISOString(),
                  verifiedBy: "Tournament Organizing Committee",
                };
              }
              return c;
            });
            localStorage.setItem("kukkiwon_client_registrations", JSON.stringify(updated));

            // Sync with backend in background
            fetch("/api/registrations/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ registrations: updated }),
            }).catch(() => {});
          }
        } catch {}
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

      // Update client-side persistence
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("kukkiwon_client_registrations");
          if (raw) {
            const list: any[] = JSON.parse(raw);
            const updated = list.map((c: any) => {
              if (c.id === itemId || c.registrationId === itemId || c.registrationNumber === itemId) {
                return {
                  ...c,
                  paymentStatus: "REJECTED",
                  status: "REJECTED",
                  rejectionReason: reason,
                };
              }
              return c;
            });
            localStorage.setItem("kukkiwon_client_registrations", JSON.stringify(updated));

            fetch("/api/registrations/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ registrations: updated }),
            }).catch(() => {});
          }
        } catch {}
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
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <span>Payment Verification Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative verification of tournament fees (₹2,500) and submitted UTR / UPI transaction references.
          </p>
        </div>

        <button
          onClick={() => loadQueue()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Verification Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Verification Requests</option>
            <option value="UNDER_REVIEW">UNDER REVIEW (Pending)</option>
            <option value="VERIFIED">VERIFIED (Approved)</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Queue Total: <strong className="text-slate-900">{items.length}</strong>
        </div>
      </div>

      {/* Main Payment Verification Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
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
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading payment verification queue...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                    <p className="font-semibold text-slate-900">All payments verified.</p>
                    <p className="text-xs text-slate-500 mt-1">No pending transaction verification requests at this time.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Participant Details */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {item.photoUrl ? (
                          <div
                            onClick={() => setSelectedDossier(item)}
                            className="relative w-10 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 cursor-pointer hover:border-blue-600 transition group"
                            title="Click to inspect athlete dossier"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.photoUrl}
                              alt={item.athleteName}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="h-3.5 w-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => setSelectedDossier(item)}
                            className="w-10 h-12 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 cursor-pointer hover:border-blue-600 transition"
                            title="Click to inspect athlete dossier"
                          >
                            <Camera className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <div
                            onClick={() => setSelectedDossier(item)}
                            className="font-bold text-slate-900 uppercase text-xs cursor-pointer hover:text-blue-600 transition"
                            title="Click to inspect athlete dossier"
                          >
                            {item.athleteName}
                          </div>
                          <div className="text-[10px] font-mono text-blue-700 font-bold">
                            {item.athleteId || item.registrationNumber}
                          </div>
                          {item.kukkiwonId && (
                            <div className="text-[10px] font-mono text-slate-500">
                              {item.kukkiwonId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Submitted UTR Reference */}
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block tracking-wider">
                          {item.utrNumber || "OFFLINE-MANUAL"}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {item.participantType === "COACH" ? "Coach Accreditation" : "UPI / Net Banking"}
                        </div>
                      </div>
                    </td>

                    {/* Fee Amount */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="text-sm font-black text-slate-900">
                        {item.amountFormatted || "₹1,500"}
                      </span>
                    </td>

                    {/* Division / Academy */}
                    <td className="p-3.5">
                      <div className="text-xs text-slate-800 font-medium">
                        {item.categoryName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <span>{item.academyName}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {item.status === "UNDER_REVIEW" ? "PENDING VERIFICATION" : item.status}
                      </span>
                    </td>

                    {/* Submitted Date */}
                    <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(item.submittedAt || item.uploadedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDossier(item)}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          title="Quick inspect athlete photo, Govt ID, Kukkiwon cert & details"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Review</span>
                        </button>

                        <Link
                          href={`/admin/registrations/${item.registrationId}`}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold transition inline-flex items-center gap-1"
                        >
                          <span>Full</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>

                        {item.status !== "VERIFIED" && (
                          <button
                            onClick={() => handleApprove(item.id, item.athleteName)}
                            disabled={actionLoadingId === item.id}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase transition inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                          >
                            {actionLoadingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3 stroke-[3]" />
                            )}
                            <span>Approve</span>
                          </button>
                        )}

                        {item.status !== "REJECTED" && (
                          <button
                            onClick={() => handleReject(item.id, item.athleteName)}
                            disabled={actionLoadingId === item.id}
                            className="px-2 py-1 rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold uppercase transition disabled:opacity-50"
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

      {/* QUICK DOSSIER REVIEW MODAL */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase text-white tracking-tight flex items-center gap-2">
                    <span>{selectedDossier.athleteName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        selectedDossier.status === "VERIFIED"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : selectedDossier.status === "REJECTED"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {selectedDossier.status === "UNDER_REVIEW" ? "PENDING REVIEW" : selectedDossier.status}
                    </span>
                  </h2>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Reg ID: <strong className="text-white">{selectedDossier.registrationNumber}</strong> • Athlete ID: <strong className="text-[#D4AF37]">{selectedDossier.athleteId}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
              {/* Profile & Vital Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                {/* Photo & Quick Badges */}
                <div className="flex flex-col items-center justify-center text-center p-2 border-b md:border-b-0 md:border-r border-slate-800/80">
                  <div
                    onClick={() => {
                      if (selectedDossier.photoUrl) setPreviewPhotoModal(selectedDossier.photoUrl);
                    }}
                    className={`relative w-28 h-36 rounded-xl border-2 border-[#D4AF37] bg-slate-900 overflow-hidden shrink-0 shadow-lg ${
                      selectedDossier.photoUrl ? "cursor-pointer group" : ""
                    }`}
                  >
                    {selectedDossier.photoUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedDossier.photoUrl}
                          alt={selectedDossier.athleteName}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1">
                        <Camera className="h-6 w-6" />
                        <span className="text-[10px]">No Photo</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 font-mono">
                    {selectedDossier.participantType || "ATHLETE"}
                  </span>
                </div>

                {/* Key Technical / Sports Details */}
                <div className="space-y-2.5">
                  <span className="text-[10px] uppercase font-black text-[#D4AF37] tracking-wider block">
                    Tournament Classification
                  </span>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Category</span>
                    <span className="font-bold text-white text-sm">{selectedDossier.categoryName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Division</span>
                      <span className="font-semibold text-slate-200">{selectedDossier.division || "Official"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Weight Class</span>
                      <span className="font-semibold text-slate-200">{selectedDossier.weightKg ? `${selectedDossier.weightKg} kg` : "—"}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Belt / Dan Rank</span>
                      <span className="font-semibold text-amber-300">{selectedDossier.beltRank || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Kukkiwon Dan No.</span>
                      <span className="font-mono text-[#D4AF37] font-bold">{selectedDossier.kukkiwonId || "—"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Affiliated Academy / Dojang</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedDossier.academyName || "Independent"}</span>
                    </span>
                  </div>
                </div>

                {/* Contact & Payment Summary */}
                <div className="space-y-2.5 border-t md:border-t-0 md:border-l border-slate-800/80 md:pl-4">
                  <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider block">
                    Verification & Payment
                  </span>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Registration Fee</span>
                    <span className="text-base font-black text-white">{selectedDossier.amountFormatted || "₹2,500"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Submitted UTR Reference</span>
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/30 inline-block mt-0.5">
                      {selectedDossier.utrNumber || "OFFLINE-MANUAL"}
                    </span>
                  </div>
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Contact</span>
                    <div className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
                      <Mail className="h-3 w-3 text-sky-400 shrink-0" />
                      <span className="truncate">{selectedDossier.email || "—"}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span>{selectedDossier.phone || "—"}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                      <span>{[selectedDossier.city, selectedDossier.state, selectedDossier.nationality].filter(Boolean).join(", ") || "India"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents Dossier Inspection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sky-400" />
                    <span>Uploaded Mandatory Documents & Proofs</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Inspect all athlete submitted proofs before approving
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Document 1: Government ID Proof */}
                  {(() => {
                    const doc = selectedDossier.documentsUploaded?.gov_id || selectedDossier.documentsUploaded?.GOVT_ID || selectedDossier.documentsUploaded?.aadhaar;
                    const preview = doc?.preview_url || doc?.file_url || doc?.previewUrl || doc?.fileUrl || doc?.dataUrl;
                    const fileName = doc?.file_name || doc?.name || "Aadhaar / National ID";
                    return (
                      <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between space-y-2">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-sky-400 block">
                            Govt ID Proof (Aadhaar / Passport)
                          </span>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {fileName}
                          </span>
                        </div>

                        {preview ? (
                          <div
                            onClick={() => setPreviewDocModal({ title: "Government ID Proof", url: preview, fileName })}
                            className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer group"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="Govt ID Proof" className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 w-full rounded-lg border border-dashed border-slate-800 bg-slate-900/40 flex items-center justify-center text-slate-600 text-[10px]">
                            Not uploaded
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          {preview ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal({ title: "Government ID Proof", url: preview, fileName })}
                                className="text-[10px] font-bold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Preview</span>
                              </button>
                              <a
                                href={preview}
                                download={fileName}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                              </a>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No document</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Document 2: Kukkiwon Dan Certificate */}
                  {(() => {
                    const doc = selectedDossier.documentsUploaded?.kukkiwon_cert || selectedDossier.documentsUploaded?.KUKKIWON_CERT || selectedDossier.documentsUploaded?.dan_cert;
                    const preview = doc?.preview_url || doc?.file_url || doc?.previewUrl || doc?.fileUrl || doc?.dataUrl;
                    const fileName = doc?.file_name || doc?.name || (selectedDossier.kukkiwonId ? `Dan: ${selectedDossier.kukkiwonId}` : "Certificate Proof");
                    return (
                      <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between space-y-2">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#D4AF37] block">
                            Kukkiwon Dan Certificate
                          </span>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {fileName}
                          </span>
                        </div>

                        {preview ? (
                          <div
                            onClick={() => setPreviewDocModal({ title: "Kukkiwon Dan Certificate", url: preview, fileName })}
                            className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer group"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="Kukkiwon Dan Certificate" className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 w-full rounded-lg border border-dashed border-slate-800 bg-slate-900/40 flex items-center justify-center text-slate-600 text-[10px]">
                            {selectedDossier.kukkiwonId ? `Dan ID: ${selectedDossier.kukkiwonId}` : "Not uploaded"}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          {preview ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal({ title: "Kukkiwon Dan Certificate", url: preview, fileName })}
                                className="text-[10px] font-bold text-[#D4AF37] hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Preview</span>
                              </button>
                              <a
                                href={preview}
                                download={fileName}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                              </a>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No document</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Document 3: Medical Certificate */}
                  {(() => {
                    const doc = selectedDossier.documentsUploaded?.medical_cert || selectedDossier.documentsUploaded?.MEDICAL_CERT;
                    const preview = doc?.preview_url || doc?.file_url || doc?.previewUrl || doc?.fileUrl || doc?.dataUrl;
                    const fileName = doc?.file_name || doc?.name || "Medical Certificate";
                    return (
                      <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between space-y-2">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                            Medical Fitness Proof
                          </span>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {fileName}
                          </span>
                        </div>

                        {preview ? (
                          <div
                            onClick={() => setPreviewDocModal({ title: "Medical Fitness Certificate", url: preview, fileName })}
                            className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer group"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="Medical Certificate" className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 w-full rounded-lg border border-dashed border-slate-800 bg-slate-900/40 flex items-center justify-center text-slate-600 text-[10px]">
                            Not uploaded
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          {preview ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal({ title: "Medical Fitness Certificate", url: preview, fileName })}
                                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Preview</span>
                              </button>
                              <a
                                href={preview}
                                download={fileName}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                              </a>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No document</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Document 4: Offline Payment UTR Slip */}
                  {(() => {
                    const slip = selectedDossier.offlineSlip || selectedDossier.documentsUploaded?.offline_slip || selectedDossier.documentsUploaded?.PAYMENT_RECEIPT;
                    const preview = slip?.preview_url || slip?.file_url || slip?.previewUrl || slip?.fileUrl || slip?.dataUrl;
                    const fileName = slip?.file_name || slip?.name || `UTR: ${selectedDossier.utrNumber || "Manual"}`;
                    return (
                      <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between space-y-2">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                            UTR / Payment Proof
                          </span>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {fileName}
                          </span>
                        </div>

                        {preview ? (
                          <div
                            onClick={() => setPreviewDocModal({ title: "Payment Transaction Slip", url: preview, fileName })}
                            className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer group"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="Payment Receipt" className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 w-full rounded-lg border border-dashed border-slate-800 bg-slate-900/40 flex items-center justify-center text-slate-500 text-[10px] font-mono text-center p-2">
                            UTR: {selectedDossier.utrNumber || "Verified via gateway"}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          {preview ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal({ title: "Payment Transaction Slip", url: preview, fileName })}
                                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Preview</span>
                              </button>
                              <a
                                href={preview}
                                download={fileName}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                              </a>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No slip file</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
              <Link
                href={`/admin/registrations/${selectedDossier.registrationId}`}
                className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition underline underline-offset-2"
              >
                <span>Open Full Registration Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                {selectedDossier.status !== "VERIFIED" && (
                  <button
                    type="button"
                    onClick={async () => {
                      const id = selectedDossier.id;
                      const name = selectedDossier.athleteName;
                      setSelectedDossier(null);
                      await handleApprove(id, name);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase transition inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                    <span>Approve Payment</span>
                  </button>
                )}

                {selectedDossier.status !== "REJECTED" && (
                  <button
                    type="button"
                    onClick={async () => {
                      const id = selectedDossier.id;
                      const name = selectedDossier.athleteName;
                      setSelectedDossier(null);
                      await handleReject(id, name);
                    }}
                    className="px-3 py-2 rounded-lg border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900 text-rose-300 text-xs font-bold uppercase transition cursor-pointer"
                  >
                    Reject
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedDossier(null)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW LIGHTBOX MODAL */}
      {previewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">{previewDocModal.title}</h3>
                {previewDocModal.fileName && (
                  <p className="text-xs text-slate-400 mt-0.5">{previewDocModal.fileName}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewDocModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 overflow-auto flex-1 flex items-center justify-center bg-slate-950/60 rounded-xl my-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewDocModal.url}
                alt={previewDocModal.title}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
              <a
                href={previewDocModal.url}
                download={previewDocModal.fileName || "document"}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#b5952f] text-slate-950 text-xs font-bold uppercase transition inline-flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download File</span>
              </a>
              <button
                onClick={() => setPreviewDocModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {previewPhotoModal && (
        <div
          onClick={() => setPreviewPhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in cursor-pointer"
        >
          <div
            className="relative max-w-md p-2 bg-slate-900 border border-[#D4AF37] rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhotoModal}
              alt="Athlete Photo Full Size"
              className="max-h-[80vh] max-w-full rounded-xl object-contain mx-auto"
            />
            <button
              onClick={() => setPreviewPhotoModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-black cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
