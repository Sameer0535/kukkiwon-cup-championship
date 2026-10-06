// ==============================================================================
// ATHLETE REGISTRATION WIZARD — STREAMLINED 2-STEP INTAKE
// Step 1: Athlete Details, Photo, Academy Affiliation, WT Category & Documents
// Step 2: Review & Championship Fee Payment
// Theme: White & Royal Blue Corporate Sports Theme (No dark/black styling)
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Stepper, StepItem } from "@/components/registration/stepper";
import { AuthModal } from "@/components/registration/auth-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { calculateAge } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  User,
  Calendar,
  Building2,
  Camera,
  Upload,
  FileText,
  FileCheck,
  CreditCard,
  QrCode,
  Sparkles,
  Trash2,
  Eye,
  Check,
  Clock,
  Printer,
  Mail,
} from "lucide-react";

// ------------------------------------------------------------------------------
// 2-STEP CONFIGURATION
// ------------------------------------------------------------------------------
const STEPS: StepItem[] = [
  {
    id: 1,
    title: "Competitor Details & Documents",
    shortTitle: "Details & Docs",
    description: "Personal, Academy, WT Category & Uploads",
  },
  {
    id: 2,
    title: "Review & Payment",
    shortTitle: "Payment",
    description: "Accreditation fee & confirmation",
  },
];

// ------------------------------------------------------------------------------
// DROPDOWN CONSTANTS
// ------------------------------------------------------------------------------
const NATIONALITIES = [
  { code: "IND", label: "Indian (IND)" },
  { code: "KOR", label: "South Korean (KOR)" },
  { code: "USA", label: "American (USA)" },
  { code: "GBR", label: "British (GBR)" },
  { code: "NEP", label: "Nepalese (NEP)" },
  { code: "BHU", label: "Bhutanese (BHU)" },
  { code: "BGD", label: "Bangladeshi (BGD)" },
  { code: "LKA", label: "Sri Lankan (LKA)" },
  { code: "UAE", label: "Emirati (UAE)" },
  { code: "SGP", label: "Singaporean (SGP)" },
  { code: "MYS", label: "Malaysian (MYS)" },
  { code: "THA", label: "Thai (THA)" },
  { code: "VIE", label: "Vietnamese (VIE)" },
  { code: "JPN", label: "Japanese (JPN)" },
  { code: "AUS", label: "Australian (AUS)" },
  { code: "CAN", label: "Canadian (CAN)" },
  { code: "GER", label: "German (GER)" },
  { code: "FRA", label: "French (FRA)" },
  { code: "ITA", label: "Italian (ITA)" },
  { code: "ESP", label: "Spanish (ESP)" },
  { code: "OTHER", label: "Other" },
];

const COUNTRIES = [
  "India",
  "South Korea",
  "United States",
  "United Kingdom",
  "Nepal",
  "Bhutan",
  "Bangladesh",
  "Sri Lanka",
  "United Arab Emirates",
  "Singapore",
  "Malaysia",
  "Thailand",
  "Vietnam",
  "Japan",
  "Australia",
  "Canada",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Other",
];

// ------------------------------------------------------------------------------
// WORLD TAEKWONDO OFFICIAL WEIGHT CATEGORIES
// ------------------------------------------------------------------------------
interface WTWeightClass {
  code: string;
  name: string;
  weightLimit: string;
  minWeight: number;
  maxWeight: number;
}

const WT_DIVISIONS = [
  { id: "SUB_JUNIOR", label: "Sub-Junior", ageRange: "Ages 5–11", desc: "Under 12 years" },
  { id: "CADET", label: "Cadet", ageRange: "Ages 12–14", desc: "Cadet World Class" },
  { id: "JUNIOR", label: "Junior", ageRange: "Ages 15–17", desc: "Junior WT Standard" },
  { id: "SENIOR", label: "Senior", ageRange: "Ages 17+", desc: "World Taekwondo Senior" },
];

const WT_CATEGORIES: Record<
  string,
  { MALE: WTWeightClass[]; FEMALE: WTWeightClass[] }
