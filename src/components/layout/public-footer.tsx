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
    <footer className="w-full border-t border-slate-800 bg-[#070E1B] text-slate-300">
      {/* Upper Footer Block */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Kyorix Sports Technology Organization & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-16 shrink-0 flex items-center justify-center">
                <Image
                  src={BRANDING.kyorix.logoPath}
                  alt={BRANDING.kyorix.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-black text-white uppercase tracking-wider">
                KYORIX SPORTS TECHNOLOGY
              </span>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                Official Platform & Scoring Partner
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Official tournament registration, digital accreditation, and electronic scoring platform
              developed and operated by Kyorix Sports Technology.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-blue-500 pl-2">
              Championship Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-cyan-400 transition-colors">
                  About the Championship
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-cyan-400 font-semibold transition-colors">
                  Register for Tournament
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cyan-400 transition-colors">
                  Official Secretariat & Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Regulatory */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-cyan-400 pl-2">
              Legal & Regulations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="hover:text-cyan-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-cyan-400 transition-colors">
                  Privacy & Data Protection Policy
                </Link>
              </li>
              <li>
                <Link href="/about#eligibility" className="hover:text-cyan-400 transition-colors">
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

          {/* Column 4: Kyorix Company Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-blue-400 pl-2">
              Kyorix Company Contact
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">
                  Kyorix Sports Technology Private Limited, New Delhi, India
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-cyan-400 shrink-0" />
                <a
                  href="mailto:contact@kyorix.com"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  contact@kyorix.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="text-slate-300">+91 98765 43210</span>
              </div>
              <div className="pt-2">
                <a
                  href="https://kyorix.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                >
                  <span>Kyorix Sports Technology Official Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Copyright Bar */}
      <div className="border-t border-slate-800 bg-[#050A14] py-6 text-xs">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-center sm:text-left">
            © {new Date().getFullYear()} Kyorix Sports Technology. All rights reserved.
          </p>
          <p className="text-slate-500 text-[11px] text-center sm:text-right">
            Official Championship Management Platform • Powered by Kyorix Sports Technology
          </p>
        </div>
      </div>
    </footer>
  );
}
