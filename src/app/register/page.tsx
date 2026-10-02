// ==============================================================================
// REGISTRATION PORTAL STATUS & PREVIEW
// Phase 1 Foundation Active — Phase 2 UI Launch Notice
// ==============================================================================

import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, CheckCircle, Database, Lock, ArrowLeft, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090D16]">
      <PublicHeader />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        {/* Phase Notice Card */}
        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-950 p-6 sm:p-10 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="info">Phase 1 Architecture Complete</Badge>
            <Badge variant="gold">Phase 2 Registration Form Queued</Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
            Championship Registration System
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The database schemas, validation layer, private storage, and role-based accreditation engine
            for the Kukkiwon Cup Championship have been successfully established in Phase 1.
          </p>
        </div>

        {/* Verified Data Layer Checklist */}
        <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-slate-800">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <span>Database Models Ready For Registration Intake</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Participant Master Record (non-guessable Public ID)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Multi-Edition Championship Linkage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Configurable Designations (10 Official Categories)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Standardized ISO Nationalities & Country Flags</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Private Secure Storage (Signed URLs for IDs)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Auditable Terms & Conditions Versioning (v1.0)</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Link to Admin Dashboard */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-xl border border-slate-800 bg-slate-950">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wide">
              Administrator Access
            </h4>
            <p className="text-xs text-slate-400">
              Tournament officials can access the administration portal to review configurations and schema health.
            </p>
          </div>
          <Link href="/admin">
            <Button variant="primary" size="md">
              <span>Go to Admin Portal</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