> = {
  SENIOR: {
    MALE: [
      { code: "KY-SEN-M-U54", name: "Finweight", weightLimit: "Under 54.0 kg", minWeight: 45, maxWeight: 54 },
      { code: "KY-SEN-M-U58", name: "Flyweight", weightLimit: "Under 58.0 kg", minWeight: 54.1, maxWeight: 58 },
      { code: "KY-SEN-M-U63", name: "Bantamweight", weightLimit: "Under 63.0 kg", minWeight: 58.1, maxWeight: 63 },
      { code: "KY-SEN-M-U68", name: "Featherweight", weightLimit: "Under 68.0 kg", minWeight: 63.1, maxWeight: 68 },
      { code: "KY-SEN-M-U74", name: "Lightweight", weightLimit: "Under 74.0 kg", minWeight: 68.1, maxWeight: 74 },
      { code: "KY-SEN-M-U80", name: "Welterweight", weightLimit: "Under 80.0 kg", minWeight: 74.1, maxWeight: 80 },
      { code: "KY-SEN-M-U87", name: "Middleweight", weightLimit: "Under 87.0 kg", minWeight: 80.1, maxWeight: 87 },
      { code: "KY-SEN-M-O87", name: "Heavyweight", weightLimit: "Over 87.0 kg (+87kg)", minWeight: 87.1, maxWeight: 140 },
    ],
    FEMALE: [
      { code: "KY-SEN-F-U46", name: "Finweight", weightLimit: "Under 46.0 kg", minWeight: 38, maxWeight: 46 },
      { code: "KY-SEN-F-U49", name: "Flyweight", weightLimit: "Under 49.0 kg", minWeight: 46.1, maxWeight: 49 },
      { code: "KY-SEN-F-U53", name: "Bantamweight", weightLimit: "Under 53.0 kg", minWeight: 49.1, maxWeight: 53 },
      { code: "KY-SEN-F-U57", name: "Featherweight", weightLimit: "Under 57.0 kg", minWeight: 53.1, maxWeight: 57 },
      { code: "KY-SEN-F-U62", name: "Lightweight", weightLimit: "Under 62.0 kg", minWeight: 57.1, maxWeight: 62 },
      { code: "KY-SEN-F-U67", name: "Welterweight", weightLimit: "Under 67.0 kg", minWeight: 62.1, maxWeight: 67 },
      { code: "KY-SEN-F-U73", name: "Middleweight", weightLimit: "Under 73.0 kg", minWeight: 67.1, maxWeight: 73 },
      { code: "KY-SEN-F-O73", name: "Heavyweight", weightLimit: "Over 73.0 kg (+73kg)", minWeight: 73.1, maxWeight: 120 },
    ],
  },
  JUNIOR: {
    MALE: [
      { code: "KY-JUN-M-U45", name: "Finweight", weightLimit: "Under 45.0 kg", minWeight: 35, maxWeight: 45 },
      { code: "KY-JUN-M-U48", name: "Flyweight", weightLimit: "Under 48.0 kg", minWeight: 45.1, maxWeight: 48 },
      { code: "KY-JUN-M-U51", name: "Bantamweight", weightLimit: "Under 51.0 kg", minWeight: 48.1, maxWeight: 51 },
      { code: "KY-JUN-M-U55", name: "Featherweight", weightLimit: "Under 55.0 kg", minWeight: 51.1, maxWeight: 55 },
      { code: "KY-JUN-M-U59", name: "Lightweight", weightLimit: "Under 59.0 kg", minWeight: 55.1, maxWeight: 59 },
      { code: "KY-JUN-M-U63", name: "Welterweight", weightLimit: "Under 63.0 kg", minWeight: 59.1, maxWeight: 63 },
      { code: "KY-JUN-M-U68", name: "Light Middle", weightLimit: "Under 68.0 kg", minWeight: 63.1, maxWeight: 68 },
      { code: "KY-JUN-M-U73", name: "Middleweight", weightLimit: "Under 73.0 kg", minWeight: 68.1, maxWeight: 73 },
      { code: "KY-JUN-M-U78", name: "Light Heavy", weightLimit: "Under 78.0 kg", minWeight: 73.1, maxWeight: 78 },
      { code: "KY-JUN-M-O78", name: "Heavyweight", weightLimit: "Over 78.0 kg (+78kg)", minWeight: 78.1, maxWeight: 120 },
    ],
    FEMALE: [
      { code: "KY-JUN-F-U42", name: "Finweight", weightLimit: "Under 42.0 kg", minWeight: 32, maxWeight: 42 },
      { code: "KY-JUN-F-U44", name: "Flyweight", weightLimit: "Under 44.0 kg", minWeight: 42.1, maxWeight: 44 },
      { code: "KY-JUN-F-U46", name: "Bantamweight", weightLimit: "Under 46.0 kg", minWeight: 44.1, maxWeight: 46 },
      { code: "KY-JUN-F-U49", name: "Featherweight", weightLimit: "Under 49.0 kg", minWeight: 46.1, maxWeight: 49 },
      { code: "KY-JUN-F-U52", name: "Lightweight", weightLimit: "Under 52.0 kg", minWeight: 49.1, maxWeight: 52 },
      { code: "KY-JUN-F-U55", name: "Welterweight", weightLimit: "Under 55.0 kg", minWeight: 52.1, maxWeight: 55 },
      { code: "KY-JUN-F-U59", name: "Light Middle", weightLimit: "Under 59.0 kg", minWeight: 55.1, maxWeight: 59 },
      { code: "KY-JUN-F-U63", name: "Middleweight", weightLimit: "Under 63.0 kg", minWeight: 59.1, maxWeight: 63 },
      { code: "KY-JUN-F-U68", name: "Light Heavy", weightLimit: "Under 68.0 kg", minWeight: 63.1, maxWeight: 68 },
      { code: "KY-JUN-F-O68", name: "Heavyweight", weightLimit: "Over 68.0 kg (+68kg)", minWeight: 68.1, maxWeight: 105 },
    ],
  },
  CADET: {
    MALE: [
      { code: "KY-CAD-M-U33", name: "Finweight", weightLimit: "Under 33.0 kg", minWeight: 25, maxWeight: 33 },
      { code: "KY-CAD-M-U37", name: "Flyweight", weightLimit: "Under 37.0 kg", minWeight: 33.1, maxWeight: 37 },
      { code: "KY-CAD-M-U41", name: "Bantamweight", weightLimit: "Under 41.0 kg", minWeight: 37.1, maxWeight: 41 },
      { code: "KY-CAD-M-U45", name: "Featherweight", weightLimit: "Under 45.0 kg", minWeight: 41.1, maxWeight: 45 },
      { code: "KY-CAD-M-U49", name: "Lightweight", weightLimit: "Under 49.0 kg", minWeight: 45.1, maxWeight: 49 },
      { code: "KY-CAD-M-U53", name: "Welterweight", weightLimit: "Under 53.0 kg", minWeight: 49.1, maxWeight: 53 },
      { code: "KY-CAD-M-U57", name: "Light Middle", weightLimit: "Under 57.0 kg", minWeight: 53.1, maxWeight: 57 },
      { code: "KY-CAD-M-U61", name: "Middleweight", weightLimit: "Under 61.0 kg", minWeight: 57.1, maxWeight: 61 },
      { code: "KY-CAD-M-U65", name: "Light Heavy", weightLimit: "Under 65.0 kg", minWeight: 61.1, maxWeight: 65 },
      { code: "KY-CAD-M-O65", name: "Heavyweight", weightLimit: "Over 65.0 kg (+65kg)", minWeight: 65.1, maxWeight: 95 },
    ],
    FEMALE: [
      { code: "KY-CAD-F-U29", name: "Finweight", weightLimit: "Under 29.0 kg", minWeight: 22, maxWeight: 29 },
      { code: "KY-CAD-F-U33", name: "Flyweight", weightLimit: "Under 33.0 kg", minWeight: 29.1, maxWeight: 33 },
      { code: "KY-CAD-F-U37", name: "Bantamweight", weightLimit: "Under 37.0 kg", minWeight: 33.1, maxWeight: 37 },
      { code: "KY-CAD-F-U41", name: "Featherweight", weightLimit: "Under 41.0 kg", minWeight: 37.1, maxWeight: 41 },
      { code: "KY-CAD-F-U44", name: "Lightweight", weightLimit: "Under 44.0 kg", minWeight: 41.1, maxWeight: 44 },
      { code: "KY-CAD-F-U47", name: "Welterweight", weightLimit: "Under 47.0 kg", minWeight: 44.1, maxWeight: 47 },
      { code: "KY-CAD-F-U51", name: "Light Middle", weightLimit: "Under 51.0 kg", minWeight: 47.1, maxWeight: 51 },
      { code: "KY-CAD-F-U55", name: "Middleweight", weightLimit: "Under 55.0 kg", minWeight: 51.1, maxWeight: 55 },
      { code: "KY-CAD-F-U59", name: "Light Heavy", weightLimit: "Under 59.0 kg", minWeight: 55.1, maxWeight: 59 },
      { code: "KY-CAD-F-O59", name: "Heavyweight", weightLimit: "Over 59.0 kg (+59kg)", minWeight: 59.1, maxWeight: 85 },
    ],
  },
  SUB_JUNIOR: {
    MALE: [
      { code: "KY-SUB-M-U18", name: "Under 18kg", weightLimit: "Under 18.0 kg", minWeight: 12, maxWeight: 18 },
      { code: "KY-SUB-M-U21", name: "Under 21kg", weightLimit: "Under 21.0 kg", minWeight: 18.1, maxWeight: 21 },
      { code: "KY-SUB-M-U24", name: "Under 24kg", weightLimit: "Under 24.0 kg", minWeight: 21.1, maxWeight: 24 },
      { code: "KY-SUB-M-U27", name: "Under 27kg", weightLimit: "Under 27.0 kg", minWeight: 24.1, maxWeight: 27 },
      { code: "KY-SUB-M-U30", name: "Under 30kg", weightLimit: "Under 30.0 kg", minWeight: 27.1, maxWeight: 30 },
      { code: "KY-SUB-M-U33", name: "Under 33kg", weightLimit: "Under 33.0 kg", minWeight: 30.1, maxWeight: 33 },
      { code: "KY-SUB-M-U36", name: "Under 36kg", weightLimit: "Under 36.0 kg", minWeight: 33.1, maxWeight: 36 },
      { code: "KY-SUB-M-U40", name: "Under 40kg", weightLimit: "Under 40.0 kg", minWeight: 36.1, maxWeight: 40 },
      { code: "KY-SUB-M-O40", name: "Over 40kg", weightLimit: "Over 40.0 kg (+40kg)", minWeight: 40.1, maxWeight: 70 },
    ],
    FEMALE: [
      { code: "KY-SUB-F-U18", name: "Under 18kg", weightLimit: "Under 18.0 kg", minWeight: 12, maxWeight: 18 },
      { code: "KY-SUB-F-U21", name: "Under 21kg", weightLimit: "Under 21.0 kg", minWeight: 18.1, maxWeight: 21 },
      { code: "KY-SUB-F-U24", name: "Under 24kg", weightLimit: "Under 24.0 kg", minWeight: 21.1, maxWeight: 24 },
      { code: "KY-SUB-F-U27", name: "Under 27kg", weightLimit: "Under 27.0 kg", minWeight: 24.1, maxWeight: 27 },
      { code: "KY-SUB-F-U30", name: "Under 30kg", weightLimit: "Under 30.0 kg", minWeight: 27.1, maxWeight: 30 },
      { code: "KY-SUB-F-U33", name: "Under 33kg", weightLimit: "Under 33.0 kg", minWeight: 30.1, maxWeight: 33 },
      { code: "KY-SUB-F-U36", name: "Under 36kg", weightLimit: "Under 36.0 kg", minWeight: 33.1, maxWeight: 36 },
      { code: "KY-SUB-F-U40", name: "Under 40kg", weightLimit: "Under 40.0 kg", minWeight: 36.1, maxWeight: 40 },
      { code: "KY-SUB-F-O40", name: "Over 40kg", weightLimit: "Over 40.0 kg (+40kg)", minWeight: 40.1, maxWeight: 70 },
    ],
  },
};

