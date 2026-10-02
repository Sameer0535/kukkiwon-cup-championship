// ==============================================================================
// OFFICIAL PUBLIC HEADER (Requirements 6, 25 & 29)
// Institutional Sports Header with Responsive Drawer & No Admin Links
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BRANDING } from "@/config/branding";
import { PUBLIC_NAV_ITEMS } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight, Shield } from "lucide-react";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  // Prevent background scrolling while mobile drawer is open (Requirement 25)
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Close drawer on path change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Top Institutional Bar */}
      <div className="w-full bg-[#050912] border-b border-slate-800/80 text-[11px] text-slate-300 py-1.5 px-4 sm:px-8">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="font-semibold text-slate-200">World Taekwondo Headquarters</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-amber-400/90 hidden sm:inline font-medium">India North Branch Sanctioned Event</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-300 font-medium">Tech Partner:</span>
            <span className="text-cyan-400 font-semibold tracking-wide">Kyorix Sports Technology</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090D16]/95 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* LEFT & CENTER: Kukkiwon Emblem + Championship Title */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white p-1 border border-slate-700/80 shadow-md group-hover:border-amber-500/50 transition-colors shrink-0">
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
                <span className="text-base sm:text-lg font-extrabold tracking-wider text-white uppercase font-sans">
                  KUKKIWON CUP
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {BRANDING.edition}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                India North Branch <span className="text-slate-600">×</span> <span className="text-cyan-400">Kyorix</span>
              </span>
            </div>
          </Link>

          {/* RIGHT: Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs uppercase font-bold tracking-wider transition-colors py-1 ${
                    isActive
                      ? "text-amber-400 border-b-2 border-amber-400"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* DESKTOP REGISTER CTA (Prominent) */}
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/register">
              <Button
                variant="gold"
                size="md"
                className="text-xs uppercase tracking-wider font-extrabold px-5 shadow-lg shadow-amber-500/20"
              >
                <span>Register Now</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          {/* MOBILE ACTIONS: Mobile Register Button + Hamburger */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link href="/register">
              <Button variant="gold" size="sm" className="text-[11px] font-bold uppercase tracking-wider px-3">
                Register
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER (Requirement 25) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out Drawer */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#0A0F1D] border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-white p-1">
                    <Image
                      src={BRANDING.kukkiwon.logoPath}
                      alt={BRANDING.kukkiwon.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block uppercase">
                      Kukkiwon Cup
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      India North Branch
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2">
                {PUBLIC_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider text-slate-200 hover:bg-slate-900 hover:text-amber-400 transition-colors"
                  >
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-4 pt-6 border-t border-slate-800">
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full"
              >
                <Button variant="gold" size="lg" className="w-full uppercase font-bold tracking-wider">
                  <span>Register Now</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <Shield className="h-3.5 w-3.5 text-amber-400" />
                <span>Official Championship Portal</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
