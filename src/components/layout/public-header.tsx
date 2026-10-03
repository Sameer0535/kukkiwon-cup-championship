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
      <div className="w-full bg-[#081120] border-b border-blue-950/80 text-[10px] sm:text-[11px] text-slate-300 py-1.5 px-3 sm:px-8">
        <div className="container mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
            <span className="font-semibold text-slate-200 truncate">World Taekwondo Headquarters</span>
            <span className="text-slate-500 hidden md:inline">•</span>
            <span className="text-cyan-300/90 hidden md:inline font-medium">India North Branch Sanctioned Event</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-slate-400 font-medium">Tech Partner:</span>
            <span className="text-cyan-400 font-semibold tracking-wide">Kyorix Sports Technology</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="container mx-auto flex h-20 items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* LEFT & CENTER: Kukkiwon Emblem + Championship Title */}
          <Link href="/" className="flex items-center gap-3 sm:gap-3.5 group min-w-0">
            <div className="relative h-9 w-20 sm:h-10 sm:w-24 shrink-0 transition-transform group-hover:scale-105 flex items-center justify-center">
              <Image
                src={BRANDING.kukkiwon.logoPath}
                alt={BRANDING.kukkiwon.name}
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base lg:text-lg font-black tracking-wider text-slate-950 uppercase font-sans leading-tight truncate">
                KUKKIWON CUP 2026
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-blue-700 uppercase leading-tight truncate">
                KUKKIWON INDIA NORTH BRANCH <span className="text-slate-400 font-normal">×</span> KYORIX
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
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-600 hover:text-blue-600"
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* DESKTOP REGISTER CTA (Prominent) */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/my-registration"
              className="text-xs uppercase font-bold tracking-wider text-slate-600 hover:text-blue-600 transition-colors"
            >
              My Registrations
            </Link>
            <Link href="/register">
              <Button
                variant="gold"
                size="md"
                className="text-xs uppercase tracking-wider font-extrabold px-5 shadow-md shadow-blue-500/20"
              >
                <span>Register Now</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          {/* MOBILE ACTIONS: Mobile Register Button + Hamburger */}
          <div className="flex items-center gap-1.5 sm:hidden shrink-0">
            <Link href="/register">
              <Button variant="gold" size="sm" className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 h-8">
                Register
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1"
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out Drawer */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white border-l border-slate-200 p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-200 text-slate-900">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-8 w-16 shrink-0 flex items-center justify-center">
                    <Image
                      src={BRANDING.kukkiwon.logoPath}
                      alt={BRANDING.kukkiwon.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-950 block uppercase tracking-wider">
                      KUKKIWON CUP 2026
                    </span>
                    <span className="text-[10px] text-blue-700 font-bold block uppercase tracking-wider leading-tight">
                      KUKKIWON INDIA NORTH BRANCH × KYORIX
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
                  aria-label="Close navigation menu"
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
                    className="block px-3 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-3 pt-6 border-t border-slate-200">
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

              <Link
                href="/my-registration"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-xs uppercase font-bold text-slate-600 hover:text-blue-600"
              >
                My Registrations
              </Link>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                <span>Official Championship Portal</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