// Document upload file payload
interface UploadedFileRecord {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

/**
 * Flexible Kukkiwon ID formatter:
 * 1. Allows users to type "-" manually without stripping.
 * 2. If the user omits hyphens (or pastes numbers), automatically inserts hyphens at
 *    standard KKID-XXXXXX-XXXX-XXXX segment boundaries.
 * 3. Does not block backspacing over hyphens.
 */
function formatKukkiwonIdInput(val: string, prev = ""): string {
  if (!val.trim()) return "";
  const upper = val.toUpperCase();

  // If user is deleting/backspacing, respect deletion without force-inserting
  if (upper.length < prev.length) {
    return upper.replace(/[^A-Z0-9-]/g, "").slice(0, 21);
  }

  // If user entered only digits (or pasted raw digits like 12345612341234)
  const rawDigits = upper.replace(/\D/g, "");
  if (!upper.startsWith("K") && rawDigits.length > 0) {
    let formatted = "KKID";
    if (rawDigits.length > 0) formatted += "-" + rawDigits.slice(0, 6);
    if (rawDigits.length > 6) formatted += "-" + rawDigits.slice(6, 10);
    if (rawDigits.length > 10) formatted += "-" + rawDigits.slice(10, 14);
    return formatted.slice(0, 21);
  }

  // If user entered "KKID" followed by digits without hyphens (e.g. KKID123456...)
  if (upper.startsWith("KKID") && !upper.includes("-") && upper.length > 4) {
    const d = upper.slice(4).replace(/\D/g, "");
    let formatted = "KKID";
    if (d.length > 0) formatted += "-" + d.slice(0, 6);
    if (d.length > 6) formatted += "-" + d.slice(6, 10);
    if (d.length > 10) formatted += "-" + d.slice(10, 14);
    return formatted.slice(0, 21);
  }

  // User is typing manually (allowing characters and hyphens)
  const cleaned = upper.replace(/[^A-Z0-9-]/g, "");
  const singleHyphens = cleaned.replace(/-{2,}/g, "-");

  // Auto-insert hyphen if the user typed next digits but omitted hyphen at boundaries
  let result = singleHyphens;
  if (/^KKID[0-9]/.test(result)) {
    result = "KKID-" + result.slice(4);
  }
  const matchSegment2 = result.match(/^(KKID-[0-9]{6})([0-9].*)$/);
  if (matchSegment2) {
    result = matchSegment2[1] + "-" + matchSegment2[2];
  }
  const matchSegment3 = result.match(/^(KKID-[0-9]{6}-[0-9]{4})([0-9].*)$/);
  if (matchSegment3) {
    result = matchSegment3[1] + "-" + matchSegment3[2];
  }

  return result.slice(0, 21);
}

function AthleteRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDraftId = searchParams.get("draftId");

  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [registrationId, setRegistrationId] = React.useState<string | null>(queryDraftId);
  const [registrationNumber, setRegistrationNumber] = React.useState<string | null>(null);

