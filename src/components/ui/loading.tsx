// ==============================================================================
// LOADING COMPONENT
// Spinner, skeleton loaders, and full-page loading screens
// ==============================================================================

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  return (
    <Loader2
      className={cn("animate-spin text-sky-400", sizeMap[size], className)}
    />
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-800/80", className)}
      {...props}
    />
  );
}

export function PageLoader({ text = "Loading tournament data..." }: { text?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-xs font-medium text-slate-400 animate-pulse">{text}</p>
    </div>
  );
}
