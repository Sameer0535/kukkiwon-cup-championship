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
import { SITE_CONFIG } from "@/config/site";
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

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Page Hero Header */}
        <section className="relative overflow-hidden border-b border-slate-800/80 bg-[#090D16] py-16 sm:py-20">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              Institutional Governance & Partnership
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white">
              About The Championship
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              An official tournament platform established under the direct authority of
              Kukkiwon India North Branch, powered by Kyorix Sports Technology.
            </p>
          </div>
        </section>

        {/* Section 1: Kukkiwon India North Branch Institutional Profile */}
        <section className="py-16 sm:py-20 border-b border-slate-800/80 bg-[#060A13]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-4 flex justify-center">
                <div className="relative h-44 w-44 rounded-2xl bg-white p-4 border border-slate-700 shadow-2xl flex items-center justify-center">
                  <Image
                    src={BRANDING.kukkiwon.logoPath}
                    alt={BRANDING.kukkiwon.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                    Governing Authority
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold uppercase text-white">
                    {BRANDING.kukkiwon.name} ({BRANDING.kukkiwon.branch})
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    {BRANDING.kukkiwon.title}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Kukkiwon, located in Gangnam-gu, Seoul, Republic of Korea, was founded in 1972 as the World
                  Taekwondo Headquarters. It serves as the definitive authority for standardizing Taekwondo technique,
                  administering international Dan/Poom promotions, training master instructors, and upholding the martial
                  art's Olympic legacy.
                </p>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  The Kukkiwon India North Branch is the officially designated jurisdictional authority governing
                  Dan promotions, examiner certifications, black belt verification, and sanctioned championships across
                  the northern states of India.
                </p>

                <div className="pt-2">
                  <a
                    href="https://kukkiwon-india.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:underline"
                  >
                    <span>Visit Kukkiwon India North Branch Official Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Kyorix Sports Technology Institutional Profile */}
        <section className="py-16 sm:py-20 border-b border-slate-800/80 bg-[#090D16]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-8 space-y-4 order-2 lg:order-1">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#00E5FF]">
                    Technology & Accreditation Partner
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold uppercase text-white">
                    {BRANDING.kyorix.name} {BRANDING.kyorix.subtitle}
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Electronic Scoring & Tournament Infrastructure
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Kyorix Sports Technology provides tournament electronic management solutions for combat sports.
                  Through wireless sensor transmitters, electronic body protectors (PSS), synchronized video replay,
                  and digital referee scoring pads, Kyorix ensures instant, tamper-proof point calculation.
                </p>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  For the Kukkiwon Cup Championship, Kyorix architects the standalone registration platform,
                  cryptographic QR badge verification, electronic mat management, and participant credential verification,
                  elevating the tournament to international technological benchmarks.
                </p>
              </div>

              <div className="lg:col-span-4 flex justify-center order-1 lg:order-2">
                <div className="relative h-28 w-56 rounded-2xl bg-slate-950 p-4 border border-slate-800 shadow-2xl flex items-center justify-center">
                  <Image
                    src={BRANDING.kyorix.logoPath}
                    alt={BRANDING.kyorix.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Principles & Regulatory Integrity */}
        <section id="eligibility" className="py-16 sm:py-20 bg-[#060A13]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Official Standards
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase text-white">
                Participation Standards & Ethics
              </h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="p-5 rounded-xl border border-slate-800 bg-[#0A0F1D] space-y-2">
                <h3 className="font-bold text-white uppercase text-xs">
                  1. Kukkiwon Dan / Poom Credential Verification
                </h3>
                <p className="text-slate-400">
                  All black belt competitors and accredited coaches must provide their verified Kukkiwon Dan or
                  Poom certificate number during registration. Credentials are confirmed through the official
                  Kukkiwon records repository.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-800 bg-[#0A0F1D] space-y-2">
                <h3 className="font-bold text-white uppercase text-xs">
                  2. Mandatory Photographic Accreditation
                </h3>
                <p className="text-slate-400">
                  Official tournament ID cards bearing cryptographic QR codes must be worn at all times. Ringside
                  access is strictly restricted to active competitors and accredited coaches during scheduled matches.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-800 bg-[#0A0F1D] space-y-2">
                <h3 className="font-bold text-white uppercase text-xs">
                  3. Martial Arts Spirit & Fair Play
                </h3>
                <p className="text-slate-400">
                  Every participant, official, and spectator is expected to honor the tenets of Taekwondo: Courtesy
                  (Ye-Ui), Integrity (Yom-Chi), Perseverance (In-Nae), Self-Control (Guk-Gi), and Indomitable Spirit
                  (Baekjul-bool-gool).
                </p>
              </div>
            </div>

            <div className="text-center pt-4">
              <Link href="/register">
                <Button variant="gold" size="lg" className="text-xs uppercase font-extrabold px-8">
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