  // User session
  const [currentUser, setCurrentUser] = React.useState<{
    id: string;
    email: string;
    fullName: string;
  } | null>(null);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<"save" | "proceed" | "pay" | null>(null);

  // Form State
  const [formData, setFormData] = React.useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "MALE" as "MALE" | "FEMALE",
    nationality: "IND",
    country: "India",
    state: "Delhi",
    city: "New Delhi",
    phone: "",
    email: "",
    photo_url: "",

    academy_id: undefined as string | undefined,
    academy_name: undefined as string | undefined,
    academy_code: undefined as string | undefined,
    is_new_academy: false,
    new_academy_data: undefined as
      | { name: string; country: string; state: string; city: string; head_coach: string }
      | undefined,

    discipline: "KYORUGI" as "KYORUGI" | "POOMSAE" | "DEMO",
    division: "SENIOR",
    category_id: "KY-SEN-M-U58",
    weight_category_name: "Under 58.0 kg",
    belt_rank: "1ST_DAN_BLACK",
    kukkiwon_dan_number: "",
    weight_kg: undefined as string | undefined,

    documents_uploaded: {
      gov_id: null as UploadedFileRecord | null,
      kukkiwon_cert: null as UploadedFileRecord | null,
      medical_cert: null as UploadedFileRecord | null,
    },

