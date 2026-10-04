// ==============================================================================
// DOCUMENT CARD COMPONENT (Requirements 8, 9, 10, 19, 20)
// Institutional document card supporting upload, replacement, rejection feedback, and versioning
// ==============================================================================

"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Trash2,
  FileCheck,
  ShieldAlert,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { RequirementWithDocument, DocumentVerificationStatus } from "@/types/document";

interface DocumentCardProps {
  requirement: RequirementWithDocument;
  onUpload: (file: File) => Promise<void>;
  onReplace: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
  onView?: () => void;
  isBusy?: boolean;
}

export function DocumentCard({
  requirement,
  onUpload,
  onReplace,
  onDelete,
  onView,
  isBusy = false,
}: DocumentCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentDoc = requirement.current_document;
  const status = requirement.status;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size against requirement.max_file_size
    if (file.size > requirement.max_file_size) {
      const maxMb = (requirement.max_file_size / (1024 * 1024)).toFixed(1);
      setErrorMsg(`File exceeds the ${maxMb}MB limit.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleConfirm = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      if (currentDoc) {
        await onReplace(selectedFile);
      } else {
        await onUpload(selectedFile);
      }
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Status Badge Rendering (Requirement 9)
  const renderStatusBadge = () => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Under Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case "UPLOADED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Uploaded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Not Uploaded
          </span>
        );
    }
  };

  // Allowed extensions for file input accept attribute
  const acceptedTypes = requirement.allowed_file_types || "image/jpeg,image/png,application/pdf";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 transition-all hover:border-blue-300 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h4 className="text-base font-bold text-slate-900 tracking-wide">{requirement.title}</h4>
              {requirement.is_required ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                  Required
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
                  Conditional / Optional
                </span>
              )}
            </div>
            {requirement.description && (
              <p className="text-xs text-slate-500 mt-1 max-w-xl">{requirement.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {renderStatusBadge()}
          {currentDoc?.version && (
            <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              v{currentDoc.version}
            </span>
          )}
        </div>
      </div>

      {/* REJECTION FEEDBACK BOX (Requirement 9) */}
      {status === "REJECTED" && currentDoc?.rejection_reason && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-rose-700">Document Rejected</p>
            <p className="text-rose-600 mt-1 italic font-medium">
              &quot;{currentDoc.rejection_reason}&quot;
            </p>
            <p className="text-rose-500 mt-1.5 font-semibold">
              Please click &quot;Upload Replacement&quot; below to submit a revised document.
            </p>
          </div>
        </div>
      )}

      {/* CURRENT DOCUMENT DETAILS */}
      {currentDoc && (
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate text-slate-700">
            <FileCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="truncate font-medium">{currentDoc.original_filename}</span>
            <span className="text-slate-400 font-mono text-[11px]">
              ({(currentDoc.file_size / 1024).toFixed(0)} KB)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onView && (
              <button
                type="button"
                onClick={onView}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center gap-1.5 border border-slate-300"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                View
              </button>
            )}

            {/* Allow delete only if NOT verified */}
            {status !== "VERIFIED" && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isBusy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Remove uploaded document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ERROR DISPLAY */}
      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* UPLOAD CONTROLS & RE-UPLOAD FLOW (Requirement 10) */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          <span>Max size: {(requirement.max_file_size / (1024 * 1024)).toFixed(0)}MB • Formats: PDF, JPEG, PNG</span>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept={acceptedTypes}
            className="hidden"
            onChange={handleFileChange}
          />

          {selectedFile ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-600 font-medium truncate max-w-[150px]">
                {selectedFile.name}
              </span>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isUploading || isBusy}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Confirm
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isUploading}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold border border-slate-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                status === "REJECTED"
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : currentDoc
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              {status === "REJECTED"
                ? "Upload Replacement"
                : currentDoc
                ? "Replace Document"
                : "Upload Document"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
