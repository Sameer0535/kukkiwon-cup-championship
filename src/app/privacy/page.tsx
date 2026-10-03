// ==============================================================================
// PRIVACY POLICY (Requirement 5)
// Data Protection, Participant Record Confidentiality & Document Security
// ==============================================================================

import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Badge } from "@/components/ui/badge";
import { Lock, Shield, CheckCircle2 } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Header */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50/70 via-white to-white py-14 sm:py-18">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="cyan">Data Protection</Badge>
              <span className="font-mono text-xs text-slate-500">
                Tournament Privacy Protocol
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-950">
              Privacy & Credential Security Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              How the Kukkiwon Cup Championship protects participant records, identification files,
              and accreditation credentials.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-14 sm:py-20 bg-slate-50/70">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-10 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold uppercase text-slate-950 tracking-wide border-l-2 border-cyan-500 pl-3">
                1. Information We Collect
              </h2>
              <p>
                To organize a safe, sanctioned championship, we collect personal identifying information
                including participant full name, date of birth, gender, nationality, emergency contact,
                academy affiliation, Kukkiwon Dan/Poom certificate numbers, and official portrait photographs.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold uppercase text-slate-950 tracking-wide border-l-2 border-cyan-500 pl-3">
                2. Strictly Private Document Storage Architecture
              </h2>
              <p>
                Government identification documents (such as Aadhaar cards, passports, or medical fitness
                certificates) are held in strictly private, isolated cloud storage buckets (<code className="text-blue-600 font-semibold">participant-documents</code>).
                These files are never publicly exposed on the internet. Access is restricted to authorized
                tournament credential examiners via time-limited, cryptographically signed URLs.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold uppercase text-slate-950 tracking-wide border-l-2 border-cyan-500 pl-3">
                3. Cryptographic QR Verification & Zero-PII Policy
              </h2>
              <p>
                The QR codes printed on tournament badges do not encode sensitive participant personal information
                (such as dates of birth, phone numbers, or residential addresses). Instead, they store a high-entropy,
                cryptographically random token that resolves to a secure verification status page showing only authorized
                accreditation details.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold uppercase text-slate-950 tracking-wide border-l-2 border-cyan-500 pl-3">
                4. Data Sharing & Non-Disclosure
              </h2>
              <p>
                Participant information is shared exclusively between the official organizers (Kukkiwon India
                North Branch and Kyorix Sports Technology) for tournament operations, scoring, certificate issuance,
                and medical emergency coordination. We never sell, lease, or monetize participant data to third-party
                marketers.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-2 text-slate-600 shadow-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold uppercase text-xs">
                <Lock className="h-4 w-4 text-cyan-600" />
                <span>Security Governance Compliance</span>
              </div>
              <p className="text-xs">
                For questions regarding data retention or to request correction of your tournament records,
                contact the Data Controller at <code className="text-blue-600 font-semibold">privacy@kyorix.com</code>.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
