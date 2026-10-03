// ==============================================================================
// CHAMPIONSHIP ADMIN CMS WORKSPACE (/admin/cms)
// Complete institutional administrative control over public championship content,
// timeline, announcements, FAQ, contact channels, and live publishing status
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

type TabKey = "info" | "hero" | "dates" | "announcements" | "faqs" | "contact" | "publishing";

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

  // Load data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/cms");
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
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !championship) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: championship.name,
          shortName: championship.shortName,
          description: championship.description,
          venue: championship.venue,
          location: content.location,
          heroTitle: content.heroTitle,
          heroSubtitle: content.heroSubtitle,
          registrationInstructions: content.registrationInstructions,
          contactEmail: content.contactEmail,
          contactPhone: content.contactPhone,
          startDate: championship.startDate,
          endDate: championship.endDate,
          registrationOpen: championship.registrationOpen,
          registrationClose: championship.registrationClose,
          lateRegistrationDeadline: championship.lateRegistrationDeadline,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save CMS content.");
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
        headers: { "Content-Type": "application/json" },
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

  // Save Date
  const handleSaveDate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDate ? `/api/admin/cms/dates/${editingDate.id}` : "/api/admin/cms/dates";
      const method = editingDate ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dateForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save important date.");
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
      const res = await fetch(`/api/admin/cms/dates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete date.");
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
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`/api/admin/cms/faqs/${id}`, { method: "DELETE" });
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId: "champ-kukkiwon-2026",
          ...annForm,
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
      const res = await fetch(`/api/admin/cms/announcements/${id}`, { method: "DELETE" });
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="gold">Phase 9 Production CMS</Badge>
            <Badge variant={statusVariant(content?.websiteStatus || "DRAFT")}>
              {content?.websiteStatus || "DRAFT"}
            </Badge>
            <Badge variant="outline">
              REGISTRATION: {regState}
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-amber-400" />
            Championship CMS & Live Publishing
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Authoritative institutional management of public tournament information, announcements, schedule, and live status.
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
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-slate-800">
        {[
          { key: "info", label: "Championship Info", icon: FileText },
          { key: "hero", label: "Hero & Banner", icon: Sparkles },
          { key: "dates", label: "Important Dates", icon: Calendar, badge: dates.length },
          { key: "announcements", label: "Announcements", icon: Megaphone, badge: announcements.length },
          { key: "faqs", label: "FAQ Management", icon: HelpCircle, badge: faqs.length },
          { key: "contact", label: "Contact & Social", icon: Mail },
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
                  ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && (
                <span className="ml-1 px-1.5 py-0.2 text-[11px] rounded-full bg-slate-800 text-slate-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Championship Information */}
      {activeTab === "info" && championship && content && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Championship Identity & Details</CardTitle>
            <CardDescription className="text-slate-400">
              Update official tournament title, description, venue location, and registration window dates.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveInfo}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Official Name</label>
                  <Input
                    value={championship.name}
                    onChange={(e) => setChampionship({ ...championship, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Short Display Name</label>
                  <Input
                    value={championship.shortName}
                    onChange={(e) => setChampionship({ ...championship, shortName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Championship Description</label>
                <Textarea
                  rows={4}
                  value={championship.description}
                  onChange={(e) => setChampionship({ ...championship, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Venue Stadium</label>
                  <Input
                    value={championship.venue}
                    onChange={(e) => setChampionship({ ...championship, venue: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Location / City / Country</label>
                  <Input
                    value={content.location || ""}
                    onChange={(e) => setContent({ ...content, location: e.target.value })}
                    placeholder="New Delhi, India"
                    required
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Registration & Tournament Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Registration Opens</label>
                    <Input
                      type="datetime-local"
                      value={championship.registrationOpen.substring(0, 16)}
                      onChange={(e) => setChampionship({ ...championship, registrationOpen: new Date(e.target.value).toISOString() })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Regular Deadline</label>
                    <Input
                      type="datetime-local"
                      value={championship.registrationClose.substring(0, 16)}
                      onChange={(e) => setChampionship({ ...championship, registrationClose: new Date(e.target.value).toISOString() })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Late Registration Cutoff</label>
                    <Input
                      type="datetime-local"
                      value={championship.lateRegistrationDeadline ? championship.lateRegistrationDeadline.substring(0, 16) : ""}
                      onChange={(e) => setChampionship({ ...championship, lateRegistrationDeadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Tournament Start Date</label>
                    <Input
                      type="datetime-local"
                      value={championship.startDate.substring(0, 16)}
                      onChange={(e) => setChampionship({ ...championship, startDate: new Date(e.target.value).toISOString() })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Tournament End Date</label>
                    <Input
                      type="datetime-local"
                      value={championship.endDate.substring(0, 16)}
                      onChange={(e) => setChampionship({ ...championship, endDate: new Date(e.target.value).toISOString() })}
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-800 pt-4">
              <Button type="submit" disabled={saving} className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Championship Info"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Tab 2: Hero Section */}
      {activeTab === "hero" && content && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Hero & Banner Configuration</CardTitle>
            <CardDescription className="text-slate-400">
              Customize the landing page headline, sub-headline, and athlete registration instructions.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveInfo}>
            <CardContent className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Hero Main Headline</label>
                <Input
                  value={content.heroTitle}
                  onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                  placeholder="The Pinnacle of Taekwondo Excellence"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Hero Subtitle</label>
                <Input
                  value={content.heroSubtitle || ""}
                  onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                  placeholder="Sanctioned by World Taekwondo Headquarters Kukkiwon India North Branch"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Registration Instructions (Markdown / Plain)</label>
                <Textarea
                  rows={4}
                  value={content.registrationInstructions || ""}
                  onChange={(e) => setContent({ ...content, registrationInstructions: e.target.value })}
                  placeholder="1. Complete profile. 2. Upload verification. 3. Pay online."
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs font-mono text-slate-400">
                  CTA Button Destination: <code className="text-amber-400 font-bold">/register</code> (Enforced server-side)
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-800 pt-4">
              <Button type="submit" disabled={saving} className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Hero Settings"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Tab 3: Important Dates CRUD */}
      {activeTab === "dates" && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-white text-xl">Tournament Schedule & Milestones</CardTitle>
              <CardDescription className="text-slate-400">
                Manage chronological deadlines displayed in the Important Dates section on the public site.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingDate(null);
                setDateForm({ title: "", description: "", date: new Date().toISOString(), displayOrder: dates.length + 1, isPublished: true });
                setDateModalOpen(true);
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5"
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
                      <div className="font-bold text-white text-sm">{d.title}</div>
                      {d.description && <div className="text-xs text-slate-400">{d.description}</div>}
                    </TableCell>
                    <TableCell className="text-xs text-amber-400 font-mono">
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
      )}

      {/* Tab 4: Announcements CRUD */}
      {activeTab === "announcements" && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-white text-xl">Championship Announcements</CardTitle>
              <CardDescription className="text-slate-400">
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
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5"
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
                      <div className="font-bold text-white text-sm">{a.title}</div>
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

      {/* Tab 5: FAQ CRUD */}
      {activeTab === "faqs" && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-white text-xl">Frequently Asked Questions (FAQ)</CardTitle>
              <CardDescription className="text-slate-400">
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
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add FAQ
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqs.map((f) => (
                <div key={f.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-amber-400 font-bold">Q#{f.displayOrder}</span>
                      <h4 className="text-white font-bold text-sm">{f.question}</h4>
                      <Badge variant={f.isPublished ? "success" : "default"} className="text-[10px]">
                        {f.isPublished ? "LIVE" : "DRAFT"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 pl-7">{f.answer}</p>
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

      {/* Tab 6: Contact & Social Information */}
      {activeTab === "contact" && content && championship && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Official Contact & Social Channels</CardTitle>
            <CardDescription className="text-slate-400">
              Secretariat email, phone helpline, and verified social media links.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveInfo}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Official Email</label>
                  <Input
                    type="email"
                    value={content.contactEmail || ""}
                    onChange={(e) => setContent({ ...content, contactEmail: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Helpline Phone</label>
                  <Input
                    value={content.contactPhone || ""}
                    onChange={(e) => setContent({ ...content, contactPhone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Secretariat Physical Address</label>
                <Input
                  value={championship.contactAddress || ""}
                  onChange={(e) => setChampionship({ ...championship, contactAddress: e.target.value })}
                  placeholder="Kyorix Sports Technology Private Limited, New Delhi, India"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Instagram URL</label>
                  <Input
                    value={championship.socialLinks?.instagram || ""}
                    onChange={(e) => setChampionship({
                      ...championship,
                      socialLinks: { ...championship.socialLinks, instagram: e.target.value },
                    })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Facebook URL</label>
                  <Input
                    value={championship.socialLinks?.facebook || ""}
                    onChange={(e) => setChampionship({
                      ...championship,
                      socialLinks: { ...championship.socialLinks, facebook: e.target.value },
                    })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">YouTube Channel</label>
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
            <CardFooter className="flex justify-end border-t border-slate-800 pt-4">
              <Button type="submit" disabled={saving} className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Contact Info"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Tab 7: Publishing State */}
      {activeTab === "publishing" && content && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Championship Publication & Versioning</CardTitle>
            <CardDescription className="text-slate-400">
              Audit status, verify live visibility, and toggle public accessibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Current CMS Status</div>
                <div className="text-xl font-bold text-white flex items-center gap-2">
                  <Badge variant={statusVariant(content.websiteStatus)} className="text-sm px-3 py-1">
                    {content.websiteStatus}
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Registration State</div>
                <div className="text-xl font-bold text-white flex items-center gap-2">
                  <Badge variant={statusVariant(regState)} className="text-sm px-3 py-1">
                    {regState}
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Last Published Timestamp</div>
                <div className="text-xs font-mono text-amber-400 mt-2">
                  {content.publishedAt ? new Date(content.publishedAt).toLocaleString() : "Never Published"}
                </div>
                {content.updatedBy && (
                  <div className="text-[11px] text-slate-400 mt-1">
                    By: <span className="text-slate-300 font-semibold">{content.updatedBy}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-amber-400/5 border border-amber-400/20 space-y-4">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Live Publication Controls
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
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

      {/* Date Modal */}
      {dateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingDate ? "Edit Important Date" : "Add Important Date"}
            </h3>
            <form onSubmit={handleSaveDate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title</label>
                <Input
                  value={dateForm.title}
                  onChange={(e) => setDateForm({ ...dateForm, title: e.target.value })}
                  placeholder="e.g. Regular Registration Cutoff"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description (Optional)</label>
                <Input
                  value={dateForm.description}
                  onChange={(e) => setDateForm({ ...dateForm, description: e.target.value })}
                  placeholder="Brief note"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
                  <Input
                    type="datetime-local"
                    value={dateForm.date ? dateForm.date.substring(0, 16) : ""}
                    onChange={(e) => setDateForm({ ...dateForm, date: new Date(e.target.value).toISOString() })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Display Order</label>
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
                  className="rounded border-slate-700 bg-slate-950 text-amber-500"
                />
                <label htmlFor="datePublished" className="text-xs text-slate-300">Publish on public website</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button variant="ghost" type="button" onClick={() => setDateModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold">Save Date</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {faqModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingFaq ? "Edit FAQ" : "Add FAQ"}
            </h3>
            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Question</label>
                <Input
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  placeholder="e.g. Can athletes participate in multiple categories?"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Answer</label>
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
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Display Order</label>
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
                    className="rounded border-slate-700 bg-slate-950 text-amber-500"
                  />
                  <label htmlFor="faqPublished" className="text-xs text-slate-300">Live on Public Site</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button variant="ghost" type="button" onClick={() => setFaqModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold">Save FAQ</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {annModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingAnn ? "Edit Announcement" : "Create Announcement"}
            </h3>
            <form onSubmit={handleSaveAnn} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title</label>
                <Input
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Short Description</label>
                <Input
                  value={annForm.shortDescription}
                  onChange={(e) => setAnnForm({ ...annForm, shortDescription: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Content</label>
                <Textarea
                  rows={4}
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
                  <select
                    value={annForm.status}
                    onChange={(e) => setAnnForm({ ...annForm, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date (Optional)</label>
                  <Input
                    type="date"
                    value={annForm.expiryDate ? annForm.expiryDate.substring(0, 10) : ""}
                    onChange={(e) => setAnnForm({ ...annForm, expiryDate: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button variant="ghost" type="button" onClick={() => setAnnModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold">Save Announcement</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
