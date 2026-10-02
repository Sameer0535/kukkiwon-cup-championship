// ==============================================================================
// GLOBAL ERROR BOUNDARY (Requirement 28)
// Client error screen matching official Kukkiwon Cup design system
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Tournament Platform Error]:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070B14] p-6 text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 shadow-xl mx-auto">
          <AlertCircle className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest block">
            System Notice
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
            An Unexpected Error Occurred
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            The championship platform encountered a temporary processing condition.
            No tournament records were affected.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            variant="gold"
            size="md"
            className="w-full sm:w-auto text-xs uppercase font-bold tracking-wider px-6"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            <span>Try Again</span>
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full text-xs uppercase font-bold tracking-wider px-6 border-slate-700 text-slate-300"
            >
              <Home className="h-4 w-4 mr-1.5" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
