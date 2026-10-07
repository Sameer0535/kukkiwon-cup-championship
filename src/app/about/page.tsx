// ==============================================================================
// ABOUT PAGE - OFFICIAL INSTITUTIONAL PROFILE (Requirement 5)
// Kukkiwon India North Branch x Kyorix Sports Technology
// ==============================================================================

import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BRANDING } from "@/config/branding";
import { getPublicChampionshipData } from "@/lib/cms";
import {
  Shield,
  Award,
  Cpu,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  MapPin,
  Building,
  Target,
} from "lucide-react";

export default async function AboutPage() {
  const tournament = await getPublicChampionshipData();

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Page Hero Header */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50/70 via-white to-white py-16 sm:py-20">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              {tournament.partnershipTagline || "Institutional Governance & Partnership"}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-950">
              About The Championship
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {tournament.partnershipDescription ||
                "An official tournament platform established under the direct authority of Kukkiwon India North Branch, powered by Kyorix Sports Technology."}
            </p>
          </div>
        </section>

        {/* Section 1: Kukkiwon India North Branch Institutional Profile */}
        <section className="py-16 sm:py-20 border-b border-slate-200 bg-slate-50/70">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-4 flex justify-center">
                <div className="relative h-36 w-44 rounded-2xl bg-white p-3 border border-slate-200 shadow-md flex items-center justify-center">
                  <Image
                    src={BRANDING.kukkiwon.logoPath}
                    alt={tournament.kukkiwonTitle || BRANDING.kukkiwon.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                    {tournament.kukkiwonRole || "Governing Authority"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase text-slate-950">
                    {tournament.kukkiwonTitle || BRANDING.kukkiwon.name}{" "}
                    {tournament.kukkiwonBranch ? `(${tournament.kukkiwonBranch})` : `(${BRANDING.kukkiwon.branch})`}
                  </h2>
                  <p className="text-xs font-bold text-slate-500">
                    {tournament.kukkiwonBadge || "Official Sanctioning Body"}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {tournament.kukkiwonDescription ||
                    "Kukkiwon, located in Gangnam-gu, Seoul, Republic of Korea, was founded in 1972 as the World Taekwondo Headquarters. It serves as the definitive authority for standardizing Taekwondo technique, administering international Dan/Poom promotions, training master instructors, and upholding the martial art's Olympic legacy.\n\nThe Kukkiwon India North Branch is the officially designated jurisdictional authority governing Dan promotions, examiner certifications, black belt verification, and sanctioned championships across the northern states of India."}
                </p>

                <div className="pt-2">
                  <a
                    href={tournament.kukkiwonUrl || "https://kukkiwon-india.org/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <span>{tournament.kukkiwonUrlText || "Visit Kukkiwon India North Branch Official Portal"}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Kyorix Sports Technology Institutional Profile */}
        <section className="py-16 sm:py-20 border-b border-slate-200 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-8 space-y-4 order-2 lg:order-1">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">
                    {tournament.kyorixRole || "Technology & Accreditation Partner"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase text-slate-950">
                    {tournament.kyorixTitle || BRANDING.kyorix.name}{" "}
                    {tournament.kyorixSubtitle || BRANDING.kyorix.subtitle}
                  </h2>
                  <p className="text-xs font-bold text-slate-500">
                    {tournament.kyorixBadge || "Electronic Scoring & Tournament Infrastructure"}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {tournament.kyorixDescription ||
                    "Kyorix Sports Technology provides tournament electronic management solutions for combat sports. Through wireless sensor transmitters, electronic body protectors (PSS), synchronized video replay, and digital referee scoring pads, Kyorix ensures instant, tamper-proof point calculation.\n\nFor the Kukkiwon Cup Championship, Kyorix architects the standalone registration platform, cryptographic QR badge verification, electronic mat management, and participant credential verification, elevating the tournament to international technological benchmarks."}
                </p>
              </div>

              <div className="lg:col-span-4 flex justify-center order-1 lg:order-2">
                <div className="relative h-36 w-36 rounded-2xl bg-white p-3 border border-slate-200 shadow-md flex items-center justify-center">
                  <Image
                    src={BRANDING.kyorix.logoPath}
                    alt={tournament.kyorixTitle || BRANDING.kyorix.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Principles & Regulatory Integrity */}
        <section id="eligibility" className="py-16 sm:py-20 bg-slate-50/70">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Official Standards
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-slate-950">
                {tournament.aboutMissionHeading || "Participation Standards & Ethics"}
              </h2>
              {tournament.aboutMissionText && (
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                  {tournament.aboutMissionText}
                </p>
              )}
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <h3 className="font-bold text-slate-900 uppercase text-xs">
                  1. Kukkiwon Dan / Poom Credential Verification
                </h3>
                <p className="text-slate-600">
                  All black belt competitors and accredited coaches must provide their verified Kukkiwon Dan or
                  Poom certificate number during registration. Credentials are confirmed through the official
                  Kukkiwon records repository.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <h3 className="font-bold text-slate-900 uppercase text-xs">
                  2. Mandatory Photographic Accreditation
                </h3>
                <p className="text-slate-600">
                  Official tournament ID cards bearing cryptographic QR codes must be worn at all times. Ringside
                  access is strictly restricted to active competitors and accredited coaches during scheduled matches.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <h3 className="font-bold text-slate-900 uppercase text-xs">
                  3. Martial Arts Spirit & Fair Play
                </h3>
                <p className="text-slate-600">
                  Every participant, official, and spectator is expected to honor the tenets of Taekwondo: Courtesy
                  (Ye-Ui), Integrity (Yom-Chi), Perseverance (In-Nae), Self-Control (Guk-Gi), and Indomitable Spirit
                  (Baekjul-bool-gool).
                </p>
              </div>
            </div>

            <div className="text-center pt-4">
              <Link href="/register">
                <Button variant="gold" size="lg" className="text-xs uppercase font-extrabold px-8 shadow-lg shadow-blue-500/25">
                  <span>Register for the Championship</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
