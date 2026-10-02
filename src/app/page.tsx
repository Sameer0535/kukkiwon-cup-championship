// ==============================================================================
// KUKKIWON CUP CHAMPIONSHIP - FOUNDATION HOMEPAGE
// Phase 1 Architecture, Database & System Readiness Dashboard
// ==============================================================================

import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BRANDING } from "@/config/branding";
import {
  Database,
  ShieldCheck,
  QrCode,
  FileCheck2,
  Lock,
  Layers,
  CheckCircle2,
  ArrowRight,
  Server,
  Activity,
  Cpu,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090D16]">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section with Dual Branding Presentation */}
        <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-[#0B1220] to-[#090D16] py-16 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.15),transparent)]" />
          
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            {/* Phase 1 Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>PHASE 1 COMPLETE — FOUNDATION & SYSTEM ARCHITECTURE</span>
            </div>

            {/* Official Logos Display */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 py-4">
              {/* Kukkiwon Logo Container */}
              <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-white p-3 shadow-xl hover:scale-105 transition-transform duration-300">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                  <Image
                    src={BRANDING.kukkiwon.logoPath}
                    alt={BRANDING.kukkiwon.name}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              <span className="text-2xl font-light text-slate-400">×</span>

              {/* Kyorix Logo Container */}
              <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl hover:scale-105 transition-transform duration-300">
                <div className="relative h-14 w-36 sm:h-16 sm:w-44">
                  <Image
                    src={BRANDING.kyorix.logoPath}
                    alt={BRANDING.kyorix.name}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Title & Tagline */}
            <div className="space-y-4 max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white uppercase">
                Kukkiwon Cup <span className="gold-gradient-text">Championship</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-medium">
                Collaboration between{" "}
                <span className="text-amber-400 font-semibold">Kukkiwon India North Branch</span>{" "}
                and{" "}
                <span className="text-cyan-400 font-semibold">Kyorix Sports Technology</span>
              </p>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                A 100% standalone, decoupled tournament platform with dedicated PostgreSQL database,
                role-based security, private document storage, cryptographic QR verification, and accreditation architecture.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-sky-400 shadow-lg shadow-sky-500/25 transition-all uppercase tracking-wider"
              >
                <span>Explore Admin Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/verify/demo-token"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all uppercase tracking-wider"
              >
                <QrCode className="h-4 w-4 text-emerald-400" />
                <span>Test QR Verification</span>
              </Link>

              <Link
                href="/api/health"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-sky-400 transition-colors"
              >
                <Activity className="h-4 w-4 text-sky-400" />
                <span>API Health Diagnostics</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Architecture Checklist & Highlights Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-white uppercase">
              Phase 1 Deliverables & Architecture
            </h2>
            <p className="text-xs text-slate-400">
              Complete relational models, security boundaries, and modular architecture implemented strictly per specification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: 100% Standalone Isolation */}
            <Card className="border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <Badge variant="success">Decoupled</Badge>
                </div>
                <CardTitle className="pt-3">100% Standalone Isolation</CardTitle>
                <CardDescription>
                  Completely independent of the legacy Kyorix website (<code className="text-slate-300">kyorix-mgr.vercel.app</code>).
                  Has its own frontend, backend, database, authentication, storage, payment config, and ID engine.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 2: Relational PostgreSQL Schema */}
            <Card className="border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                    <Database className="h-5 w-5" />
                  </div>
                  <Badge variant="info">12 Relational Entities</Badge>
                </div>
                <CardTitle className="pt-3">Relational PostgreSQL Models</CardTitle>
                <CardDescription>
                  Type-safe Prisma client & SQL DDL covering: Championships, Participants, Registrations,
                  Designations, Nationalities, Documents, Payments, IdCards, AdminUsers, AuditLogs, SiteSettings, and TermsVersions.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 3: Role-Based Access Control */}
            <Card className="border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Badge variant="warning">7 RBAC Roles</Badge>
                </div>
                <CardTitle className="pt-3">Secure Server-Side Auth</CardTitle>
                <CardDescription>
                  Multi-tier RBAC: <code className="text-slate-300">SUPER_ADMIN</code>, <code className="text-slate-300">EVENT_ADMIN</code>,
                  <code className="text-slate-300">REGISTRATION_ADMIN</code>, <code className="text-slate-300">FINANCE_ADMIN</code>,
                  <code className="text-slate-300">DOCUMENT_ADMIN</code>, <code className="text-slate-300">CONTENT_ADMIN</code>, and <code className="text-slate-300">VIEWER</code>.
                  No public registration endpoint.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 4: Private File Storage Architecture */}
            <Card className="border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <Badge variant="gold">Encrypted Buckets</Badge>
                </div>
                <CardTitle className="pt-3">Private Document Storage</CardTitle>
                <CardDescription>
                  Logical bucket segregation (<code className="text-slate-300">participant-documents</code>, <code className="text-slate-300">participant-photos</code>,
                  <code className="text-slate-300">championship-assets</code>, <code className="text-slate-300">id-cards</code>). Strictly private government IDs with time-limited signed URLs.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 5: Cryptographic QR Verification */}
            <Card className="border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <Badge variant="cyan">Zero-PII QR</Badge>
                </div>
                <CardTitle className="pt-3">QR Verification Engine</CardTitle>
                <CardDescription>
                  High-entropy cryptographic tokens pointing to configurable verification domain (<code className="text-slate-300">/verify/[token]</code>).
                  Never embeds raw participant PII directly in QR payload.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 6: Multi-Championship Scalability */}
            <Card className="border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Layers className="h-5 w-5" />
                  </div>
                  <Badge variant="default">Multi-Edition</Badge>
                </div>
                <CardTitle className="pt-3">Multi-Tournament Scalability</CardTitle>
                <CardDescription>
                  URL slugs (<code className="text-slate-300">kukkiwon-cup-2026</code>), event-specific fees, dates, rules, venues,
                  and configurable designation options. Ready for future editions without database restructuring.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* System Diagnostics & Environment Transparency */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-sky-400" />
                  <span>Platform Verification Checklist</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Automated architectural verification of Phase 1 requirements
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Ready for Phase 2
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Next.js App Router & TypeScript Strict</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>PostgreSQL / Supabase Schema & DDL</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Prisma Client (v6) Type Generation</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Decoupled Public ID & Secret Database ID</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Configurable Designations (10 Initial Values)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Standardized Nationalities & ISO Flags</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Private Storage & Signed URL Handler</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Cryptographic QR Verification Architecture</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Zero Credentials In Code (.env.example)</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
