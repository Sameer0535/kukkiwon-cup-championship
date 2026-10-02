// ==============================================================================
// REGISTRATION PORTAL ENTRY PAGE (Requirements 5 & 30)
// Official Tournament Entry Overview & Preparation Portal
// ==============================================================================

import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Shield,
  FileCheck,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

export default function RegisterPage() {
  const steps = [
    {
      num: "01",
      title: "Review Category & Division",
      desc: "Identify your age and weight division under the official World Taekwondo technical outline.",
    },
    {
      num: "02",
      title: "Prepare Required Documents",
      desc: "Have your Government Photo ID (Aadhaar/Passport), Dan/Poom certificate, and digital portrait photo ready.",
    },
    {
      num: "03",
      title: "Submit Registration Profile",
      desc: "Provide participant personal details, dojang affiliation, and select competitive disciplines.",
    },
    {
      num: "04",
      title: "Accreditation & Badge Issuance",
      desc: "Upon committee verification and fee clearance, your cryptographic digital QR ID card will be issued.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Registration Header Banner */}
        <section className="relative overflow-hidden border-b border-slate-800/80 bg-[#090D16] py-14 sm:py-20">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              Kukkiwon Cup Championship 2026
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white">
              Tournament Registration
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Official registration portal for competitors, certified coaches, and technical officials.
              Sanctioned by Kukkiwon India North Branch.
            </p>
          </div>
        </section>

        {/* 4-Step Registration Process Overview */}
        <section className="py-16 border-b border-slate-800/80 bg-[#060A13]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Registration Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase text-white">
                How to Register
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s) => (
                <div
                  key={s.num}
                  className="p-6 rounded-xl border border-slate-800 bg-[#0A0F1D] space-y-3"
                >
                  <span className="text-2xl font-black text-amber-400/90 font-mono block">
                    {s.num}
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Required Documentation Checklist */}
        <section className="py-16 border-b border-slate-800/80 bg-[#090D16]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#00E5FF]">
                Compliance Checklist
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase text-white">
                Required Verification Documents
              </h2>
              <p className="text-xs text-slate-400">
                To guarantee tournament integrity and sports safety, all participants must provide the following:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0C1222] flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white uppercase">Government Photo ID</h4>
                  <p className="text-slate-400 mt-0.5">
                    Aadhaar Card, Passport, or Voter ID for proof of age and nationality.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0C1222] flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white uppercase">Kukkiwon Dan / Poom Certificate</h4>
                  <p className="text-slate-400 mt-0.5">
                    Required for all black belt athlete divisions and accredited coaches.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0C1222] flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white uppercase">Digital Portrait Photograph</h4>
                  <p className="text-slate-400 mt-0.5">
                    Clear front-facing color photo for printing on your official QR badge.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0C1222] flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white uppercase">Medical Fitness & Terms Acceptance</h4>
                  <p className="text-slate-400 mt-0.5">
                    Signed parent/guardian indemnity (for minors) and acceptance of terms v1.0.
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 3 Form Queue Box */}
            <div className="p-8 rounded-2xl border border-amber-500/30 bg-[#0C1425] text-center space-y-4">
              <Badge variant="gold">Phase 2 Established • Phase 3 Registration Engine Ready</Badge>
              <h3 className="text-xl font-bold text-white uppercase">
                Begin Participant Enrollment
              </h3>
              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                The public championship website is active. Live multi-step wizard intake, document upload
                crop, and electronic fee settlement are provisioned for full processing in Phase 3.
              </p>
              <div className="pt-2">
                <Link href="/contact">
                  <Button variant="outline" size="md" className="text-xs uppercase font-bold text-slate-300 border-slate-700">
                    <span>Contact Tournament Desk</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
