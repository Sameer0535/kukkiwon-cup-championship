// ==============================================================================
// ADMIN DASHBOARD OVERVIEW
// High-level operational metrics, entity counters, and architecture controls
// ==============================================================================

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Users,
  ClipboardCheck,
  CreditCard,
  FileCheck,
  IdCard,
  ShieldCheck,
  ArrowRight,
  Database,
  Activity,
  Lock,
} from "lucide-react";

export default function AdminDashboardPage() {
  const stats = [
    {
      title: "Championships",
      value: "1 Active",
      subtitle: "Kukkiwon Cup 2026",
      icon: Trophy,
      href: "/admin/championships",
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
    },
    {
      title: "Participants",
      value: "Master DB Ready",
      subtitle: "Non-guessable Public IDs",
      icon: Users,
      href: "/admin/participants",
      color: "text-sky-400",
      bgColor: "bg-sky-400/10",
    },
    {
      title: "Document Reviews",
      value: "Private Storage",
      subtitle: "Signed URL stream",
      icon: FileCheck,
      href: "/admin/documents",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      title: "ID & QR Accreditation",
      value: "Engine Online",
      subtitle: "Cryptographic URL-safe",
      icon: IdCard,
      href: "/admin/id-cards",
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0B1426] to-slate-950 p-6 sm:p-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="gold">Phase 1 Foundation Operational</Badge>
          <span className="text-xs font-mono text-slate-400">
            Auth: <strong className="text-emerald-400">SUPER_ADMIN</strong>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
          Administration & Operations Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Centralized management for tournament editions, registrations, document verification,
          accreditation ID issuance, and real-time QR validation.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href} className="group">
              <Card className="border-slate-800 bg-slate-900/60 p-5 group-hover:border-slate-700 transition-all h-full flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {stat.title}
                  </span>
                  <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-0.5">
                    {stat.subtitle}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Subsystem Readiness Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Systems */}
        <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Database className="h-4 w-4 text-sky-400" />
              <span>Relational Database Architecture</span>
            </CardTitle>
            <Badge variant="info">Prisma v6 + PostgreSQL</Badge>
          </CardHeader>
          <CardContent className="p-0 space-y-2.5 pt-2 text-xs text-slate-300">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
              <span>Championships Model</span>
              <span className="text-emerald-400 font-mono font-semibold">Ready</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
              <span>Participants (Decoupled Public ID)</span>
              <span className="text-emerald-400 font-mono font-semibold">Ready</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
              <span>Registrations & Terms v1.0</span>
              <span className="text-emerald-400 font-mono font-semibold">Ready</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
              <span>Documents (Private Storage)</span>
              <span className="text-emerald-400 font-mono font-semibold">Ready</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span>Payments & ID Cards</span>
              <span className="text-emerald-400 font-mono font-semibold">Ready</span>
            </div>
          </CardContent>
        </Card>

        {/* Security & Access Management */}
        <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-400" />
              <span>Role-Based Access Control (RBAC)</span>
            </CardTitle>
            <Badge variant="warning">7 Distinct Roles</Badge>
          </CardHeader>
          <CardContent className="p-0 space-y-2.5 pt-2 text-xs text-slate-300">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
              <span>SUPER_ADMIN & EVENT_ADMIN</span>
              <span className="text-purple-400 font-semibold">Full Authority</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
              <span>REGISTRATION_ADMIN</span>
              <span className="text-sky-400 font-semibold">Participant Review</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
              <span>FINANCE_ADMIN & DOCUMENT_ADMIN</span>
              <span className="text-amber-400 font-semibold">Targeted Scope</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span>CONTENT_ADMIN & VIEWER</span>
              <span className="text-slate-400 font-semibold">CMS / Read-only</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-4">
        <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
          Module Direct Access
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Link
            href="/admin/championships"
            className="p-3 rounded-lg border border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:text-sky-400 transition-all text-center block"
          >
            Championships
          </Link>
          <Link
            href="/admin/registrations"
            className="p-3 rounded-lg border border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:text-sky-400 transition-all text-center block"
          >
            Registrations
          </Link>
          <Link
            href="/admin/documents"
            className="p-3 rounded-lg border border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:text-sky-400 transition-all text-center block"
          >
            Documents
          </Link>
          <Link
            href="/admin/id-cards"
            className="p-3 rounded-lg border border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:text-sky-400 transition-all text-center block"
          >
            ID Cards & QR
          </Link>
        </div>
      </div>
    </div>
  );
}
