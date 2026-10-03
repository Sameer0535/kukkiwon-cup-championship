// ==============================================================================
// NAVIGATION CONFIGURATION - PUBLIC VS ADMIN ARCHITECTURE
// Clean separation of Public vs Protected Admin Experiences (Requirement 21)
// ==============================================================================

import { AdminRole } from "@/types";

export interface NavItem {
  title: string;
  href: string;
  badge?: string;
}

export interface AdminNavItem {
  title: string;
  href: string;
  icon: string;
  requiredRole?: AdminRole[];
  description: string;
}

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "About", href: "/about" },
  { title: "Championship", href: "/championship/kukkiwon-cup-2026" },
  { title: "Information", href: "/#information" },
  { title: "Contact", href: "/contact" },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    title: "Overview",
    href: "/admin",
    icon: "LayoutDashboard",
    description: "System health, live registrations, and analytics",
  },
  {
    title: "Championships",
    href: "/admin/championships",
    icon: "Trophy",
    requiredRole: ["SUPER_ADMIN", "EVENT_ADMIN"],
    description: "Manage tournament editions, dates, fees, and rules",
  },
  {
    title: "Registrations",
    href: "/admin/registrations",
    icon: "ClipboardCheck",
    requiredRole: ["SUPER_ADMIN", "EVENT_ADMIN", "REGISTRATION_ADMIN"],
    description: "Review, approve, or reject participant entries",
  },
  {
    title: "Participants",
    href: "/admin/participants",
    icon: "Users",
    requiredRole: ["SUPER_ADMIN", "EVENT_ADMIN", "REGISTRATION_ADMIN"],
    description: "Master directory and accreditation records",
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: "CreditCard",
    requiredRole: ["SUPER_ADMIN", "EVENT_ADMIN", "FINANCE_ADMIN"],
    description: "Payment verification, transaction logs, and receipts",
  },
  {
    title: "Document Verification",
    href: "/admin/documents",
    icon: "FileCheck",
    requiredRole: ["SUPER_ADMIN", "DOCUMENT_ADMIN", "REGISTRATION_ADMIN"],
    description: "Review private identity and Kukkiwon Dan certificates",
  },
  {
    title: "ID Cards & Badges",
    href: "/admin/id-cards",
    icon: "IdCard",
    requiredRole: ["SUPER_ADMIN", "EVENT_ADMIN", "REGISTRATION_ADMIN"],
    description: "Batch generation, QR accreditation, and badge print",
  },
  {
    title: "Content & CMS",
    href: "/admin/content",
    icon: "FileText",
    requiredRole: ["SUPER_ADMIN", "EVENT_ADMIN", "REGISTRAR", "FINANCE_ADMIN", "VIEWER"],
    description: "Publish announcements, edit hero text, and terms",
  },
  {
    title: "Audit Logs",
    href: "/admin/audit",
    icon: "ShieldAlert",
    requiredRole: ["SUPER_ADMIN"],
    description: "Immutable security trail of administrative actions",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: "Settings",
    requiredRole: ["SUPER_ADMIN"],
    description: "Gateways, storage buckets, and security secrets",
  },
];
