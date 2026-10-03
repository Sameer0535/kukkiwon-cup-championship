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
    default: "bg-slate-100 text-slate-800 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    gold: "bg-blue-50 text-blue-700 border-blue-200 font-bold",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200 font-bold",
    outline: "bg-white text-slate-700 border-slate-300",
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
