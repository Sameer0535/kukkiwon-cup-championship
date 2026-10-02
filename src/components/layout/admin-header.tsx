// ==============================================================================
// ADMIN HEADER (Phase 8 Implementation)
// Top bar with Championship Selector, Admin identity, and Logout controls
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Shield, LogOut, Trophy, ChevronDown } from "lucide-react";

export function AdminHeader({ title = "Tournament Management" }: { title?: string }) {
  const router = useRouter();
  const [championships, setChampionships] = React.useState<any[]>([]);
  const [selectedChamp, setSelectedChamp] = React.useState<string>("champ-kukkiwon-2026");

  React.useEffect(() => {
    fetch("/api/admin/championships")
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data.length > 0) {
          setChampionships(data.data);
          setSelectedChamp(data.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {}
    router.push("/admin/login");
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 px-4 sm:px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wide truncate">
          {title}
        </h1>

        {/* Phase 8 Requirement 25: Championship Selector */}
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
          <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
          <div className="relative">
            <select
              value={selectedChamp}
              onChange={(e) => setSelectedChamp(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-700 text-xs font-semibold text-white py-1.5 pl-2.5 pr-8 rounded-lg focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {championships.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name}
                </option>
              ))}
              {championships.length === 0 && (
                <option value="champ-kukkiwon-2026" className="bg-slate-900 text-white">
                  Kukkiwon Cup Championship 2026
                </option>
              )}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Shield className="h-3 w-3" />
          Accredited Admin
        </span>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
        >
          <span className="hidden sm:inline">Public Site</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-900/40 bg-rose-950/20 text-xs font-medium text-rose-300 hover:bg-rose-900/30 hover:border-rose-700 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
