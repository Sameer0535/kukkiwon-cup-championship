// ==============================================================================
// BUTTON COMPONENT
// ==============================================================================

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold" | "cyan";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-sky-500 text-slate-950 font-semibold hover:bg-sky-400 shadow-md shadow-sky-500/20",
      secondary:
        "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/60",
      outline:
        "border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800/80 hover:border-slate-600",
      ghost:
        "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white",
      danger:
        "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
      gold:
        "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-amber-500/20",
      cyan:
        "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-cyan-500/20",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
