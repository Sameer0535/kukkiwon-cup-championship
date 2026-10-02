// ==============================================================================
// CHAMPIONSHIP REGISTRATION ENTRY PORTAL (Phase 3 Requirement 1)
// Official Kukkiwon North India x Kyorix Sports Technology Enrollment Gate
// ==============================================================================

import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Award,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function RegisterEntryPage() {
  const selectionCards = [
    {
      id: "athlete",
      title: "ATHLETE",
      category: "Individual Competitor",
      badge: "Kyorugi & Poomsae",
      badgeVariant: "gold" as const,
      icon: Award,
      description:
        "For individual competitors participating in Kyorugi, Poomsae, or other available championship disciplines.",
      buttonText: "REGISTER AS ATHLETE",
      href: "/register/athlete",
      accentBorder: "hover:border-[#D4AF37]/60",
      accentText: "text-[#D4AF37]",
      specs: [
        "Age & weight division matching",
        "Kukkiwon Dan/Poom or Color Belt entry",
        "Accreditation & digital ID card issuance",
      ],
    },
    {
      id: "coach",
      title: "COACH",
      category: "Accredited Corner Coach",
      badge: "Official Accreditation",
      badgeVariant: "cyan" as const,
      icon: ShieldCheck,
      description:
        "For officially registered coaches accompanying participating athletes and dojang delegations.",
      buttonText: "REGISTER AS COACH",
      href: "/register/coach",
      accentBorder: "hover:border-[#00E5FF]/60",
      accentText: "text-[#00E5FF]",
      specs: [
        "Official corner coach accreditation",
        "Academy & team delegation linkage",
        "Ring access credentials",
      ],
    },
    {
      id: "academy",
      title: "ACADEMY / TEAM",
      category: "Club & Dojang Directory",
      badge: "Team Management",
      badgeVariant: "outline" as const,
      icon: Building2,
      description:
        "For academies or teams registering participants and managing collective tournament entries.",
      buttonText: "REGISTER ACADEMY / TEAM",
      href: "/register/academy",
      accentBorder: "hover:border-slate-500",
      accentText: "text-slate-200",
      specs: [
        "Unique institutional code (e.g. KKC26-ACA-XXXXXX)",
        "Accredited delegation management",
        "Duplicate team protection",
      ],
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Select Participant Profile",
      desc: "Choose whether you are registering an individual athlete, an accredited coach, or a dojang academy team.",
    },
    {
      num: "02",
      title: "Provide Identification",
      desc: "Submit verified identity, date of birth, and Kukkiwon Dan/Poom details where mandated.",
    },
    {
      num: "03",
      title: "Category Eligibility",
      desc: "Our database engine calculates your approved weight and age division according to official technical rules.",
    },
    {
      num: "04",
      title: "Review & Save-As-Draft",
      desc: "Save your progress at every step and submit when complete to obtain your human-readable registration code.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 selection:bg-[#D4AF37] selection:text-slate-950 font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Institutional Hero Banner */}
        <section className="relative overflow-hidden border-b border-slate-800/80 bg-[#090D16] py-14 sm:py-20">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="gold">Official Championship Portal</Badge>
              <Badge variant="outline">Sanctioned by Kukkiwon North India</Badge>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              CHAMPIONSHIP REGISTRATION
            </h1>
            
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Register athletes, coaches, and academies for the Kukkiwon Cup Championship.
            </p>

            {/* Quick Resume Link for Existing Registrants */}
            <div className="pt-2">
              <Link
                href="/my-registration"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#00E5FF] hover:text-white transition-colors bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-full shadow-inner"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Already started? View or Resume Draft in My Registrations</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* 3 Primary Participant Registration Cards */}
        <section className="py-14 sm:py-20 border-b border-slate-800/80 bg-[#060A13]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Registration Entry
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase text-white">
                Select Participant Category
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Each participant type enters a dedicated official intake wizard with customized eligibility, division rules, and accreditation requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {selectionCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    className={`flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0A0F1D] p-6 sm:p-8 transition-all duration-200 shadow-xl ${card.accentBorder}`}
                  >
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <Icon className={`h-6 w-6 ${card.accentText}`} />
                        </div>
                        <Badge variant={card.badgeVariant}>
                          {card.badge}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          {card.category}
                        </span>
                        <h3 className="text-2xl font-black uppercase text-white tracking-tight">
                          {card.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed min-h-[56px]">
                          {card.description}
                        </p>
                      </div>

                      {/* Specs */}
                      <div className="space-y-2 border-t border-slate-800/80 pt-4">
                        {card.specs.map((spec, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8">
                      <Link href={card.href} className="block">
                        <Button
                          variant={card.id === "athlete" ? "primary" : card.id === "coach" ? "secondary" : "outline"}
                          size="lg"
                          className="w-full text-xs font-bold uppercase tracking-wider justify-between group"
                        >
                          <span>{card.buttonText}</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4-Step Registration Process Overview */}
        <section className="py-14 sm:py-16 border-b border-slate-800/80 bg-[#090D16]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                System Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase text-white">
                Championship Intake Process
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s) => (
                <div
                  key={s.num}
                  className="p-6 rounded-xl border border-slate-800 bg-[#0A0F1D] space-y-3"
                >
                  <span className="text-2xl font-black text-[#D4AF37] font-mono block">
                    {s.num}
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Institutional Accreditation Notice */}
        <section className="py-12 bg-[#060A13]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00E5FF]">
                <ShieldCheck className="h-4 w-4" />
                <span>Institutional Governance Notice</span>
              </div>
              <h3 className="text-lg font-bold text-white uppercase">
                Official Sanction & Credentialing Policy
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Kukkiwon Cup Championship operates under strict World Taekwondo and Kukkiwon India North technical rules.
                All registered participants are issued verified accreditation reference numbers (e.g. <code className="text-[#D4AF37] bg-slate-900 px-1 py-0.5 rounded">KKC26-ATH-000001</code>).
                All registrations are held in draft state until final electronic verification.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
