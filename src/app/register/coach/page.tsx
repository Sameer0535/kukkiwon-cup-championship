// ==============================================================================
// COACH REGISTRATION WIZARD (Phase 3 Requirement 7, 10, 11, 13, 14)
// Multi-step intake for accredited corner coaches & delegation officials
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Stepper, StepItem } from "@/components/registration/stepper";
import { AcademySelector } from "@/components/registration/academy-selector";
import { AuthModal } from "@/components/registration/auth-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { CoachDraftData } from "@/types/registration";
import { calculateAge } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  ShieldCheck,
  User,
  Briefcase,
} from "lucide-react";

const STEPS: StepItem[] = [
  { id: 1, title: "Personal Details", shortTitle: "Personal", description: "Identity & Contact" },
  { id: 2, title: "Academy / Team", shortTitle: "Academy", description: "Delegation Linkage" },
  { id: 3, title: "Professional Info", shortTitle: "Credentials", description: "Coaching Dan & License" },
  { id: 4, title: "Review & Submit", shortTitle: "Review", description: "Terms & Declarations" },
];

function CoachRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDraftId = searchParams.get("draftId");

  const [currentStep, setCurrentStep] = React.useState(1);
  const [registrationId, setRegistrationId] = React.useState<string | null>(queryDraftId);
  const [registrationNumber, setRegistrationNumber] = React.useState<string | null>(null);

  // User session state
  const [currentUser, setCurrentUser] = React.useState<{ id: string; email: string; fullName: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<"save" | "submit" | null>(null);

  // Form State
  const [formData, setFormData] = React.useState<CoachDraftData>({
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "MALE",
    nationality: "IND",
    country: "India",
    state: "Delhi",
    city: "New Delhi",
    phone: "",
    email: "",
    photo_url: "",

    academy_id: undefined,
    academy_name: undefined,
    academy_code: undefined,
    is_new_academy: false,

    coach_role: "CORNER_COACH",
    qualification: "National Coach Certificate Level 1",
    kukkiwon_dan_number: "",
    certification_details: "Kukkiwon Dan Certified / WT Coach License",
    experience_years: "5",

    declaration_accurate: false,
    declaration_terms: false,
    declaration_rules: false,
  });

  // Feedback State
  const [loading, setLoading] = React.useState(false);
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = React.useState<string | null>(null);
  const [submittedData, setSubmittedData] = React.useState<any | null>(null);

  React.useEffect(() => {
    checkUserSession();
  }, []);

  React.useEffect(() => {
    if (queryDraftId) {
      loadDraft(queryDraftId);
    }
  }, [queryDraftId]);

  const checkUserSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        setFormData((prev) => ({
          ...prev,
          email: prev.email || data.user.email,
          first_name: prev.first_name || (data.user.fullName?.split(" ")[0] ?? ""),
          last_name: prev.last_name || (data.user.fullName?.split(" ").slice(1).join(" ") ?? ""),
        }));
      }
    } catch {
      // Ignore
    }
  };

  const loadDraft = async (draftId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/registrations/draft?registrationId=${draftId}`);
      const data = await res.json();
      if (data.draft) {
        setRegistrationId(data.draft.id);
        setRegistrationNumber(data.draft.registrationNumber);
        if (data.draft.draftData) {
          setFormData((prev) => ({ ...prev, ...data.draft.draftData }));
        }
      }
    } catch {
      setErrorNotice("Could not load draft.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CoachDraftData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorNotice(null);
    setSaveSuccessNotice(null);
  };

  const validateStep1 = () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrorNotice("First and last name are required.");
      return false;
    }
    if (!formData.date_of_birth) {
      setErrorNotice("Date of birth is required.");
      return false;
    }
    const age = calculateAge(formData.date_of_birth);
    if (age < 18) {
      setErrorNotice("Accredited tournament coaches must be at least 18 years of age.");
      return false;
    }
    if (!formData.email.trim() || !formData.phone.trim()) {
      setErrorNotice("Contact email and mobile number are mandatory.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.academy_id && !formData.is_new_academy) {
      setErrorNotice("Please select an existing recognized academy or request a new club registration.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.coach_role || !formData.qualification.trim()) {
      setErrorNotice("Coaching role and qualification details are required.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setErrorNotice(null);
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setErrorNotice(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveDraft = async () => {
    if (!currentUser) {
      setPendingAction("save");
      setAuthModalOpen(true);
      return;
    }

    setLoading(true);
    setErrorNotice(null);
    setSaveSuccessNotice(null);

    try {
      const res = await fetch("/api/registrations/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          participantType: "COACH",
          draftData: formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save draft.");

      setRegistrationId(data.registrationId);
      setRegistrationNumber(data.registrationNumber);
      setSaveSuccessNotice(`Draft saved successfully with reference [${data.registrationNumber}]. You can return anytime.`);
    } catch (err: any) {
      setErrorNotice(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setPendingAction("submit");
      setAuthModalOpen(true);
      return;
    }

    if (!formData.declaration_accurate || !formData.declaration_terms) {
      setErrorNotice("All mandatory legal declarations and terms must be checked.");
      return;
    }

    setLoading(true);
    setErrorNotice(null);

    try {
      const res = await fetch("/api/registrations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          participantType: "COACH",
          draftData: formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");

      setSubmittedData(data);
    } catch (err: any) {
      setErrorNotice(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (user: { id: string; email: string; fullName: string }) => {
    setCurrentUser(user);
    if (pendingAction === "save") {
      setTimeout(() => handleSaveDraft(), 100);
    } else if (pendingAction === "submit") {
      setTimeout(() => handleSubmit(), 100);
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
            <div className="rounded-2xl border border-[#00E5FF]/40 bg-[#0C1425] p-8 sm:p-12 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[#00E5FF]/20 border-2 border-[#00E5FF] flex items-center justify-center mx-auto text-[#00E5FF]">
                <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <Badge variant="cyan">Official Coach Accreditation Recorded</Badge>
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-white">
                  COACH REGISTRATION SUBMITTED
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Your coach accreditation application has been recorded for technical verification.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Coach Reference:</span>
                  <span className="text-[#00E5FF] font-bold text-sm">
                    {submittedData.registrationNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Coach Name:</span>
                  <span className="text-white font-bold">{submittedData.participantName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Role:</span>
                  <span className="text-white">{submittedData.categoryName}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Status:</span>
                  <Badge variant="cyan">
                    {submittedData.status}
                  </Badge>
                </div>
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
                    <span>Back to Portal</span>
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
  // COACH WIZARD RENDER
  // ----------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 font-sans">
      <PublicHeader />

      <main className="flex-1 py-10 sm:py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="space-y-1">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Registration Selection</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                Coach Accreditation Intake
              </h1>
              <p className="text-xs text-slate-400">
                Kukkiwon Cup 2026 • Official Coach Accreditation
              </p>
            </div>

            {registrationNumber && (
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                  Reference Code
                </span>
                <span className="text-xs font-mono font-bold text-[#00E5FF] bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                  {registrationNumber}
                </span>
              </div>
            )}
          </div>

          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={(s) => setCurrentStep(s)}
          />

          {errorNotice && (
            <Alert variant="danger" title="Notice">
              {errorNotice}
            </Alert>
          )}

          {saveSuccessNotice && (
            <Alert variant="success" title="Draft Saved">
              {saveSuccessNotice}
            </Alert>
          )}

          <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] p-6 sm:p-10 shadow-xl space-y-8">
            {/* STEP 1: PERSONAL INFORMATION */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                    <User className="h-4 w-4 text-[#00E5FF]" />
                    <span>Step 01 — Personal Information</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter the legal identity details of the accompanying coach.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="First Name *"
                    placeholder="e.g. Vikram"
                    value={formData.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    required
                  />
                  <Input
                    label="Middle Name"
                    placeholder="e.g. Singh"
                    value={formData.middle_name}
                    onChange={(e) => updateField("middle_name", e.target.value)}
                  />
                  <Input
                    label="Last Name *"
                    placeholder="e.g. Rathore"
                    value={formData.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => updateField("date_of_birth", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#00E5FF]"
                      required
                    />
                    {formData.date_of_birth && (
                      <span className="text-[11px] text-emerald-400 mt-1 block">
                        Age: {calculateAge(formData.date_of_birth)} yrs (Min 18 required)
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => updateField("gender", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#00E5FF]"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <Input
                    label="Nationality *"
                    value={formData.nationality}
                    onChange={(e) => updateField("nationality", e.target.value)}
                    required
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Mobile Number (WhatsApp) *"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address *"
                    type="email"
                    placeholder="coach@example.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* STEP 2: ACADEMY / TEAM SELECTION */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <AcademySelector
                  selectedAcademyId={formData.academy_id}
                  selectedAcademyName={formData.academy_name}
                  selectedAcademyCode={formData.academy_code}
                  isNewAcademy={formData.is_new_academy}
                  newAcademyData={formData.new_academy_data}
                  onChange={(res) => {
                    setFormData((prev) => ({
                      ...prev,
                      academy_id: res.academy_id,
                      academy_name: res.academy_name,
                      academy_code: res.academy_code,
                      is_new_academy: res.is_new_academy,
                      new_academy_data: res.new_academy_data,
                    }));
                  }}
                />
              </div>
            )}

            {/* STEP 3: PROFESSIONAL INFORMATION */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[#00E5FF]" />
                    <span>Step 03 — Professional Coaching Qualifications</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Provide recognized credentials and tournament delegation role.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Role within Academy / Delegation *
                    </label>
                    <select
                      value={formData.coach_role}
                      onChange={(e) => updateField("coach_role", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#00E5FF]"
                    >
                      <option value="HEAD_COACH">Head Coach</option>
                      <option value="CORNER_COACH">Accredited Corner Coach</option>
                      <option value="ASSISTANT_COACH">Assistant Coach</option>
                      <option value="TEAM_MANAGER">Team Manager / Delegation Leader</option>
                    </select>
                  </div>

                  <Input
                    label="Years of Coaching Experience"
                    type="number"
                    min="1"
                    placeholder="e.g. 8"
                    value={formData.experience_years || ""}
                    onChange={(e) => updateField("experience_years", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Coaching Qualification / Certification *"
                    placeholder="e.g. National Coach Course Level 1 / WT Coach License"
                    value={formData.qualification}
                    onChange={(e) => updateField("qualification", e.target.value)}
                    required
                  />

                  <Input
                    label="Kukkiwon Dan Number (Where Applicable)"
                    placeholder="e.g. 05123984"
                    value={formData.kukkiwon_dan_number || ""}
                    onChange={(e) => updateField("kukkiwon_dan_number", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Additional Certification Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="List official seminars, sports medicine, or referee qualifications..."
                    value={formData.certification_details || ""}
                    onChange={(e) => updateField("certification_details", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & DECLARATIONS */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#00E5FF]" />
                    <span>Step 04 — Review & Declarations</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Confirm your coach accreditation details.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="font-bold text-[#00E5FF] uppercase block">
                      1. Coach Profile
                    </span>
                    <div className="space-y-1 text-slate-300">
                      <div>Name: <span className="font-bold text-white">{formData.first_name} {formData.last_name}</span></div>
                      <div>DOB: {formData.date_of_birth} ({calculateAge(formData.date_of_birth)} yrs)</div>
                      <div>Contact: {formData.phone} • {formData.email}</div>
                      <div>City/State: {formData.city}, {formData.state}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="font-bold text-[#D4AF37] uppercase block">
                      2. Academy & Credentials
                    </span>
                    <div className="space-y-1 text-slate-300">
                      <div>Academy: <span className="font-bold text-white">{formData.academy_name || "New Academy"}</span></div>
                      <div>Role: <span className="font-bold text-white">{formData.coach_role}</span></div>
                      <div>Qualification: {formData.qualification}</div>
                      <div>Kukkiwon Dan: {formData.kukkiwon_dan_number || "N/A"}</div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-800 bg-[#0C1222] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#00E5FF]">
                    Accredited Coach Undertaking
                  </h4>
                  <div className="space-y-3 text-xs text-slate-300">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.declaration_accurate}
                        onChange={(e) => updateField("declaration_accurate", e.target.checked)}
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-[#00E5FF] focus:ring-[#00E5FF]"
                      />
                      <span>
                        I confirm that the credentials and experience provided are true and complete.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.declaration_terms}
                        onChange={(e) => updateField("declaration_terms", e.target.checked)}
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-[#00E5FF] focus:ring-[#00E5FF]"
                      />
                      <span>
                        I agree to uphold official World Taekwondo coach decorum and accept the tournament terms and disciplinary regulations.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-6">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleBack}
                    className="w-full sm:w-auto text-xs uppercase font-bold text-slate-300 border-slate-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    <span>Back</span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={handleSaveDraft}
                  isLoading={loading && pendingAction === "save"}
                  className="w-full sm:w-auto text-xs uppercase font-bold text-[#00E5FF] hover:bg-slate-900"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  <span>Save & Continue Later</span>
                </Button>
              </div>

              <div className="w-full sm:w-auto">
                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleNext}
                    className="w-full sm:w-auto text-xs uppercase font-bold bg-[#00E5FF] text-slate-950 hover:bg-[#00cce6]"
                  >
                    <span>Proceed to Step 0{currentStep + 1}</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={loading && pendingAction !== "save"}
                    disabled={!formData.declaration_accurate || !formData.declaration_terms}
                    className="w-full sm:w-auto text-xs uppercase font-bold bg-[#00E5FF] text-slate-950 hover:bg-[#00cce6]"
                  >
                    <span>Submit Coach Registration</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        title={pendingAction === "save" ? "Sign In to Save Coach Draft" : "Sign In to Submit Coach Registration"}
        subtitle="Your coach profile will be securely tied to your championship user account."
      />
    </div>
  );
}

export default function CoachRegistrationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070B14]">
          <div className="animate-spin w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full" />
        </div>
      }
    >
      <CoachRegistrationContent />
    </React.Suspense>
  );
}

