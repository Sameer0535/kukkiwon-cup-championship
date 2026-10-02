"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Award,
  Loader2,
  CheckCircle2,
  Flag,
} from "lucide-react";
import type { PublicAthleteVerification } from "@/types/id-card";

export function ManualVerifyBox() {
  const [athleteId, setAthleteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicAthleteVerification | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = athleteId.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setResult(null);
    setErrorMessage(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/verify/athlete-id/${encodeURIComponent(cleanId)}`, {
        headers: { Accept: "application/json" },
      });

      if (res.status === 429) {
        setErrorMessage("Rate limit exceeded. Please wait a minute before searching again.");
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setErrorMessage("Unable to connect to verification server. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0A192F]/60 p-5 space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
        <Search className="h-4 w-4" />
        <span>Manual Accreditation Lookup</span>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value.toUpperCase())}
            placeholder="Enter Athlete ID (e.g. KKC26-ATH-000001)"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !athleteId.trim()}
          className="px-5 py-2.5 rounded-lg bg-[#D4AF37] text-slate-950 text-xs font-black uppercase tracking-wider hover:bg-[#b89528] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify</span>
          )}
        </button>
      </form>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {searched && result && (
        <div className="pt-3 border-t border-slate-800">
          {result.isValid && result.status === "VERIFIED" ? (
            <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                  <ShieldCheck className="h-4 w-4" />
                  <span>✓ VERIFIED ATHLETE</span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Card V{result.card?.version || result.version || 1}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="relative h-20 w-16 rounded-lg border border-[#D4AF37] bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                  {result.athlete?.photoUrl || result.photoUrl ? (
                    <Image
                      src={result.athlete?.photoUrl || result.photoUrl || ""}
                      alt={result.athlete?.name || result.athleteName || "Athlete Photo"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Award className="h-6 w-6 text-[#D4AF37]" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-[10px] font-mono text-slate-400">
                    {result.athlete?.athleteId || result.athleteId}
                  </div>
                  <div className="text-base font-black text-white uppercase truncate">
                    {result.athlete?.name || result.athleteName}
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2">
                    <Flag className="h-3 w-3 text-amber-400" />
                    <span>{result.athlete?.country || result.country || "India"}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-semibold truncate">
                      {result.athlete?.category || result.categoryName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {result.athlete?.academy || result.academyName || "Independent"}
                  </div>
                </div>
              </div>
            </div>
          ) : result.status === "REVOKED" ? (
            <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide">
                <ShieldX className="h-4 w-4" />
                <span>ID CARD REVOKED</span>
              </div>
              <p className="text-xs text-slate-300">
                This accreditation card is no longer valid.
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                Athlete ID: {result.athlete?.athleteId || result.athleteId || athleteId}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
                <ShieldAlert className="h-4 w-4" />
                <span>ACCREDITATION NOT FOUND</span>
              </div>
              <p className="text-xs text-slate-400">
                The athlete ID could not be verified in the championship registry.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
