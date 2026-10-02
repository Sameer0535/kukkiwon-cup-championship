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
    info: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    danger: "border-red-500/30 bg-red-500/10 text-red-200",
  };

  const icons = {
    info: <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />,
    danger: <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-sm shadow-md",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-bold tracking-tight text-white">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}
