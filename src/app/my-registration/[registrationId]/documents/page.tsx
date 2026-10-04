// ==============================================================================
// PARTICIPANT DOCUMENT MANAGEMENT PAGE (Requirements 8, 9, 10, 19, 20)
// Official Championship Accreditation Portal for secure document uploads and review
// ==============================================================================

"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ArrowLeft,
  FileCheck2,
  RefreshCw,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { PhotoUpload } from "@/components/registration/photo-upload";
import { DocumentCard } from "@/components/registration/document-card";
import { DocumentViewerModal } from "@/components/registration/document-viewer-modal";
import {
  RequirementWithDocument,
  DocumentReadinessSummary,
  ParticipantDocumentInfo,
} from "@/types/document";

interface PageProps {
  params: Promise<{ registrationId: string }>;
}

export default function ParticipantDocumentsPage({ params }: PageProps) {
  const { registrationId } = use(params);
  const router = useRouter();

  const [requirements, setRequirements] = useState<RequirementWithDocument[]>([]);
  const [readiness, setReadiness] = useState<DocumentReadinessSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{
    doc: ParticipantDocumentInfo;
    title: string;
  } | null>(null);
  const [busyReqId, setBusyReqId] = useState<string | null>(null);

  // Fetch requirements & documents
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/registrations/${registrationId}/documents`);
      if (res.status === 401) {
        router.push("/register");
        return;
      }
      if (res.status === 403) {
        setErrorMsg("Access Denied: You do not have permission to view documents for this registration.");
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load document requirements.");
      }

      setRequirements(data.requirements || []);
      setReadiness(data.readiness || null);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [registrationId, router]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Upload document handler
  const handleUpload = async (requirementId: string, file: File) => {
    setBusyReqId(requirementId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentRequirementId", requirementId);

      const res = await fetch(`/api/registrations/${registrationId}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file.");
      }

      // Reload state
      await loadDocuments();
    } finally {
      setBusyReqId(null);
    }
  };

  // Replace document handler
  const handleReplace = async (requirementId: string, currentDocId: string, file: File) => {
    setBusyReqId(requirementId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/registrations/${registrationId}/documents/${currentDocId}/replace`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to replace document.");
      }

      await loadDocuments();
    } finally {
      setBusyReqId(null);
    }
  };

  // Delete document handler
  const handleDelete = async (requirementId: string, documentId: string) => {
    if (!confirm("Are you sure you want to remove this uploaded document?")) return;

    setBusyReqId(requirementId);
    try {
      const res = await fetch(
        `/api/registrations/${registrationId}/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete document.");
      }

      await loadDocuments();
    } finally {
      setBusyReqId(null);
    }
  };

  // Find photo requirement vs general document requirements
  const photoReq = requirements.find((r) => r.document_type === "PHOTOGRAPH" || r.document_type === "ACADEMY_LOGO");
  const otherReqs = requirements.filter((r) => r.id !== photoReq?.id);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 pb-24 pt-8 md:pt-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Breadcrumb & Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/my-registration"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Return to Registration Dashboard</span>
          </Link>

          <div className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Reg ID: {registrationId.substring(0, 18)}...
          </div>
        </div>

        {/* Header (Requirement 8) */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200 mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Official Accreditation Portal
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            DOCUMENTS & ACCREDITATION REQUIREMENTS
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Upload the official identity, age verification, and sport credentials required for championship validation.
            All documents are stored privately in encrypted storage and reviewed by the accreditation committee.
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Notice</p>
              <p className="mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Loading accreditation requirements...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* PROGRESS SUMMARY BANNER (Requirement 8 & 11) */}
            {readiness && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
                      Accreditation Progress Summary
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                      <span>{readiness.uploaded} of {readiness.required} required documents uploaded</span>
                      {readiness.uploaded === readiness.required && readiness.required > 0 && (
                        <FileCheck2 className="w-7 h-7 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2">
                      {readiness.verified} verified • {readiness.uploaded - readiness.verified} under review •{" "}
                      {readiness.missing} missing • {readiness.rejected} rejected
                    </p>
                  </div>

                  {/* Readiness Badge */}
                  <div className="self-start sm:self-auto flex flex-col items-start sm:items-end gap-2">
                    <span
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border shadow-sm flex items-center gap-2 ${
                        readiness.readinessStatus === "DOCUMENTS_VERIFIED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : readiness.readinessStatus === "ACTION_REQUIRED"
                          ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                          : readiness.readinessStatus === "DOCUMENTS_IN_REVIEW"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {readiness.readinessStatus === "DOCUMENTS_VERIFIED" && <ShieldCheck className="w-4 h-4" />}
                      {readiness.readinessStatus === "ACTION_REQUIRED" && <AlertTriangle className="w-4 h-4" />}
                      {readiness.readinessStatus === "DOCUMENTS_IN_REVIEW" && <Clock className="w-4 h-4" />}
                      {readiness.readinessStatus.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {readiness.readyForReview ? "Ready for Accreditation Review" : "Uploads Pending"}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      readiness.verified === readiness.required && readiness.required > 0
                        ? "bg-emerald-600"
                        : readiness.rejected > 0
                        ? "bg-rose-600"
                        : "bg-blue-600"
                    }`}
                    style={{
                      width: `${
                        readiness.required > 0
                          ? Math.min(100, Math.round((readiness.uploaded / readiness.required) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* SECTION 1: ACCREDITATION PHOTOGRAPH (Requirement 7) */}
            {photoReq && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                  <Sparkles className="w-4 h-4" />
                  <span>Participant Badge Photo</span>
                </div>
                <PhotoUpload
                  currentDocument={photoReq.current_document}
                  status={photoReq.status}
                  rejectionReason={photoReq.current_document?.rejection_reason}
                  onUpload={(file) => handleUpload(photoReq.id, file)}
                  onView={() => {
                    if (photoReq.current_document) {
                      setViewingDoc({
                        doc: photoReq.current_document,
                        title: photoReq.title,
                      });
                    }
                  }}
                  isUploading={busyReqId === photoReq.id}
                />
              </div>
            )}

            {/* SECTION 2: IDENTITY & SPORT ACCREDITATION DOCUMENTS */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                <FileText className="w-4 h-4" />
                <span>Identification & Eligibility Credentials</span>
              </div>

              <div className="space-y-4">
                {otherReqs.map((req) => (
                  <DocumentCard
                    key={req.id}
                    requirement={req}
                    onUpload={(file) => handleUpload(req.id, file)}
                    onReplace={(file) => {
                      if (req.current_document) {
                        return handleReplace(req.id, req.current_document.id, file);
                      }
                      return handleUpload(req.id, file);
                    }}
                    onDelete={
                      req.current_document
                        ? () => handleDelete(req.id, req.current_document!.id)
                        : undefined
                    }
                    onView={
                      req.current_document
                        ? () =>
                            setViewingDoc({
                              doc: req.current_document!,
                              title: req.title,
                            })
                        : undefined
                    }
                    isBusy={busyReqId === req.id}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Guidance Box */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Institutional Review Policy</p>
                  <p className="mt-1 leading-relaxed">
                    Uploading documents does not immediately grant accredited status. All submitted files will be
                    reviewed by the Kukkiwon Cup Technical Secretariat. Please check back regularly for status updates.
                  </p>
                </div>
              </div>

              <Link
                href="/my-registration"
                className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors whitespace-nowrap flex items-center gap-2 shadow-sm"
              >
                <span>Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5 text-white/80" />
              </Link>
            </div>
          </div>
        )}

        {/* Secure Document Preview Lightbox (Requirement 15) */}
        {viewingDoc && (
          <DocumentViewerModal
            document={viewingDoc.doc}
            documentTitle={viewingDoc.title}
            onClose={() => setViewingDoc(null)}
          />
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
