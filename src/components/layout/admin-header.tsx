// ==============================================================================
// ADMIN HEADER
// Top bar with breadcrumb context, quick actions, and public site shortcut
// ==============================================================================

import Link from "next/link";
import { ExternalLink, Shield } from "lucide-react";

export function AdminHeader({ title = "Tournament Management" }: { title?: string }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 px-6 flex items-center justify-between backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
          {title}
        </h1>
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Shield className="h-3 w-3" />
          Protected Environment
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
        >
          <span>View Public Site</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}
