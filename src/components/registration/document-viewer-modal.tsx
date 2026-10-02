// ==============================================================================
// DOCUMENT VIEWER MODAL (Requirement 15: Private Document Retrieval)
// Renders secure authorized previews with signed temporary URLs
// ==============================================================================

"use client";

import React, { useEffect } from "react";
import { X, FileText, Download, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";
import { ParticipantDocumentInfo } from "@/types/document";

interface DocumentViewerModalProps {
  document: ParticipantDocumentInfo | null;
  documentTitle?: string;
  onClose: () => void;
}

export function DocumentViewerModal({
  document,
  documentTitle = "Championship Document",
  onClose,
}: DocumentViewerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!document) return null;

  const isImage = document.mime_type.startsWith("image/");
  const isPdf = document.mime_type === "application/pdf";
  const viewUrl = document.signed_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{documentTitle}</h3>
              <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md">
                {document.original_filename} • Version {document.version}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewUrl && (
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[300px]">
          {viewUrl ? (
            isImage ? (
              <div className="relative max-w-full max-h-[60vh] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewUrl}
                  alt={document.original_filename}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-xl border border-slate-800"
                />
              </div>
            ) : isPdf ? (
              <div className="w-full h-[60vh] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex flex-col">
                <iframe
                  src={`${viewUrl}#toolbar=0`}
                  title={document.original_filename}
                  className="w-full flex-1 border-0"
                />
              </div>
            ) : (
              <div className="text-center p-8">
                <FileText className="w-16 h-16 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">File Ready for Download</p>
                <a
                  href={viewUrl}
                  download={document.original_filename}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </a>
              </div>
            )
          ) : (
            <div className="text-center p-8">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Unable to generate secure signed preview.</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>End-to-End Encrypted Private Storage Access</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            SHA256: {document.checksum.substring(0, 12)}...
          </span>
        </div>
      </div>
    </div>
  );
}
