// ==============================================================================
// 404 NOT FOUND PAGE (Requirement 28)
// Dignified institutional error screen matching Kukkiwon Cup identity
// ==============================================================================

import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl border border-slate-800 bg-[#0C1222] p-4 text-amber-400 shadow-xl mx-auto">
            <ShieldAlert className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">
              Error 404 • Resource Not Found
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
              Page Not Found
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              The requested tournament document, registration slug, or championship page could not be located
              within the official directory.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="gold" size="md" className="w-full text-xs uppercase font-bold tracking-wider px-6">
                <Home className="h-4 w-4 mr-1.5" />
                <span>Return to Homepage</span>
              </Button>
            </Link>

            <Link href="/contact" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full text-xs uppercase font-bold tracking-wider px-6 border-slate-700 text-slate-300">
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
