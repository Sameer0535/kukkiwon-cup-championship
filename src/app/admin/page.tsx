// ==============================================================================
// ADMIN DASHBOARD OVERVIEW (Phase 8 Server Component)
// Operational metrics, entity counters, and navigation controls
// ==============================================================================

import Link from "next/link";
import { AdminService } from "@/server/services/admin.service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CreditCard,
  FileCheck,
  IdCard,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const metrics = await AdminService.getDashboardMetrics();

  const cards = [
    {
      title: "Total Athletes",
      value: String(metrics.totalAthletes || metrics.totalRegistrations),
      subtitle: `${metrics.totalRegistrations} Total Registrations`,
      icon: Users,
      href: "/admin/registrations",
      color: "text-sky-400",
      bgColor: "bg-sky-400/10",
      borderColor: "border-sky-500/20",
    },
    {
      title: "Paid Registrations",
      value: String(metrics.paidRegistrations),
      subtitle: `${metrics.pendingPayments} Pending Payment`,
      icon: CreditCard,
      href: "/admin/payments",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Payment Verification",
      value: String(metrics.documentsPending || metrics.pendingPayments),
      subtitle: `${metrics.paidRegistrations} Verified • ${metrics.pendingPayments} Pending Review`,
      icon: CreditCard,
      href: "/admin/documents",
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-500/20",
    },
    {
      title: "ID Cards Issued",
      value: String(metrics.idCardsGenerated),
      subtitle: `${metrics.idCardsPending} Ready • ${metrics.idCardsRevoked} Revoked`,
      icon: IdCard,
      href: "/admin/id-cards",
      color: "text-[#D4AF37]",
      bgColor: "bg-[#D4AF37]/10",
      borderColor: "border-[#D4AF37]/20",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0A192F] to-slate-950 p-6 sm:p-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="gold">Official Championship Operations</Badge>
          <span className="text-xs font-mono text-slate-400">
            Kukkiwon Cup 2026 Registry • <strong className="text-emerald-400">ACTIVE</strong>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
          Tournament Administration Overview
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Real-time monitoring and administrative workflow management for athlete registration intake, fee reconciliation, document verification, and accreditation credential issuance.
        </p>
      </div>

      {/* Primary Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.title} href={c.href} className="group">
              <Card className={`border ${c.borderColor} bg-slate-900/60 p-5 group-hover:border-slate-600 transition-all h-full flex flex-col justify-between`}>
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {c.title}
                  </span>
                  <div className={`p-2.5 rounded-xl ${c.bgColor} ${c.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white tracking-tight font-mono">
                    {c.value}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">
                    {c.subtitle}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Grid: Recent Registrations & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-white">
                Recent Athlete Registrations
              </h2>
              <p className="text-xs text-slate-400">Latest entries received across categories</p>
            </div>
            <Link
              href="/admin/registrations"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#D4AF37] hover:text-amber-300 transition"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                <tr>
                  <th className="pb-3">Athlete</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {(metrics.recentRegistrations || []).map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-white uppercase">{reg.athleteName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{reg.athleteId}</div>
                    </td>
                    <td className="py-3">
                      <span className="text-slate-300 font-medium">{reg.categoryName}</span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        reg.registrationStatus === "APPROVED" || reg.registrationStatus === "CONFIRMED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : reg.registrationStatus === "SUBMITTED"
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {reg.registrationStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        reg.paymentStatus === "PAID"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {reg.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/registrations/${reg.id}`}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!metrics.recentRegistrations || metrics.recentRegistrations.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No registrations recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Audit Trail Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-white">
                Recent Audit Trail
              </h2>
              <p className="text-xs text-slate-400">Security event traceability</p>
            </div>
            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#D4AF37] hover:text-amber-300 transition"
            >
              <span>View Logs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(metrics.recentAuditLogs || []).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-sky-400">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-medium">
                  {log.adminName || "System Admin"} ({log.adminRole || "SUPER_ADMIN"})
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {log.entityType}: {log.entityId}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
