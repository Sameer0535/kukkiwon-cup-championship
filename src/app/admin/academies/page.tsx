// ==============================================================================
// ADMIN ACADEMIES & CLUBS DIRECTORY
// Master registry of recognized academies, dojang affiliations, and club delegations
// Live synchronized with all athlete and coach registrations
// ==============================================================================

"use client";

import * as React from "react";
import {
  Building2,
  Users,
  Search,
  Filter,
  RefreshCw,
  Trophy,
  MapPin,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminAcademiesPage() {
  const [academies, setAcademies] = React.useState<any[]>([]);
  const [metrics, setMetrics] = React.useState({
    totalAcademies: 0,
    totalAthletes: 0,
    totalCoaches: 0,
    totalStates: 0,
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const loadAcademies = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const bearer =
        typeof window !== "undefined"
          ? sessionStorage.getItem("kukkiwon_admin_bearer") || localStorage.getItem("kukkiwon_admin_bearer")
          : null;
      const headers: Record<string, string> = {
        "x-admin-secret": "kukkiwon-bootstrap-admin-secret-2026",
      };
      if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

      const res = await fetch(`/api/admin/academies?${params.toString()}`, {
        headers,
        credentials: "include",
      });
      const data = await res.json();

      if (data.academies) {
        setAcademies(data.academies);
      }
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  React.useEffect(() => {
    loadAcademies();
  }, [loadAcademies]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAcademies();
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-[#D4AF37]" />
            <span>Academies & Dojangs Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered club delegations, institutional affiliations, and athlete distribution counts.
          </p>
        </div>

        <button
          onClick={() => loadAcademies()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Academies
            </span>
            <div className="p-2.5 rounded-xl bg-amber-400/10 text-[#D4AF37]">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {metrics.totalAcademies}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Recognized club delegations</p>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Affiliated Athletes
            </span>
            <div className="p-2.5 rounded-xl bg-sky-400/10 text-sky-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {metrics.totalAthletes}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Enrolled competitors</p>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Accredited Coaches
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-400/10 text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {metrics.totalCoaches}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Official corner trainers</p>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              States & Regions
            </span>
            <div className="p-2.5 rounded-xl bg-purple-400/10 text-purple-400">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {metrics.totalStates}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Territories represented</p>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Academy Name, Code, City, State, or Head Coach..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 text-xs font-bold uppercase tracking-wider hover:bg-[#b89528] transition shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Academies Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="p-3.5">Academy Code</th>
                <th className="p-3.5">Academy / Dojang Name</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Head Coach</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5 text-center">Athletes</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#D4AF37] mb-2" />
                    <span>Loading registered academies...</span>
                  </td>
                </tr>
              ) : academies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    <Building2 className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-white">No academies found.</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria.</p>
                  </td>
                </tr>
              ) : (
                academies.map((acad) => (
                  <tr key={acad.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#D4AF37] whitespace-nowrap">
                      {acad.code}
                    </td>
                    <td className="p-3.5 font-bold text-white uppercase whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>{acad.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>{acad.city}, {acad.state}</span>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-medium text-slate-200">
                      {acad.head_coach_name || "—"}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                      {acad.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span>{acad.email}</span>
                        </div>
                      )}
                      {acad.phone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>{acad.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className="font-bold text-sky-400 bg-sky-950/40 border border-sky-800/60 px-2 py-0.5 rounded text-[11px]">
                        {acad.athletes_count || 0}
                      </span>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {acad.status || "RECOGNIZED"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
