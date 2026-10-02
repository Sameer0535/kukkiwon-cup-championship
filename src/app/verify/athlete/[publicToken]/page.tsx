// ==============================================================================
// PUBLIC ATHLETE QR VERIFICATION PAGE (Phase 7 Hardened)
// /verify/athlete/[publicToken]
// Publicly scannable official championship accreditation verification
// strictly redacting private PII (DOB, phone, email, address, financial data)
// SEO: noindex, nofollow
// ==============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { BrandLogo } from "@/components/branding/brand-logo";
import { IdCardService } from "@/server/services/id-card.service";
import { ManualVerifyBox } from "@/components/verify/manual-verify-box";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Award,
  ArrowLeft,
  CheckCircle2,
  Flag,
} from "lucide-react";

// Phase 7 Requirement 15: Search Engine Indexing Protection
export const metadata: Metadata = {
  title: "Accreditation Verification | Kukkiwon Cup Championship",
  description: "Official real-time verification of Kukkiwon Cup Championship athlete accreditation credentials.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function AthleteVerifyPage({
  params,
}: {
  params: Promise<{ publicToken: string }>;
}) {
  const { publicToken } = await params;

  let verification = await IdCardService.verifyByPublicToken(publicToken);

  const isVerified = verification.status === "VERIFIED";
  const isRevoked = verification.status === "REVOKED";
  const isNotFound = verification.status === "NOT_FOUND";

  // Use Phase 7 structured DTO with fallback to top-level fields
  const athleteName = verification.athlete?.name || verification.athleteName || "Competitor";
  const athleteId = verification.athlete?.athleteId || verification.athleteId || "—";
  const academy = verification.athlete?.academy || verification.academyName || "Independent";
  const category = verification.athlete?.category || verification.categoryName || "Official Entry";
  const discipline = verification.athlete?.discipline || verification.discipline || "KYORUGI";
  const country = verification.athlete?.country || verification.country || "India";
  const photoUrl = verification.athlete?.photoUrl || verification.photoUrl;
  const championshipName = verification.championship?.name || verification.championshipName || "KUKKIWON CUP CHAMPIONSHIP";
  const cardVersion = verification.card?.version || verification.version || 1;

  return (
    <div className="flex min-h-screen flex-col bg-[#060D1A] text-slate-100 antialiased selection:bg-[#D4AF37] selection:text-black">
      <PublicHeader />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-2xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Championship Portal</span>
        </Link>

        {/* Primary Verification Badge Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 rounded-full bg-[#0A192F] border-2 border-slate-700 shadow-2xl">
            {isVerified && (
              <ShieldCheck className="h-12 w-12 text-emerald-400" />
            )}
            {isRevoked && (
              <ShieldX className="h-12 w-12 text-rose-500 animate-pulse" />
            )}
            {isNotFound && (
              <ShieldAlert className="h-12 w-12 text-amber-400" />
            )}
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
              {championshipName}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1">
              {isVerified && "✓ VERIFIED ATHLETE"}
              {isRevoked && "ID CARD REVOKED"}
              {isNotFound && "ACCREDITATION NOT FOUND"}
            </h1>
          </div>

          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {isVerified && "Official Kukkiwon Cup digital athlete credential verified against championship registry."}
            {isRevoked && "This accreditation card is no longer valid."}
            {isNotFound && "The QR code or accreditation number could not be verified."}
          </p>
        </div>

        {/* Official ID Card Presentation (Mobile-First Responsive) */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/30 bg-gradient-to-b from-[#0A192F] to-[#040812] shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Card Top Branding */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <BrandLogo variant="compact" />
            <div className="flex items-center gap-2">
              {isVerified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  VALID
                </span>
              )}
              {isRevoked && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  REVOKED
                </span>
              )}
              {isNotFound && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  INVALID
                </span>
              )}
            </div>
          </div>

          {isVerified ? (
            <div className="space-y-6">
              {/* Athlete Banner Profile */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative h-28 w-24 rounded-xl border-2 border-[#D4AF37] bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={athleteName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-500">
                      <Award className="h-8 w-8 mx-auto text-[#D4AF37] mb-1" />
                      <span className="text-[10px] uppercase font-bold text-slate-400">Athlete</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                    Athlete ID
                  </div>
                  <div className="text-lg sm:text-xl font-mono font-black text-white tracking-wide">
                    {athleteId}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">
                    Athlete Name
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight uppercase">
                    {athleteName}
                  </h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400 pt-1">
                    <Flag className="h-3.5 w-3.5 text-amber-400" />
                    <span>{country}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold uppercase">
                      {verification.registrationStatus || "CONFIRMED"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tournament & Category Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-slate-800 bg-[#060D1A]/80 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                    Academy
                  </span>
                  <span className="font-semibold text-slate-200">
                    {academy}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                    Category
                  </span>
                  <span className="font-semibold text-amber-400">
                    {category}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                    Discipline
                  </span>
                  <span className="font-semibold text-slate-200">
                    {discipline}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                    Country
                  </span>
                  <span className="font-semibold text-slate-200">
                    {country}
                  </span>
                </div>
              </div>

              {/* Timestamp & Security Fingerprint */}
              <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-3 gap-2">
                <span>Verified: {new Date(verification.verifiedAt).toLocaleString()}</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  Card Version: V{cardVersion} • Cryptographically Verified
                </span>
              </div>
            </div>
          ) : isRevoked ? (
            <div className="p-8 text-center space-y-4">
              <div className="inline-flex p-3 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <ShieldX className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-rose-400 uppercase">
                  ID CARD REVOKED
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  This accreditation card is no longer valid.
                </p>
                {athleteId !== "—" && (
                  <p className="text-xs font-mono text-slate-400 pt-2">
                    Athlete ID: {athleteId} (V{cardVersion})
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-[11px] text-rose-300">
                Notice: Entry to the competition floor or ring with this card is strictly prohibited.
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-4">
              <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white uppercase">
                  ACCREDITATION NOT FOUND
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  The QR code or accreditation number could not be verified.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                Please verify the accreditation card directly with tournament officials.
              </div>
            </div>
          )}
        </div>

        {/* Phase 7 Requirement 14: Manual Verification Lookup */}
        <ManualVerifyBox />

        {/* Security & Privacy Guarantee Footer Notice */}
        <div className="rounded-xl border border-slate-800 bg-[#0A192F]/40 p-4 text-center text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">
            Kukkiwon Cup Privacy & Security Standard
          </p>
          <p>
            This verification service displays only verified public accreditation status. Personal contact info, birth dates, residential addresses, and payment data are protected and never encoded in QR tokens.
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
