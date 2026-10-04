// ==============================================================================
// GLOBAL ERROR BOUNDARY
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/70 p-6 text-slate-900 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600 shadow-sm mx-auto">
          <AlertCircle className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-red-600 uppercase tracking-widest block">
            System Notice
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-950">
            An Unexpected Error Occurred
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            The championship platform encountered a temporary processing condition.
            No tournament records were affected.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            variant="primary"
            size="md"
            className="w-full sm:w-auto text-xs uppercase font-bold tracking-wider px-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            <span>Try Again</span>
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full text-xs uppercase font-bold tracking-wider px-6 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <Home className="h-4 w-4 mr-1.5" />
              <span>Return Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
