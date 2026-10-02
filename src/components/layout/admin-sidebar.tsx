// ==============================================================================
// ADMIN SIDEBAR
// Role-aware navigation for administrative portal
// ==============================================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/branding/brand-logo";
import { ADMIN_NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Trophy,
  ClipboardCheck,
  Users,
  CreditCard,
  FileCheck,
  IdCard,
  FileText,
  ShieldAlert,
  Settings,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Trophy,
  ClipboardCheck,
  Users,
  CreditCard,
  FileCheck,
  IdCard,
  FileText,
  ShieldAlert,
  Settings,
};

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800">
        <BrandLogo variant="compact" />
      </div>

      <div className="px-4 py-3 border-b border-slate-800/80">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
          Championship Admin Portal
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group",
                isActive
                  ? "bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile / session footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white">
            SA
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-semibold text-slate-200 truncate">
              Admin Session
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">
              SUPER_ADMIN
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
