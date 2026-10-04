// ==============================================================================
// PROFESSIONAL PHOTOGRAPH UPLOAD COMPONENT (Requirement 7)
// High-fidelity passport-style headshot uploader with preview, dimension checks, and replace
// ==============================================================================

"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import { Camera, Upload, RefreshCw, CheckCircle2, AlertTriangle, X, Eye } from "lucide-react";
import { ParticipantDocumentInfo, DocumentVerificationStatus } from "@/types/document";

interface PhotoUploadProps {
  currentDocument?: ParticipantDocumentInfo | null;
  status: DocumentVerificationStatus;
  rejectionReason?: string | null;
  onUpload: (file: File) => Promise<void>;
  onView?: () => void;
  isUploading?: boolean;
}

export function PhotoUpload({
  currentDocument,
  status,
  rejectionReason,
  onUpload,
  onView,
  isUploading = false,
}: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. File Type Check
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setValidationError("Please select a valid JPEG or PNG image.");
      return;
    }

    // 2. File Size Check (Max 2MB)
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setValidationError("Photograph must be under 2MB in size.");
      return;
    }

    // 3. Image Dimension Check (Min 200x200 px)
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      if (img.width < 180 || img.height < 180) {
        setValidationError("Image resolution is too low. Minimum required is 200x200 pixels.");
        URL.revokeObjectURL(objectUrl);
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(objectUrl);
    };
    img.onerror = () => {
      setValidationError("Failed to load image file. Please try another image.");
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const handleCancelSelected = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    try {
      await onUpload(selectedFile);
      handleCancelSelected();
    } catch (err: any) {
      setValidationError(err.message || "Upload failed. Please try again.");
    }
  };

  const getStatusBadge = (st: DocumentVerificationStatus) => {
    switch (st) {
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-slate-900 tracking-wide">Accreditation Photograph</h3>
            {getStatusBadge(status)}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Official headshot for championship accreditation badge and ID card. Plain light background required.
          </p>
        </div>
        {currentDocument?.version && (
          <div className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            Version {currentDocument.version}
          </div>
        )}
      </div>

      {/* Rejection Alert */}
      {status === "REJECTED" && rejectionReason && (
        <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-rose-700">Document Rejected by Official Verifier</p>
            <p className="text-rose-600 mt-1">{rejectionReason}</p>
            <p className="text-xs text-rose-500 mt-2">
              Please review the feedback above and upload a replacement photograph below.
            </p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Photo Frame / Preview */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="relative w-44 h-56 rounded-2xl overflow-hidden border-2 border-dashed border-blue-400 bg-slate-50 flex flex-col items-center justify-center group shadow-sm">
            {previewUrl ? (
              // New selected preview
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Selected Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-1 text-white">
                  <span className="text-[10px] px-1 font-mono font-bold">NEW</span>
                </div>
              </div>
            ) : currentDocument?.signed_url ? (
              // Currently saved photograph
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentDocument.signed_url}
                  alt="Accreditation Headshot"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              // Placeholder
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 group-hover:text-blue-600 transition-colors">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No Photo Uploaded</p>
                <p className="text-[11px] text-slate-400 mt-1">Portrait (3:4 ratio)</p>
              </div>
            )}
          </div>

          {imageDimensions && (
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              {imageDimensions.width} × {imageDimensions.height} px
            </p>
          )}
        </div>

        {/* Controls & Instructions */}
        <div className="md:col-span-8 flex flex-col justify-between h-full space-y-4">
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600">Accreditation Standards</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Direct forward-facing portrait with clear focus on eyes and face.</li>
              <li>Plain neutral background (white, off-white, or light grey).</li>
              <li>No sunglasses, hats, or heavy facial coverings.</li>
              <li>Formats: JPEG or PNG • Maximum size: 2MB.</li>
            </ul>
          </div>

          {validationError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleFileSelect}
            />

            {selectedFile ? (
              // Confirmation controls when a new file has been picked
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Confirm & Save Photograph
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelSelected}
                  disabled={isUploading}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-sm font-semibold transition-colors flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            ) : (
              // Standard action buttons
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {currentDocument ? "Replace Photograph" : "Upload Photograph"}
                </button>

                {currentDocument && onView && (
                  <button
                    type="button"
                    onClick={onView}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors flex items-center gap-2 border border-slate-300"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                    View Full Size
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
