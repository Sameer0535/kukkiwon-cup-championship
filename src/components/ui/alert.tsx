// ==============================================================================
// ALERT COMPONENT
// ==============================================================================

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const variantStyles = {
    info: "border-sky-300 bg-sky-50 text-sky-950 shadow-xs",
    success: "border-emerald-300 bg-emerald-50 text-emerald-950 shadow-xs",
    warning: "border-amber-300 bg-amber-50 text-amber-950 shadow-xs",
    danger: "border-red-300 bg-red-50 text-red-950 shadow-xs",
  };

  const titleStyles = {
    info: "text-sky-950 font-bold tracking-tight",
    success: "text-emerald-950 font-bold tracking-tight",
    warning: "text-amber-950 font-bold tracking-tight",
    danger: "text-red-950 font-black tracking-tight",
  };

  const bodyStyles = {
    info: "text-sky-900 font-medium",
    success: "text-emerald-900 font-medium",
    warning: "text-amber-900 font-medium",
    danger: "text-red-900 font-semibold",
  };

  const icons = {
    info: <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />,
    danger: <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-sm",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-1">
        {title && <h5 className={cn("text-sm", titleStyles[variant])}>{title}</h5>}
        <div className={cn("text-xs leading-relaxed", bodyStyles[variant])}>{children}</div>
      </div>
    </div>
  );
}
