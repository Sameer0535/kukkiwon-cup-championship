// ==============================================================================
// KUKKIWON CUP CHAMPIONSHIP - OFFICIAL PUBLIC HOMEPAGE (PHASE 2)
// Institutional Sports Federation Website — Kukkiwon North India x Kyorix
// ==============================================================================

import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BRANDING } from "@/config/branding";
import { SITE_CONFIG } from "@/config/site";
import {
  getPublicChampionshipData,
  getPublicChampionshipPackage,
} from "@/lib/cms";
import { CmsService } from "@/server/services/cms.service";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Clock,
  Shield,
  Award,
  ArrowRight,
  ExternalLink,
  Download,
  Eye,
  CheckCircle2,
  Cpu,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  Bell,
  FileDown,
} from "lucide-react";

export default async function HomePage() {
  const pkg = await getPublicChampionshipPackage("kukkiwon-cup-2026");
  const tournament = await getPublicChampionshipData("kukkiwon-cup-2026");
  const availability = await CmsService.getRegistrationAvailability(
    pkg?.championship.id || "champ-kukkiwon-2026"
  );
  const announcements = pkg?.announcements || [];
  const documents = pkg?.documents || [];
  const categories = pkg?.categories || [];
  const fees = pkg?.fees || [];

  return (
    <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans">
      <PublicHeader />

      {/* Live Announcement Banner from CMS */}
      {announcements.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/10 border-b border-amber-500/30 px-4 py-2.5">
          <div className="container mx-auto flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider shrink-0">
                Notice
              </span>
              <span className="font-semibold text-white truncate max-w-xl">
                {announcements[0].title}:
              </span>
              <span className="text-slate-300 hidden md:inline truncate max-w-lg">
                {announcements[0].shortDescription}
              </span>
            </div>
            <a href="#announcements" className="text-amber-400 hover:underline font-bold shrink-0 text-[11px]">
              View Bulletin ({announcements.length}) →
            </a>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* =========================================================================
            1. HERO SECTION (Requirements 7, 8 & 26)
            ========================================================================= */}
        <section className="relative overflow-hidden border-b border-slate-800/80 bg-[#090D16] py-14 sm:py-20 lg:py-28">
          {/* Subtle Institutional Architectural Grid & Gradient */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(212,175,55,0.12),transparent_70%)] pointer-events-none" />

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Official Heading, Metadata & CTAs */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Official Dual Logos in Hero */}
                <div className="flex items-center justify-center lg:justify-start gap-4 pb-2">
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-xl bg-white p-1 border border-slate-700 shadow-md shrink-0">
                    <Image
                      src={BRANDING.kukkiwon.logoPath}
                      alt={BRANDING.kukkiwon.name}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <span className="text-xl font-light text-slate-500">×</span>
                  <div className="relative h-12 w-28 sm:h-14 sm:w-36 overflow-hidden shrink-0">
                    <Image
                      src={BRANDING.kyorix.logoPath}
                      alt={BRANDING.kyorix.name}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>

                {/* Subtitle / Governing Banner & Live Registration Status */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
                    <Shield className="h-3.5 w-3.5 text-amber-400" />
                    <span>World Taekwondo Headquarters Sanctioned Championship</span>
                  </div>

                  {availability.status === "OPEN" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-300 shadow-sm shadow-emerald-500/10">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      REGISTRATION OPEN
                    </span>
                  )}
                  {availability.status === "COMING_SOON" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-300">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      REGISTRATION OPENS SOON
                    </span>
                  )}
                  {availability.status === "CLOSED" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/20 px-3.5 py-1 text-xs font-bold text-rose-300">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                      REGISTRATION CLOSED
                    </span>
                  )}
                </div>

                {/* Main Championship Title */}
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-white leading-tight font-sans">
                    Kukkiwon Cup <br className="hidden sm:inline" />
                    <span className="text-[#D4AF37]">Championship</span>
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 font-medium max-w-xl mx-auto lg:mx-0">
                    {tournament.subtitle}
                  </p>
                </div>

                {/* Championship Core Metadata Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-y border-slate-800/80 py-4 max-w-2xl mx-auto lg:mx-0 text-left">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Dates
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Venue
                      </span>
                      <span className="text-xs font-semibold text-white truncate block max-w-[180px]">
                        {tournament.venue}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Deadline
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {formatDate(tournament.registrationClose)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary & Secondary Action Buttons (Requirement 7) */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                  {availability.isOpen ? (
                    <Link href="/register" className="w-full sm:w-auto">
                      <Button
                        variant="gold"
                        size="lg"
                        className="w-full sm:w-auto text-xs uppercase tracking-wider font-extrabold px-8 py-3.5 shadow-xl shadow-amber-500/20"
                      >
                        <span>Register Now</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="lg"
                        disabled
                        className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold px-8 py-3.5 border-rose-700/50 bg-rose-950/30 text-rose-300 cursor-not-allowed"
                      >
                        <AlertCircle className="h-4 w-4 mr-2 text-rose-400" />
                        <span>Registration Closed</span>
                      </Button>
                    </div>
                  )}

                  <Link href="/championship/kukkiwon-cup-2026" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold px-7 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
                    >
                      <span>Explore Championship</span>
                    </Button>
                  </Link>
                </div>
              </div>


              {/* Right Column: Championship Visual Showcase */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl border-2 border-slate-800 bg-[#0C1222] p-5 shadow-2xl flex flex-col justify-between overflow-hidden group">
                  {/* Subtle Corner Accents */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-bl-full pointer-events-none" />
                  
                  {/* Top Seal */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-10 w-10 bg-white rounded-lg p-1">
                        <Image
                          src={BRANDING.kukkiwon.logoPath}
                          alt={BRANDING.kukkiwon.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-white uppercase block">
                          Official Bulletin
                        </span>
                        <span className="text-[10px] text-amber-400 font-semibold">
                          Kukkiwon Cup 2026
                        </span>
                      </div>
                    </div>
                    <Badge variant="gold">Accredited</Badge>
                  </div>

                  {/* Poster Showcase Body */}
                  <div className="text-center space-y-3 py-6 my-auto">
                    <Award className="h-16 w-16 mx-auto text-[#D4AF37] animate-pulse" />
                    <div className="space-y-1">
                      <span className="text-[11px] tracking-widest uppercase font-bold text-slate-400">
                        Official Championship
                      </span>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                        {tournament.name}
                      </h3>
                      <p className="text-xs text-slate-300 max-w-xs mx-auto">
                        New Delhi • {formatDate(tournament.startDate)}
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="inline-block text-[11px] font-mono px-3 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-400">
                        Powered by Kyorix Electronic Scoring
                      </span>
                    </div>
                  </div>

                  {/* Bottom Strip */}
                  <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Sanction: Kukkiwon India North</span>
                    <span className="text-emerald-400 font-medium">Entries Open</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. ABOUT THE CHAMPIONSHIP (Requirement 9)
            ========================================================================= */}
        <section className="py-16 sm:py-24 border-b border-slate-800/80 bg-[#060A13]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Official Sanction & Purpose
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                About The Championship
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-2">
                {tournament.description}
              </p>
            </div>

            {/* Core Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-6 rounded-xl border border-slate-800 bg-[#0A0F1D] space-y-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  Kukkiwon Accreditation
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Conducted under direct technical sanction of Kukkiwon India North Branch. Official certificates,
                  rank points, and Dan recognition recognized worldwide.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-800 bg-[#0A0F1D] space-y-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  Kyorix Sport Technology
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Featuring cutting-edge wireless electronic scoring systems, automated ring mats, and cryptographic
                  QR badges ensuring total transparency in scoring and credentials.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-800 bg-[#0A0F1D] space-y-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  National Competitor Pool
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Welcoming leading dojangs, state associations, collegiate athletes, and certified coaches across
                  Delhi, Haryana, Punjab, Uttar Pradesh, Himachal, and partner nations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. DUAL ORGANIZATION SECTION (Requirement 10)
            ========================================================================= */}
        <section className="py-16 sm:py-24 border-b border-slate-800/80 bg-[#090D16]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-12">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Collaboration & Leadership
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                Presented in Partnership
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                A strategic sporting union combining authentic martial arts governance with modern tournament technology.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Partner 1: Kukkiwon India North Branch */}
              <div className="p-8 rounded-2xl border border-slate-800 bg-[#0C1222] space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white p-2 border border-slate-700 shadow-md shrink-0">
                      <Image
                        src={BRANDING.kukkiwon.logoPath}
                        alt={BRANDING.kukkiwon.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                        {BRANDING.kukkiwon.name}
                      </h3>
                      <p className="text-xs text-[#D4AF37] font-semibold">
                        {BRANDING.kukkiwon.branch}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {BRANDING.kukkiwon.title}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pt-2">
                    Established under the authority of World Taekwondo Headquarters Kukkiwon (Seoul, South Korea).
                    The India North Branch is the official governing authority responsible for Dan promotions,
                    black belt certifications, instructor seminars, and sanctioned championships across Northern India.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sanctioning Body</span>
                  <a
                    href="https://kukkiwon-india.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#D4AF37] hover:underline"
                  >
                    <span>Visit Kukkiwon India</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Partner 2: Kyorix Sports Technology */}
              <div className="p-8 rounded-2xl border border-slate-800 bg-[#0C1222] space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-32 overflow-hidden rounded-xl bg-slate-950 p-2 border border-slate-800 shadow-md shrink-0">
                      <Image
                        src={BRANDING.kyorix.logoPath}
                        alt={BRANDING.kyorix.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                        {BRANDING.kyorix.name}
                      </h3>
                      <p className="text-xs text-[#00E5FF] font-semibold">
                        {BRANDING.kyorix.subtitle}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Sports Hardware & Accreditation Partner
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pt-2">
                    Pioneers in martial arts competition electronics, Kyorix Sports Technology engineers wireless
                    electronic chest and head protectors, multi-mat management software, real-time judge scoring consoles,
                    and secure cryptographic QR credentials ensuring flawless event execution.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Technology & Accreditation</span>
                  <span className="text-[#00E5FF] font-semibold">
                    Electronic Scoring Partner
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. CHAMPIONSHIP DETAILS & DISCIPLINES (Requirement 11)
            ========================================================================= */}
        <section id="information" className="py-16 sm:py-24 border-b border-slate-800/80 bg-[#060A13]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-12">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Tournament Structure
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                Championship Details & Disciplines
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Official competition divisions, entry fee schedule, and venue regulations.
              </p>
            </div>

            {/* Disciplines Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tournament.disciplines.map((d) => (
                <div
                  key={d.title}
                  className="p-6 rounded-xl border border-slate-800 bg-[#0A0F1D] space-y-3"
                >
                  <span className="text-[11px] font-mono text-[#D4AF37] block font-bold uppercase">
                    {d.category}
                  </span>
                  <h3 className="text-base font-bold text-white uppercase">{d.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{d.description}</p>
                </div>
              ))}
            </div>

            {/* Entry Fee & Rules Strip */}
            <div className="p-8 rounded-2xl border border-slate-800 bg-[#0C1222] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
              <div className="space-y-1 sm:border-r sm:border-slate-800 sm:pr-6">
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  Athlete Competitor Fee
                </span>
                <div className="text-2xl font-black text-white">
                  {formatCurrency(tournament.entryFeeAthlete, tournament.currency)}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Includes accreditation badge & official entry
                </span>
              </div>

              <div className="space-y-1 sm:border-r sm:border-slate-800 sm:pr-6">
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  Coach Accreditation Fee
                </span>
                <div className="text-2xl font-black text-white">
                  {formatCurrency(tournament.entryFeeCoach, tournament.currency)}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Includes coaching zone mat pass
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  Official Referees & Jury
                </span>
                <div className="text-2xl font-black text-emerald-400">
                  Complimentary
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Sanctioned board invitation required
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. OFFICIAL CHAMPIONSHIP POSTER SECTION (Requirement 12)
            ========================================================================= */}
        <section className="py-16 sm:py-24 border-b border-slate-800/80 bg-[#090D16]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Tournament Circulation
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                Official Championship Poster
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Official tournament announcement document issued by the Organizing Committee.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Poster Container with Aspect Ratio */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl border-2 border-slate-800 bg-[#060A13] p-6 shadow-2xl flex flex-col justify-between text-center overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-[10px] uppercase font-bold text-amber-400">
                      Official Tournament Notice
                    </span>
                    <span className="text-[10px] text-slate-500">Edition 2026</span>
                  </div>

                  <div className="space-y-3 my-auto py-6">
                    <Award className="h-16 w-16 mx-auto text-[#D4AF37]" />
                    <h3 className="text-xl font-extrabold text-white uppercase tracking-tight">
                      Kukkiwon Cup Championship
                    </h3>
                    <p className="text-xs text-amber-300 font-medium">
                      India North Branch Sanctioned
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Indira Gandhi Indoor Stadium, New Delhi
                      <br />
                      {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
                    Kukkiwon India North × Kyorix Sports Technology
                  </div>
                </div>
              </div>

              {/* Poster Information & Actions */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white uppercase">
                    Tournament Poster & Technical Outline
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The official championship poster and tournament circular contain the sanctioned rules,
                    weight categories, age divisions, protest procedures, and credential collection schedules.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Official high-resolution print aspect ratio</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Authorized signatures of governing committee</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Editable via Admin CMS in subsequent editions</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                  <Link href="/championship/kukkiwon-cup-2026">
                    <Button variant="secondary" size="md" className="text-xs uppercase font-bold">
                      <Eye className="h-4 w-4 mr-1.5" />
                      <span>View Tournament Details</span>
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="gold" size="md" className="text-xs uppercase font-extrabold">
                      <span>Register Competitor</span>
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5B. OFFICIAL ANNOUNCEMENTS & BULLETINS (Phase 9 Requirement 11)
            ========================================================================= */}
        <section id="announcements" className="py-16 sm:py-24 border-b border-slate-800/80 bg-[#060A13]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Official Communications
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                Latest Announcements
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Official notices, equipment guidelines, and technical briefings issued by the organizing committee.
              </p>
            </div>

            {announcements.length === 0 ? (
              <div className="p-8 rounded-xl border border-slate-800 bg-[#0C1222] text-center text-slate-400 text-sm">
                No active announcements currently published. Check back soon for official updates.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-6 rounded-2xl border border-slate-800 bg-[#0C1222] space-y-4 flex flex-col justify-between hover:border-amber-500/40 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                          <Bell className="h-3 w-3" />
                          Official Notice
                        </span>
                        <span className="text-slate-400 font-mono">
                          {new Date(ann.publishDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white leading-snug">
                        {ann.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {ann.shortDescription}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3">
                        {ann.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            5C. PUBLIC CHAMPIONSHIP DOCUMENTS (Phase 9 Requirement 12)
            ========================================================================= */}
        <section id="documents" className="py-16 sm:py-24 border-b border-slate-800/80 bg-[#090D16]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Official Publications
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                Public Championship Documents
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Download official event prospectuses, category technical guidelines, and participation guidelines.
              </p>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 rounded-xl border border-slate-800 bg-[#0C1222] text-center text-slate-400 text-sm">
                No public documents uploaded at this time.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 rounded-2xl border border-slate-800 bg-[#0C1222] space-y-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-semibold">
                          {doc.documentType}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {doc.fileSizeFormatted}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {doc.description}
                      </p>
                    </div>

                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors"
                    >
                      <FileDown className="h-3.5 w-3.5 text-amber-400" />
                      <span>Download Document</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            5D. IMPORTANT DATES TIMELINE (Phase 9 Requirement 10)
            ========================================================================= */}
        <section id="dates" className="py-16 sm:py-24 border-b border-slate-800/80 bg-[#060A13]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Key Milestones
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                Important Championship Dates
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Crucial deadlines for athlete submissions, late registrations, and tournament start dates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-slate-800 bg-[#0C1222] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  Registration Opens
                </span>
                <span className="text-sm font-bold text-white block">
                  {formatDate(tournament.registrationOpen)}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Digital entries portal goes live
                </span>
              </div>

              <div className="p-5 rounded-xl border border-slate-800 bg-[#0C1222] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
                  Registration Closes
                </span>
                <span className="text-sm font-bold text-white block">
                  {formatDate(tournament.registrationClose)}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Standard entry deadline
                </span>
              </div>

              <div className="p-5 rounded-xl border border-slate-800 bg-[#0C1222] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">
                  Late Registration
                </span>
                <span className="text-sm font-bold text-white block">
                  {tournament.startDate ? formatDate(tournament.startDate) : "N/A"}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Late surcharge applies
                </span>
              </div>

              <div className="p-5 rounded-xl border border-slate-800 bg-[#0C1222] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                  Championship Dates
                </span>
                <span className="text-sm font-bold text-white block">
                  {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {tournament.venue}, {tournament.city}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. REGISTRATION CALL TO ACTION (Requirement 13)
            ========================================================================= */}
        <section className="py-16 sm:py-24 border-b border-slate-800/80 bg-gradient-to-b from-[#090D16] to-[#04070D]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1 text-xs font-semibold text-amber-300">
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              <span>Official Entries Open • National Participation</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-sans">
                Ready to Take Part?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                Register for the Kukkiwon Cup Championship. Compete under official Kukkiwon sanction
                and secure your certified tournament accreditation badge.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              {availability.isOpen ? (
                <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full sm:w-auto text-xs uppercase tracking-wider font-black px-10 py-4 text-slate-950 shadow-2xl shadow-amber-500/25"
                  >
                    <span>Register Now</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <div className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    disabled
                    className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold px-10 py-4 border-rose-700/50 bg-rose-950/30 text-rose-300 cursor-not-allowed"
                  >
                    <AlertCircle className="h-4 w-4 mr-2 text-rose-400" />
                    <span>Registration Closed</span>
                  </Button>
                </div>
              )}
              <Link href="/contact" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold px-8 border-slate-700 text-slate-300"
                >
                  <span>Contact Secretariat</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            7. CONTACT & SECRETARIAT SECTION (Requirement 15)
            ========================================================================= */}
        <section className="py-16 sm:py-24 bg-[#060A13]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Tournament Secretariat
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                Official Inquiries & Support
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Official communication channels for participating academies, coaches, and delegations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-6 rounded-xl border border-slate-800 bg-[#0A0F1D] space-y-2">
                <Mail className="h-6 w-6 mx-auto text-[#D4AF37]" />
                <h4 className="text-xs uppercase font-bold text-white tracking-wider">
                  Email Secretariat
                </h4>
                <a
                  href={`mailto:${tournament.contactEmail}`}
                  className="text-xs font-medium text-slate-300 hover:text-white transition-colors block"
                >
                  {tournament.contactEmail}
                </a>
              </div>

              <div className="p-6 rounded-xl border border-slate-800 bg-[#0A0F1D] space-y-2">
                <Phone className="h-6 w-6 mx-auto text-[#00E5FF]" />
                <h4 className="text-xs uppercase font-bold text-white tracking-wider">
                  Helpline
                </h4>
                <span className="text-xs font-medium text-slate-300 block">
                  {tournament.contactPhone}
                </span>
              </div>

              <div className="p-6 rounded-xl border border-slate-800 bg-[#0A0F1D] space-y-2">
                <MapPin className="h-6 w-6 mx-auto text-emerald-400" />
                <h4 className="text-xs uppercase font-bold text-white tracking-wider">
                  Competition Stadium
                </h4>
                <span className="text-xs font-medium text-slate-300 block">
                  {tournament.contactAddress}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
