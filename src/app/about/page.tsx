// ==============================================================================
// ABOUT PAGE - ORGANIZATIONAL PARTNERSHIP
// Kukkiwon North India x Kyorix Sports Technology
// ==============================================================================

import Image from "next/image";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BRANDING } from "@/config/branding";
import { Shield, Cpu, Award, CheckCircle2, ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090D16]">
      <PublicHeader />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl space-y-12">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Overview</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
            About The <span className="gold-gradient-text">Championship</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            The Kukkiwon Cup Championship represents a landmark collaboration between the
            official World Taekwondo Headquarters India North Branch and Kyorix Sports Technology,
            establishing a new benchmark for competitive martial arts in the region.
          </p>
        </div>

        {/* Organizations Dual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Kukkiwon Card */}
          <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white p-2 shadow-md">
                <Image
                  src={BRANDING.kukkiwon.logoPath}
                  alt={BRANDING.kukkiwon.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase">
                  {BRANDING.kukkiwon.name}
                </h3>
                <p className="text-xs text-amber-400 font-semibold">
                  {BRANDING.kukkiwon.branch}
                </p>
                <p className="text-[11px] text-slate-400">
                  {BRANDING.kukkiwon.title}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kukkiwon is the official World Taekwondo Headquarters located in South Korea.
              The India North Branch oversees official Dan/Poom belt certification, technical
              seminars, examiner accreditation, and sanctioned championships throughout Northern India.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                <span>Sanctioned Kukkiwon Dan Certification</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <span>Official Governing Tournament Regulations</span>
              </div>
            </div>
          </Card>

          {/* Kyorix Card */}
          <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-32 overflow-hidden rounded-xl bg-slate-950 p-2 border border-slate-800 shadow-md">
                <Image
                  src={BRANDING.kyorix.logoPath}
                  alt={BRANDING.kyorix.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase">
                  {BRANDING.kyorix.name}
                </h3>
                <p className="text-xs text-cyan-400 font-semibold">
                  {BRANDING.kyorix.subtitle}
                </p>
                <p className="text-[11px] text-slate-400">
                  Accreditation & Scoring Partner
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kyorix Sports Technology develops cutting-edge electronic scoring hardware,
              mat management software, real-time wireless referee pads, and secure cryptographic
              accreditation badge engines for world-class combat sporting events.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <span>Digital Accreditation & QR Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>High-Precision Ring Mat Management</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Independence Disclaimer */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-6 space-y-2 text-xs text-slate-400">
          <h4 className="font-bold text-slate-200 uppercase tracking-wide">
            Platform Decoupling Notice
          </h4>
          <p>
            This portal is a completely standalone production environment. It operates on an
            independent database, independent authentication system, private storage, and unique
            encryption keys completely separated from previous tournament systems.
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
