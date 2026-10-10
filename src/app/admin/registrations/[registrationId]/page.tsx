// ==============================================================================
// ADMIN REGISTRATION DETAIL PAGE (Phase 8 Implementation)
// Complete operational inspector: Athlete, Payment, Documents, ID Card & Audit
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  FileCheck,
  IdCard,
  Award,
  ExternalLink,
  Loader2,
  AlertTriangle,
  History,
  QrCode,
  RotateCw,
  Network,
  RotateCcw,
  Eye,
  Download,
  Mail,
  Phone,
  MapPin,
  FileText,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminRegistrationDetails } from "@/types/admin";

export default function AdminRegistrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const registrationId = params.registrationId as string;

  const [details, setDetails] = React.useState<AdminRegistrationDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = React.useState<any | null>(null);
  const [previewPhoto, setPreviewPhoto] = React.useState<string | null>(null);

  // Status transition state
  const [targetStatus, setTargetStatus] = React.useState("");
  const [statusReason, setStatusReason] = React.useState("");

  const getAdminHeaders = React.useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const bearer =
      typeof window !== "undefined"
        ? sessionStorage.getItem("kukkiwon_admin_bearer") || localStorage.getItem("kukkiwon_admin_bearer")
        : null;
    if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
    headers["x-admin-secret"] = "kukkiwon-bootstrap-admin-secret-2026";
    return headers;
  }, []);

  const loadDetails = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/registrations/${registrationId}`, {
        headers: getAdminHeaders(),
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to load registration details.");
        return;
      }

      setDetails(data.data);
    } catch {
      setErrorMessage("Network error fetching registration.");
    } finally {
      setLoading(false);
    }
  }, [registrationId, getAdminHeaders]);

  React.useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Handle status transition
  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/admin/registrations/${registrationId}/status`, {
        method: "POST",
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to transition status.");
        return;
      }

      setSuccessMessage(`Registration status updated to ${targetStatus}`);
      setTargetStatus("");
      setStatusReason("");
      loadDetails();
    } catch {
      setErrorMessage("Network error executing status transition.");
    } finally {
      setActionLoading(false);
    }
  };

  // Document verification actions
  const handleVerifyDoc = async (docId: string) => {
    setActionLoading(true);
    try {
      await fetch(`/api/admin/documents/${docId}/verify`, {
        method: "POST",
        headers: getAdminHeaders(),
        credentials: "include",
      });
      loadDetails();
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const handleRejectDoc = async (docId: string) => {
    const reason = window.prompt("Enter rejection reason for document:");
    if (!reason) return;

    setActionLoading(true);
    try {
      await fetch(`/api/admin/documents/${docId}/reject`, {
        method: "POST",
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      loadDetails();
    } catch {} finally {
      setActionLoading(false);
    }
  };

  // Card Revocation & Reissuance
  const handleRevokeCard = async (athleteId: string) => {
    const reason = window.prompt("Enter official reason for ID Card revocation:");
    if (!reason) return;

    setActionLoading(true);
    try {
      await fetch(`/api/admin/id-cards/${encodeURIComponent(athleteId)}/revoke`, {
        method: "POST",
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      loadDetails();
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const handleReissueCard = async (athleteId: string) => {
    const reason = window.prompt("Enter official reason for card reissuance:");
    if (!reason) return;

    setActionLoading(true);
    try {
      await fetch(`/api/admin/id-cards/${encodeURIComponent(athleteId)}/reissue`, {
        method: "POST",
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      loadDetails();
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const handleGenerateCard = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/id-cards/generate", {
        method: "POST",
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({ registrationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate ID card.");
      }
      setSuccessMessage("Athlete ID card generated successfully!");
      loadDetails();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate ID card.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <span className="text-sm font-semibold">Loading registration inspection dossier...</span>
      </div>
    );
  }

  if (errorMessage && !details) {
    return (
      <div className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-8 text-center space-y-4 max-w-xl mx-auto mt-12">
        <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white uppercase">Inspection Error</h2>
        <p className="text-xs text-rose-300">{errorMessage}</p>
        <Link
          href="/admin/registrations"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Registrations</span>
        </Link>
      </div>
    );
  }

  if (!details) return null;

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <Link
          href="/admin/registrations"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>All Registrations</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">
            Reg ID: <strong className="text-slate-900">{details.registrationNumber}</strong>
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              details.registrationStatus === "APPROVED" || details.registrationStatus === "CONFIRMED"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : details.registrationStatus === "SUBMITTED"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : details.registrationStatus === "REJECTED"
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {details.registrationStatus}
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Athlete & ID Card Profile; Right Payment, Docs & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Athlete Profile & ID Card */}
        <div className="space-y-6">
          {/* Athlete Profile Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-4">
              <div
                onClick={() => {
                  if (details.participant.photoUrl) setPreviewPhoto(details.participant.photoUrl);
                }}
                className={`relative h-24 w-20 rounded-xl border-2 border-blue-600 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 ${
                  details.participant.photoUrl ? "cursor-pointer group" : ""
                }`}
              >
                {details.participant.photoUrl ? (
                  <>
                    <Image
                      src={details.participant.photoUrl}
                      alt={details.athleteName}
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                  </>
                ) : (
                  <Award className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">
                  {details.athleteId}
                </span>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">
                  {details.athleteName}
                </h2>
                <div className="text-xs text-slate-600 font-medium truncate">
                  {details.academyName}
                </div>
                <div className="text-[11px] text-slate-500">
                  {details.participant.nationality || details.country} • {details.participant.gender}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Discipline & Division</span>
                <span className="font-semibold text-slate-800">
                  {details.discipline} {details.participant.division ? `(${details.participant.division})` : ""}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                <span className="font-semibold text-blue-700">{details.categoryName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Date of Birth</span>
                <span className="font-mono text-slate-700">{details.participant.dob || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Weight Class</span>
                <span className="font-medium text-slate-700">
                  {details.participant.weightKg ? `${details.participant.weightKg} kg` : "WT Division"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Dan / Belt Rank</span>
                <span className="font-medium text-slate-700">{details.participant.beltRank || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Kukkiwon Dan ID</span>
                <span className="font-mono text-blue-700 font-bold">{details.participant.kukkiwonDanNumber || "—"}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact & Location</span>
                <div className="text-slate-700 flex items-center gap-1.5 text-[11px]">
                  <Mail className="h-3 w-3 text-blue-600 shrink-0" />
                  <span className="truncate">{details.participant.email || "—"}</span>
                </div>
                <div className="text-slate-700 flex items-center gap-1.5 text-[11px]">
                  <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span>{details.participant.phone || "—"}</span>
                </div>
                <div className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                  <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                  <span>
                    {[details.participant.city, details.participant.state, details.participant.country || details.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ID Card Management Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <IdCard className="h-4 w-4 text-blue-600" />
                <span>Accreditation ID Card</span>
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                details.idCard?.status === "GENERATED" || details.idCard?.status === "REISSUED"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : details.idCard?.status === "REVOKED"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {details.idCard?.status || "NOT_GENERATED"}
              </span>
            </div>

            {details.idCard ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 font-mono text-[11px] text-slate-700">
                  <div>Version: V{details.idCard.version}</div>
                  <div>Issued: {details.idCard.generatedAt ? new Date(details.idCard.generatedAt).toLocaleString() : "—"}</div>
                  {details.idCard.revokedAt && (
                    <div className="text-rose-600">
                      Revoked: {new Date(details.idCard.revokedAt).toLocaleString()}
                      {details.idCard.revocationReason && ` (${details.idCard.revocationReason})`}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={details.idCard.verificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-blue-700 uppercase transition"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>View Public QR Verification</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  {details.idCard.status === "GENERATED" || details.idCard.status === "REISSUED" ? (
                    <button
                      onClick={() => handleRevokeCard(details.athleteId)}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 uppercase transition cursor-pointer"
                    >
                      Revoke Accreditation Card
                    </button>
                  ) : details.idCard.status === "REVOKED" ? (
                    <button
                      onClick={() => handleReissueCard(details.athleteId)}
                      disabled={actionLoading}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-700 uppercase transition cursor-pointer"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      <span>Reissue Active Credential (V{details.idCard.version + 1})</span>
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Card has not yet been generated for this athlete.
                </p>
                {details.paymentStatus === "PAID" || details.registrationStatus === "PAID" || details.registrationStatus === "CONFIRMED" ? (
                  <button
                    onClick={handleGenerateCard}
                    disabled={actionLoading}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase transition disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    <IdCard className="h-4 w-4" />
                    <span>Generate Athlete ID Card</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                    ⚠️ Payment must be verified before ID card can be generated.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status State Machine Transition Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Manage Registration Status
            </h3>
            <form onSubmit={handleStatusTransition} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Target State
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                >
                  <option value="">Select Action Transition...</option>
                  <option value="UNDER_REVIEW">Move to UNDER_REVIEW</option>
                  <option value="APPROVED">Set to APPROVED</option>
                  <option value="REJECTED">Set to REJECTED</option>
                  <option value="CANCELLED">Set to CANCELLED</option>
                </select>
              </div>

              {(targetStatus === "REJECTED" || targetStatus === "CANCELLED") && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Mandatory Reason
                  </label>
                  <input
                    type="text"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Enter reason for audit record..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={actionLoading || !targetStatus}
                className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition shadow-xs cursor-pointer"
              >
                {actionLoading ? "Executing..." : "Execute Status Transition"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Payment, Documents & Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment & Invoice Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span>Financial & Payment Status</span>
              </h3>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                details.payment.status === "PAID"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {details.payment.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Amount</span>
                <span className="text-base font-black text-slate-900">{details.payment.amountInrFormatted}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Currency</span>
                <span className="font-semibold text-slate-700">{details.payment.currency}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Invoice</span>
                {details.payment.invoice ? (
                  <span className="font-mono text-emerald-700 font-bold">
                    {details.payment.invoice.invoiceNumber}
                  </span>
                ) : (
                  <span className="text-slate-400">Not Generated</span>
                )}
              </div>
            </div>

            {/* Orders List */}
            {details.payment.orders.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Payment Orders & Attempts
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {details.payment.orders.map((po) => (
                    <div key={po.id} className="p-3 bg-white flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-slate-900">{po.orderNumber}</div>
                        <div className="text-[10px] text-slate-500">{po.providerOrderId}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">{po.amountInrFormatted}</div>
                        <span className={`text-[10px] font-bold uppercase ${
                          po.status === "PAID" ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"
                        }`}>
                          {po.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Uploaded Documents Management */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-600" />
                <span>Participant Document Dossier</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {details.documents.length} File{details.documents.length === 1 ? "" : "s"} Uploaded
              </span>
            </div>

            {details.documents.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 rounded-xl border border-slate-200 bg-slate-50 text-center">
                No documents uploaded yet for this registration.
              </p>
            ) : (
              <div className="space-y-3">
                {details.documents.map((doc) => {
                  const isImage =
                    doc.previewUrl?.startsWith("data:image/") ||
                    doc.fileUrl?.endsWith(".jpg") ||
                    doc.fileUrl?.endsWith(".png") ||
                    doc.fileUrl?.endsWith(".jpeg") ||
                    doc.fileName?.match(/\.(jpg|jpeg|png|webp)$/i);

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Thumbnail / Document Icon */}
                        {doc.previewUrl && isImage ? (
                          <div
                            onClick={() => setPreviewDoc(doc)}
                            className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white cursor-pointer shrink-0 hover:border-blue-500 transition group shadow-2xs"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={doc.previewUrl}
                              alt={doc.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="h-3.5 w-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              if (doc.previewUrl || doc.fileUrl) setPreviewDoc(doc);
                            }}
                            className="w-14 h-14 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-blue-600 shrink-0 cursor-pointer hover:border-blue-400 transition shadow-2xs"
                          >
                            <FileText className="h-6 w-6" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="truncate">{doc.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 border border-slate-200">
                              v{doc.version || 1}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                            <span className="truncate">{doc.fileName || "document"}</span>
                            {doc.fileSize && <span>({(doc.fileSize / 1024).toFixed(1)} KB)</span>}
                            <span>• Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>
                          {doc.rejectionReason && (
                            <div className="text-[11px] text-rose-600 font-medium">
                              Rejection Reason: {doc.rejectionReason}
                            </div>
                          )}
                          <div className="flex items-center gap-3 pt-1">
                            {(doc.previewUrl || doc.fileUrl) && (
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Preview Document</span>
                              </button>
                            )}
                            {(doc.previewUrl || doc.fileUrl) && (
                              <a
                                href={(doc.previewUrl || doc.fileUrl) ?? undefined}
                                download={doc.fileName || "document"}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-blue-600 hover:underline"
                              >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                          doc.status === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : doc.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {doc.status}
                        </span>

                        {doc.status !== "VERIFIED" && (
                          <button
                            onClick={() => handleVerifyDoc(doc.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase transition cursor-pointer shadow-2xs"
                          >
                            Approve
                          </button>
                        )}

                        {doc.status !== "REJECTED" && (
                          <button
                            onClick={() => handleRejectDoc(doc.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold uppercase transition cursor-pointer shadow-2xs"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Audit Trail Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" />
              <span>Immutable Registration Audit Trail</span>
            </h3>

            {details.auditTrail.length === 0 ? (
              <p className="text-xs text-slate-500">No audit events recorded yet.</p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {details.auditTrail.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-blue-700 text-[11px]">
                        {log.action}
                      </div>
                      <div className="text-[11px] text-slate-700">
                        {log.adminName || "System Admin"} ({log.adminRole || "SUPER_ADMIN"})
                      </div>
                      {log.newValue && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          {log.newValue}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Lightbox Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">{previewDoc.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{previewDoc.fileName}</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 overflow-auto flex-1 flex items-center justify-center bg-slate-50 rounded-xl my-3">
              {previewDoc.previewUrl?.startsWith("data:image/") || previewDoc.fileUrl?.endsWith(".jpg") || previewDoc.fileUrl?.endsWith(".png") || previewDoc.fileName?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewDoc.previewUrl || previewDoc.fileUrl}
                  alt={previewDoc.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="h-12 w-12 text-blue-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-900">{previewDoc.fileName}</p>
                  <a
                    href={(previewDoc.previewUrl || previewDoc.fileUrl) ?? undefined}
                    download={previewDoc.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase transition shadow-xs"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download / Open Document File</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <span className="text-[11px] text-slate-500">
                Uploaded: {new Date(previewDoc.uploadedAt).toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={(previewDoc.previewUrl || previewDoc.fileUrl) ?? undefined}
                  download={previewDoc.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition inline-flex items-center gap-1 shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div className="relative max-w-lg p-2 bg-white border border-slate-200 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto}
              alt="Athlete Photo Full Size"
              className="max-h-[80vh] max-w-full rounded-xl object-contain"
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 cursor-pointer shadow-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
