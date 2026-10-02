// ==============================================================================
// DOCUMENT REQUIREMENTS CHECKLIST (Requirement 6)
// Establishes compliance readiness checklist for participant verification
// Full cryptographic document upload/storage is scheduled for Phase 4
// ==============================================================================

"use client";

import * as React from "react";
import { CheckCircle2, FileText, AlertCircle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DocumentChecklistProps {
  discipline?: string;
  beltRank?: string;
  checkedDocs: Record<string, boolean>;
  onChange: (checkedDocs: Record<string, boolean>) => void;
}

export function DocumentChecklist({
  discipline,
  beltRank,
  checkedDocs,
  onChange,
}: DocumentChecklistProps) {
  const isBlackBeltOrDan =
    beltRank?.includes("DAN") ||
    beltRank?.includes("POOM") ||
    beltRank?.includes("BLACK");

  const docItems = [
    {
      id: "gov_id",
      title: "Government Photo Identification",
      desc: "Valid Aadhaar Card, Passport, or National Identity Card verifying legal full name and nationality.",
      required: true,
      badge: "Mandatory",
    },
    {
      id: "dob_proof",
      title: "Proof of Age / Birth Certificate",
      desc: "Official municipal birth certificate or secondary school certificate verifying date of birth for division eligibility.",
      required: true,
      badge: "Mandatory",
    },
    {
      id: "kukkiwon_cert",
      title: "Kukkiwon Dan / Poom Certificate",
      desc: "Mandatory for all Black Belt / Poom participants. Must include official Kukkiwon certification number.",
      required: isBlackBeltOrDan,
      badge: isBlackBeltOrDan ? "Mandatory for Dan" : "Optional for Color Belts",
    },
    {
      id: "athlete_photo",
      title: "Digital Portrait Photograph",
      desc: "Front-facing colored passport-style photo with plain white or light background for official accreditation badge printing.",
      required: true,
      badge: "Mandatory for ID Card",
    },
    {
      id: "medical_fitness",
      title: "Medical Fitness & Minor Consent",
      desc: "Signed medical fitness clearance and parental consent declaration for minor competitors under 18 years of age.",
      required: true,
      badge: "Safety Policy",
    },
  ];

  const handleToggle = (id: string) => {
    onChange({
      ...checkedDocs,
      [id]: !checkedDocs[id],
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-slate-800 bg-[#090D16] space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00E5FF]">
          <Shield className="h-4 w-4" />
          <span>Accreditation Verification Checklist</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Please confirm you have the following required documentation ready. Secure cryptographic document upload and committee verification will take place prior to ID badge clearance.
        </p>
      </div>

      <div className="space-y-3">
        {docItems.map((doc) => {
          const isChecked = !!checkedDocs[doc.id];

          return (
            <div
              key={doc.id}
              onClick={() => handleToggle(doc.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4 select-none ${
                isChecked
                  ? "border-emerald-500/50 bg-emerald-950/10"
                  : "border-slate-800 bg-[#0A0F1D] hover:border-slate-700"
              }`}
            >
              <div className="pt-0.5 shrink-0">
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                    isChecked
                      ? "bg-emerald-500 border-emerald-500 text-slate-950"
                      : "border-slate-700 bg-slate-900"
                  }`}
                >
                  {isChecked && <CheckCircle2 className="h-4 w-4 stroke-[3]" />}
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span>{doc.title}</span>
                  </h5>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      doc.required
                        ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    {doc.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{doc.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-[#D4AF37] shrink-0" />
        <span>
          Note: Full secure document uploading & cloud storage will be activated in Phase 4. Check all items to confirm document preparedness.
        </span>
      </div>
    </div>
  );
}
