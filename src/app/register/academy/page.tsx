// ==============================================================================
// ACADEMY / TEAM REGISTRATION (Phase 3 Requirements 8, 9, 10, 14)
// Institutional registration for clubs, dojangs, and teams with duplicate protection
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { AuthModal } from "@/components/registration/auth-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { AcademyDraftData, Academy } from "@/types/registration";
import {
  Building2,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Save,
} from "lucide-react";

export default function AcademyRegistrationPage() {
  const router = useRouter();

  // User session
  const [currentUser, setCurrentUser] = React.useState<{ id: string; email: string; fullName: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<"save" | "submit" | null>(null);

  // Form State
  const [formData, setFormData] = React.useState<AcademyDraftData>({
    name: "",
    short_name: "",
    country: "India",
    state: "Delhi",
    city: "New Delhi",
    address: "",
    email: "",
    phone: "",
    website: "",
    head_coach_name: "",

    representative_first_name: "",
    representative_last_name: "",
    representative_email: "",
    representative_phone: "",
    representative_role: "Head Coach / Academy Director",

    declaration_accurate: false,
    declaration_terms: false,
  });

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = React.useState(false);
  const [duplicateMatches, setDuplicateMatches] = React.useState<Academy[]>([]);

  // Feedback State
  const [loading, setLoading] = React.useState(false);
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null);
  const [submittedData, setSubmittedData] = React.useState<any | null>(null);

  React.useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        setFormData((prev) => ({
          ...prev,
          representative_email: prev.representative_email || data.user.email,
          representative_first_name: prev.representative_first_name || (data.user.fullName?.split(" ")[0] ?? ""),
          representative_last_name: prev.representative_last_name || (data.user.fullName?.split(" ").slice(1).join(" ") ?? ""),
        }));
      }
    } catch {
      // Ignore
    }
  };

  const updateField = (field: keyof AcademyDraftData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorNotice(null);

    // Duplicate check on name & city
    if (field === "name" || field === "city") {
      const n = field === "name" ? value : formData.name;
      const c = field === "city" ? value : formData.city;
      checkDuplicate(n, c);
    }
  };

  const checkDuplicate = async (name: string, city: string) => {
    if (name.length < 3 || city.length < 2) {
      setDuplicateWarning(false);
      setDuplicateMatches([]);
      return;
    }

    try {
      const res = await fetch("/api/academies/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, country: formData.country, email: formData.email }),
      });
      const data = await res.json();
      if (data.isDuplicate && data.matches?.length > 0) {
        setDuplicateMatches(data.matches);
        setDuplicateWarning(true);
      } else {
        setDuplicateWarning(false);
        setDuplicateMatches([]);
      }
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.city.trim() || !formData.state.trim()) {
      setErrorNotice("Academy Name, City, and State are mandatory.");
      return;
    }

    if (!formData.representative_first_name.trim() || !formData.representative_email.trim()) {
      setErrorNotice("Official representative details are mandatory.");
      return;
    }

    if (!formData.declaration_accurate || !formData.declaration_terms) {
      setErrorNotice("Please confirm all required declarations and agreements.");
      return;
    }

    if (!currentUser) {
      setPendingAction("submit");
      setAuthModalOpen(true);
      return;
    }

    setLoading(true);
    setErrorNotice(null);

    try {
      const res = await fetch("/api/academies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Academy registration failed.");

      // Also create registration record for dashboard tracking
      await fetch("/api/registrations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantType: "ACADEMY_TEAM",
          draftData: formData,
        }),
      });

      setSubmittedData(data.academy);
    } catch (err: any) {
      setErrorNotice(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (user: { id: string; email: string; fullName: string }) => {
    setCurrentUser(user);
    if (pendingAction === "submit") {
      setTimeout(() => {
        const dummyForm = document.getElementById("academy-form") as HTMLFormElement;
        if (dummyForm) dummyForm.requestSubmit();
      }, 100);
    }
    setPendingAction(null);
  };

  // ----------------------------------------------------------------------------
  // CONFIRMATION SCREEN
  // ----------------------------------------------------------------------------
  if (submittedData) {
    return (
      <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 font-sans">
        <PublicHeader />
        <main className="flex-1 py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="rounded-2xl border border-slate-700 bg-[#0C1425] p-8 sm:p-12 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <Badge variant="gold">Institutional Dojang Record Created</Badge>
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-white">
                  ACADEMY REGISTERED
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Your academy or team has been enrolled into the official Kukkiwon Cup directory.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Academy Code:</span>
                  <span className="text-[#D4AF37] font-bold text-sm">
                    {submittedData.code}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Academy Name:</span>
                  <span className="text-white font-bold">{submittedData.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">City / State:</span>
                  <span className="text-white">{submittedData.city}, {submittedData.state}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Status:</span>
                  <Badge variant="cyan">
                    {submittedData.status}
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0A0F1D] border border-slate-800 text-xs text-slate-400 text-left space-y-1">
                <span className="font-bold text-white block">Next Steps for Academy Managers:</span>
                <p>
                  Share your unique Academy Code (<span className="text-[#D4AF37] font-mono">{submittedData.code}</span>) with your students and coaches. When registering, they can search and select your academy directly.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <Link href="/my-registration" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full text-xs font-bold uppercase">
                    <span>View in My Registrations</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full text-xs font-bold uppercase border-slate-700">
                    <span>Register Competitors</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // ACADEMY FORM RENDER
  // ----------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 font-sans">
      <PublicHeader />

      <main className="flex-1 py-10 sm:py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <div className="space-y-1 border-b border-slate-800 pb-6">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Registration Selection</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
              Academy & Team Registration
            </h1>
            <p className="text-xs text-slate-400">
              Kukkiwon Cup 2026 • Official Organization & Dojang Profile Intake
            </p>
          </div>

          {errorNotice && (
            <Alert variant="danger" title="Notice">
              {errorNotice}
            </Alert>
          )}

          {/* DUPLICATE WARNING BOX */}
          {duplicateWarning && duplicateMatches.length > 0 && (
            <div className="p-5 rounded-2xl border border-amber-500/50 bg-amber-950/20 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-200 uppercase">
                    An academy with similar information already exists.
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    We found an existing recognized academy in our directory. To prevent duplicate team accounts, verify if your club is already registered:
                  </p>
                </div>
              </div>

              <div className="space-y-2 pl-8">
                {duplicateMatches.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{m.name}</span>
                      <span className="text-slate-400 ml-2">({m.city}, {m.state})</span>
                      <span className="text-[#D4AF37] font-mono ml-2">[{m.code}]</span>
                    </div>
                    <Link href={`/register/athlete`}>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        className="text-[10px] uppercase font-bold py-1 h-7"
                      >
                        Register Athletes Under This Academy
                      </Button>
                    </Link>
                  </div>
                ))}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setDuplicateWarning(false)}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    Continue with new academy registration anyway
                  </button>
                </div>
              </div>
            </div>
          )}

          <form id="academy-form" onSubmit={handleSubmit} className="space-y-8">
            {/* 1. ORGANIZATION INFORMATION */}
            <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#D4AF37]" />
                  <span>1. Organization Information</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official club details for accreditation and certificate issuance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Official Academy / Team Name *"
                    placeholder="e.g. Dynamic Tiger Taekwondo Dojang"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Short Name / Acronym"
                  placeholder="e.g. DTTD Delhi"
                  value={formData.short_name || ""}
                  onChange={(e) => updateField("short_name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Country *"
                  value={formData.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  required
                />
                <Input
                  label="State / Province *"
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  required
                />
                <Input
                  label="City *"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Dojang Full Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street address, building, sports center name..."
                  value={formData.address || ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Official Email *"
                  type="email"
                  placeholder="academy@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
                <Input
                  label="Official Phone *"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  required
                />
                <Input
                  label="Website / Social URL (Optional)"
                  placeholder="https://mytaekwondo.com"
                  value={formData.website || ""}
                  onChange={(e) => updateField("website", e.target.value)}
                />
              </div>

              <Input
                label="Head Coach / Grandmaster Name *"
                placeholder="e.g. Grandmaster Sun-Woo Park (7th Dan)"
                value={formData.head_coach_name}
                onChange={(e) => updateField("head_coach_name", e.target.value)}
                required
              />
            </div>

            {/* 2. REPRESENTATIVE INFORMATION */}
            <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[#00E5FF]" />
                  <span>2. Official Representative Information</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The primary authorized point of contact for tournament notifications and inquiries.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Representative First Name *"
                  placeholder="e.g. Rajesh"
                  value={formData.representative_first_name}
                  onChange={(e) => updateField("representative_first_name", e.target.value)}
                  required
                />
                <Input
                  label="Representative Last Name *"
                  placeholder="e.g. Sharma"
                  value={formData.representative_last_name}
                  onChange={(e) => updateField("representative_last_name", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Representative Email *"
                  type="email"
                  placeholder="rep@example.com"
                  value={formData.representative_email}
                  onChange={(e) => updateField("representative_email", e.target.value)}
                  required
                />
                <Input
                  label="Representative Phone *"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.representative_phone}
                  onChange={(e) => updateField("representative_phone", e.target.value)}
                  required
                />
                <Input
                  label="Position / Role *"
                  placeholder="e.g. Academy Secretary / Manager"
                  value={formData.representative_role}
                  onChange={(e) => updateField("representative_role", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 3. DECLARATIONS & SUBMIT */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0C1222] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Institutional Undertaking
              </h4>
              <div className="space-y-3 text-xs text-slate-300">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.declaration_accurate}
                    onChange={(e) => updateField("declaration_accurate", e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span>
                    I confirm that I am authorized to register this academy and that all provided organization credentials are true and accurate.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.declaration_terms}
                    onChange={(e) => updateField("declaration_terms", e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span>
                    I accept the Kukkiwon Cup 2026 Championship regulations and agree to manage our club participants in accordance with official technical guidelines.
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  disabled={!formData.declaration_accurate || !formData.declaration_terms}
                  className="text-xs uppercase font-bold"
                >
                  <span>Submit Academy Registration</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <PublicFooter />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        title="Sign In to Register Academy"
        subtitle="Creating an account will assign you as the administrator of this academy."
      />
    </div>
  );
}
