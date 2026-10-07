// ==============================================================================
// ACADEMY REGISTRATION REDIRECT / ADVISORY
// Academy and team delegation is now integrated directly into Athlete & Coach flows
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, ShieldCheck, ArrowRight, Building2, CheckCircle2 } from "lucide-react";

export default function AcademyRegistrationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70 text-slate-900 font-sans">
      <PublicHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-500 flex items-center justify-center mx-auto text-blue-600">
              <Building2 className="h-8 w-8 stroke-[2]" />
            </div>

            <div className="space-y-2">
              <Badge variant="info">Registration Notice</Badge>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-950 tracking-tight">
                Academy Registration Simplified
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Separate academy / team registration is no longer required. Academies, dojangs, and club delegations are now selected or registered seamlessly directly inside the individual <strong>Athlete</strong> and <strong>Coach</strong> intake forms.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Registering a Competitor?</strong> Choose Athlete registration to assign their weight division and link their academy.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Registering a Corner Coach?</strong> Coach intake is available for accredited team officials with direct pass generation.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link href="/register/athlete">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-xs font-bold uppercase bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Award className="h-4 w-4 mr-2" />
                  <span>Register Athlete</span>
                </Button>
              </Link>

              <Link href="/register/coach">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-xs font-bold uppercase border-blue-500/60 text-blue-700 hover:bg-blue-50"
                >
                  <ShieldCheck className="h-4 w-4 mr-2 text-blue-600" />
                  <span>Register Coach</span>
                </Button>
              </Link>
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="text-xs text-slate-500 hover:text-blue-600 transition inline-flex items-center gap-1"
              >
                <span>Back to Registration Portal</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
