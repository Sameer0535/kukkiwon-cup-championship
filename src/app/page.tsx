// ==============================================================================
// KUKKIWON CUP CHAMPIONSHIP - OFFICIAL PUBLIC HOMEPAGE
// Presented by Kukkiwon India North Branch x Kyorix Sports Technology
// Modern White & Blue Corporate Sports Federation Architecture
// ==============================================================================

import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BRANDING } from "@/config/branding";
import {
  getPublicChampionshipData,
  getPublicChampionshipPackage,
  getPublicImportantDates,
} from "@/lib/cms";
import { CmsService } from "@/server/services/cms.service";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Clock,
  Shield,
  Award,
  ArrowRight,
  ExternalLink,
  Eye,
  CheckCircle2,
  Cpu,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";

export default async function HomePage() {
  const pkg = await getPublicChampionshipPackage("kukkiwon-cup-2026");
  const tournament = await getPublicChampionshipData("kukkiwon-cup-2026");
  const availability = await CmsService.getRegistrationAvailability(
    pkg?.championship.id || "champ-kukkiwon-2026"
  );
  const champId = pkg?.championship.id || "champ-kukkiwon-2026";
  const dynamicDates = await getPublicImportantDates(champId);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* =========================================================================
            1. HERO SECTION (White & Blue Tech Palette)
            ========================================================================= */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50/80 via-white to-white py-14 sm:py-20 lg:py-24">
          {/* Subtle High-Tech Blueprint Grid & Radial Glow */}
          <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#0066ff_1px,transparent_1px),linear-gradient(to_bottom,#0066ff_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(0,102,255,0.08),transparent_70%)] pointer-events-none" />

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Official Heading, Metadata & CTAs */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Official Dual Logos in Hero */}
                <div className="flex items-center justify-center lg:justify-start gap-4 pb-2">
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-xl bg-white p-1.5 border border-slate-200 shadow-sm shrink-0">
                    <Image
                      src={BRANDING.kukkiwon.logoPath}
                      alt={BRANDING.kukkiwon.name}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <span className="text-xl font-light text-slate-300">×</span>
                  <div className="relative h-14 w-32 sm:h-16 sm:w-40 overflow-hidden rounded-xl bg-white p-1 border border-slate-200 shadow-sm shrink-0">
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
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
                    <Shield className="h-3.5 w-3.5 text-blue-600" />
                    <span>World Taekwondo Headquarters Sanctioned Championship</span>
                  </div>

                  {availability.status === "OPEN" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      REGISTRATION OPEN
                    </span>
                  )}
                  {availability.status === "COMING_SOON" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-700">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      REGISTRATION OPENS SOON
                    </span>
                  )}
                  {availability.status === "CLOSED" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                      REGISTRATION CLOSED
                    </span>
                  )}
                </div>

                {/* Main Championship Title */}
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-slate-950 leading-tight font-sans">
                    Kukkiwon Cup <br className="hidden sm:inline" />
                    <span className="text-blue-600">Championship</span>
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto lg:mx-0">
                    {tournament.subtitle}
                  </p>
                </div>

                {/* Championship Core Metadata Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-y border-slate-200 py-4 max-w-2xl mx-auto lg:mx-0 text-left bg-slate-50/60 rounded-xl px-4">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Dates
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Venue
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate block max-w-[180px]">
                        {tournament.venue}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Deadline
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {formatDate(tournament.registrationClose)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary & Secondary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                  {availability.isOpen ? (
                    <Link href="/register" className="w-full sm:w-auto">
                      <Button
                        variant="gold"
                        size="lg"
                        className="w-full sm:w-auto text-xs uppercase tracking-wider font-extrabold px-8 py-3.5 shadow-lg shadow-blue-500/20"
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
                        className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold px-8 py-3.5 border-rose-300 bg-rose-50 text-rose-700 cursor-not-allowed"
                      >
                        <AlertCircle className="h-4 w-4 mr-2 text-rose-500" />
                        <span>Registration Closed</span>
                      </Button>
                    </div>
                  )}

                  <Link href="/contact" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold px-7 border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                    >
                      <span>Contact Secretariat</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: Championship Visual Showcase Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-xl flex flex-col justify-between overflow-hidden group">
                  {/* Subtle Corner Accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />

                  {/* Top Seal */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-10 w-10 bg-white rounded-lg p-1 border border-slate-200 shadow-2xs">
                        <Image
                          src={BRANDING.kukkiwon.logoPath}
                          alt={BRANDING.kukkiwon.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-900 uppercase block">
                          Official Bulletin
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold">
                          Kukkiwon Cup 2026
                        </span>
                      </div>
                    </div>
                    <Badge variant="gold">Accredited</Badge>
                  </div>

                  {/* Poster Showcase Body */}
                  <div className="text-center space-y-3 py-6 my-auto">
                    <Award className="h-16 w-16 mx-auto text-blue-600 animate-pulse" />
                    <div className="space-y-1">
                      <span className="text-[11px] tracking-widest uppercase font-bold text-slate-400">
                        Official Championship
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                        KUKKIWON CUP CHAMPIONSHIP
                      </h3>
                      <div className="text-xl font-bold text-blue-600">
                        2026
                      </div>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        New Delhi • {formatDate(tournament.startDate)}
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="inline-block text-[11px] font-mono px-3 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                        Powered by Kyorix Electronic Scoring
                      </span>
                    </div>
                  </div>

                  {/* Bottom Strip */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Sanction: Kukkiwon India North</span>
                    <span className="text-emerald-600 font-semibold">Entries Open</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. DUAL ORGANIZATION SECTION (White & Blue Partnership)
            ========================================================================= */}
        <section className="py-16 sm:py-20 border-b border-slate-200 bg-slate-50/70">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-12">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Collaboration & Leadership
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-950">
                Presented in Partnership
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                A strategic sporting union combining authentic martial arts governance with modern tournament technology.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Partner 1: Kukkiwon India North Branch */}
              <div className="p-8 rounded-2xl border border-slate-200 bg-white space-y-5 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white p-2 border border-slate-200 shadow-sm shrink-0">
                      <Image
                        src={BRANDING.kukkiwon.logoPath}
                        alt={BRANDING.kukkiwon.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                        {BRANDING.kukkiwon.name}
                      </h3>
                      <p className="text-xs text-blue-600 font-bold">
                        {BRANDING.kukkiwon.branch}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {BRANDING.kukkiwon.title}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-2">
                    Established under the authority of World Taekwondo Headquarters Kukkiwon (Seoul, South Korea).
                    The India North Branch is the official governing authority responsible for Dan promotions,
                    black belt certifications, instructor seminars, and sanctioned championships across Northern India.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Sanctioning Body</span>
                  <a
                    href="https://kukkiwon-india.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                  >
                    <span>Visit Kukkiwon India</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Partner 2: Kyorix Sports Technology */}
              <div className="p-8 rounded-2xl border border-blue-200 bg-white space-y-5 flex flex-col justify-between shadow-sm shadow-blue-500/5">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-32 overflow-hidden rounded-xl bg-white p-1 border border-slate-200 shadow-sm shrink-0">
                      <Image
                        src={BRANDING.kyorix.logoPath}
                        alt={BRANDING.kyorix.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                        {BRANDING.kyorix.name}
                      </h3>
                      <p className="text-xs text-cyan-600 font-bold">
                        {BRANDING.kyorix.subtitle}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Sports Hardware & Accreditation Partner
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-2">
                    Pioneers in martial arts competition electronics, Kyorix Sports Technology engineers wireless
                    electronic chest and head protectors, multi-mat management software, real-time judge scoring consoles,
                    and secure cryptographic QR credentials ensuring flawless event execution.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Technology & Accreditation</span>
                  <span className="text-blue-600 font-bold">
                    Electronic Scoring Partner
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. CHAMPIONSHIP DETAILS & DISCIPLINES (Fees fully removed as requested)
            ========================================================================= */}
        <section id="information" className="py-16 sm:py-20 border-b border-slate-200 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-12">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Tournament Structure
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-950">
                Championship Details & Disciplines
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Official competition divisions, category weight brackets, and venue regulations.
              </p>
            </div>

            {/* Disciplines Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tournament.disciplines.map((d) => (
                <div
                  key={d.title}
                  className="p-6 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <span className="text-[11px] font-mono text-blue-600 block font-bold uppercase">
                    {d.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 uppercase">{d.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{d.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. OFFICIAL CHAMPIONSHIP POSTER SECTION
            ========================================================================= */}
        <section className="py-16 sm:py-20 border-b border-slate-200 bg-slate-50/70">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Tournament Circulation
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-950">
                Official Championship Poster
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Official tournament announcement document issued by the Organizing Committee.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Poster Container with Aspect Ratio */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-xl flex flex-col justify-between text-center overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-[10px] uppercase font-bold text-blue-600">
                      Official Tournament Notice
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">Edition 2026</span>
                  </div>

                  <div className="space-y-3 my-auto py-6">
                    <Award className="h-16 w-16 mx-auto text-blue-600" />
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                      Kukkiwon Cup Championship
                    </h3>
                    <p className="text-xs text-blue-600 font-bold">
                      India North Branch Sanctioned
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Indira Gandhi Indoor Stadium, New Delhi
                      <br />
                      {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                    Kukkiwon India North × Kyorix Sports Technology
                  </div>
                </div>
              </div>

              {/* Poster Information & Actions */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-900 uppercase">
                    Tournament Poster & Technical Outline
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The official championship poster and tournament circular contain the sanctioned rules,
                    weight categories, age divisions, protest procedures, and credential collection schedules.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Official high-resolution print aspect ratio</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Authorized signatures of governing committee</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Editable via Admin CMS in subsequent editions</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                  <Link href="/contact">
                    <Button variant="outline" size="md" className="text-xs uppercase font-bold border-slate-300 bg-white hover:bg-slate-50 text-slate-700">
                      <Eye className="h-4 w-4 mr-1.5" />
                      <span>Contact Secretariat</span>
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="gold" size="md" className="text-xs uppercase font-extrabold shadow-md shadow-blue-500/20">
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
            5. IMPORTANT DATES TIMELINE
            ========================================================================= */}
        <section id="dates" className="py-16 sm:py-20 border-b border-slate-200 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Key Milestones
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-950">
                Important Championship Dates
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Crucial deadlines for athlete submissions, late registrations, and tournament start dates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dynamicDates && dynamicDates.length > 0 ? (
                dynamicDates.map((d) => (
                  <div key={d.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5 hover:border-blue-400 hover:shadow-xs transition-colors">
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">
                      {d.title}
                    </span>
                    <span className="text-sm font-bold text-slate-900 block">
                      {formatDate(d.date)}
                    </span>
                    <span className="text-[11px] text-slate-500 block line-clamp-2">
                      {d.description || "Official tournament milestone"}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">
                      Registration Opens
                    </span>
                    <span className="text-sm font-bold text-slate-900 block">
                      {formatDate(tournament.registrationOpen)}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Digital entries portal goes live
                    </span>
                  </div>

                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider block">
                      Registration Closes
                    </span>
                    <span className="text-sm font-bold text-slate-900 block">
                      {formatDate(tournament.registrationClose)}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Standard entry deadline
                    </span>
                  </div>

                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">
                      Late Registration
                    </span>
                    <span className="text-sm font-bold text-slate-900 block">
                      {tournament.startDate ? formatDate(tournament.startDate) : "N/A"}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Late surcharge applies
                    </span>
                  </div>

                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">
                      Championship Dates
                    </span>
                    <span className="text-sm font-bold text-slate-900 block">
                      {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {tournament.venue}, {tournament.city}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. REGISTRATION CALL TO ACTION
            ========================================================================= */}
        <section className="py-16 sm:py-24 border-b border-slate-200 bg-gradient-to-b from-blue-50/70 via-white to-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-700">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              <span>Official Entries Open • National Participation</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-950 font-sans">
                Ready to Take Part?
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
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
                    className="w-full sm:w-auto text-xs uppercase tracking-wider font-black px-10 py-4 shadow-xl shadow-blue-500/25"
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
                    className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold px-10 py-4 border-rose-300 bg-rose-50 text-rose-700 cursor-not-allowed"
                  >
                    <AlertCircle className="h-4 w-4 mr-2 text-rose-500" />
                    <span>Registration Closed</span>
                  </Button>
                </div>
              )}
              <Link href="/contact" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold px-8 border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                >
                  <span>Contact Secretariat</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            7. CONTACT & SECRETARIAT SECTION
            ========================================================================= */}
        <section className="py-16 sm:py-20 bg-slate-50/80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Tournament Secretariat
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-950">
                Official Inquiries & Support
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Official communication channels for participating academies, coaches, and delegations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <Mail className="h-6 w-6 mx-auto text-blue-600" />
                <h4 className="text-xs uppercase font-bold text-slate-900 tracking-wider">
                  Email Secretariat
                </h4>
                <a
                  href={`mailto:${tournament.contactEmail}`}
                  className="text-xs font-semibold text-blue-600 hover:underline block"
                >
                  {tournament.contactEmail}
                </a>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <Phone className="h-6 w-6 mx-auto text-cyan-600" />
                <h4 className="text-xs uppercase font-bold text-slate-900 tracking-wider">
                  Helpline
                </h4>
                <span className="text-xs font-semibold text-slate-700 block">
                  {tournament.contactPhone}
                </span>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <MapPin className="h-6 w-6 mx-auto text-emerald-600" />
                <h4 className="text-xs uppercase font-bold text-slate-900 tracking-wider">
                  Competition Stadium
                </h4>
                <span className="text-xs font-semibold text-slate-700 block">
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
