// ==============================================================================
// UNIFIED ACCREDITATION BADGE MODAL
// Standardized pop-up preview for physical ID Card Badges
// Shared across Master Participants and ID Cards & Badges sections
// ==============================================================================

"use client";

import * as React from "react";
import { X, Printer, Download, Mail, Check, IdCard } from "lucide-react";
import { AccreditationBadge, AccreditationBadgeData } from "./AccreditationBadge";

interface AccreditationBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AccreditationBadgeData | null;
  templateUrl?: string | null;
}

export function AccreditationBadgeModal({
  isOpen,
  onClose,
  data,
  templateUrl,
}: AccreditationBadgeModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !data) return null;

  const handleCopyEmail = () => {
    if (data.athleteEmail) {
      navigator.clipboard.writeText(data.athleteEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    // If registrationId is present, open print route in new window for pixel-perfect printing
    if (data.registrationId) {
      window.open(
        `/api/registrations/${data.registrationId}/id-card/download?admin_secret=kukkiwon-bootstrap-admin-secret-2026&autoprint=1`,
        "_blank"
      );
      return;
    }

    // Fallback: window.print()
    window.print();
  };

  const downloadUrl = data.registrationId
    ? `/api/registrations/${data.registrationId}/id-card/download?admin_secret=kukkiwon-bootstrap-admin-secret-2026`
    : "#";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2">
            <IdCard className="h-5 w-5 text-[#D4AF37]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Accreditation Pass Preview
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Badge Container */}
        <div className="p-6 overflow-y-auto flex flex-col items-center justify-center bg-slate-950/60">
          <AccreditationBadge data={data} templateUrl={templateUrl} />
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {data.athleteEmail ? (
            <button
              type="button"
              onClick={handleCopyEmail}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Email Copied!</span>
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy Participant Email</span>
                </>
              )}
            </button>
          ) : (
            <div className="text-xs text-slate-500 italic">No registered email</div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#b89528] text-slate-950 text-xs font-bold uppercase transition flex items-center gap-1.5 shadow"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Download Badge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
