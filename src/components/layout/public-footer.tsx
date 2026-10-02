// ==============================================================================
// PUBLIC FOOTER
// Collaboration notice, organizational credentials, and legal disclaimers
// ==============================================================================

import Link from "next/link";
import { BrandLogo } from "@/components/branding/brand-logo";
import { BRANDING } from "@/config/branding";
import { Shield, Sparkles } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 text-slate-400 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800/60">
          {/* Dual Brand Block */}
          <div className="space-y-3">
            <BrandLogo variant="combined" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm pt-2">
              Official registration, accreditation, and tournament credential system
              for the Kukkiwon Cup Championship.
            </p>
            <div className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 border border-slate-800">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Standalone Production Architecture — Phase 1</span>
            </div>
          </div>

          {/* Organizing Collaboration */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-200 tracking-wider uppercase">
              Presented In Collaboration
            </h4>
            <div className="space-y-1.5 pt-1 text-slate-400">
              <p>
                <strong className="text-slate-300">Kukkiwon North India Branch:</strong> Official
                governing representative of the World Taekwondo Headquarters.
              </p>
              <p>
                <strong className="text-slate-300">Kyorix Sports Technology:</strong> Tournament
                technology, electronic scoring, and digital accreditation partner.
              </p>
            </div>
          </div>

          {/* Quick Links & Verification */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-200 tracking-wider uppercase">
              Security & Verification
            </h4>
            <ul className="space-y-2 pt-1 text-slate-400">
              <li>
                <Link href="/verify/demo-token" className="hover:text-sky-400 flex items-center gap-1.5 transition-colors">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Public QR Credential Verification</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-sky-400 transition-colors">
                  Authorized Administrator Portal
                </Link>
              </li>
              <li>
                <Link href="/api/health" className="hover:text-sky-400 transition-colors">
                  System Health & API Diagnostics
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-[11px] text-slate-400 gap-4">
          <p>
            © {new Date().getFullYear()} {BRANDING.championshipName}. All rights reserved.
          </p>
          <p className="text-slate-400">
            Independent Standalone Platform — Strictly decoupled from legacy management portals.
          </p>
        </div>
      </div>
    </footer>
  );
}
