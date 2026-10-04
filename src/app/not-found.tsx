// ==============================================================================
// 404 NOT FOUND PAGE
// Dignified institutional error screen matching Kukkiwon Cup White & Blue theme
// ==============================================================================

import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70 text-slate-900 font-sans">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-600 shadow-sm mx-auto">
            <ShieldAlert className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest block">
              Error 404 • Resource Not Found
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-950">
              Page Not Found
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              The requested tournament document, registration slug, or championship page could not be located
              within the official directory.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full text-xs uppercase font-bold tracking-wider px-6 bg-blue-600 hover:bg-blue-700 text-white">
                <Home className="h-4 w-4 mr-1.5" />
                <span>Return to Homepage</span>
              </Button>
            </Link>

            <Link href="/contact" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full text-xs uppercase font-bold tracking-wider px-6 border-slate-300 text-slate-700 hover:bg-slate-100">
                <span>Contact Secretariat</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
