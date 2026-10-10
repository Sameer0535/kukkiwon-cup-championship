// ==============================================================================
// ADMIN MASTER PARTICIPANTS DIRECTORY (Athletes & Coaches)
// Live synchronized directory with ID Card generation & accreditation preview
// ==============================================================================

"use client";

import * as React from "react";
import {
  Users,
  Search,
  RefreshCw,
  Building2,
  Loader2,
  Camera,
  Mail,
  ArrowRight,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toWorldTaekwondoCountryCode } from "@/lib/utils";

interface ParticipantItem {
  publicId: string;
  fullName: string;
  gender: string;
  nationality: string;
  flag: string;
  designation: "Athlete" | "Coach" | "Technical Official";
  academy: string;
  kukkiwonId: string;
  photoUrl?: string | null;
  status: "ACTIVE" | "APPROVED" | "PENDING" | "UNDER_REVIEW";
  registrationId?: string;
  categoryName?: string;
  coachRole?: string;
  email?: string;
  phone?: string;
}

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = React.useState<ParticipantItem[]>([]);
  const [filterDesignation, setFilterDesignation] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const getAdminHeaders = React.useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    const bearer =
      typeof window !== "undefined"
        ? sessionStorage.getItem("kukkiwon_admin_bearer") || localStorage.getItem("kukkiwon_admin_bearer")
        : null;
    if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
    headers["x-admin-secret"] = "kukkiwon-bootstrap-admin-secret-2026";
    return headers;
  }, []);

  const loadParticipants = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDesignation) params.set("designation", filterDesignation);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/admin/participants?${params.toString()}`, {
        headers: getAdminHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      let list: ParticipantItem[] = Array.isArray(data?.participants) ? data.participants : [];

      // Merge local client-stored registrations so participants never disappear on serverless restarts
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("kukkiwon_client_registrations");
          if (raw) {
            const clientList: any[] = JSON.parse(raw);
            const seenNames = new Set(list.map((p) => p.fullName?.toLowerCase().trim()));
            const seenIds = new Set(list.map((p) => p.publicId));

            for (const c of clientList) {
              if (!c || !c.registrationNumber) continue;
              const name = (c.athleteName || c.participantName || "").trim();
              if (name && !seenNames.has(name.toLowerCase()) && !seenIds.has(c.registrationNumber)) {
                const des: "Athlete" | "Coach" = c.participantType === "COACH" ? "Coach" : "Athlete";
                if (!filterDesignation || filterDesignation.toLowerCase() === des.toLowerCase()) {
                  const q = searchQuery.trim().toLowerCase();
                  if (
                    !q ||
                    name.toLowerCase().includes(q) ||
                    (c.registrationNumber && c.registrationNumber.toLowerCase().includes(q)) ||
                    (c.academyName && c.academyName.toLowerCase().includes(q)) ||
                    (c.kukkiwonId && c.kukkiwonId.toLowerCase().includes(q))
                  ) {
                    list.unshift({
                      publicId: c.registrationNumber,
                      fullName: name,
                      gender: c.gender || "MALE",
                      nationality: c.nationality || "IND",
                      flag: "🌐",
                      designation: des,
                      academy: c.academyName || "Official Dojang",
                      kukkiwonId: c.kukkiwonId || "Submitted",
                      photoUrl: c.photoUrl || null,
                      status: c.paymentStatus === "PAID" || c.status === "APPROVED" ? "ACTIVE" : "PENDING",
                      registrationId: c.id,
                      categoryName: c.categoryName || "Official Entry",
                      coachRole: c.coachRole,
                      email: c.email || "",
                      phone: c.phone || "",
                    });
                  }
                }
              }
            }
          }
        } catch {}
      }

      setParticipants(list);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [filterDesignation, searchQuery, getAdminHeaders]);

  React.useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadParticipants();
  };

  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  const handleDeleteParticipant = async (p: ParticipantItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete participant "${p.fullName}" (${p.publicId})?\n\nThis will permanently erase their athlete profile, registration record, document dossier, and accreditation pass.`
    );
    if (!confirmDelete) return;

    const targetId = p.registrationId || p.publicId;
    setActionLoadingId(targetId);

    try {
      const res = await fetch(`/api/admin/participants?id=${encodeURIComponent(targetId)}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete participant.");
      }

      // Erase from local client persistence so it doesn't reappear
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("kukkiwon_client_registrations");
          if (raw) {
            const list: any[] = JSON.parse(raw);
            const filtered = list.filter(
              (item: any) =>
                item.id !== p.registrationId &&
                item.registrationId !== p.registrationId &&
                item.registrationNumber !== p.publicId &&
                item.id !== p.publicId &&
                item.athleteName?.toLowerCase() !== p.fullName.toLowerCase()
            );
            localStorage.setItem("kukkiwon_client_registrations", JSON.stringify(filtered));

            // Sync with backend
            fetch("/api/registrations/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ registrations: filtered }),
            }).catch(() => {});
          }
        } catch {}
      }

      // Remove from table immediately
      setParticipants((prev) =>
        prev.filter((item) => item.publicId !== p.publicId && item.registrationId !== p.registrationId)
      );
    } catch (err: any) {
      alert(err.message || "Failed to delete participant.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const coachesCount = participants.filter((p) => p.designation === "Coach").length;
  const athletesCount = participants.filter((p) => p.designation === "Athlete").length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-blue-600" />
            <span>Master Participants & Coaches Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative directory for all accredited Coaches and Athletes with instant ID Card generation.
          </p>
        </div>

        <button
          onClick={() => loadParticipants()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Designation Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <button
              onClick={() => setFilterDesignation("")}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition cursor-pointer ${
                filterDesignation === ""
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Participants ({participants.length})
            </button>
            <button
              onClick={() => setFilterDesignation("Coach")}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition cursor-pointer ${
                filterDesignation === "Coach"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Coaches Only ({coachesCount})
            </button>
            <button
              onClick={() => setFilterDesignation("Athlete")}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition cursor-pointer ${
                filterDesignation === "Athlete"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Athletes Only ({athletesCount})
            </button>
          </div>

          <div className="text-xs font-mono text-slate-500">
            Total Records: <strong className="text-slate-900">{participants.length}</strong>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Full Name, Public ID, Academy, or Kukkiwon ID..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer shadow-xs"
          >
            Search
          </button>
        </form>
      </div>

      {/* Participants Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="p-3.5">Public ID</th>
                <th className="p-3.5">Participant Name</th>
                <th className="p-3.5">Designation</th>
                <th className="p-3.5">Academy / Dojang</th>
                <th className="p-3.5">Kukkiwon Dan ID</th>
                <th className="p-3.5">Nationality</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading participants directory...</span>
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500">
                    <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-900">No participants found.</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters.</p>
                  </td>
                </tr>
              ) : (
                participants.map((p) => {
                  const isCoach = p.designation === "Coach";
                  return (
                    <tr key={p.publicId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <code className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {p.publicId}
                        </code>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {p.photoUrl ? (
                            <div className="relative w-8 h-10 rounded-md overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.photoUrl} alt={p.fullName} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-10 rounded-md border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                              <Camera className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 uppercase text-xs">
                              {p.fullName}
                            </div>
                            {p.email && (
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5 lowercase">
                                <Mail className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[190px]">{p.email}</span>
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {isCoach ? (p.coachRole || "Accredited Coach") : (p.categoryName || "Competitor")}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCoach
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {p.designation}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          <span>{p.academy}</span>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-700 font-bold">
                          {p.kukkiwonId}
                        </span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        {(() => {
                          const wt = toWorldTaekwondoCountryCode(p.nationality);
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {wt.code}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === "ACTIVE" || p.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteParticipant(p)}
                          disabled={actionLoadingId === (p.registrationId || p.publicId)}
                          title={`Permanently delete ${p.fullName}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold uppercase transition disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                          {actionLoadingId === (p.registrationId || p.publicId) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
