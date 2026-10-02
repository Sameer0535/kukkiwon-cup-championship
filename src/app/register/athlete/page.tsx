// ==============================================================================
// ATHLETE REGISTRATION WIZARD (Phase 3 Requirement 3, 4, 5, 6, 11, 13, 14)
// Multi-step intake with category eligibility engine, draft persistence, and review
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Stepper, StepItem } from "@/components/registration/stepper";
import { AcademySelector } from "@/components/registration/academy-selector";
import { DocumentChecklist } from "@/components/registration/document-checklist";
import { AuthModal } from "@/components/registration/auth-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  AthleteDraftData,
  Category,
  RegistrationStatus,
} from "@/types/registration";
import { calculateAge } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Award,
  Clock,
  User,
  Calendar,
} from "lucide-react";

const STEPS: StepItem[] = [
  { id: 1, title: "Personal Details", shortTitle: "Personal", description: "Identity & DOB" },
  { id: 2, title: "Academy / Dojang", shortTitle: "Academy", description: "Club affiliation" },
  { id: 3, title: "Discipline & Category", shortTitle: "Category", description: "Division matching" },
  { id: 4, title: "Document Readiness", shortTitle: "Documents", description: "Accreditation checklist" },
  { id: 5, title: "Review & Submit", shortTitle: "Review", description: "Terms & confirmation" },
];

