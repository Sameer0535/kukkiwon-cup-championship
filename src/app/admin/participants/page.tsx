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
  Award,
  IdCard,
  Building2,
  Printer,
  X,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Camera,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  // ID Card Generation / Preview Modal State
  const [selectedParticipant, setSelectedParticipant] = React.useState<ParticipantItem | null>(null);
  const [cardModalOpen, setCardModalOpen] = React.useState(false);

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
      if (data.participants) {
        setParticipants(data.participants);
      }
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

  const handleOpenIdCard = (p: ParticipantItem) => {
    setSelectedParticipant(p);
    setCardModalOpen(true);
  };

  const handlePrintCard = () => {
    window.print();
  };

  const coachesCount = participants.filter((p) => p.designation === "Coach").length;
  const athletesCount = participants.filter((p) => p.designation === "Athlete").length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-sky-400" />
            <span>Master Participants & Coaches Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative directory for all accredited Coaches and Athletes with instant ID Card generation.
          </p>
        </div>

        <button
          onClick={() => loadParticipants()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Designation Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setFilterDesignation("")}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition ${
                filterDesignation === ""
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Participants ({participants.length})
            </button>
            <button
              onClick={() => setFilterDesignation("Coach")}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition ${
                filterDesignation === "Coach"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Coaches Only ({coachesCount})
            </button>
            <button
              onClick={() => setFilterDesignation("Athlete")}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition ${
                filterDesignation === "Athlete"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Athletes Only ({athletesCount})
            </button>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Total Records: <strong className="text-white">{participants.length}</strong>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Full Name, Public ID, Academy, or Kukkiwon ID..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Participants Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="p-3.5">Public ID</th>
                <th className="p-3.5">Participant Name</th>
                <th className="p-3.5">Designation</th>
                <th className="p-3.5">Academy / Dojang</th>
                <th className="p-3.5">Kukkiwon Dan ID</th>
                <th className="p-3.5">Nationality</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">ID Card Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-sky-400 mb-2" />
                    <span>Loading participants directory...</span>
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    <Users className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-white">No participants found.</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters.</p>
                  </td>
                </tr>
              ) : (
                participants.map((p) => {
                  const isCoach = p.designation === "Coach";
                  return (
                    <tr key={p.publicId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <code className="text-xs font-mono font-bold text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {p.publicId}
                        </code>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {p.photoUrl ? (
                            <div className="relative w-8 h-10 rounded-md overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.photoUrl} alt={p.fullName} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-10 rounded-md border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center text-slate-600 shrink-0">
                              <Camera className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white uppercase text-xs">
                              {p.fullName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {isCoach ? (p.coachRole || "Accredited Coach") : (p.categoryName || "Competitor")}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCoach
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {p.designation}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-500" />
                          <span>{p.academy}</span>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs text-emerald-400 font-bold">
                          {p.kukkiwonId}
                        </span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-200">
                          <span>{p.flag}</span>
                          <span>{p.nationality}</span>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === "ACTIVE" || p.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <Button
                          onClick={() => handleOpenIdCard(p)}
                          variant="secondary"
                          size="sm"
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold border border-slate-700 inline-flex items-center gap-1.5"
                        >
                          <IdCard className="h-3.5 w-3.5 text-sky-400" />
                          <span>Generate ID Card</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ID CARD MODAL / PREVIEW FOR ATHLETES AND COACHES */}
      {cardModalOpen && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950 shrink-0">
              <div className="flex items-center gap-2">
                <IdCard className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Official Accreditation ID Card
                </h3>
              </div>
              <button
                onClick={() => setCardModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Official Badge Frame */}
            <div className="p-6 overflow-y-auto space-y-4 flex flex-col items-center justify-center bg-slate-950/60 print:m-0 print:p-0">
              <div
                id="accreditation-card-print"
                className="w-full max-w-[340px] rounded-2xl border-2 border-[#D4AF37] bg-gradient-to-b from-[#0A192F] via-[#051329] to-[#0A192F] p-5 text-white shadow-2xl relative overflow-hidden"
              >
                {/* Gold Trim Header */}
                <div className="text-center border-b border-[#D4AF37]/40 pb-3 space-y-1">
                  <div className="text-[10px] tracking-widest font-black uppercase text-[#D4AF37]">
                    KUKKIWON CUP INDIA 2026
                  </div>
                  <div className="text-[9px] font-bold tracking-wider text-slate-300 uppercase">
                    OFFICIAL ACCREDITATION PASS
                  </div>
                  <span
                    className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedParticipant.designation === "Coach"
                        ? "bg-blue-600 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {selectedParticipant.designation === "Coach" ? "OFFICIAL COACH" : "ATHLETE"}
                  </span>
                </div>

                {/* Photo & Identity Section */}
                <div className="flex flex-col items-center text-center my-4 space-y-3">
                  <div className="relative w-28 h-36 rounded-xl border-2 border-[#D4AF37] overflow-hidden bg-slate-900 shadow-lg">
                    {selectedParticipant.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedParticipant.photoUrl}
                        alt={selectedParticipant.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                        <Users className="h-10 w-10 stroke-1" />
                        <span className="text-[9px] font-mono mt-1">Official Portrait</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h2 className="text-base font-black uppercase tracking-tight text-white">
                      {selectedParticipant.fullName}
                    </h2>
                    <div className="text-[11px] font-mono text-[#D4AF37] font-bold">
                      {selectedParticipant.publicId}
                    </div>
                  </div>
                </div>

                {/* Details Table */}
                <div className="space-y-1.5 text-xs border-t border-[#D4AF37]/30 pt-3 font-mono">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Kukkiwon Dan:</span>
                    <span className="font-bold text-emerald-400">{selectedParticipant.kukkiwonId}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Academy / Club:</span>
                    <span className="font-bold text-white text-right truncate max-w-[170px]">
                      {selectedParticipant.academy}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">
                      {selectedParticipant.designation === "Coach" ? "Coach Role:" : "WT Category:"}
                    </span>
                    <span className="font-bold text-sky-400 text-right truncate max-w-[170px]">
                      {selectedParticipant.designation === "Coach"
                        ? (selectedParticipant.coachRole || "Coach")
                        : (selectedParticipant.categoryName || "Senior")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Country:</span>
                    <span className="font-bold text-white">
                      {selectedParticipant.flag} {selectedParticipant.nationality}
                    </span>
                  </div>
                </div>

                {/* Footer Barcode / Verification Pass */}
                <div className="mt-4 pt-3 border-t border-[#D4AF37]/30 flex items-center justify-between text-[9px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Verified Official Credential</span>
                  </div>
                  <span className="font-mono text-[#D4AF37]">KYORIX • KKC26</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full pt-2">
                <Button
                  onClick={handlePrintCard}
                  variant="primary"
                  className="flex-1 bg-[#D4AF37] hover:bg-[#b89528] text-slate-950 font-bold uppercase text-xs"
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  <span>Print / Download Badge</span>
                </Button>
                <Button
                  onClick={() => setCardModalOpen(false)}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
