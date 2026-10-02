// ==============================================================================
// OFFICIAL PUBLIC FOOTER (Requirements 16 & 29)
// Institutional Sports Footer — Completely Removed Public Admin Links
// ==============================================================================

import Link from "next/link";
import Image from "next/image";
import { BRANDING } from "@/config/branding";
import { SITE_CONFIG } from "@/config/site";
import { MapPin, Mail, Phone, Shield, ExternalLink } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-slate-800 bg-[#060A13] text-slate-400">
      {/* Upper Footer Block */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Organization & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white p-1 border border-slate-700 shadow-md shrink-0">
                <Image
                  src={BRANDING.kukkiwon.logoPath}
                  alt={BRANDING.kukkiwon.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-white uppercase tracking-wider">
                  KUKKIWON CUP
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                  India North Branch
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Official tournament registration and digital accreditation platform sanctioned by
              the World Taekwondo Headquarters Kukkiwon India North Branch, powered by Kyorix Sports Technology.
            </p>

            <div className="pt-2">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">
                Technology Partner
              </span>
              <div className="relative h-8 w-28 overflow-hidden rounded">
                <Image
                  src={BRANDING.kyorix.logoPath}
                  alt={BRANDING.kyorix.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-amber-400 pl-2">
              Championship Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About the Championship
                </Link>
              </li>
              <li>
                <Link href="/championship/kukkiwon-cup-2026" className="hover:text-white transition-colors">
                  Tournament Schedule & Rules
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-amber-400 font-semibold transition-colors">
                  Register for Tournament
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Official Secretariat & Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Regulatory */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-sky-400 pl-2">
              Legal & Regulations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy & Data Protection Policy
                </Link>
              </li>
              <li>
                <Link href="/championship/kukkiwon-cup-2026#rules" className="hover:text-white transition-colors">
                  Competition Rules & Regulations
                </Link>
              </li>
              <li>
                <Link href="/about#eligibility" className="hover:text-white transition-colors">
                  Dan Certification Requirements
                </Link>
              </li>
              <li>
                <Link href="/verify/demo-token" className="hover:text-emerald-400 font-medium transition-colors flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Verify Credential Badge</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Official Secretariat Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-emerald-400 pl-2">
              Secretariat Contact
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">
                  {SITE_CONFIG.contact.address}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  {SITE_CONFIG.contact.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-300">{SITE_CONFIG.contact.phone}</span>
              </div>
              <div className="pt-2">
                <a
                  href={SITE_CONFIG.links.kukkiwonOfficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
                >
                  <span>Kukkiwon World HQ (Korea)</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Copyright Bar */}
      <div className="border-t border-slate-800/80 bg-[#04070D] py-6 text-xs">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-center sm:text-left">
            © {new Date().getFullYear()} {BRANDING.championshipName}. All rights reserved.
          </p>
          <p className="text-slate-500 text-[11px] text-center sm:text-right">
            Official Championship Platform • Sanctioned by Kukkiwon India North Branch & Kyorix Sports Technology
          </p>
        </div>
      </div>
    </footer>
  );
}
