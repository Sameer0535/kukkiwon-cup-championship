// ==============================================================================
// DUAL BRANDING LOGO COMPONENT
// Kukkiwon North India x Kyorix Sport Technology Official Asset Representation
// ==============================================================================

import Image from "next/image";
import Link from "next/link";
import { BRANDING } from "@/config/branding";

interface BrandLogoProps {
  variant?: "combined" | "kukkiwon-only" | "kyorix-only" | "compact";
  className?: string;
}

export function BrandLogo({ variant = "combined", className = "" }: BrandLogoProps) {
  if (variant === "kukkiwon-only") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white p-1 shadow-md">
          <Image
            src={BRANDING.kukkiwon.logoPath}
            alt={BRANDING.kukkiwon.name}
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-wider text-slate-100 uppercase">
            {BRANDING.kukkiwon.name}
          </span>
          <span className="text-xs text-amber-400 font-medium">
            {BRANDING.kukkiwon.branch}
          </span>
        </div>
      </div>
    );
  }

  if (variant === "kyorix-only") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="relative h-10 w-28 overflow-hidden rounded">
          <Image
            src={BRANDING.kyorix.logoPath}
            alt={BRANDING.kyorix.name}
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Link href="/" className={`flex items-center gap-3 group ${className}`}>
        <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white p-1 border border-slate-700/60 shadow-sm">
          <Image
            src={BRANDING.kukkiwon.logoPath}
            alt={BRANDING.kukkiwon.name}
            fill
            className="object-contain"
          />
        </div>
        <div className="h-6 w-px bg-slate-800" />
        <div className="relative h-8 w-20 overflow-hidden">
          <Image
            src={BRANDING.kyorix.logoPath}
            alt={BRANDING.kyorix.name}
            fill
            className="object-contain"
          />
        </div>
      </Link>
    );
  }

  // Combined full header variant
  return (
    <Link href="/" className={`flex items-center gap-4 group ${className}`}>
      {/* Kukkiwon Emblem */}
      <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white p-1 border border-slate-700/60 shadow-lg group-hover:border-amber-500/50 transition-colors">
        <Image
          src={BRANDING.kukkiwon.logoPath}
          alt={BRANDING.kukkiwon.name}
          fill
          className="object-contain"
          priority
        />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">
            KUKKIWON CUP
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {BRANDING.edition}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>India North Branch</span>
          <span className="text-slate-600">×</span>
          <span className="text-cyan-400 font-semibold">Kyorix</span>
        </div>
      </div>

      {/* Kyorix Emblem */}
      <div className="hidden sm:flex items-center pl-3 border-l border-slate-800">
        <div className="relative h-9 w-28 overflow-hidden">
          <Image
            src={BRANDING.kyorix.logoPath}
            alt={BRANDING.kyorix.name}
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </Link>
  );
}
