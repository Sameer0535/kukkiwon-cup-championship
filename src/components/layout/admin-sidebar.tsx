// ==============================================================================
// ADMIN SIDEBAR
// Role-aware navigation for administrative portal
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/branding/brand-logo";
import { ADMIN_NAV_ITEMS } from "@/config/navigation";
import { useAdminNav } from "@/components/layout/admin-nav-context";
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
  Building2,
  X,
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
  Building2,
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAdminNav();

  // Close drawer on path change
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  // Handle escape key and prevent body scroll when open on mobile
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };

    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen, setSidebarOpen]);

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
        <BrandLogo variant="compact" />
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
          aria-label="Close admin navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700">
          Championship Admin Portal
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto bg-white">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group min-h-[44px]",
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile / session footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
            SA
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-semibold text-slate-900 truncate">
              Admin Session
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">
              SUPER_ADMIN
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white flex-col shrink-0 min-h-screen shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Visible on screens < lg when opened) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Drawer */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] border-r border-slate-200 bg-white flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

