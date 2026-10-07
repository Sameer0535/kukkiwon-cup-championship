// ==============================================================================
// UNIFIED ACCREDITATION BADGE COMPONENT
// Authoritative visual representation of Kukkiwon Cup accreditation passes
// Renders identically across:
// 1. Master Participants Directory Modal
// 2. ID Cards & Badges Section Modal
// 3. Single / Bulk Print & Download Views
// Supports custom graphic template background overlay with standard fallback
// ==============================================================================

"use client";

import * as React from "react";
import {
  IdCard,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Users,
  QrCode as QrCodeIcon,
} from "lucide-react";

export interface AccreditationBadgeData {
  athleteId: string;
  athleteName: string;
  athleteEmail?: string | null;
  designation?: "Athlete" | "Coach" | "Technical Official" | string;
  academyName: string;
  categoryName?: string;
  coachRole?: string;
  kukkiwonId?: string | null;
  photoUrl?: string | null;
  flag?: string;
  nationality?: string;
  status?: string;
  version?: number;
  registrationId?: string;
}

interface AccreditationBadgeProps {
  data: AccreditationBadgeData;
  templateUrl?: string | null;
  id?: string;
  className?: string;
}

export function AccreditationBadge({
  data,
  templateUrl,
  id = "accreditation-card-badge",
  className = "",
}: AccreditationBadgeProps) {
  const isCoach =
    data.designation === "Coach" ||
    data.designation === "COACH" ||
    (data.categoryName && data.categoryName.toLowerCase().includes("coach"));

  const roleLabel = isCoach ? "OFFICIAL COACH" : "ATHLETE";
  const roleBg = isCoach ? "bg-blue-600 text-white" : "bg-emerald-600 text-white";

  const nationalityDisplay = data.nationality || "IND";
  const flagDisplay = data.flag || (nationalityDisplay.includes("IND") ? "🇮🇳" : "🌐");

  return (
    <div
      id={id}
      className={`relative w-[340px] min-h-[510px] rounded-2xl overflow-hidden shadow-2xl transition-all flex flex-col justify-between text-white ${
        templateUrl
          ? "border-2 border-[#D4AF37]/80 bg-slate-950"
          : "border-2 border-[#D4AF37] bg-gradient-to-b from-[#0A192F] via-[#051329] to-[#0A192F]"
      } ${className}`}
      style={
        templateUrl
          ? {
              backgroundImage: `url(${templateUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : undefined
      }
    >
      {/* Semi-transparent backdrop overlay when custom template is used */}
      {templateUrl && (
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] pointer-events-none" />
      )}

      {/* Content wrapper relative to sit above backdrop */}
      <div className="relative z-10 flex flex-col h-full justify-between p-5 space-y-3">
        {/* TOP INSTITUTIONAL HEADER */}
        <div className="text-center border-b border-[#D4AF37]/40 pb-2.5 space-y-1">
          <div className="text-[10px] tracking-widest font-black uppercase text-[#D4AF37]">
            KUKKIWON CUP INDIA 2026
          </div>
          <div className="text-[9px] font-bold tracking-wider text-slate-300 uppercase">
            OFFICIAL ACCREDITATION PASS
          </div>
          <span
            className={`inline-block px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow ${roleBg}`}
          >
            {roleLabel}
          </span>
        </div>

        {/* PHOTO & PRIMARY ATHLETE IDENTITY */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="relative w-28 h-36 rounded-xl border-2 border-[#D4AF37] overflow-hidden bg-slate-900 shadow-xl flex items-center justify-center">
            {data.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.photoUrl}
                alt={data.athleteName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900">
                <Users className="h-10 w-10 stroke-1 text-[#D4AF37]" />
                <span className="text-[9px] font-mono mt-1 text-slate-400">
                  Official Portrait
                </span>
              </div>
            )}
          </div>

          <div className="space-y-0.5 max-w-full px-2">
            <h2 className="text-base font-black uppercase tracking-tight text-white leading-tight">
              {data.athleteName}
            </h2>
            <div className="text-xs font-mono text-[#D4AF37] font-bold tracking-wider">
              {data.athleteId}
            </div>

            {/* Registered Email display beneath athlete name */}
            {data.athleteEmail && (
              <div className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-mono mt-0.5 px-2.5 py-0.5 rounded-full bg-slate-950/70 border border-amber-400/30">
                <Mail className="h-3 w-3 text-slate-400" />
                <span className="truncate max-w-[240px]">{data.athleteEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* METADATA CREDENTIALS GRID */}
        <div className="space-y-1.5 text-xs border-t border-[#D4AF37]/30 pt-2.5 font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Kukkiwon Dan:</span>
            <span className="font-bold text-emerald-400">
              {data.kukkiwonId || "KKID-VERIFIED"}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Academy / Club:</span>
            <span className="font-bold text-white text-right truncate max-w-[180px]">
              {data.academyName || "Independent"}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">
              {isCoach ? "Coach Role:" : "WT Category:"}
            </span>
            <span className="font-bold text-sky-400 text-right truncate max-w-[180px]">
              {isCoach
                ? data.coachRole || "Accredited Coach"
                : data.categoryName || "Senior Division"}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Country:</span>
            <span className="font-bold text-white">
              {flagDisplay} {nationalityDisplay}
            </span>
          </div>
        </div>

        {/* DIGITAL QR VERIFICATION & FOOTER BARCODE */}
        <div className="pt-2 border-t border-[#D4AF37]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-white text-slate-950 shadow">
              <QrCodeIcon className="h-9 w-9 text-slate-950" />
            </div>
            <div className="text-left text-[9px] text-slate-400 leading-tight">
              <div className="flex items-center gap-1 font-bold text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified Official</span>
              </div>
              <span className="font-mono text-[#D4AF37]">KYORIX • KKC26</span>
            </div>
          </div>

          <div className="text-right text-[9px] font-mono text-slate-400">
            <div>v{data.version || 1}</div>
            <div className="text-emerald-400 font-bold uppercase">{data.status || "ACTIVE"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