    declaration_accurate: true,
    declaration_terms: true,
    declaration_rules: true,
  });

  // UI state
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = React.useState<string | null>(null);
  const [submittedData, setSubmittedData] = React.useState<any | null>(null);

  // Payment states in Step 2
  const [paymentMethod, setPaymentMethod] = React.useState<"RAZORPAY" | "DEMO" | "OFFLINE">("RAZORPAY");
  const [offlineUtr, setOfflineUtr] = React.useState("");
  const [offlineSlip, setOfflineSlip] = React.useState<UploadedFileRecord | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);

  // File input refs
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const govIdInputRef = React.useRef<HTMLInputElement>(null);
  const slipInputRef = React.useRef<HTMLInputElement>(null);

  // Check user session
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          setFormData((prev) => ({
            ...prev,
            email: prev.email || data.user.email,
            first_name: prev.first_name || (data.user.fullName?.split(" ")[0] ?? ""),
            last_name: prev.last_name || (data.user.fullName?.split(" ").slice(1).join(" ") ?? ""),
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Load draft if draftId is in URL
  React.useEffect(() => {
    if (queryDraftId) {
      loadDraft(queryDraftId);
    }
  }, [queryDraftId]);

  const loadDraft = async (draftId: string) => {
    try {
      const res = await fetch(`/api/registrations/draft?registrationId=${draftId}`);
      const data = await res.json();
      if (data.draft) {
        setRegistrationId(data.draft.id);
        setRegistrationNumber(data.draft.registrationNumber);
        if (data.draft.draftData) {
          setFormData((prev) => ({ ...prev, ...data.draft.draftData }));
          if (data.draft.draftData.photo_url) {
            setPhotoPreview(data.draft.draftData.photo_url);
          }
        }
      }
    } catch {
      // Ignore
    }
  };

  // Live Auto-Suggestion for Division based on DOB
  React.useEffect(() => {
    if (formData.date_of_birth) {
      const age = calculateAge(formData.date_of_birth);
      let suggestedDivision = "SENIOR";
      if (age < 12) suggestedDivision = "SUB_JUNIOR";
      else if (age >= 12 && age <= 14) suggestedDivision = "CADET";
      else if (age >= 15 && age <= 17) suggestedDivision = "JUNIOR";
      else suggestedDivision = "SENIOR";

      // If user hasn't explicitly set a different division or initial match
      setFormData((prev) => {
        // Keep current division if valid or switch to suggested
        const currentCats = WT_CATEGORIES[suggestedDivision]?.[prev.gender] || [];
        const firstCat = currentCats[0];
        return {
          ...prev,
          division: suggestedDivision,
          category_id: firstCat?.code || prev.category_id,
          weight_category_name: firstCat ? firstCat.weightLimit : prev.weight_category_name,
        };
      });
    }
  }, [formData.date_of_birth, formData.gender]);

  // Helper field updater
  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorNotice(null);
  };

  // ----------------------------------------------------------------------------
  // PHOTO UPLOAD HANDLER
  // ----------------------------------------------------------------------------
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorNotice("Please upload a valid image file (JPG or PNG) for competitor photo.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorNotice("Photo file size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      updateField("photo_url", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    updateField("photo_url", "");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  // ----------------------------------------------------------------------------
  // DOCUMENT FILE UPLOAD HANDLER
  // ----------------------------------------------------------------------------
  const handleDocUpload = (
    key: "gov_id" | "kukkiwon_cert" | "medical_cert",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorNotice("Document file size must be under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFormData((prev) => ({
        ...prev,
        documents_uploaded: {
          ...prev.documents_uploaded,
          [key]: {
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl,
          },
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (key: "gov_id" | "kukkiwon_cert" | "medical_cert") => {
    setFormData((prev) => ({
      ...prev,
      documents_uploaded: {
        ...prev.documents_uploaded,
        [key]: null,
      },
    }));
  };

  // ----------------------------------------------------------------------------
  // STEP 1 VALIDATION
  // ----------------------------------------------------------------------------
  const validateStep1 = (): boolean => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrorNotice("Competitor legal first name and last name are required.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    if (!formData.date_of_birth) {
      setErrorNotice("Date of birth is required for official division allocation.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    const age = calculateAge(formData.date_of_birth);
    if (age < 5 || age > 75) {
      setErrorNotice(`Participant age (${age} yrs) must be within 5 to 75 years.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    if (!formData.phone.trim() || !formData.email.trim()) {
      setErrorNotice("Contact mobile number and email are required for official accreditation notices.");
      window.scrollTo({ top: 300, behavior: "smooth" });
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone.trim())) {
      setErrorNotice("Please enter a valid strict 10-digit mobile number.");
      window.scrollTo({ top: 300, behavior: "smooth" });
      return false;
    }
    if (!formData.photo_url && !photoPreview) {
      setErrorNotice("Competitor photograph is required for official accreditation badge printing.");
      window.scrollTo({ top: 300, behavior: "smooth" });
      return false;
    }
    if (!formData.academy_name?.trim()) {
      setErrorNotice("Please enter your Academy or Dojang name.");
      window.scrollTo({ top: 600, behavior: "smooth" });
      return false;
    }
    const kkidRegex = /^KKID-\d{6}-\d{4}-\d{4}$/i;
    if (!formData.kukkiwon_dan_number || !kkidRegex.test(formData.kukkiwon_dan_number.trim())) {
      setErrorNotice("Kukkiwon ID is mandatory and must match the strict format KKID-123456-1234-1234.");
      window.scrollTo({ top: 750, behavior: "smooth" });
      return false;
    }
    if (!formData.category_id) {
      setErrorNotice("Please select a World Taekwondo weight division category.");
      window.scrollTo({ top: 800, behavior: "smooth" });
      return false;
    }
    if (!formData.documents_uploaded.gov_id) {
      setErrorNotice("Government photo identification / age proof document upload is required.");
      window.scrollTo({ top: 1100, behavior: "smooth" });
      return false;
    }
    if (!formData.declaration_accurate || !formData.declaration_terms) {
      setErrorNotice("You must accept the official declarations and terms before proceeding.");
      return false;
    }
    return true;
  };

  // ----------------------------------------------------------------------------
  // PROCEED TO STEP 2 (Payment)
  // ----------------------------------------------------------------------------
  const handleProceedToStep2 = async () => {
    setErrorNotice(null);
    if (!validateStep1()) return;

    // Save draft on server if user is logged in
    if (currentUser) {
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
        if (data.registrationId) {
          setRegistrationId(data.registrationId);
          setRegistrationNumber(data.registrationNumber);
        }
      } catch {
        // Continue to Step 2 even if draft save encounters network lag
      }
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ----------------------------------------------------------------------------
  // SAVE AS DRAFT
  // ----------------------------------------------------------------------------
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

  // ----------------------------------------------------------------------------
  // PAYMENT COMPLETION (Online / Demo / Offline)
  // ----------------------------------------------------------------------------
  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    setErrorNotice(null);

    try {
      if (paymentMethod === "OFFLINE") {
        const cleanUtr = offlineUtr.trim().toUpperCase();
        if (cleanUtr.length < 8 || cleanUtr.length > 25) {
          throw new Error("Please enter a valid Bank / UPI Transaction Reference (UTR) Number (minimum 8 characters).");
        }
      }

      const { weight_kg: _unusedWeight, ...cleanFormData } = formData;
      const payloadDraftData = {
        ...cleanFormData,
        payment_status: paymentMethod === "OFFLINE" ? "UNDER_REVIEW" : "PAID",
        payment_method: paymentMethod === "OFFLINE" ? "OFFLINE_UPI" : paymentMethod,
        offline_utr: offlineUtr.trim().toUpperCase(),
        fee_amount: 2500,
      };

      // 1. Submit directly to API
      let submitRes = await fetch("/api/registrations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registrationId || undefined,
          participantType: "ATHLETE",
          draftData: payloadDraftData,
        }),
      });

      let submitResult = await submitRes.json();

      // If submission failed on an existing draft ID (e.g. guest session mismatch), auto-retry fresh
      if (!submitRes.ok && registrationId) {
        submitRes = await fetch("/api/registrations/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantType: "ATHLETE",
            draftData: payloadDraftData,
          }),
        });
        submitResult = await submitRes.json();
      }

      if (!submitRes.ok) {
        throw new Error(submitResult.error || "Submission failed. Please verify your details and try again.");
      }

      setSubmittedData({
        ...submitResult,
        registrationNumber: submitResult.registrationNumber || registrationNumber || `KKC26-ATH-${Math.floor(100000 + Math.random() * 900000)}`,
        paymentStatus: paymentMethod === "OFFLINE" ? "OFFLINE_VERIFICATION_PENDING" : "PAID",
        amount: 2500,
        utrNumber: paymentMethod === "OFFLINE" ? offlineUtr.trim().toUpperCase() : undefined,
        paymentDate: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      });
    } catch (err: any) {
      setErrorNotice(err.message || "Failed to process payment. Please try again.");
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAuthSuccess = (user: { id: string; email: string; fullName: string }) => {
    setCurrentUser(user);
    if (pendingAction === "save") {
      setTimeout(() => handleSaveDraft(), 100);
    } else if (pendingAction === "pay") {
      setTimeout(() => handleProcessPayment(), 100);
    }
    setPendingAction(null);
  };

  // Calculated Age & Available WT Categories
  const calculatedAge = formData.date_of_birth ? calculateAge(formData.date_of_birth) : null;
  const currentWTCategories = WT_CATEGORIES[formData.division]?.[formData.gender] || [];

  // ----------------------------------------------------------------------------
  // STEP 3: SUCCESS / CONFIRMATION SCREEN
  // ----------------------------------------------------------------------------
  if (submittedData) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans">
        <PublicHeader />
        <main className="flex-1 py-14 sm:py-20">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="rounded-2xl border border-blue-200 bg-white p-8 sm:p-12 text-center space-y-6 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <Badge variant="success">Payment & Registration Received</Badge>
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-950 tracking-tight">
                  THANK YOU FOR YOUR PAYMENT
                </h1>
                <p className="text-sm text-slate-700 font-medium max-w-lg mx-auto leading-relaxed">
                  Thank you for submitting your payment and tournament registration! The tournament organizing committee will verify your payment and send your official Athlete ID Card / Accreditation Pass directly to your registered email address (<strong className="text-blue-700">{formData.email}</strong>) once verified.
                </p>
              </div>

              {/* Prominent Official Email Delivery Notice */}
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-left flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-blue-950">
                  <span className="font-bold uppercase tracking-wider block">Official ID Card Issuance Notice</span>
                  <p className="text-slate-700 leading-relaxed">
                    Official athlete ID cards are only generated and issued in the admin panel after payment verification. Registered athletes will not view or download the ID card on the public website; the organizing team will deliver your verified pass directly to <strong>{formData.email}</strong> upon payment verification.
                  </p>
                </div>
              </div>

              {/* Official Receipt Card */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Official Reference Code:</span>
                  <span className="text-blue-600 font-bold text-sm tracking-wide">
                    {submittedData.registrationNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Athlete Name:</span>
                  <span className="text-slate-900 font-bold uppercase">
                    {formData.first_name} {formData.middle_name} {formData.last_name}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Kukkiwon ID:</span>
                  <span className="text-slate-900 font-bold">
                    {formData.kukkiwon_dan_number || "Submitted"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Academy / Dojang:</span>
                  <span className="text-slate-900">
                    {formData.academy_name || formData.new_academy_data?.name || "Official Dojang"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">WT Division & Weight:</span>
                  <span className="text-blue-700 font-semibold">{formData.weight_category_name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Registration Fee:</span>
                  <span className="text-slate-900 font-bold">₹2,500</span>
                </div>
                {submittedData.utrNumber && (
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Submitted UTR Reference:</span>
                    <span className="text-slate-900 font-bold tracking-wider">{submittedData.utrNumber}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">Accreditation Status:</span>
                  <Badge variant="warning">
                    PENDING PAYMENT VERIFICATION
                  </Badge>
                </div>
              </div>

              {/* Action Buttons (Strictly NO ID Card buttons on website) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <Link href="/" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full text-xs font-bold uppercase border-slate-300 text-slate-700 hover:bg-slate-100">
                    <span>Return to Home</span>
                  </Button>
                </Link>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full text-xs font-bold uppercase bg-blue-600 hover:bg-blue-700 text-white">
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
  // MAIN WIZARD RENDER (2 STEPS)
  // ----------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70 text-slate-900 font-sans">
      <PublicHeader />

      <main className="flex-1 py-10 sm:py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          {/* Header Title Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Registration Selection</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-950 tracking-tight">
                Athlete Championship Intake
              </h1>
              <p className="text-xs text-slate-600">
                Kukkiwon Cup 2026 • 2-Step Official Competitor Registration
              </p>
            </div>

            {registrationNumber && (
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                  Reference Code
                </span>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                  {registrationNumber}
                </span>
              </div>
            )}
          </div>

          {/* 2-Step Stepper Progress */}
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={(s) => {
              if (s === 1) setCurrentStep(1);
              if (s === 2 && validateStep1()) setCurrentStep(2);
            }}
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-10">
            {/* ================================================================ */}
            {/* STEP 1: ATHLETE DETAILS, ACADEMY, WT CATEGORIES & DOCUMENTS      */}
            {/* ================================================================ */}
            {currentStep === 1 && (
              <div className="space-y-10">
                {/* 1.1 PERSONAL INFORMATION */}
                <div className="space-y-5">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-950 uppercase flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span>1. Competitor Identification</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter personal identity details as per legal government identification.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      Step 1 of 2
                    </span>
                  </div>

                  {/* Name fields */}
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

                  {/* DOB, Gender, Nationality */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => updateField("date_of_birth", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                        required
                      />
                      {calculatedAge !== null && (
                        <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
                          Age: {calculatedAge} years old • Division: {formData.division}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Gender *
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => updateField("gender", e.target.value as "MALE" | "FEMALE")}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>

                    {/* Nationality Dropdown */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Nationality *
                      </label>
                      <select
                        value={formData.nationality}
                        onChange={(e) => updateField("nationality", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                        required
                      >
                        {NATIONALITIES.map((nat) => (
                          <option key={nat.code} value={nat.code}>
                            {nat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Country Dropdown, State, City */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Country of Residence *
                      </label>
                      <select
                        value={formData.country}
                        onChange={(e) => updateField("country", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                        required
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

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

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Mobile Number (WhatsApp) *"
                      type="tel"
                      placeholder="10-digit number (e.g. 9876543210)"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      helperText={`Strict 10 digits (${formData.phone.length}/10)`}
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

                  {/* 1.2 REAL PHOTOGRAPH UPLOAD */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2">
                          <Camera className="h-4 w-4 text-blue-600" />
                          <span>Official Competitor Photograph *</span>
                        </span>
                        <p className="text-xs text-slate-500">
                          Front-facing passport-style portrait on white or light background for official accreditation badge.
                        </p>
                      </div>
                      {photoPreview && (
                        <Badge variant="success">Photo Ready</Badge>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
                      {/* Photo Preview Frame */}
                      <div className="relative w-32 h-40 rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden flex flex-col items-center justify-center shrink-0 shadow-2xs">
                        {photoPreview ? (
                          <>
                            <img
                              src={photoPreview}
                              alt="Competitor Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700 transition"
                              title="Remove Photo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-3 space-y-1 text-slate-400">
                            <Camera className="h-8 w-8 mx-auto stroke-1" />
                            <span className="text-[10px] uppercase font-bold block">3:4 Portrait</span>
                          </div>
                        )}
                      </div>

                      {/* Photo Upload Actions */}
                      <div className="space-y-3 flex-1 text-center sm:text-left">
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handlePhotoSelect}
                          className="hidden"
                          id="athlete-photo-input"
                        />
                        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => photoInputRef.current?.click()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                          >
                            <Upload className="h-3.5 w-3.5 mr-1.5" />
                            <span>{photoPreview ? "Change Photo" : "Upload Passport Photo"}</span>
                          </Button>
                          {photoPreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleRemovePhoto}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              <span>Remove</span>
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Supported formats: JPG, PNG, WEBP. Maximum file size: 5MB. Resolution: Minimum 300x400 px.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1.3 ACADEMY AFFILIATION (DIRECTLY BELOW PHOTO) */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-950 uppercase flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span>2. Academy / Dojang Affiliation</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Link your entry to an accredited dojang or enter your local training academy details.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Academy / Dojang Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your academy or dojang name (e.g. Delhi Taekwondo Academy)"
                      value={formData.academy_name || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          academy_name: val,
                          is_new_academy: true,
                          new_academy_data: {
                            name: val,
                            country: prev.country || "India",
                            state: prev.state || "Delhi",
                            city: prev.city || "New Delhi",
                            head_coach: "Head Coach",
                          },
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-2xs"
                      required
                    />
                    <p className="text-[11px] text-slate-500">
                      Type the official name of your training academy or dojang.
                    </p>
                  </div>
                </div>

                {/* 1.4 WT DIVISION & WEIGHT CATEGORIES (DIRECTLY BELOW ACADEMY) */}
                <div className="space-y-5 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-950 uppercase flex items-center gap-2">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span>3. World Taekwondo Division & Weight Category</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Official World Taekwondo weight divisions matched to DOB ({calculatedAge ? `${calculatedAge} yrs` : "N/A"}) and gender ({formData.gender}).
                      </p>
                    </div>
                  </div>

                  {/* Discipline Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Discipline *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: "KYORUGI", title: "Kyorugi (Sparring)" },
                        { id: "POOMSAE", title: "Poomsae" },
                        { id: "DEMO", title: "Demonstration" },
                      ].map((disc) => {
                        const isSelected = formData.discipline === disc.id;
                        return (
                          <div
                            key={disc.id}
                            onClick={() => updateField("discipline", disc.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-600"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <span className="text-sm font-bold uppercase text-slate-900">
                              {disc.title}
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                                isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Division Selection (Sub-Junior, Cadet, Junior, Senior) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Age Division *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {WT_DIVISIONS.map((div) => {
                        const isSelected = formData.division === div.id;
                        return (
                          <div
                            key={div.id}
                            onClick={() => {
                              const cats = WT_CATEGORIES[div.id]?.[formData.gender] || [];
                              const first = cats[0];
                              setFormData((prev) => ({
                                ...prev,
                                division: div.id,
                                category_id: first?.code || prev.category_id,
                                weight_category_name: first ? first.weightLimit : prev.weight_category_name,
                              }));
                            }}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all text-center ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <span className="text-xs font-bold uppercase text-slate-900 block">
                              {div.label}
                            </span>
                            <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">
                              {div.ageRange}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Kukkiwon ID (Strict Mandatory) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Kukkiwon ID <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] font-mono text-blue-600 font-semibold">
                        Format: KKID-123456-1234-1234
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={21}
                      placeholder="KKID-123456-1234-1234"
                      value={formData.kukkiwon_dan_number}
                      onChange={(e) => {
                        const formatted = formatKukkiwonIdInput(
                          e.target.value,
                          formData.kukkiwon_dan_number
                        );
                        updateField("kukkiwon_dan_number", formatted);
                      }}
                      onBlur={(e) => {
                        const val = e.target.value.trim().toUpperCase();
                        if (!val) return;
                        const digits = val.replace(/\D/g, "").slice(0, 14);
                        if (digits.length === 14) {
                          updateField(
                            "kukkiwon_dan_number",
                            `KKID-${digits.slice(0, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`
                          );
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-2xs"
                      required
                    />
                    <p className="text-xs text-slate-600 leading-normal">
                      Mandatory official Kukkiwon Dan/Poom ID. Strict format: <strong>KKID-123456-1234-1234</strong>. Do not have a Kukkiwon ID?{" "}
                      <a
                        href="https://kukkiwon-india.org/services/register-individual?next=register-dojang"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        Register for individual membership first
                      </a>
                      .
                    </p>
                  </div>

                  {/* WORLD TAEKWONDO WEIGHT CATEGORY CARDS */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                        Select World Taekwondo Weight Class ({formData.gender}) *
                      </label>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {currentWTCategories.length} Official Categories
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {currentWTCategories.map((cat) => {
                        const isSelected = formData.category_id === cat.code;
                        return (
                          <div
                            key={cat.code}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                category_id: cat.code,
                                weight_category_name: cat.weightLimit,
                              }));
                            }}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-600/30"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <span
                              className={`text-xs sm:text-sm font-bold font-mono ${
                                isSelected ? "text-blue-700" : "text-slate-800"
                              }`}
                            >
                              {cat.weightLimit}
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                                isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 1.5 REAL DOCUMENT UPLOADS */}
                <div className="space-y-5 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-950 uppercase flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-blue-600" />
                        <span>4. Mandatory Document Upload</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload digital proof files for tournament accreditation verification.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* DOC 1: Government ID / Age Proof */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-900">
                          1. Government ID / Age Proof *
                        </span>
                        <Badge variant={formData.documents_uploaded.gov_id ? "success" : "danger"}>
                          {formData.documents_uploaded.gov_id ? "Uploaded" : "Required"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Aadhaar, Passport, or Municipal Birth Certificate.
                      </p>

                      <input
                        ref={govIdInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleDocUpload("gov_id", e)}
                        className="hidden"
                      />

                      {formData.documents_uploaded.gov_id ? (
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                          <div className="truncate pr-2">
                            <span className="font-semibold text-slate-800 block truncate">
                              {formData.documents_uploaded.gov_id.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {(formData.documents_uploaded.gov_id.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc("gov_id")}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => govIdInputRef.current?.click()}
                          className="w-full text-xs font-bold border-dashed border-slate-300 bg-white hover:bg-slate-50 text-blue-600"
                        >
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          <span>Upload ID / DOB Proof</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Legal Declarations Checkboxes */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs text-slate-700">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.declaration_accurate}
                        onChange={(e) => updateField("declaration_accurate", e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span>
                        I confirm that the competitor details and uploaded documents are authentic and match government identity records.
                      </span>
                    </label>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.declaration_terms}
                        onChange={(e) => updateField("declaration_terms", e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span>
                        I accept the Kukkiwon Cup 2026 Championship Terms & Conditions, anti-doping policies, and accreditation regulations.
                      </span>
                    </label>
                  </div>
                </div>

                {/* BOTTOM ACTION BAR FOR STEP 1 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={handleSaveDraft}
                    isLoading={loading && pendingAction === "save"}
                    className="text-xs uppercase font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    <span>Save Draft & Continue Later</span>
                  </Button>

                  {/* PROCEED TO STEP 2 BUTTON */}
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleProceedToStep2}
                    className="w-full sm:w-auto text-xs uppercase font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    <span>Proceed to Step 2: Payment</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ================================================================ */}
            {/* STEP 2: REVIEW SUMMARY & OFFICIAL PAYMENT CHECKOUT               */}
            {/* ================================================================ */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-950 uppercase flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span>Step 2 — Review & Official Fee Payment</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify your entry details and complete the official championship entry fee.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    <span>Edit Details</span>
                  </Button>
                </div>

                {/* Athlete Review Summary Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Photo preview */}
                    <div className="w-16 h-20 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 shadow-2xs">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Competitor"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="gold">Athlete Entry</Badge>
                        <Badge variant="outline">{formData.division} Division</Badge>
                      </div>
                      <h4 className="text-lg font-black uppercase text-slate-950">
                        {formData.first_name} {formData.middle_name} {formData.last_name}
                      </h4>
                      <p className="text-xs text-slate-600 font-mono">
                        DOB: {formData.date_of_birth} ({calculatedAge} yrs) • {formData.gender} • {formData.nationality}
                      </p>
                    </div>

                    <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                      <span className="text-xs font-bold text-blue-700 block">
                        {formData.weight_category_name}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Academy</span>
                      <span className="font-semibold text-slate-900">
                        {formData.academy_name || formData.new_academy_data?.name || "Independent"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact</span>
                      <span className="font-semibold text-slate-900">{formData.phone} • {formData.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                      <span className="font-semibold text-slate-900">{formData.city}, {formData.state}</span>
                    </div>
                  </div>
                </div>

                {/* Championship Fee Calculation */}
                <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span>Kukkiwon Cup 2026 Athlete Entry Fee</span>
                    <span className="font-mono font-bold">₹2,500</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span>Accreditation Pass & Official Kukkiwon Badge</span>
                    <span className="text-emerald-700 font-semibold uppercase text-[11px]">Included</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span>Electronic Scoring / Court Scheduling</span>
                    <span className="text-emerald-700 font-semibold uppercase text-[11px]">Included</span>
                  </div>
                  <div className="border-t border-blue-200 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black uppercase text-slate-950 block">Total Amount Payable</span>
                      <span className="text-[11px] text-slate-500">Official championship entry receipt issued upon completion</span>
                    </div>
                    <span className="text-2xl font-black text-blue-700 font-mono">₹2,500</span>
                  </div>
                </div>

                {/* Payment Channel Selection */}
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                    Choose Payment Method *
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Method 1: Razorpay */}
                    <div
                      onClick={() => setPaymentMethod("RAZORPAY")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === "RAZORPAY"
                          ? "border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase text-slate-900">
                          Online Checkout
                        </span>
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            paymentMethod === "RAZORPAY" ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"
                          }`}
                        >
                          {paymentMethod === "RAZORPAY" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">Razorpay (Cards, UPI, NetBanking)</p>
                    </div>

                    {/* Method 2: Instant Demo Pay */}
                    <div
                      onClick={() => setPaymentMethod("DEMO")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === "DEMO"
                          ? "border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase text-slate-900 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                          <span>1-Click Test Pay</span>
                        </span>
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            paymentMethod === "DEMO" ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"
                          }`}
                        >
                          {paymentMethod === "DEMO" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">Simulate instant test payment</p>
                    </div>

                    {/* Method 3: Offline UPI */}
                    <div
                      onClick={() => setPaymentMethod("OFFLINE")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === "OFFLINE"
                          ? "border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase text-slate-900 flex items-center gap-1.5">
                          <QrCode className="h-3.5 w-3.5 text-blue-600" />
                          <span>Offline UPI / Transfer</span>
                        </span>
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            paymentMethod === "OFFLINE" ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"
                          }`}
                        >
                          {paymentMethod === "OFFLINE" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">Submit UPI UTR transaction reference</p>
                    </div>
                  </div>

                  {/* Offline Details Box */}
                  {paymentMethod === "OFFLINE" && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <div className="text-xs text-slate-700 space-y-1">
                        <span className="font-bold block text-slate-900">Official Tournament UPI Account:</span>
                        <p className="font-mono text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-block font-bold">
                          kukkiwon.cup2026@upi
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Transfer ₹2,500 using Google Pay, PhonePe, or Paytm, and enter your 12-digit UTR reference below.
                        </p>
                      </div>

                      <div className="space-y-1.5 max-w-md">
                        <label className="block text-xs font-bold tracking-wide uppercase text-slate-700">
                          Bank / UPI UTR Reference Number (Strict 12 Digits) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={12}
                          placeholder="e.g. 402918274619"
                          value={offlineUtr}
                          onChange={(e) => setOfflineUtr(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12))}
                          className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono tracking-widest text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors shadow-2xs"
                          required
                        />
                        <p className="text-[11px] text-slate-500 font-mono">
                          Must be exactly 12 alphanumeric characters ({offlineUtr.length}/12 entered)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2 Error Notice */}
                {errorNotice && (
                  <div className="pt-2">
                    <Alert variant="danger" title="Submission Notice">
                      {errorNotice}
                    </Alert>
                  </div>
                )}

                {/* BOTTOM ACTION BAR FOR STEP 2 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setCurrentStep(1)}
                    className="w-full sm:w-auto text-xs uppercase font-bold text-slate-700 border-slate-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    <span>Back to Competitor Details</span>
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleProcessPayment}
                    isLoading={isProcessingPayment}
                    className="w-full sm:w-auto text-xs uppercase font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    <span>
                      {paymentMethod === "DEMO"
                        ? "Confirm with 1-Click Test Pay"
                        : paymentMethod === "OFFLINE"
                        ? "Submit Registration & UTR"
                        : "Pay ₹2,500 & Complete Registration"}
                    </span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />

      {/* Auth Modal for In-Wizard Save or Payment Submit */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        title={pendingAction === "save" ? "Sign In to Save Draft" : "Sign In to Complete Payment"}
        subtitle="Your registration and official accreditation pass will be linked to your account."
      />
    </div>
  );
}

export default function AthleteRegistrationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <AthleteRegistrationContent />
    </React.Suspense>
  );
}
