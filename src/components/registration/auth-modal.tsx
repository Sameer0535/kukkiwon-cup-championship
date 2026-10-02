// ==============================================================================
// REGISTRATION AUTHENTICATION MODAL (Requirement 2)
// In-flow authentication modal enabling Save & Resume without losing form state
// ==============================================================================

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Shield, Lock, UserPlus, LogIn, X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; email: string; fullName: string }) => void;
  title?: string;
  subtitle?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Registrant Authentication Required",
  subtitle = "Please sign in or create a championship account to save your draft and track submission status.",
}: AuthModalProps) {
  const [tab, setTab] = React.useState<"login" | "register">("register");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      tab === "login"
        ? { email, password }
        : { email, password, full_name: fullName, phone };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onSuccess({
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.full_name,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0C1222] p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/60"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
            <Shield className="h-4 w-4" />
            <span>Kukkiwon Cup Identity</span>
          </div>
          <h3 className="text-xl font-black uppercase text-white">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{subtitle}</p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError(null);
            }}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              tab === "register"
                ? "bg-[#D4AF37] text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError(null);
            }}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              tab === "login"
                ? "bg-[#D4AF37] text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
        </div>

        {error && (
          <Alert variant="danger" title="Notice">
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <>
              <Input
                label="Full Name *"
                type="text"
                placeholder="e.g. Master Rajesh Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Mobile Number (Optional)"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          <Input
            label="Email Address *"
            type="email"
            placeholder="participant@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password *"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Minimum 6 characters"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full text-xs font-bold uppercase tracking-wider mt-4"
            isLoading={loading}
          >
            {tab === "register" ? (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                <span>Create Account & Continue</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                <span>Sign In & Continue</span>
              </>
            )}
          </Button>
        </form>

        <div className="border-t border-slate-800/80 pt-3 text-center">
          <p className="text-[11px] text-slate-400">
            Your draft data is safely saved in the browser and will immediately link to your account.
          </p>
        </div>
      </div>
    </div>
  );
}
