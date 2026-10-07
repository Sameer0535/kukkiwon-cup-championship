// ==============================================================================
// ADMIN LOGIN PORTAL (Phase 8 Production Hardened)
// Secure administrative authentication backed by real server-side API
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Lock, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("admin@kukkiwoncup.org");
  const [password, setPassword] = React.useState("admin123456");
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      // Store bearer token for authorization header support across tabs and sessions
      if (data.token) {
        sessionStorage.setItem("kukkiwon_admin_bearer", data.token);
        localStorage.setItem("kukkiwon_admin_bearer", data.token);
      }

      router.push("/admin");
    } catch {
      setErrorMessage("Network error connecting to administrative authentication service.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#060D1A] p-4 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <BrandLogo variant="combined" className="justify-center" />
          </Link>
          <div className="pt-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-bold">
              Accredited Tournament Administration
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
              Championship Admin Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Authorized access for tournament directors, registrars, and finance officers
            </p>
          </div>
        </div>

        {/* Login Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5">
          {errorMessage && (
            <Alert variant="danger" title="Access Denied">
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Official Administrator Email"
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
              className="w-full uppercase font-bold tracking-wider mt-2 bg-[#D4AF37] text-slate-950 hover:bg-[#b89528]"
              isLoading={loading}
            >
              <Lock className="h-4 w-4 mr-2" />
              <span>Authenticate Session</span>
            </Button>
          </form>

          {/* Security policy note */}
          <div className="border-t border-slate-800/80 pt-4 text-center space-y-2">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Public registration is disabled. Administrative accounts are strictly provisioned server-side with role-based permissions.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