function AthleteRegistrationContent() {
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
  const [formData, setFormData] = React.useState<AthleteDraftData>({
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

    discipline: "KYORUGI",
    division: "SENIOR",
    category_id: "",
    belt_rank: "1ST_DAN_BLACK",
    kukkiwon_dan_number: "",
    weight_kg: "58.0",

    documents_checked: {
      gov_id: false,
      dob_proof: false,
      kukkiwon_cert: false,
      athlete_photo: false,
      medical_fitness: false,
    },

    declaration_accurate: false,
    declaration_terms: false,
    declaration_rules: false,
  });

  // Dynamic Categories from Server
  const [availableCategories, setAvailableCategories] = React.useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(false);
  const [categoryError, setCategoryError] = React.useState<string | null>(null);

  // Status & Feedback State
  const [loading, setLoading] = React.useState(false);
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = React.useState<string | null>(null);
  const [submittedData, setSubmittedData] = React.useState<any | null>(null);

  // 1. Check user session on mount
  React.useEffect(() => {
    checkUserSession();
  }, []);

  // 2. If draftId exists in query, load draft
  React.useEffect(() => {
    if (queryDraftId) {
      loadDraft(queryDraftId);
    }
  }, [queryDraftId]);

  // 3. Load eligible categories when DOB, gender, discipline, weight, or belt changes
  React.useEffect(() => {
    if (formData.discipline && formData.date_of_birth) {
      fetchEligibleCategories();
    }
  }, [
    formData.discipline,
    formData.date_of_birth,
    formData.gender,
    formData.belt_rank,
    formData.weight_kg,
  ]);

  const checkUserSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        // Pre-fill email if empty
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
    } catch (err: any) {
      setErrorNotice("Could not load draft. You may need to sign in to access your drafts.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleCategories = async () => {
    setLoadingCategories(true);
    setCategoryError(null);
    try {
      const params = new URLSearchParams({
        discipline: formData.discipline,
        dob: formData.date_of_birth,
        gender: formData.gender,
        belt: formData.belt_rank || "",
        weight: formData.weight_kg || "",
      });

      const res = await fetch(`/api/categories?${params.toString()}`);
      const data = await res.json();

      if (data.categories) {
        setAvailableCategories(data.categories);
        // If current selected category is not in eligible list, reset or select first
        if (
          formData.category_id &&
          !data.categories.some((c: Category) => c.id === formData.category_id || c.code === formData.category_id)
        ) {
          setFormData((prev) => ({ ...prev, category_id: "" }));
        }
      }
    } catch {
      setCategoryError("Could not calculate eligible categories.");
    } finally {
      setLoadingCategories(false);
    }
  };

  // Field change helper
  const updateField = (field: keyof AthleteDraftData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorNotice(null);
    setSaveSuccessNotice(null);
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrorNotice("First name and last name are required.");
      return false;
    }
    if (!formData.date_of_birth) {
      setErrorNotice("Date of birth is required for division eligibility.");
      return false;
    }
    const age = calculateAge(formData.date_of_birth);
    if (age < 5 || age > 75) {
      setErrorNotice(`Participant age (${age} years) is outside competitive championship bounds (5–75 years).`);
      return false;
    }
    if (!formData.email.trim() || !formData.phone.trim()) {
      setErrorNotice("Contact email and mobile number are mandatory for accreditation.");
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!formData.academy_id && !formData.is_new_academy) {
      setErrorNotice("Please select an existing recognized academy or register a new club profile.");
      return false;
    }
    if (formData.is_new_academy) {
      if (!formData.new_academy_data?.name?.trim() || !formData.new_academy_data?.city?.trim()) {
        setErrorNotice("Please provide the new academy name and city.");
        return false;
      }
    }
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!formData.discipline) {
      setErrorNotice("Please select a championship discipline.");
      return false;
    }
    if (!formData.category_id) {
      setErrorNotice("Please select an approved category division.");
      return false;
    }
    return true;
  };

  // Step 4 Validation
  const validateStep4 = () => {
    return true; // Document checklist acknowledgment
  };

  // Navigation handlers
  const handleNext = () => {
    setErrorNotice(null);
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setErrorNotice(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // REQUIREMENT 11: Save-As-Draft
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
          participantType: "ATHLETE",
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

  // REQUIREMENT 14: Submit Registration
  const handleSubmit = async () => {
    if (!currentUser) {
      setPendingAction("submit");
      setAuthModalOpen(true);
      return;
    }

    if (!formData.declaration_accurate || !formData.declaration_terms || !formData.declaration_rules) {
      setErrorNotice("All mandatory legal declarations and terms must be checked before submission.");
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
          participantType: "ATHLETE",
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

  // Auth Modal Success Callback
  const handleAuthSuccess = (user: { id: string; email: string; fullName: string }) => {
    setCurrentUser(user);
    if (pendingAction === "save") {
      setTimeout(() => handleSaveDraft(), 100);
    } else if (pendingAction === "submit") {
      setTimeout(() => handleSubmit(), 100);
    }
    setPendingAction(null);
  };

  // Selected Category Object
  const selectedCategoryObj = availableCategories.find(
    (c) => c.id === formData.category_id || c.code === formData.category_id
  );

  // ----------------------------------------------------------------------------
  // CONFIRMATION SCREEN AFTER SUBMISSION (Requirement 14)
  // ----------------------------------------------------------------------------
  if (submittedData) {
    return (
      <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 font-sans">
        <PublicHeader />
        <main className="flex-1 py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="rounded-2xl border border-emerald-500/40 bg-[#0C1425] p-8 sm:p-12 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <Badge variant="gold">Official Submission Recorded</Badge>
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-white">
                  REGISTRATION SUBMITTED
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Your athlete registration has been successfully submitted for review by the Kukkiwon Cup organizing committee.
                </p>
              </div>

              {/* Reference Card */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Registration Reference:</span>
                  <span className="text-[#D4AF37] font-bold text-sm">
                    {submittedData.registrationNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Athlete Name:</span>
                  <span className="text-white font-bold">{submittedData.participantName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Championship:</span>
                  <span className="text-white">{submittedData.championshipName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Discipline:</span>
                  <span className="text-[#00E5FF]">{submittedData.discipline}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Category Division:</span>
                  <span className="text-white">{submittedData.categoryName}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Accreditation Status:</span>
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
                    <span>Register Another Participant</span>
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
  // ATHLETE WIZARD STEPPER RENDER
  // ----------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 font-sans">
      <PublicHeader />

      <main className="flex-1 py-10 sm:py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          {/* Header Title Banner */}
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
                Athlete Championship Intake
              </h1>
              <p className="text-xs text-slate-400">
                Kukkiwon Cup 2026 • Individual Competitor Registration
              </p>
            </div>

            {registrationNumber && (
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                  Reference Code
                </span>
                <span className="text-xs font-mono font-bold text-[#D4AF37] bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                  {registrationNumber}
                </span>
              </div>
            )}
          </div>

          {/* Stepper Progress */}
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={(s) => setCurrentStep(s)}
          />

          {/* Feedback Notices */}
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

          {/* Wizard Card Container */}
          <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] p-6 sm:p-10 shadow-xl space-y-8">
            {/* ---------------------------------------------------------------- */}
            {/* STEP 1: PERSONAL INFORMATION */}
            {/* ---------------------------------------------------------------- */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                    <User className="h-4 w-4 text-[#D4AF37]" />
                    <span>Step 01 — Personal Information</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter the competitor&apos;s legal identity as shown on government documents.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="First Name *"
                    placeholder="e.g. Arjun"
                    value={formData.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    required
                  />
                  <Input
                    label="Middle Name"
                    placeholder="e.g. Kumar"
                    value={formData.middle_name}
                    onChange={(e) => updateField("middle_name", e.target.value)}
                  />
                  <Input
                    label="Last Name *"
                    placeholder="e.g. Sharma"
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
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                      required
                    />
                    {formData.date_of_birth && (
                      <span className="text-[11px] text-emerald-400 mt-1 block">
                        Age: {calculateAge(formData.date_of_birth)} years old
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
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <Input
                    label="Nationality (ISO / Country) *"
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
                    placeholder="athlete@example.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-[#0C1222] space-y-2">
                  <span className="text-xs font-bold text-white uppercase block">
                    Competitor ID Photograph
                  </span>
                  <p className="text-xs text-slate-400">
                    A formal color portrait photo is required for your official accreditation badge. (File upload will be activated in Phase 4).
                  </p>
                  <Input
                    label="Photo File / Reference Name"
                    placeholder="e.g. photo_arjun_sharma.jpg"
                    value={formData.photo_url || ""}
                    onChange={(e) => updateField("photo_url", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* STEP 2: ACADEMY / TEAM SELECTION */}
            {/* ---------------------------------------------------------------- */}
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

            {/* ---------------------------------------------------------------- */}
            {/* STEP 3: DISCIPLINE & CATEGORY SELECTION */}
            {/* ---------------------------------------------------------------- */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#D4AF37]" />
                    <span>Step 03 — Competitive Discipline & Category</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select your competitive discipline and choose your eligible weight division.
                  </p>
                </div>

                {/* Discipline Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                    Select Discipline *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "KYORUGI", title: "Kyorugi (Sparring)", desc: "Full contact WT electronic sparring" },
                      { id: "POOMSAE", title: "Poomsae (Forms)", desc: "Recognized individual & team patterns" },
                      { id: "DEMO", title: "Demonstration", desc: "Kyukpa breaking & team demonstration" },
                    ].map((disc) => {
                      const isSelected = formData.discipline === disc.id;
                      return (
                        <div
                          key={disc.id}
                          onClick={() => updateField("discipline", disc.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#D4AF37] bg-slate-900 shadow-md"
                              : "border-slate-800 bg-[#090D16] hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold uppercase text-white">
                              {disc.title}
                            </span>
                            <div
                              className={`w-3.5 h-3.5 rounded-full border ${
                                isSelected ? "bg-[#D4AF37] border-[#D4AF37]" : "border-slate-700"
                              }`}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">{disc.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Belt & Weight Parameters for Eligibility */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Belt / Dan Level *
                    </label>
                    <select
                      value={formData.belt_rank}
                      onChange={(e) => updateField("belt_rank", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="1ST_DAN_BLACK">1st Dan Black Belt</option>
                      <option value="2ND_DAN_BLACK">2nd Dan Black Belt</option>
                      <option value="3RD_DAN_PLUS">3rd Dan & Above</option>
                      <option value="1ST_POOM">1st Poom (Junior Black Belt)</option>
                      <option value="2ND_POOM">2nd Poom</option>
                      <option value="COLOR_BELT_RED">Red / Black Stripe (Geup 1-2)</option>
                      <option value="COLOR_BELT_BLUE">Blue Belt (Geup 3-4)</option>
                      <option value="COLOR_BELT_GREEN">Green Belt (Geup 5-6)</option>
                      <option value="COLOR_BELT_YELLOW">Yellow Belt (Geup 7-8)</option>
                    </select>
                  </div>

                  {formData.discipline === "KYORUGI" && (
                    <Input
                      label="Exact Weight (kg) *"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 57.5"
                      value={formData.weight_kg}
                      onChange={(e) => updateField("weight_kg", e.target.value)}
                      helperText="Official tournament weigh-in tolerance applies"
                      required
                    />
                  )}

                  <Input
                    label="Kukkiwon Dan/Poom Number"
                    placeholder="e.g. 05489123"
                    value={formData.kukkiwon_dan_number}
                    onChange={(e) => updateField("kukkiwon_dan_number", e.target.value)}
                    helperText="Mandatory for black belt divisions"
                  />
                </div>

                {/* Eligible Categories Box */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Available Categories for Your Profile
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Calculated by DOB ({calculateAge(formData.date_of_birth)} yrs), {formData.gender}, and {formData.discipline}.
                      </p>
                    </div>
                    {loadingCategories && (
                      <span className="text-xs text-[#00E5FF] animate-pulse font-mono">
                        Calculating eligibility...
                      </span>
                    )}
                  </div>

                  {availableCategories.length === 0 ? (
                    <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-950/20 text-center space-y-2">
                      <AlertCircle className="h-6 w-6 text-amber-400 mx-auto" />
                      <p className="text-xs text-amber-200">
                        No active category found matching this age, gender, and weight combination.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Try adjusting the weight or check with the tournament committee for open age categories.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {availableCategories.map((cat) => {
                        const isSelected = formData.category_id === cat.id || formData.category_id === cat.code;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => updateField("category_id", cat.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "border-[#D4AF37] bg-slate-900 shadow-md"
                                : "border-slate-800 bg-[#090D16] hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold uppercase text-white">
                                {cat.name}
                              </span>
                              <span className="text-[10px] font-mono bg-slate-800 text-[#D4AF37] px-1.5 py-0.5 rounded">
                                {cat.code}
                              </span>
                            </div>
                            <div className="mt-2 text-[11px] text-slate-400 space-y-0.5">
                              <div>Division: {cat.division}</div>
                              {cat.min_weight && cat.max_weight && (
                                <div>Weight: {cat.min_weight}kg – {cat.max_weight}kg</div>
                              )}
                              {cat.min_age && cat.max_age && (
                                <div>Age Limit: {cat.min_age}–{cat.max_age} yrs</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* STEP 4: DOCUMENT READINESS */}
            {/* ---------------------------------------------------------------- */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <DocumentChecklist
                  discipline={formData.discipline}
                  beltRank={formData.belt_rank}
                  checkedDocs={formData.documents_checked || {}}
                  onChange={(docs) => updateField("documents_checked", docs)}
                />
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* STEP 5: REVIEW & FINAL DECLARATIONS */}
            {/* ---------------------------------------------------------------- */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                    <span>Step 05 — Final Verification & Declarations</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Carefully review your entry. Upon submission, your record will be locked for committee review.
                  </p>
                </div>

                {/* Review Table / Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Personal Review */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="font-bold text-[#D4AF37] uppercase block">
                      1. Personal Information
                    </span>
                    <div className="space-y-1 text-slate-300">
                      <div>Name: <span className="font-bold text-white">{formData.first_name} {formData.middle_name} {formData.last_name}</span></div>
                      <div>DOB: {formData.date_of_birth} ({calculateAge(formData.date_of_birth)} yrs)</div>
                      <div>Gender: {formData.gender}</div>
                      <div>Nationality: {formData.nationality} ({formData.country})</div>
                      <div>City/State: {formData.city}, {formData.state}</div>
                      <div>Contact: {formData.phone} • {formData.email}</div>
                    </div>
                  </div>

                  {/* Academy Review */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="font-bold text-[#00E5FF] uppercase block">
                      2. Academy / Dojang
                    </span>
                    <div className="space-y-1 text-slate-300">
                      {formData.is_new_academy ? (
                        <>
                          <div className="font-bold text-white">{formData.new_academy_data?.name}</div>
                          <div>Location: {formData.new_academy_data?.city}, {formData.new_academy_data?.state}</div>
                          <div>Status: <Badge variant="outline">New Academy Request</Badge></div>
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-white">{formData.academy_name || "Not Specified"}</div>
                          <div>Code: <span className="font-mono text-[#D4AF37]">{formData.academy_code || "N/A"}</span></div>
                          <div>Affiliation: Recognized Tournament Academy</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Discipline & Category Review */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 md:col-span-2">
                    <span className="font-bold text-amber-400 uppercase block">
                      3. Discipline & Category
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
                      <div>Discipline: <span className="font-bold text-white">{formData.discipline}</span></div>
                      <div>Belt: <span className="font-bold text-white">{formData.belt_rank}</span></div>
                      {formData.discipline === "KYORUGI" && (
                        <div>Declared Weight: <span className="font-bold text-white">{formData.weight_kg} kg</span></div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-400">Assigned Category: </span>
                      <span className="font-bold text-emerald-400">
                        {selectedCategoryObj?.name || formData.category_id || "None Selected"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mandatory Legal Declarations (Requirement 13) */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-[#0C1222] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                    Official Championship Declarations
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
                        I confirm that the information provided is accurate and verifiable against my legal government identity documents.
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
                        I agree to the official Championship Terms & Conditions (v1.0) and accept tournament accreditation policies.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.declaration_rules}
                        onChange={(e) => updateField("declaration_rules", e.target.checked)}
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-[#D4AF37] focus:ring-[#D4AF37]"
                      />
                      <span>
                        I acknowledge the applicable participation requirements and agree to uphold the tenets of Taekwondo and tournament fair play.
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
                  className="w-full sm:w-auto text-xs uppercase font-bold text-[#D4AF37] hover:bg-slate-900"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  <span>Save & Continue Later</span>
                </Button>
              </div>

              <div className="w-full sm:w-auto">
                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    className="w-full sm:w-auto text-xs uppercase font-bold"
                  >
                    <span>Proceed to Step 0{currentStep + 1}</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={loading && pendingAction !== "save"}
                    disabled={!formData.declaration_accurate || !formData.declaration_terms}
                    className="w-full sm:w-auto text-xs uppercase font-bold bg-[#D4AF37] text-slate-950 hover:bg-amber-400"
                  >
                    <span>Submit Registration</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />

      {/* Auth Modal for In-Wizard Save or Submit */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        title={pendingAction === "save" ? "Sign In to Save Draft" : "Sign In to Submit Registration"}
        subtitle="Your in-progress registration details will be linked immediately to your account."
      />
    </div>
  );
}

export default function AthleteRegistrationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070B14]">
          <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
        </div>
      }
    >
      <AthleteRegistrationContent />
    </React.Suspense>
  );
}

