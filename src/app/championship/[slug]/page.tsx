// ==============================================================================
// DYNAMIC CHAMPIONSHIP ROUTE (Requirements 22 & 23)
// Multi-event slug lookup: /championship/[slug]
// ==============================================================================

import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Clock,
  Shield,
  FileText,
  CreditCard,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export default async function ChampionshipPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fallback tournament data for demonstration / development
  const tournament = {
    slug,
    name: "Kukkiwon Cup Championship 2026",
    subtitle: "Presented by Kukkiwon North India & Kyorix Sports Technology",
    status: "REGISTRATION_OPEN",
    startDate: "2026-11-20T09:00:00Z",
    endDate: "2026-11-23T18:00:00Z",
    registrationClose: "2026-11-10T23:59:59Z",
    venue: "Indira Gandhi Indoor Stadium Complex",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    feeAthlete: 2500,
    feeCoach: 1500,
    feeOfficial: 0,
    currency: "INR",
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#090D16]">
      <PublicHeader />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        {/* Tournament Header Banner */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0B1528] to-slate-950 p-6 sm:p-10 space-y-4 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="success">Registration Open</Badge>
            <span className="text-xs font-mono text-slate-400">
              Slug: <strong className="text-sky-400">{tournament.slug}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white uppercase tracking-tight">
            {tournament.name}
          </h1>
          <p className="text-sm text-amber-400 font-medium">{tournament.subtitle}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-sky-400 shrink-0" />
              <span>
                {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-sky-400 shrink-0" />
              <span>
                {tournament.venue}, {tournament.city}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Closes {formatDate(tournament.registrationClose)}</span>
            </div>
          </div>
        </div>

        {/* Tournament Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fee Structure */}
          <Card className="border-slate-800 bg-slate-900/60 p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-sky-400" />
                <span>Entry & Accreditation Fees</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3 pt-2 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Athlete Competitor Fee</span>
                <span className="font-bold text-white">
                  {formatCurrency(tournament.feeAthlete, tournament.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-300">Coach Accreditation Fee</span>
                <span className="font-bold text-white">
                  {formatCurrency(tournament.feeCoach, tournament.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-300">Referee / Official Accreditation</span>
                <span className="font-bold text-emerald-400">Complimentary</span>
              </div>
            </CardContent>
          </Card>

          {/* Registration Requirements */}
          <Card className="border-slate-800 bg-slate-900/60 p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <span>Required Documentation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-2 pt-2 text-xs text-slate-300">
              <p>• Government Photo ID (Aadhaar / Passport / Voter ID)</p>
              <p>• Kukkiwon Dan/Poom Certificate (for Dan divisions & Coaches)</p>
              <p>• Digital Passport Photo (for official accreditation badge)</p>
              <p>• Signed Terms of Participation (Auditable Terms v1.0)</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA to Register (Phase Notice) */}
        <div className="text-center pt-4">
          <Link href="/register">
            <Button variant="gold" size="lg" className="uppercase tracking-wider">
              <span>Proceed to Registration Portal</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
