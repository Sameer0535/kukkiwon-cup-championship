// ==============================================================================
// TERMS & CONDITIONS (Requirements 5 & 18)
// Official Championship Participation Terms & Legal Framework
// ==============================================================================

import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Badge } from "@/components/ui/badge";
import { BRANDING } from "@/config/branding";
import { Shield, FileText, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Header */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50/70 via-white to-white py-14 sm:py-18">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="gold">Legal Framework</Badge>
              <span className="font-mono text-xs text-slate-500">
                Active Terms Version: <strong className="text-slate-900">v1.0</strong>
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-950">
              Terms & Conditions
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Official participant agreement, tournament regulations, and liability waiver for the
              Kukkiwon Cup Championship.
            </p>
          </div>
        </section>

        {/* Legal Text Content */}
        <section className="py-14 sm:py-20 bg-slate-50/70">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-10 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold uppercase text-slate-950 tracking-wide border-l-2 border-blue-600 pl-3">
                1. Championship Eligibility & Sanction
              </h2>
              <p>
                The Kukkiwon Cup Championship is sanctioned by the World Taekwondo Headquarters Kukkiwon India
                North Branch. All participating athletes, coaches, and technical officials must comply with the
                official World Taekwondo (WT) competition rules and guidelines established by the organizing committee.
                Submission of false age, belt rank, or nationality will result in immediate disqualification without refund.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold uppercase text-slate-950 tracking-wide border-l-2 border-blue-600 pl-3">
                2. Dan & Poom Certificate Verification
              </h2>
              <p>
                Competitors entering black belt categories and coaches seeking mat credentials must hold an authentic,
                verifiable Kukkiwon Dan or Poom certificate. The organizing committee reserves the right to authenticate
                all certificates directly against Kukkiwon Seoul master registries.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold uppercase text-slate-950 tracking-wide border-l-2 border-blue-600 pl-3">
                3. Physical Fitness, Health & Assumption of Risk
              </h2>
              <p>
                Taekwondo is a dynamic, full-contact martial art. Every competitor (and their legal guardian in the
                case of minors) acknowledges the inherent physical risks associated with sparring, poomsae, and
                demonstration competition. Competitors certify that they are medically fit to engage in intense physical
                contests and maintain personal medical/accident insurance.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold uppercase text-slate-950 tracking-wide border-l-2 border-blue-600 pl-3">
                4. Accreditation, Badge Display & Media Rights
              </h2>
              <p>
                All participants consent to being photographed and recorded during tournament events for official
                Kukkiwon and Kyorix archival, promotional, and broadcast purposes. Digital accreditation ID badges
                bearing cryptographic QR codes must be worn at all times within tournament venues. Tampering with or
                transferring an accreditation badge is strictly prohibited.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold uppercase text-slate-950 tracking-wide border-l-2 border-blue-600 pl-3">
                5. Fee Policy & Cancellation
              </h2>
              <p>
                Registration and accreditation fees contribute toward official electronic scoring equipment, ring
                infrastructure, medical personnel, and credential badge manufacturing. Entry fees are non-refundable
                once entries close or in the event of an athlete's failure to meet weigh-in specifications.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-2 text-slate-600 shadow-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold uppercase text-xs">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Auditable Legal Acceptance</span>
              </div>
              <p className="text-xs">
                When you enroll in the tournament platform, your acceptance is recorded with the exact timestamp
                and terms version (<code className="text-blue-600 font-semibold">v1.0</code>) in compliance with digital sports governance standards.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
