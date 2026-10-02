// ==============================================================================
// BADGE COMPONENT
// Status and accreditation tags
// ==============================================================================

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "gold"
    | "cyan"
    | "outline";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-800 text-slate-300 border-slate-700/80",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    gold: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30",
    outline: "bg-transparent text-slate-400 border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Maps registration status string to matching badge variant
 */
export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    CONFIRMED: { variant: "success", label: "Confirmed" },
    PAID: { variant: "info", label: "Paid" },
    PENDING_PAYMENT: { variant: "warning", label: "Pending Payment" },
    UNDER_REVIEW: { variant: "warning", label: "Under Review" },
    DRAFT: { variant: "default", label: "Draft" },
    PAYMENT_FAILED: { variant: "danger", label: "Payment Failed" },
    REJECTED: { variant: "danger", label: "Rejected" },
    CANCELLED: { variant: "outline", label: "Cancelled" },
    GENERATED: { variant: "success", label: "Card Active" },
    REISSUED: { variant: "cyan", label: "Reissued" },
    REVOKED: { variant: "danger", label: "Revoked" },
    NOT_GENERATED: { variant: "default", label: "Not Issued" },
    VERIFIED: { variant: "success", label: "Verified" },
    PENDING: { variant: "warning", label: "Pending" },
    UPLOADED: { variant: "info", label: "Uploaded" },
  };

  const item = statusMap[status] || { variant: "default", label: status };

  return <Badge variant={item.variant}>{item.label}</Badge>;
}
