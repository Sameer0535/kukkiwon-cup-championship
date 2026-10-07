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
import { SITE_CONFIG } from "@/config/site";
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
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50/70 via-white to-white py-14 sm:py-20 lg:py-24">
          {/* Dynamic Background Image (Editable via Admin Portal) */}
          {tournament.bannerUrl ? (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <Image
                src={tournament.bannerUrl}
                alt="Championship Hero Backdrop"
                fill
                className="object-cover object-center opacity-25"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/85 to-white" />
            </div>
          ) : (
            <>
              {/* Subtle High-Tech Blueprint Grid & Radial Glow fallback */}
              <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#0066ff_1px,transparent_1px),linear-gradient(to_bottom,#0066ff_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(0,102,255,0.08),transparent_70%)] pointer-events-none" />
            </>
          )}

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-6">
            {/* Grand Dual Logos in Hero (Full official branding, transparent background, increased prominent size) */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 pb-2">
              <div className="relative h-24 w-36 sm:h-32 sm:w-48 md:h-36 md:w-52 shrink-0 flex items-center justify-center transition-transform hover:scale-105">
                <Image
                  src={BRANDING.kukkiwon.logoPath}
                  alt={BRANDING.kukkiwon.name}
                  fill
                  className="object-contain drop-shadow-sm"
                  priority
                />
              </div>
              <span className="text-3xl sm:text-4xl font-extralight text-slate-300 select-none">×</span>
              <div className="relative h-24 w-32 sm:h-32 sm:w-44 md:h-36 md:w-48 shrink-0 flex items-center justify-center transition-transform hover:scale-105">
                <Image
                  src={BRANDING.kyorix.logoPath}
                  alt={BRANDING.kyorix.name}
                  fill
                  className="object-contain drop-shadow-sm"
                  priority
                />
              </div>
            </div>

            {/* Main Championship Title */}
            <div className="space-y-2">
              {tournament.heroTagline && (
                <div className="inline-block px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
                  {tournament.heroTagline}
                </div>
              )}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-slate-950 leading-tight font-sans">
                {tournament.heroHeadline || tournament.name || "KUKKIWON CUP CHAMPIONSHIP 2026"}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto">
                {tournament.subtitle}
              </p>
            </div>

            {/* Championship Core Metadata Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-y border-slate-200 py-4 max-w-2xl mx-auto text-left bg-slate-50/60 rounded-xl px-4">
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              {availability.isOpen ? (
                <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full sm:w-auto text-xs uppercase tracking-wider font-extrabold px-8 py-3.5 shadow-lg shadow-blue-500/20"
                  >
                    <span>{tournament.heroPrimaryCtaText || "Register Now"}</span>
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
                  <span>{tournament.heroSecondaryCtaText || "Contact Secretariat"}</span>
                </Button>
              </Link>
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
                {tournament.partnershipTagline || "Collaboration & Leadership"}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-950">
                {tournament.partnershipHeading || "Presented in Partnership"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                {tournament.partnershipDescription || "A strategic sporting union combining authentic martial arts governance with modern tournament technology."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Partner 1: Kukkiwon India North Branch */}
              <div className="p-8 rounded-2xl border border-slate-200 bg-white space-y-5 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-24 shrink-0 flex items-center justify-center">
                      <Image
                        src={BRANDING.kukkiwon.logoPath}
                        alt={BRANDING.kukkiwon.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                        {tournament.kukkiwonTitle || BRANDING.kukkiwon.name}
                      </h3>
                      <p className="text-xs text-blue-600 font-bold">
                        {tournament.kukkiwonBranch || BRANDING.kukkiwon.branch}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {tournament.kukkiwonRole || BRANDING.kukkiwon.title}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-2">
                    {tournament.kukkiwonDescription || "Established under the authority of World Taekwondo Headquarters Kukkiwon (Seoul, South Korea). The India North Branch is the official governing authority responsible for Dan promotions, black belt certifications, instructor seminars, and sanctioned championships across Northern India."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{tournament.kukkiwonBadge || "Sanctioning Body"}</span>
                  <a
                    href={tournament.kukkiwonUrl || "https://kukkiwon-india.org/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                  >
                    <span>{tournament.kukkiwonUrlText || "Visit Kukkiwon India"}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Partner 2: Kyorix Sports Technology */}
              <div className="p-8 rounded-2xl border border-blue-200 bg-white space-y-5 flex flex-col justify-between shadow-sm shadow-blue-500/5">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-22 shrink-0 flex items-center justify-center">
                      <Image
                        src={BRANDING.kyorix.logoPath}
                        alt={BRANDING.kyorix.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                        {tournament.kyorixTitle || BRANDING.kyorix.name}
                      </h3>
                      <p className="text-xs text-cyan-600 font-bold">
                        {tournament.kyorixSubtitle || BRANDING.kyorix.subtitle}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {tournament.kyorixRole || "Sports Hardware & Accreditation Partner"}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-2">
                    {tournament.kyorixDescription || "Pioneers in martial arts competition electronics, Kyorix Sports Technology engineers wireless electronic chest and head protectors, multi-mat management software, real-time judge scoring consoles, and secure cryptographic accreditation ensuring flawless event execution."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Technology & Accreditation</span>
                  <span className="text-blue-600 font-bold">
                    {tournament.kyorixBadge || "Electronic Scoring Partner"}
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
                {tournament.disciplinesTagline || "Tournament Structure"}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-950">
                {tournament.disciplinesHeading || "Championship Details & Disciplines"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                {tournament.disciplinesDescription || "Official competition divisions, category weight brackets, and venue regulations."}
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
            5. IMPORTANT DATES TIMELINE
            ========================================================================= */}
        <section id="dates" className="py-16 sm:py-20 border-b border-slate-200 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                {tournament.datesTagline || "Key Milestones"}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-950">
                {tournament.datesHeading || "Important Championship Dates"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                {tournament.datesDescription || "Crucial deadlines for athlete submissions, late registrations, and tournament start dates."}
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

            <div className="space-y-3">
              {tournament.ctaTagline && (
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block">
                  {tournament.ctaTagline}
                </span>
              )}
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-950 font-sans">
                {tournament.ctaTitle || "Ready to Take Part?"}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                {tournament.ctaDescription || "Register for the Kukkiwon Cup Championship. Compete under official Kukkiwon sanction and secure your certified tournament accreditation badge."}
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
                    <span>{tournament.ctaPrimaryBtnText || "Register Now"}</span>
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
                  <span>{tournament.ctaSecondaryBtnText || "Contact Secretariat"}</span>
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
                {tournament.contactTagline || "Tournament Secretariat"}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-950">
                {tournament.contactHeading || "Official Inquiries & Support"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                {tournament.contactDescription || "Official communication channels for participating academies, coaches, and delegations."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <Mail className="h-6 w-6 mx-auto text-blue-600" />
                <h4 className="text-xs uppercase font-bold text-slate-900 tracking-wider">
                  Email Secretariat
                </h4>
                <a
                  href={`mailto:${tournament.contactEmail || SITE_CONFIG.contact.email}`}
                  className="text-xs font-semibold text-blue-600 hover:underline block"
                >
                  {tournament.contactEmail || SITE_CONFIG.contact.email}
                </a>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <Phone className="h-6 w-6 mx-auto text-cyan-600" />
                <h4 className="text-xs uppercase font-bold text-slate-900 tracking-wider">
                  Helpline
                </h4>
                <span className="text-xs font-semibold text-slate-700 block">
                  {tournament.contactPhone || SITE_CONFIG.contact.phone}
                </span>
                {tournament.contactPhoneHours && (
                  <span className="text-[11px] text-slate-500 block">
                    {tournament.contactPhoneHours}
                  </span>
                )}
              </div>

              <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <MapPin className="h-6 w-6 mx-auto text-emerald-600" />
                <h4 className="text-xs uppercase font-bold text-slate-900 tracking-wider">
                  Company Secretariat
                </h4>
                <span className="text-xs font-semibold text-slate-700 block">
                  {tournament.contactAddress || SITE_CONFIG.contact.address}
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
