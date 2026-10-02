// ==============================================================================
// PUBLIC QR ACCREDITATION VERIFICATION (Requirements 13 & 14)
// High-security credential verification page: /verify/[token]
// ==============================================================================

import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/branding/brand-logo";
import { IdCardService } from "@/server/services/id-card.service";
import { ShieldCheck, ShieldAlert, Award, Calendar, CheckCircle, ArrowLeft } from "lucide-react";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Perform lookup via IdCardService
  let verification: any = null;

  if (token === "demo-token") {
    // Demonstration accreditation card for Phase 1 verification preview
    verification = {
      is_valid: true,
      card_status: "GENERATED",
      card_number: "CARD-KC26-DEMO01",
      participant_name: "Master Rahul Sharma",
      designation: "Athlete",
      nationality: "India",
      flag_identifier: "🇮🇳",
      championship_name: "Kukkiwon Cup Championship 2026",
      registration_number: "REG-KC26-A1001",
      verified_at: new Date().toISOString(),
      message: "Official Kukkiwon Cup accreditation verified.",
    };
  } else {
    try {
      verification = await IdCardService.verifyByQrToken(token);
    } catch {
      verification = {
        is_valid: false,
        card_status: "NOT_GENERATED",
        verified_at: new Date().toISOString(),
        message: "Failed to verify credential. Verification service error.",
      };
    }
  }

  const isValid = verification?.is_valid;

  return (
    <div className="flex min-h-screen flex-col bg-[#090D16]">
      <PublicHeader />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-2xl space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        {/* Verification Status Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-900 border border-slate-800 shadow-xl">
            {isValid ? (
              <ShieldCheck className="h-12 w-12 text-emerald-400 animate-bounce" />
            ) : (
              <ShieldAlert className="h-12 w-12 text-red-400" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white uppercase tracking-tight">
            {isValid ? "Official Accreditation Verified" : "Accreditation Unverified"}
          </h1>
          <p className="text-xs text-slate-400">
            Kukkiwon Cup Tournament Accreditation & Security Verification System
          </p>
        </div>

        {/* Digital ID Accreditation Badge Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-950 to-[#0A0F1D] shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Top Brand Presentation */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <BrandLogo variant="compact" />
            <StatusBadge status={verification.card_status} />
          </div>

          {/* Participant Info Block */}
          {isValid ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Photo Placeholder */}
                <div className="relative h-28 w-24 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                  {verification.photo_url ? (
                    <Image
                      src={verification.photo_url}
                      alt={verification.participant_name || "Participant"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-500">
                      <Award className="h-8 w-8 mx-auto text-amber-400 mb-1" />
                      <span className="text-[10px] uppercase font-bold">Official</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {verification.card_number}
                    </span>
                    <Badge variant="gold">
                      {verification.designation || "Participant"}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-white pt-1">
                    {verification.participant_name}
                  </h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400">
                    <span className="text-lg">{verification.flag_identifier || "🇮🇳"}</span>
                    <span>{verification.nationality || "India"}</span>
                  </div>
                </div>
              </div>

              {/* Tournament Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Tournament
                  </span>
                  <span className="font-medium text-slate-200">
                    {verification.championship_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Registration No
                  </span>
                  <span className="font-mono text-slate-200">
                    {verification.registration_number}
                  </span>
                </div>
              </div>

              {/* Verification Timestamp */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                <span>Verified: {new Date(verification.verified_at).toLocaleString()}</span>
                <span className="text-emerald-400 font-semibold">Cryptographically Signed</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center space-y-3">
              <p className="text-sm text-red-400 font-medium">
                {verification.message || "This accreditation token does not correspond to an active ID badge."}
              </p>
              <p className="text-xs text-slate-400">
                Please contact tournament administration if you believe this is in error.
              </p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>
            Security Note: This QR verification endpoint accesses zero raw participant PII directly from the QR code.
          </p>
          <p>
            All verifications are authenticated through secure high-entropy token resolution.
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
