// ==============================================================================
// DYNAMIC CHAMPIONSHIP DETAILS PAGE (Requirements 5, 11, 22 & 23)
// Full technical outline, division breakdown, and schedule: /championship/[slug]
// ==============================================================================

import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPublicChampionshipData } from "@/lib/cms";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Clock,
  Shield,
  Award,
  CreditCard,
  FileText,
  ArrowRight,
  CheckCircle2,
  Users,
  AlertTriangle,
} from "lucide-react";

export default async function ChampionshipDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await getPublicChampionshipData(slug);

  const scheduleItems = [
    { day: "Day 1", date: "Friday, 20 Nov 2026", activity: "Official Delegations Arrival, Weight Weigh-In & Head of Team Technical Meeting" },
    { day: "Day 2", date: "Saturday, 21 Nov 2026", activity: "Poomsae (Individual & Team Divisions), Cadet & Sub-Junior Kyorugi Matches" },
    { day: "Day 3", date: "Sunday, 22 Nov 2026", activity: "Junior & Senior Kyorugi Preliminary & Semi-Final Elimination Rounds" },
    { day: "Day 4", date: "Monday, 23 Nov 2026", activity: "Championship Finals, Demonstration Showcase, Medal Ceremonies & Closing" },
  ];

  const divisions = [
    { name: "Senior Division", age: "18+ Years", belt: "1st Dan / Poom and above", rules: "World Taekwondo Senior Rules" },
    { name: "Junior Division", age: "15 – 17 Years", belt: "1st Dan / Poom and above", rules: "World Taekwondo Junior Rules" },
    { name: "Cadet Division", age: "12 – 14 Years", belt: "Poom Belt Holders", rules: "Head contact limited rules" },
    { name: "Sub-Junior Division", age: "Under 12 Years", belt: "Color Belt & Poom", rules: "Non-head contact safety rules" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70 text-slate-900 font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* Championship Header Banner */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white py-14 sm:py-20">
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-6 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <Badge variant="blue">Official Championship</Badge>
              <Badge variant="success">Registration Open</Badge>
              <span className="text-xs font-mono text-slate-500">
                Slug: <strong className="text-blue-600">{tournament.slug}</strong>
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-slate-900">
                {tournament.name}
              </h1>
              <p className="text-sm sm:text-base text-blue-600 font-medium">
                {tournament.subtitle}
              </p>
            </div>

            {/* Quick Metadata Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  {tournament.venue}, {tournament.city}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Registration Closes: {formatDate(tournament.registrationClose)}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/register">
                <Button variant="primary" size="lg" className="text-xs uppercase font-extrabold px-8">
                  <span>Register Competitor Now</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Schedule & Event Outline */}
        <section className="py-16 border-b border-slate-200 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Official Program
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase text-slate-900">
                Tournament Schedule & Itinerary
              </h2>
            </div>

            <div className="space-y-3">
              {scheduleItems.map((item) => (
                <div
                  key={item.day}
                  className="p-5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
                >
                  <div className="space-y-0.5 sm:w-1/4">
                    <span className="font-bold text-blue-600 uppercase tracking-wide block">
                      {item.day}
                    </span>
                    <span className="text-slate-500">{item.date}</span>
                  </div>
                  <div className="sm:w-3/4 font-medium text-slate-800">
                    {item.activity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Age & Division Categories */}
        <section className="py-16 border-b border-slate-200 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Eligibility
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase text-slate-900">
                Competition Divisions & Belt Criteria
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {divisions.map((div) => (
                <div
                  key={div.name}
                  className="p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase">{div.name}</h3>
                    <Badge variant="blue">{div.age}</Badge>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div>Belt Requirement: <strong className="text-slate-900">{div.belt}</strong></div>
                    <div>Rules: <strong className="text-slate-900">{div.rules}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fees & Technical Rules */}
        <section id="rules" className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Financial & Regulatory Outline
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase text-slate-900">
                Accreditation Fees & Guidelines
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
              <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span>Entry Fee Structure</span>
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span>Athlete Entry (per discipline)</span>
                    <span className="font-bold text-slate-900">{formatCurrency(tournament.entryFeeAthlete, tournament.currency)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span>Coach Accreditation Mat Pass</span>
                    <span className="font-bold text-slate-900">{formatCurrency(tournament.entryFeeCoach, tournament.currency)}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Referees, Jury & Board Members</span>
                    <span className="font-bold text-emerald-600">Complimentary</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Technical Rules Summary</span>
                </h3>
                <ul className="space-y-1.5 text-slate-600">
                  <li>• World Taekwondo Competition Rules strictly apply.</li>
                  <li>• Electronic body protector and sensor scoring provided by Kyorix.</li>
                  <li>• Mandatory mouthguard, groin guard, shin/forearm guards, and WT gloves.</li>
                  <li>• Valid government photo identification required at weigh-in.</li>
                </ul>
              </div>
            </div>

            <div className="text-center pt-4">
              <Link href="/register">
                <Button variant="primary" size="lg" className="text-xs uppercase font-extrabold px-10">
                  <span>Register Now for {tournament.name}</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
