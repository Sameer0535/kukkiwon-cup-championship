// ==============================================================================
// PUBLIC HEADER
// Displays dual-branding (Kukkiwon North India x Kyorix Sport Technology)
// ==============================================================================

import Link from "next/link";
import { BrandLogo } from "@/components/branding/brand-logo";
import { PUBLIC_NAV_ITEMS } from "@/config/navigation";
import { ShieldCheck, UserCog } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Dual Brand Presentation */}
        <BrandLogo variant="combined" />

        {/* Public Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-semibold tracking-wider text-slate-300 hover:text-sky-400 transition-colors uppercase"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/verify/demo-token"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Verify QR</span>
          </Link>

          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all"
          >
            <UserCog className="h-4 w-4 text-sky-400" />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
