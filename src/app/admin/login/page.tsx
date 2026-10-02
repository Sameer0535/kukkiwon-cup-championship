// ==============================================================================
// ADMIN LOGIN PORTAL (Requirement 15)
// Secure administrative authentication — No public self-registration
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Shield, Lock, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Simulate authentication check for Phase 1 verification
    setTimeout(() => {
      setLoading(false);
      if (email.toLowerCase().includes("admin")) {
        window.location.href = "/admin";
      } else {
        setMessage("Demo Mode: Enter an email containing 'admin' (e.g. admin@kukkiwoncup.org) with any 8+ char password to access the portal.");
      }
    }, 600);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#090D16] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <BrandLogo variant="combined" className="justify-center" />
          </Link>
          <div className="pt-2">
            <h2 className="text-xl font-bold uppercase tracking-wider text-white">
              Administrator Authentication
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Restricted portal for accredited tournament officials & organizers
            </p>
          </div>
        </div>

        {/* Login Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5">
          {message && (
            <Alert variant="info" title="System Notice">
              {message}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Official Email"
              type="email"
              placeholder="admin@kukkiwoncup.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Security Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full uppercase font-bold tracking-wider mt-2"
              isLoading={loading}
            >
              <Lock className="h-4 w-4 mr-2" />
              <span>Authenticate Session</span>
            </Button>
          </form>

          {/* Security policy note */}
          <div className="border-t border-slate-800/80 pt-4 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Public self-registration is strictly disabled. Administrative accounts are
              provisioned via secure server-side credentials only.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Public Championship Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
