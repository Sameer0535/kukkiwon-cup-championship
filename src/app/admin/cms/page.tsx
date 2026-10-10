// ==============================================================================
// CHAMPIONSHIP ADMIN CMS WORKSPACE (/admin/cms)
// Complete institutional administrative control over public championship content,
// hero, sections, timeline, announcements, FAQ, contact channels, and live publishing status
// ==============================================================================

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Calendar,
  Megaphone,
  HelpCircle,
  Mail,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Save,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  RefreshCw,
  X,
  FileText,
  Layout,
  Code,
  Layers,
  Building,
  Target,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  ChampionshipContentDTO,
  ChampionshipImportantDateDTO,
  ChampionshipFAQDTO,
  PublicAnnouncement,
  PublicChampionship,
  RegistrationState,
} from "@/types/cms";

type TabKey = "info" | "hero" | "sections" | "dates" | "announcements" | "faqs" | "contact" | "publishing";

interface DisciplineCard {
  title: string;
  category: string;
  description: string;
}

const DEFAULT_DISCIPLINE_CARDS: DisciplineCard[] = [
  {
    title: "Kyorugi (Sparring)",
    category: "Senior, Junior, Cadet",
    description: "Official Olympic-style sparring conducted under World Taekwondo rules with electronic scoring systems and real-time point validation.",
  },
  {
    title: "Poomsae (Forms)",
    category: "Individual, Pair & Team",
    description: "Recognized WTF poomsae judging evaluating technical accuracy, balance, speed, presentation, and martial art discipline.",
  },
  {
    title: "Kyukpa (Breaking)",
    category: "Speed, Power & Special Tech",
    description: "Official wood breaking divisions demonstrating precision impact force, jumping techniques, and technical mastery.",
  },
];

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Core CMS state
  const [content, setContent] = useState<ChampionshipContentDTO | null>(null);
  const [championship, setChampionship] = useState<PublicChampionship | null>(null);
  const [regState, setRegState] = useState<RegistrationState>("OPEN");
  const [dates, setDates] = useState<ChampionshipImportantDateDTO[]>([]);
  const [faqs, setFaqs] = useState<ChampionshipFAQDTO[]>([]);
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);

  // Disciplines Builder state
  const [disciplineCards, setDisciplineCards] = useState<DisciplineCard[]>(DEFAULT_DISCIPLINE_CARDS);
  const [disciplineModalOpen, setDisciplineModalOpen] = useState(false);
  const [editingDisciplineIndex, setEditingDisciplineIndex] = useState<number | null>(null);
  const [disciplineForm, setDisciplineForm] = useState<DisciplineCard>({ title: "", category: "", description: "" });
  const [showRawDisciplinesJson, setShowRawDisciplinesJson] = useState(false);

  // Modals for CRUD
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<ChampionshipImportantDateDTO | null>(null);
  const [dateForm, setDateForm] = useState({ title: "", description: "", date: "", displayOrder: 1, isPublished: true });

  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<ChampionshipFAQDTO | null>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", displayOrder: 1, isPublished: true });

  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<PublicAnnouncement | null>(null);
  const [annForm, setAnnForm] = useState({ title: "", shortDescription: "", content: "", expiryDate: "", status: "PUBLISHED" as const });

  // Banner direct upload state
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, or WEBP).");
      return;
    }

    setBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const bearer =
        typeof window !== "undefined"
          ? sessionStorage.getItem("kukkiwon_admin_bearer") || localStorage.getItem("kukkiwon_admin_bearer")
          : null;
      const headers: Record<string, string> = {
        "x-admin-secret": "kukkiwon-bootstrap-admin-secret-2026",
      };
      if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

      const res = await fetch("/api/admin/cms/banner-upload", {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setChampionship((prev) => (prev ? { ...prev, bannerUrl: data.url } : null));
        triggerNotification("Championship banner uploaded successfully! Remember to save.");
      } else {
        // Fallback to base64 preview
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setChampionship((prev) => (prev ? { ...prev, bannerUrl: base64 } : null));
          triggerNotification("Championship banner loaded as preview! Click 'Save Hero Settings' to persist.");
        };
        reader.readAsDataURL(file);
      }
    } catch {
      // Local preview fallback
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setChampionship((prev) => (prev ? { ...prev, bannerUrl: base64 } : null));
        triggerNotification("Banner image preview loaded!");
      };
      reader.readAsDataURL(file);
    } finally {
      setBannerUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // Safe header constructor for authenticated admin calls
  const getAdminHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const bearer =
      typeof window !== "undefined"
        ? sessionStorage.getItem("kukkiwon_admin_bearer") || localStorage.getItem("kukkiwon_admin_bearer")
        : null;
    if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
    headers["x-admin-secret"] = "kukkiwon-bootstrap-admin-secret-2026";
    return headers;
  };

  // Safe datetime-local input formatting in local client timezone
  const formatForInput = (val?: string | null): string => {
    if (!val) return "";
    const str = String(val).trim();
    if (!str) return "";
    try {
      // If already in YYYY-MM-DDTHH:mm format (local input string)
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(str)) {
        return str.substring(0, 16);
      }
      const d = new Date(str);
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const mins = pad(d.getMinutes());
      return `${year}-${month}-${day}T${hours}:${mins}`;
    } catch {
      return "";
    }
  };

  const toIso = (val?: string | null): string | null => {
    if (!val) return null;
    const str = String(val).trim();
    if (!str) return null;
    try {
      if (str.endsWith("Z")) return str;
      const d = new Date(str);
      if (isNaN(d.getTime())) return str;
      return d.toISOString();
    } catch {
      return str;
    }
  };

  const parseFromInput = (val: string, fallback?: string | null): string => {
    if (!val) return fallback || new Date().toISOString();
    return toIso(val) || fallback || new Date().toISOString();
  };

  // Load data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/cms", {
        headers: getAdminHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to load CMS data: ${res.statusText}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setContent(json.data.content);
        setChampionship(json.data.championship);
        setRegState(json.data.registrationState || "OPEN");
        setDates(json.data.dates || []);
        setFaqs(json.data.faqs || []);
        setAnnouncements(json.data.announcements || []);

        // Parse disciplines JSON
        if (json.data.content?.disciplinesJson) {
          try {
            const parsed = JSON.parse(json.data.content.disciplinesJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setDisciplineCards(parsed);
            }
          } catch {
            // Keep fallback
          }
        }

        // Cache into localStorage
        if (typeof window !== "undefined") {
          try {
            if (json.data.content) localStorage.setItem("kukkiwon_cms_content", JSON.stringify(json.data.content));
            if (json.data.championship) localStorage.setItem("kukkiwon_cms_championship", JSON.stringify(json.data.championship));
            if (json.data.dates) localStorage.setItem("kukkiwon_important_dates", JSON.stringify(json.data.dates));
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load championship CMS data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Save Content / Info
  const handleSaveInfo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content || !championship) return;
    setSaving(true);
    setError(null);
    try {
      const cleanStartDate = toIso(championship.startDate) || championship.startDate;
      const cleanEndDate = toIso(championship.endDate) || championship.endDate;
      const cleanRegOpen = toIso(championship.registrationOpen) || championship.registrationOpen;
      const cleanRegClose = toIso(championship.registrationClose) || championship.registrationClose;
      const cleanLateReg = championship.lateRegistrationDeadline
        ? toIso(championship.lateRegistrationDeadline) || championship.lateRegistrationDeadline
        : null;

      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({
          name: championship.name,
          shortName: championship.shortName,
          description: championship.description,
          venue: championship.venue,
          location: content.location,
          heroTitle: content.heroTitle,
          heroSubtitle: content.heroSubtitle,
          heroTagline: content.heroTagline,
          heroPrimaryCtaText: content.heroPrimaryCtaText,
          heroSecondaryCtaText: content.heroSecondaryCtaText,
          registrationInstructions: content.registrationInstructions,
          contactEmail: content.contactEmail,
          contactPhone: content.contactPhone,
          contactPhoneHours: content.contactPhoneHours,
          contactAddress: content.contactAddress || championship.contactAddress,
          startDate: cleanStartDate,
          endDate: cleanEndDate,
          registrationOpen: cleanRegOpen,
          registrationClose: cleanRegClose,
          lateRegistrationDeadline: cleanLateReg,
          bannerUrl: championship.bannerUrl,
          partnershipTagline: content.partnershipTagline,
          partnershipHeading: content.partnershipHeading,
          partnershipDescription: content.partnershipDescription,
          kukkiwonTitle: content.kukkiwonTitle,
          kukkiwonBranch: content.kukkiwonBranch,
          kukkiwonRole: content.kukkiwonRole,
          kukkiwonDescription: content.kukkiwonDescription,
          kukkiwonUrl: content.kukkiwonUrl,
          kukkiwonUrlText: content.kukkiwonUrlText,
          kukkiwonBadge: content.kukkiwonBadge,
          kyorixTitle: content.kyorixTitle,
          kyorixSubtitle: content.kyorixSubtitle,
          kyorixRole: content.kyorixRole,
          kyorixDescription: content.kyorixDescription,
          kyorixBadge: content.kyorixBadge,
          disciplinesTagline: content.disciplinesTagline,
          disciplinesHeading: content.disciplinesHeading,
          disciplinesDescription: content.disciplinesDescription,
          disciplinesJson: content.disciplinesJson,
          datesTagline: content.datesTagline,
          datesHeading: content.datesHeading,
          datesDescription: content.datesDescription,
          ctaTagline: content.ctaTagline,
          ctaTitle: content.ctaTitle,
          ctaDescription: content.ctaDescription,
          ctaPrimaryBtnText: content.ctaPrimaryBtnText,
          ctaSecondaryBtnText: content.ctaSecondaryBtnText,
          contactTagline: content.contactTagline,
          contactHeading: content.contactHeading,
          contactDescription: content.contactDescription,
          aboutMissionHeading: content.aboutMissionHeading,
          aboutMissionText: content.aboutMissionText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save CMS content.");

      // Broadcast and cache CMS content locally so changes reflect immediately live across tabs and sessions
      if (typeof window !== "undefined") {
        try {
          const updatedChamp = {
            ...championship,
            startDate: cleanStartDate,
            endDate: cleanEndDate,
            registrationOpen: cleanRegOpen,
            registrationClose: cleanRegClose,
            lateRegistrationDeadline: cleanLateReg,
          };
          localStorage.setItem("kukkiwon_cms_content", JSON.stringify(content));
          localStorage.setItem("kukkiwon_cms_championship", JSON.stringify(updatedChamp));
          const stored = {
            startDate: cleanStartDate,
            endDate: cleanEndDate,
            registrationOpen: cleanRegOpen,
            registrationClose: cleanRegClose,
            lateRegistrationDeadline: cleanLateReg,
            venue: championship.venue,
            city: championship.city,
            timestamp: Date.now(),
          };
          localStorage.setItem("kukkiwon_championship_dates", JSON.stringify(stored));
          window.dispatchEvent(
            new CustomEvent("kukkiwon_cms_updated", {
              detail: { championship, content, dates: stored },
            })
          );
          window.dispatchEvent(new CustomEvent("kukkiwon_dates_updated", { detail: stored }));
        } catch (err) {
          console.warn("Could not sync CMS to localStorage:", err);
        }
      }

      triggerNotification("Championship content saved successfully!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Publish / Unpublish
  const handleTogglePublish = async (action: "PUBLISH" | "UNPUBLISH") => {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/cms/publish", {
        method: "POST",
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publication update failed.");
      triggerNotification(action === "PUBLISH" ? "Championship published to live website!" : "Championship unpublished to draft mode.");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  // Save Discipline Modal
  const handleSaveDisciplineModal = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: DisciplineCard[];
    if (editingDisciplineIndex !== null) {
      updated = disciplineCards.map((c, i) => (i === editingDisciplineIndex ? disciplineForm : c));
    } else {
      updated = [...disciplineCards, disciplineForm];
    }
    setDisciplineCards(updated);
    if (content) {
      setContent({
        ...content,
        disciplinesJson: JSON.stringify(updated, null, 2),
      });
    }
    setDisciplineModalOpen(false);
  };

  const handleDeleteDiscipline = (index: number) => {
    if (!confirm("Are you sure you want to remove this discipline card?")) return;
    const updated = disciplineCards.filter((_, i) => i !== index);
    setDisciplineCards(updated);
    if (content) {
      setContent({
        ...content,
        disciplinesJson: JSON.stringify(updated, null, 2),
      });
    }
  };

  // Save Date
  const handleSaveDate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDate ? `/api/admin/cms/dates/${editingDate.id}` : "/api/admin/cms/dates";
      const method = editingDate ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({
          ...dateForm,
          date: toIso(dateForm.date) || dateForm.date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save important date.");

      // Synchronize to localStorage
      if (typeof window !== "undefined") {
        try {
          const updatedItem = data.data || { ...dateForm, id: editingDate ? editingDate.id : `date-${Date.now()}` };
          const updatedDates = editingDate
            ? dates.map((d) => (d.id === editingDate.id ? { ...d, ...updatedItem } : d))
            : [...dates, updatedItem];
          localStorage.setItem("kukkiwon_important_dates", JSON.stringify(updatedDates));

          // Also update parent championship dates if milestone matches
          const rawChampDates = localStorage.getItem("kukkiwon_championship_dates");
          const champDates = rawChampDates ? JSON.parse(rawChampDates) : (championship ? {
            startDate: championship.startDate,
            endDate: championship.endDate,
            registrationOpen: championship.registrationOpen,
            registrationClose: championship.registrationClose,
            lateRegistrationDeadline: championship.lateRegistrationDeadline,
            venue: championship.venue,
          } : {});

          const lowerTitle = (dateForm.title || "").toLowerCase();
          if (lowerTitle.includes("registration open") || lowerTitle.includes("online registration")) {
            champDates.registrationOpen = dateForm.date;
          } else if (lowerTitle.includes("regular registration") || lowerTitle.includes("registration close") || lowerTitle.includes("standard registration")) {
            champDates.registrationClose = dateForm.date;
          } else if (lowerTitle.includes("late registration")) {
            champDates.lateRegistrationDeadline = dateForm.date;
          } else if (lowerTitle.includes("opening ceremony") || lowerTitle.includes("day 1") || lowerTitle.includes("start")) {
            champDates.startDate = dateForm.date;
          }
          champDates.timestamp = Date.now();
          localStorage.setItem("kukkiwon_championship_dates", JSON.stringify(champDates));

          window.dispatchEvent(new CustomEvent("kukkiwon_dates_updated", { detail: { dates: updatedDates, championship: champDates } }));
        } catch {}
      }

      setDateModalOpen(false);
      triggerNotification("Important date saved!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteDate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this important date?")) return;
    try {
      const res = await fetch(`/api/admin/cms/dates/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete date.");

      if (typeof window !== "undefined") {
        try {
          const updatedDates = dates.filter((d) => d.id !== id);
          localStorage.setItem("kukkiwon_important_dates", JSON.stringify(updatedDates));
          window.dispatchEvent(new CustomEvent("kukkiwon_dates_updated", { detail: { dates: updatedDates } }));
        } catch {}
      }

      triggerNotification("Important date deleted.");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Save FAQ
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFaq ? `/api/admin/cms/faqs/${editingFaq.id}` : "/api/admin/cms/faqs";
      const method = editingFaq ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify(faqForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save FAQ.");
      setFaqModalOpen(false);
      triggerNotification("FAQ saved!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`/api/admin/cms/faqs/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete FAQ.");
      triggerNotification("FAQ deleted.");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Save Announcement
  const handleSaveAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAnn ? `/api/admin/cms/announcements/${editingAnn.id}` : "/api/admin/cms/announcements";
      const method = editingAnn ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({
          championshipId: "champ-kukkiwon-2026",
          ...annForm,
          expiryDate: annForm.expiryDate ? toIso(annForm.expiryDate) || annForm.expiryDate : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save announcement.");
      setAnnModalOpen(false);
      triggerNotification("Announcement saved!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAnn = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await fetch(`/api/admin/cms/announcements/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete announcement.");
      triggerNotification("Announcement deleted.");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const statusVariant = (status: string) => {
    if (status === "PUBLISHED" || status === "OPEN") return "success";
    if (status === "CLOSING_SOON") return "warning";
    return "danger";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="gold">Production CMS Engine</Badge>
            <Badge variant={statusVariant(content?.websiteStatus || "DRAFT")}>
              {content?.websiteStatus || "DRAFT"}
            </Badge>
            <Badge variant="outline">
              REGISTRATION: {regState}
            </Badge>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            Championship CMS & Live Publishing
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Authoritative institutional management of all public tournament sections, content, timeline, announcements, and live publishing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Sync
          </Button>

          <Link href="/" target="_blank">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              View Public Site
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>

          {content?.websiteStatus === "PUBLISHED" ? (
            <Button
              variant="danger"
              size="sm"
              disabled={publishing}
              onClick={() => handleTogglePublish("UNPUBLISH")}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              disabled={publishing}
              onClick={() => handleTogglePublish("PUBLISH")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Publish Live
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between text-red-400 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between text-emerald-400 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-slate-200">
        {[
          { key: "info", label: "Championship Info", icon: FileText },
          { key: "hero", label: "Hero & Banner", icon: Sparkles },
          { key: "sections", label: "Website Sections", icon: Layout },
          { key: "dates", label: "Important Dates", icon: Calendar, badge: dates.length },
          { key: "announcements", label: "Announcements", icon: Megaphone, badge: announcements.length },
          { key: "faqs", label: "FAQ Management", icon: HelpCircle, badge: faqs.length },
          { key: "contact", label: "Contact & Secretariat", icon: Mail },
          { key: "publishing", label: "Publishing Status", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && (
                <span className="ml-1 px-1.5 py-0.2 text-[11px] rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          Tab 1: Championship Information
          ========================================================================= */}
      {activeTab === "info" && championship && content && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-slate-900 text-xl">Championship Identity & Details</CardTitle>
            <CardDescription className="text-slate-500">
              Update official tournament title, description, venue location, and registration window dates.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveInfo}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Official Name</label>
                  <Input
                    value={championship.name}
                    onChange={(e) => setChampionship({ ...championship, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Short Display Name</label>
                  <Input
                    value={championship.shortName}
                    onChange={(e) => setChampionship({ ...championship, shortName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Championship Description</label>
                <Textarea
                  rows={4}
                  value={championship.description}
                  onChange={(e) => setChampionship({ ...championship, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Venue Stadium</label>
                  <Input
                    value={championship.venue}
                    onChange={(e) => setChampionship({ ...championship, venue: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Location / City / Country</label>
                  <Input
                    value={content.location || ""}
                    onChange={(e) => setContent({ ...content, location: e.target.value })}
                    placeholder="New Delhi, India"
                    required
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Registration & Tournament Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Registration Opens</label>
                    <Input
                      type="datetime-local"
                      value={formatForInput(championship.registrationOpen)}
                      onChange={(e) => setChampionship({ ...championship, registrationOpen: e.target.value })}
                      className="bg-white border-slate-200 text-slate-900 [color-scheme:light] focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Regular Deadline</label>
                    <Input
                      type="datetime-local"
                      value={formatForInput(championship.registrationClose)}
                      onChange={(e) => setChampionship({ ...championship, registrationClose: e.target.value })}
                      className="bg-white border-slate-200 text-slate-900 [color-scheme:light] focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Late Registration Cutoff</label>
                    <Input
                      type="datetime-local"
                      value={formatForInput(championship.lateRegistrationDeadline)}
                      onChange={(e) => setChampionship({ ...championship, lateRegistrationDeadline: e.target.value || null })}
                      className="bg-white border-slate-200 text-slate-900 [color-scheme:light] focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Tournament Start Date</label>
                    <Input
                      type="datetime-local"
                      value={formatForInput(championship.startDate)}
                      onChange={(e) => setChampionship({ ...championship, startDate: e.target.value })}
                      className="bg-white border-slate-200 text-slate-900 [color-scheme:light] focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Tournament End Date</label>
                    <Input
                      type="datetime-local"
                      value={formatForInput(championship.endDate)}
                      onChange={(e) => setChampionship({ ...championship, endDate: e.target.value })}
                      className="bg-white border-slate-200 text-slate-900 [color-scheme:light] focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" disabled={saving} className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Championship Info"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* =========================================================================
          Tab 2: Hero & Banner Section
          ========================================================================= */}
      {activeTab === "hero" && content && championship && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-slate-900 text-xl">Hero & Banner Configuration</CardTitle>
            <CardDescription className="text-slate-500">
              Customize the landing page headline, tagline badge, sub-headline, CTA buttons, and backdrop photo.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveInfo}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Hero Main Headline</label>
                  <Input
                    value={content.heroTitle}
                    onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                    placeholder="The Pinnacle of Taekwondo Excellence"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tagline Badge (Top Pill)</label>
                  <Input
                    value={content.heroTagline || ""}
                    onChange={(e) => setContent({ ...content, heroTagline: e.target.value })}
                    placeholder="Official National Championship 2026"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Hero Subtitle</label>
                <Input
                  value={content.heroSubtitle || ""}
                  onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                  placeholder="Sanctioned by World Taekwondo Headquarters Kukkiwon India North Branch"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Hero Call-to-Action Buttons
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Primary CTA Button Label</label>
                    <Input
                      value={content.heroPrimaryCtaText || "Register Now"}
                      onChange={(e) => setContent({ ...content, heroPrimaryCtaText: e.target.value })}
                      placeholder="Register Now"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Links to athlete & coach registration portal (/register).
                    </span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Secondary CTA Button Label</label>
                    <Input
                      value={content.heroSecondaryCtaText || "Contact Secretariat"}
                      onChange={(e) => setContent({ ...content, heroSecondaryCtaText: e.target.value })}
                      placeholder="Contact Secretariat"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Links to official contact page (/contact).
                    </span>
                  </div>
                </div>
              </div>

              {/* Championship Banner Upload & Preview */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
                      Hero Championship Banner
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Upload an official graphic banner displayed behind the hero section on the championship homepage.
                    </p>
                  </div>
                  {championship.bannerUrl && (
                    <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 self-start sm:self-auto">
                      ✓ Banner Active
                    </Badge>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={handleBannerUpload}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />

                {/* Live Banner Preview Box */}
                {championship.bannerUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white group">
                    <div className="relative w-full h-48 sm:h-64 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={championship.bannerUrl}
                        alt="Championship Banner Preview"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex items-end p-4">
                        <div className="text-xs text-slate-900 font-mono truncate max-w-md">
                          {championship.bannerUrl.startsWith("data:") ? "Uploaded Local Image (Data URL)" : championship.bannerUrl}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={bannerUploading}
                          onClick={() => bannerInputRef.current?.click()}
                          className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
                        >
                          {bannerUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>Upload Different Image</span>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setChampionship((prev) => prev ? { ...prev, bannerUrl: "/branding/hero-banner.jpg" } : null)}
                          className="text-xs border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900"
                        >
                          Arena Preset
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setChampionship((prev) => prev ? { ...prev, bannerUrl: "" } : null)}
                        className="text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Banner</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Upload Dropzone when no banner is selected */
                  <div
                    onClick={() => bannerInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      bannerUploading
                        ? "border-amber-400/50 bg-amber-400/5"
                        : "border-slate-200 hover:border-amber-400/80 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 rounded-full bg-amber-400/10 text-blue-600 border border-amber-400/20">
                        {bannerUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {bannerUploading ? "Uploading Banner Image..." : "Click to Upload Banner Image"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          PNG, JPG, or WEBP up to 10MB • Recommended 1920x800 resolution
                        </p>
                      </div>
                      <div className="pt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setChampionship((prev) => prev ? { ...prev, bannerUrl: "/branding/hero-banner.jpg" } : null)}
                          className="text-xs border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900"
                        >
                          Use Arena Preset
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Registration Instructions (Markdown / Plain)</label>
                <Textarea
                  rows={4}
                  value={content.registrationInstructions || ""}
                  onChange={(e) => setContent({ ...content, registrationInstructions: e.target.value })}
                  placeholder="1. Complete profile. 2. Upload verification. 3. Pay online."
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" disabled={saving} className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Hero Settings"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* =========================================================================
          Tab 3: Website Sections Configuration (Partnership, Disciplines, CTA, About)
          ========================================================================= */}
      {activeTab === "sections" && content && (
        <div className="space-y-8">
          {/* Section 1: Partnership & Organization Section */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader>
              <CardTitle className="text-slate-900 text-xl flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                1. Partnership & Organization Section
              </CardTitle>
              <CardDescription className="text-slate-500">
                Institutional presentation for Kukkiwon India North Branch World Taekwondo Headquarters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Section Tagline (Small Pill)</label>
                  <Input
                    value={content.partnershipTagline || "Collaboration & Leadership"}
                    onChange={(e) => setContent({ ...content, partnershipTagline: e.target.value })}
                    placeholder="Collaboration & Leadership"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Section Main Heading</label>
                  <Input
                    value={content.partnershipHeading || "Presented in Partnership"}
                    onChange={(e) => setContent({ ...content, partnershipHeading: e.target.value })}
                    placeholder="Presented in Partnership"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Partnership Section Description</label>
                <Input
                  value={content.partnershipDescription || "A strategic sporting union combining authentic martial arts governance with modern tournament technology."}
                  onChange={(e) => setContent({ ...content, partnershipDescription: e.target.value })}
                  placeholder="Section introductory description..."
                />
              </div>

              {/* Kukkiwon Card Config */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Kukkiwon Card Configuration
                  </h4>
                  <Badge variant="gold">Governing Authority</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Institution Title</label>
                    <Input
                      value={content.kukkiwonTitle || "World Taekwondo Headquarters Kukkiwon"}
                      onChange={(e) => setContent({ ...content, kukkiwonTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Branch Name</label>
                    <Input
                      value={content.kukkiwonBranch || "India North Branch"}
                      onChange={(e) => setContent({ ...content, kukkiwonBranch: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Role / Function</label>
                    <Input
                      value={content.kukkiwonRole || "Official Governing Authority"}
                      onChange={(e) => setContent({ ...content, kukkiwonRole: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Badge Text</label>
                    <Input
                      value={content.kukkiwonBadge || "Sanctioning Body"}
                      onChange={(e) => setContent({ ...content, kukkiwonBadge: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Official Portal URL</label>
                    <Input
                      value={content.kukkiwonUrl || "https://kukkiwon-india.org/"}
                      onChange={(e) => setContent({ ...content, kukkiwonUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Portal Link Text</label>
                    <Input
                      value={content.kukkiwonUrlText || "Visit Kukkiwon India"}
                      onChange={(e) => setContent({ ...content, kukkiwonUrlText: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Kukkiwon Detailed Description</label>
                  <Textarea
                    rows={3}
                    value={content.kukkiwonDescription || ""}
                    onChange={(e) => setContent({ ...content, kukkiwonDescription: e.target.value })}
                    placeholder="Official governing authority details..."
                  />
                </div>
              </div>

            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
              <Button onClick={() => handleSaveInfo()} disabled={saving} className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Partnership Section"}
              </Button>
            </CardFooter>
          </Card>

          {/* Section 2: Tournament Disciplines & Structure */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-slate-900 text-xl flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  2. Tournament Disciplines & Divisions
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Manage the official competition categories and divisions displayed on the homepage.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingDisciplineIndex(null);
                  setDisciplineForm({ title: "", category: "", description: "" });
                  setDisciplineModalOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Discipline Card
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Section Tagline</label>
                  <Input
                    value={content.disciplinesTagline || "Tournament Structure"}
                    onChange={(e) => setContent({ ...content, disciplinesTagline: e.target.value })}
                    placeholder="Tournament Structure"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Section Heading</label>
                  <Input
                    value={content.disciplinesHeading || "Championship Details & Disciplines"}
                    onChange={(e) => setContent({ ...content, disciplinesHeading: e.target.value })}
                    placeholder="Championship Details & Disciplines"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Section Description</label>
                <Input
                  value={content.disciplinesDescription || "Official competition divisions, category weight brackets, and venue regulations."}
                  onChange={(e) => setContent({ ...content, disciplinesDescription: e.target.value })}
                  placeholder="Official competition divisions, category weight brackets, and venue regulations."
                />
              </div>

              {/* Visual Disciplines Cards Grid */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Configured Discipline Cards ({disciplineCards.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRawDisciplinesJson(!showRawDisciplinesJson)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Code className="w-3.5 h-3.5" />
                    {showRawDisciplinesJson ? "Hide Raw JSON" : "Advanced: Edit Raw JSON"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {disciplineCards.map((card, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 relative group hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">
                          {card.category || "General"}
                        </span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-900"
                            onClick={() => {
                              setEditingDisciplineIndex(idx);
                              setDisciplineForm({ ...card });
                              setDisciplineModalOpen(true);
                            }}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                            onClick={() => handleDeleteDiscipline(idx)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase">{card.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{card.description}</p>
                    </div>
                  ))}
                </div>

                {showRawDisciplinesJson && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="text-xs font-mono text-slate-400 block">Disciplines JSON String</label>
                    <Textarea
                      rows={5}
                      value={content.disciplinesJson || JSON.stringify(disciplineCards, null, 2)}
                      onChange={(e) => {
                        setContent({ ...content, disciplinesJson: e.target.value });
                        try {
                          const parsed = JSON.parse(e.target.value);
                          if (Array.isArray(parsed)) setDisciplineCards(parsed);
                        } catch {
                          // Invalid JSON typing
                        }
                      }}
                      className="font-mono text-xs text-emerald-400 bg-white"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
              <Button onClick={() => handleSaveInfo()} disabled={saving} className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Disciplines Section"}
              </Button>
            </CardFooter>
          </Card>

          {/* Section 3: Registration CTA Section */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader>
              <CardTitle className="text-slate-900 text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                3. Registration Call-to-Action (CTA) Section
              </CardTitle>
              <CardDescription className="text-slate-500">
                Call to action prompt displayed above footer motivating academies and athletes to enroll.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">CTA Tagline (Pill)</label>
                  <Input
                    value={content.ctaTagline || "Accreditation & Badges"}
                    onChange={(e) => setContent({ ...content, ctaTagline: e.target.value })}
                    placeholder="Accreditation & Badges"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">CTA Main Headline</label>
                  <Input
                    value={content.ctaTitle || "Ready to Take Part?"}
                    onChange={(e) => setContent({ ...content, ctaTitle: e.target.value })}
                    placeholder="Ready to Take Part?"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">CTA Description Paragraph</label>
                <Textarea
                  rows={2}
                  value={content.ctaDescription || ""}
                  onChange={(e) => setContent({ ...content, ctaDescription: e.target.value })}
                  placeholder="Register for the Kukkiwon Cup Championship. Compete under official Kukkiwon sanction..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Primary Button Label</label>
                  <Input
                    value={content.ctaPrimaryBtnText || "Register Now"}
                    onChange={(e) => setContent({ ...content, ctaPrimaryBtnText: e.target.value })}
                    placeholder="Register Now"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Secondary Button Label</label>
                  <Input
                    value={content.ctaSecondaryBtnText || "Contact Secretariat"}
                    onChange={(e) => setContent({ ...content, ctaSecondaryBtnText: e.target.value })}
                    placeholder="Contact Secretariat"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
              <Button onClick={() => handleSaveInfo()} disabled={saving} className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save CTA Section"}
              </Button>
            </CardFooter>
          </Card>

          {/* Section 4: About Page Mission & Standards */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader>
              <CardTitle className="text-slate-900 text-xl flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-400" />
                4. About Page: Standards & Mission Section
              </CardTitle>
              <CardDescription className="text-slate-500">
                Participation standards, ethics, and accreditation mission displayed on /about.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mission / Standards Heading</label>
                <Input
                  value={content.aboutMissionHeading || "Participation Standards & Ethics"}
                  onChange={(e) => setContent({ ...content, aboutMissionHeading: e.target.value })}
                  placeholder="Participation Standards & Ethics"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mission / Subtitle Text</label>
                <Textarea
                  rows={2}
                  value={content.aboutMissionText || ""}
                  onChange={(e) => setContent({ ...content, aboutMissionText: e.target.value })}
                  placeholder="Upholding Olympic martial arts excellence, fair play, and athlete empowerment."
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
              <Button onClick={() => handleSaveInfo()} disabled={saving} className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save About Page Mission"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* =========================================================================
          Tab 4: Important Dates Schedule & Headers
          ========================================================================= */}
      {activeTab === "dates" && content && (
        <div className="space-y-8">
          {/* Important Dates Section Headers */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader>
              <CardTitle className="text-slate-900 text-xl">Dates Section Presentation Headers</CardTitle>
              <CardDescription className="text-slate-500">
                Customize the headline and description displayed for this section on the public homepage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Section Tagline</label>
                  <Input
                    value={content.datesTagline || "Key Milestones"}
                    onChange={(e) => setContent({ ...content, datesTagline: e.target.value })}
                    placeholder="Key Milestones"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Section Heading</label>
                  <Input
                    value={content.datesHeading || "Important Championship Dates"}
                    onChange={(e) => setContent({ ...content, datesHeading: e.target.value })}
                    placeholder="Important Championship Dates"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Section Description</label>
                <Input
                  value={content.datesDescription || "Crucial deadlines for athlete submissions, late registrations, and tournament start dates."}
                  onChange={(e) => setContent({ ...content, datesDescription: e.target.value })}
                  placeholder="Crucial deadlines for athlete submissions, late registrations, and tournament start dates."
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
              <Button onClick={() => handleSaveInfo()} disabled={saving} className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Dates Section Headers"}
              </Button>
            </CardFooter>
          </Card>

          {/* Important Dates Milestones CRUD Table */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-slate-900 text-xl">Tournament Schedule & Milestones</CardTitle>
                <CardDescription className="text-slate-500">
                  Manage individual chronological deadlines displayed in the Important Dates section on the public site.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingDate(null);
                  setDateForm({ title: "", description: "", date: new Date().toISOString(), displayOrder: dates.length + 1, isPublished: true });
                  setDateModalOpen(true);
                }}
                className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Date
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Order</TableHead>
                    <TableHead>Milestone Title</TableHead>
                    <TableHead>Date / Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dates.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-slate-400">#{d.displayOrder}</TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-sm">{d.title}</div>
                        {d.description && <div className="text-xs text-slate-400">{d.description}</div>}
                      </TableCell>
                      <TableCell className="text-xs text-blue-600 font-mono">
                        {new Date(d.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.isPublished ? "success" : "default"}>
                          {d.isPublished ? "PUBLISHED" : "HIDDEN"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingDate(d);
                            setDateForm({
                              title: d.title,
                              description: d.description || "",
                              date: d.date,
                              displayOrder: d.displayOrder,
                              isPublished: d.isPublished,
                            });
                            setDateModalOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDate(d.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          Tab 5: Announcements CRUD
          ========================================================================= */}
      {activeTab === "announcements" && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-slate-900 text-xl">Championship Announcements</CardTitle>
              <CardDescription className="text-slate-500">
                Broadcast official circulars, reminders, and alerts with automatic expiration filtering.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingAnn(null);
                setAnnForm({ title: "", shortDescription: "", content: "", expiryDate: "", status: "PUBLISHED" });
                setAnnModalOpen(true);
              }}
              className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Announcement
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title & Summary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-bold text-slate-900 text-sm">{a.title}</div>
                      <div className="text-xs text-slate-400">{a.shortDescription}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.status === "PUBLISHED" ? "success" : "default"}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {a.expiryDate ? new Date(a.expiryDate).toLocaleDateString() : "Never Expires"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAnn(a);
                          setAnnForm({
                            title: a.title,
                            shortDescription: a.shortDescription,
                            content: a.content,
                            expiryDate: a.expiryDate || "",
                            status: a.status as any,
                          });
                          setAnnModalOpen(true);
                        }}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAnn(a.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          Tab 6: FAQ CRUD
          ========================================================================= */}
      {activeTab === "faqs" && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-slate-900 text-xl">Frequently Asked Questions (FAQ)</CardTitle>
              <CardDescription className="text-slate-500">
                Institutional answers for athlete registration, eligibility, accreditation, and rules.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingFaq(null);
                setFaqForm({ question: "", answer: "", displayOrder: faqs.length + 1, isPublished: true });
                setFaqModalOpen(true);
              }}
              className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add FAQ
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqs.map((f) => (
                <div key={f.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-blue-600 font-bold">Q#{f.displayOrder}</span>
                      <h4 className="text-slate-900 font-bold text-sm">{f.question}</h4>
                      <Badge variant={f.isPublished ? "success" : "default"} className="text-[10px]">
                        {f.isPublished ? "LIVE" : "DRAFT"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700 pl-7">{f.answer}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingFaq(f);
                        setFaqForm({ question: f.question, answer: f.answer, displayOrder: f.displayOrder, isPublished: f.isPublished });
                        setFaqModalOpen(true);
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteFaq(f.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          Tab 7: Contact & Secretariat Information
          ========================================================================= */}
      {activeTab === "contact" && content && championship && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-slate-900 text-xl">Official Secretariat & Contact Channels</CardTitle>
            <CardDescription className="text-slate-500">
              Secretariat email, phone helpline, operating hours, venue address, and verified social media links.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveInfo}>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Homepage Secretariat Section Headers
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Section Tagline</label>
                    <Input
                      value={content.contactTagline || "Tournament Secretariat"}
                      onChange={(e) => setContent({ ...content, contactTagline: e.target.value })}
                      placeholder="Tournament Secretariat"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Section Heading</label>
                    <Input
                      value={content.contactHeading || "Official Inquiries & Support"}
                      onChange={(e) => setContent({ ...content, contactHeading: e.target.value })}
                      placeholder="Official Inquiries & Support"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Section Subtitle / Description</label>
                  <Input
                    value={content.contactDescription || "Official communication channels for participating academies, coaches, and delegations."}
                    onChange={(e) => setContent({ ...content, contactDescription: e.target.value })}
                    placeholder="Official communication channels for participating academies, coaches, and delegations."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Official Email</label>
                  <Input
                    type="email"
                    value={content.contactEmail || ""}
                    onChange={(e) => setContent({ ...content, contactEmail: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Helpline Phone</label>
                  <Input
                    value={content.contactPhone || ""}
                    onChange={(e) => setContent({ ...content, contactPhone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Support Operating Hours</label>
                  <Input
                    value={content.contactPhoneHours || "Monday to Saturday • 9:00 AM – 6:00 PM IST"}
                    onChange={(e) => setContent({ ...content, contactPhoneHours: e.target.value })}
                    placeholder="Monday to Saturday • 9:00 AM – 6:00 PM IST"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Secretariat Physical Address / Venue</label>
                <Input
                  value={content.contactAddress || championship.contactAddress || ""}
                  onChange={(e) => {
                    setContent({ ...content, contactAddress: e.target.value });
                    setChampionship({ ...championship, contactAddress: e.target.value });
                  }}
                  placeholder="Kyorix Sports Technology Private Limited, New Delhi, India"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Instagram URL</label>
                  <Input
                    value={championship.socialLinks?.instagram || ""}
                    onChange={(e) => setChampionship({
                      ...championship,
                      socialLinks: { ...championship.socialLinks, instagram: e.target.value },
                    })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Facebook URL</label>
                  <Input
                    value={championship.socialLinks?.facebook || ""}
                    onChange={(e) => setChampionship({
                      ...championship,
                      socialLinks: { ...championship.socialLinks, facebook: e.target.value },
                    })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">YouTube Channel</label>
                  <Input
                    value={championship.socialLinks?.youtube || ""}
                    onChange={(e) => setChampionship({
                      ...championship,
                      socialLinks: { ...championship.socialLinks, youtube: e.target.value },
                    })}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" disabled={saving} className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Contact Info"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* =========================================================================
          Tab 8: Publishing State
          ========================================================================= */}
      {activeTab === "publishing" && content && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-slate-900 text-xl">Championship Publication & Versioning</CardTitle>
            <CardDescription className="text-slate-500">
              Audit status, verify live visibility, and toggle public accessibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Current CMS Status</div>
                <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Badge variant={statusVariant(content.websiteStatus)} className="text-sm px-3 py-1">
                    {content.websiteStatus}
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Registration State</div>
                <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Badge variant={statusVariant(regState)} className="text-sm px-3 py-1">
                    {regState}
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Last Published Timestamp</div>
                <div className="text-xs font-mono text-blue-600 mt-2">
                  {content.publishedAt ? new Date(content.publishedAt).toLocaleString() : "Never Published"}
                </div>
                {content.updatedBy && (
                  <div className="text-[11px] text-slate-400 mt-1">
                    By: <span className="text-slate-700 font-semibold">{content.updatedBy}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-amber-400/5 border border-amber-400/20 space-y-4">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Live Publication Controls
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                When published, the public website dynamically queries and displays your latest configured dates,
                categories, fees, and announcements. Unpublished drafts are strictly hidden from participants.
              </p>

              <div className="flex gap-4 pt-2">
                {content.websiteStatus === "PUBLISHED" ? (
                  <Button
                    variant="danger"
                    disabled={publishing}
                    onClick={() => handleTogglePublish("UNPUBLISH")}
                    className="font-bold"
                  >
                    Unpublish to Draft Mode
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    disabled={publishing}
                    onClick={() => handleTogglePublish("PUBLISH")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Publish Live Now
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* Discipline Card Modal */}
      {disciplineModalOpen && (
        <div className="fixed inset-0 bg-slate-50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              {editingDisciplineIndex !== null ? "Edit Discipline Card" : "Add Discipline Card"}
            </h3>
            <form onSubmit={handleSaveDisciplineModal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Discipline Title</label>
                <Input
                  value={disciplineForm.title}
                  onChange={(e) => setDisciplineForm({ ...disciplineForm, title: e.target.value })}
                  placeholder="e.g. Kyorugi (Sparring)"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Category / Divisions</label>
                <Input
                  value={disciplineForm.category}
                  onChange={(e) => setDisciplineForm({ ...disciplineForm, category: e.target.value })}
                  placeholder="e.g. Senior, Junior, Cadet"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Detailed Description</label>
                <Textarea
                  rows={4}
                  value={disciplineForm.description}
                  onChange={(e) => setDisciplineForm({ ...disciplineForm, description: e.target.value })}
                  placeholder="Official Olympic-style sparring conducted under World Taekwondo rules..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="ghost" type="button" onClick={() => setDisciplineModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">
                  {editingDisciplineIndex !== null ? "Update Card" : "Add Card"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Date Modal */}
      {dateModalOpen && (
        <div className="fixed inset-0 bg-slate-50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingDate ? "Edit Important Date" : "Add Important Date"}
            </h3>
            <form onSubmit={handleSaveDate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Title</label>
                <Input
                  value={dateForm.title}
                  onChange={(e) => setDateForm({ ...dateForm, title: e.target.value })}
                  placeholder="e.g. Regular Registration Cutoff"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description (Optional)</label>
                <Input
                  value={dateForm.description}
                  onChange={(e) => setDateForm({ ...dateForm, description: e.target.value })}
                  placeholder="Brief note"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Date</label>
                  <Input
                    type="datetime-local"
                    value={formatForInput(dateForm.date)}
                    onChange={(e) => setDateForm({ ...dateForm, date: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 [color-scheme:light] focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Display Order</label>
                  <Input
                    type="number"
                    value={dateForm.displayOrder}
                    onChange={(e) => setDateForm({ ...dateForm, displayOrder: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="datePublished"
                  checked={dateForm.isPublished}
                  onChange={(e) => setDateForm({ ...dateForm, isPublished: e.target.checked })}
                  className="rounded border-slate-200 bg-slate-100 text-blue-600"
                />
                <label htmlFor="datePublished" className="text-xs text-slate-700">Publish on public website</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="ghost" type="button" onClick={() => setDateModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer">Save Date</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {faqModalOpen && (
        <div className="fixed inset-0 bg-slate-50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingFaq ? "Edit FAQ" : "Add FAQ"}
            </h3>
            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Question</label>
                <Input
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  placeholder="e.g. Can athletes participate in multiple categories?"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Answer</label>
                <Textarea
                  rows={4}
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  placeholder="Authoritative clarification..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Display Order</label>
                  <Input
                    type="number"
                    value={faqForm.displayOrder}
                    onChange={(e) => setFaqForm({ ...faqForm, displayOrder: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="faqPublished"
                    checked={faqForm.isPublished}
                    onChange={(e) => setFaqForm({ ...faqForm, isPublished: e.target.checked })}
                    className="rounded border-slate-200 bg-slate-100 text-blue-600"
                  />
                  <label htmlFor="faqPublished" className="text-xs text-slate-700">Live on Public Site</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="ghost" type="button" onClick={() => setFaqModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer">Save FAQ</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {annModalOpen && (
        <div className="fixed inset-0 bg-slate-50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingAnn ? "Edit Announcement" : "Create Announcement"}
            </h3>
            <form onSubmit={handleSaveAnn} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Title</label>
                <Input
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Short Description</label>
                <Input
                  value={annForm.shortDescription}
                  onChange={(e) => setAnnForm({ ...annForm, shortDescription: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Content</label>
                <Textarea
                  rows={4}
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={annForm.status}
                    onChange={(e) => setAnnForm({ ...annForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Expiry Date (Optional)</label>
                  <Input
                    type="date"
                    value={annForm.expiryDate ? annForm.expiryDate.substring(0, 10) : ""}
                    onChange={(e) => setAnnForm({ ...annForm, expiryDate: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 [color-scheme:light] focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="ghost" type="button" onClick={() => setAnnModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer">Save Announcement</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
