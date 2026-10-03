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
        "bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20",
      secondary:
        "bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200",
      outline:
        "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300",
      ghost:
        "bg-transparent text-slate-600 hover:bg-blue-50 hover:text-blue-600",
      danger:
        "bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500/20",
      gold:
        "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-extrabold hover:brightness-110 shadow-lg shadow-blue-500/25",
      cyan:
        "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold hover:brightness-110 shadow-lg shadow-cyan-500/20",
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
