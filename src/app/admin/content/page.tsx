// ==============================================================================
// ADMIN CONTENT CMS HUB (Phase 9 - Requirement 16)
// Centralized portal for managing public championship content, categories,
// registration fees, announcements, and public documents
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Tag,
  CreditCard,
  Bell,
  FileDown,
  ExternalLink,
  ArrowRight,
  Shield,
  Calendar,
  Sparkles,
  Globe,
} from "lucide-react";

export default function AdminContentHubPage() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    fetch("/api/public/championship?package=true")
      .then((res) => res.json())
      .then((res) => {
        if (res.data) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sections = [
    {
      title: "Championship Information",
      description: "Manage tournament name, edition, dates, venue, branding images, contact details, and publishing state.",
      href: "/admin/content/championship",
      icon: Trophy,
      count: data?.championship ? `Status: ${data.championship.status}` : "Configure",
      badge: data?.championship?.isPublished ? "PUBLISHED" : "DRAFT",
      badgeVariant: (data?.championship?.isPublished ? "success" : "warning") as any,
    },
    {
      title: "Competition Categories",
      description: "Configure disciplines (Kyorugi, Poomsae, Demo), weight classes, age groups, gender rules, and active states.",
      href: "/admin/content/categories",
      icon: Tag,
      count: data?.categories ? `${data.categories.length} Categories` : "Loading...",
      badge: "ACTIVE IN SYSTEM",
      badgeVariant: "info" as any,
    },
    {
      title: "Registration Fees & Surcharges",
      description: "Authoritative base entry fees, late fee surcharges, participant type tiers, and effective payment deadlines.",
      href: "/admin/content/fees",
      icon: CreditCard,
      count: data?.fees ? `${data.fees.length} Fee Rules` : "Loading...",
      badge: "FINANCIAL ENGINE",
      badgeVariant: "gold" as any,
    },
    {
      title: "Official Announcements",
      description: "Publish notices, referee instructions, equipment guidelines, and schedule alerts with live publication control.",
      href: "/admin/content/announcements",
      icon: Bell,
      count: data?.announcements ? `${data.announcements.length} Published` : "Loading...",
      badge: "LIVE FEED",
      badgeVariant: "secondary" as any,
    },
    {
      title: "Public Documents & Prospectus",
      description: "Manage official downloadable prospectus PDFs, technical guidelines, identity criteria, and tournament terms.",
      href: "/admin/content/documents",
      icon: FileDown,
      count: data?.documents ? `${data.documents.length} Documents` : "Loading...",
      badge: "PUBLIC REPO",
      badgeVariant: "default" as any,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 uppercase tracking-wider mb-2">
            <Globe className="h-3 w-3" />
            <span>Public Website CMS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Championship Content & Live Publishing</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure public tournament details, manage categories, entry fees, and broadcast announcements without redeploying code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/cms">
            <Button size="sm" className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 text-xs shadow-xs cursor-pointer">
              <Globe className="h-3.5 w-3.5" />
              <span>Full CMS Workspace</span>
            </Button>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <span>Preview Public Site</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Live Publishing Status Banner */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Publishing Active
              </span>
              <Badge variant="success">IN PRODUCTION</Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Changes saved in this CMS immediately update the public tournament pages and registration engine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Current Edition:</span>
          <span className="font-bold text-blue-700">Kukkiwon Cup 2026</span>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link
              key={sec.href}
              href={sec.href}
              className="group block rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md hover:border-blue-300 transition-all shadow-xs relative cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:scale-105 group-hover:border-blue-200 transition-all">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant={sec.badgeVariant}>{sec.badge}</Badge>
              </div>

              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
                {sec.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                {sec.description}
              </p>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{sec.count}</span>
                <span className="text-blue-600 inline-flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Manage</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
