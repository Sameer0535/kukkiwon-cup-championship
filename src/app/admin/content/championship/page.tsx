// ==============================================================================
// ADMIN CMS CHAMPIONSHIP EDITOR (Phase 9 - Requirement 2 & 17)
// Comprehensive configuration of tournament metadata, registration dates,
// venue, contact coordinates, branding assets, and publication state
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import Image from "next/image";
import {
  Trophy,
  ArrowLeft,
  Save,
  CheckCircle2,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  Upload,
  Sparkles,
  ImageIcon,
} from "lucide-react";

export default function ChampionshipEditorPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    name: "Kukkiwon Cup Championship 2026",
    shortName: "Kukkiwon Cup 2026",
    edition: "2026",
    subtitle: "Sanctioned by World Taekwondo Headquarters Kukkiwon India North Branch",
    description: "The official premier Taekwondo championship organized under the sanction of Kukkiwon India North Branch.",
    status: "PUBLISHED",
    venue: "Indira Gandhi Indoor Stadium Complex",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    startDate: "2026-11-20T09:00:00Z",
    endDate: "2026-11-23T18:00:00Z",
    registrationOpen: "2026-09-01T00:00:00Z",
    registrationClose: "2026-11-10T23:59:59Z",
    lateRegistrationDeadline: "2026-11-15T23:59:59Z",
    heroHeadline: "The Pinnacle of Taekwondo Excellence",
    heroDescription: "Experience world-class competition, official Kukkiwon Dan accreditation, and electronic scoring precision.",
    contactEmail: "secretariat@kukkiwoncup.org",
    contactPhone: "+91 98765 43210",
    contactWhatsapp: "+91 98765 43210",
    contactAddress: "Kukkiwon India North Branch Secretariat, New Delhi, India",
    bannerUrl: "/branding/hero-banner.jpg",
    posterUrl: "/branding/poster.jpg",
    rulesDocumentUrl: "/documents/kukkiwon-cup-2026-regulations.pdf",
  });

  React.useEffect(() => {
    fetch("/api/admin/cms/championship")
      .then((res) => res.json())
      .then((res) => {
        if (res.data) {
          setForm((prev) => ({
            ...prev,
            ...res.data,
            startDate: res.data.startDate?.split("T")[0] || prev.startDate,
            endDate: res.data.endDate?.split("T")[0] || prev.endDate,
            registrationOpen: res.data.registrationOpen?.split("T")[0] || prev.registrationOpen,
            registrationClose: res.data.registrationClose?.split("T")[0] || prev.registrationClose,
            lateRegistrationDeadline: res.data.lateRegistrationDeadline?.split("T")[0] || prev.lateRegistrationDeadline,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/cms/championship", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
          endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
          registrationOpen: form.registrationOpen ? new Date(form.registrationOpen).toISOString() : undefined,
          registrationClose: form.registrationClose ? new Date(form.registrationClose).toISOString() : undefined,
          lateRegistrationDeadline: form.lateRegistrationDeadline ? new Date(form.lateRegistrationDeadline).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update championship.");

      setSuccessMsg("Championship details and publication state updated successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/content"
            className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <span>Championship Configuration</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Edit public tournament identity, schedule, contact information, and publication status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={form.status === "PUBLISHED" ? "success" : form.status === "DRAFT" ? "warning" : "default"}>
            {form.status}
          </Badge>
        </div>
      </div>

      {successMsg && (
        <Alert variant="success" title="Changes Published">
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="danger" title="Save Failed">
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Tournament Identity */}
        <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>Championship Identity & Overview</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Official Championship Name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                label="Edition / Year"
                value={form.edition}
                onChange={(e) => handleChange("edition", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Short Display Name"
              value={form.shortName}
              onChange={(e) => handleChange("shortName", e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Publication Status
              </label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="DRAFT">DRAFT (Hidden from Public Website)</option>
                <option value="PUBLISHED">PUBLISHED (Live on Public Website)</option>
                <option value="ARCHIVED">ARCHIVED (Concluded Tournament)</option>
              </select>
            </div>
          </div>

          <div>
            <Input
              label="Subtitle / Sanction Statement"
              value={form.subtitle}
              onChange={(e) => handleChange("subtitle", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Championship Description & Scope
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </Card>

        {/* Section: Hero Background Image & Theme */}
        <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-cyan-400" />
              <span>Hero Background Image / Banner</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Customize the backdrop image displayed behind the championship hero section on the homepage.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                label="Hero Background Image URL"
                placeholder="e.g. /branding/hero-banner.jpg or https://images.unsplash.com/..."
                value={form.bannerUrl || ""}
                onChange={(e) => handleChange("bannerUrl", e.target.value)}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Supports relative paths (like <code>/branding/hero-banner.jpg</code>) or any external image URL.
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">Preset Quick Actions:</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                  onClick={() => handleChange("bannerUrl", "/branding/hero-banner.jpg")}
                >
                  🏟️ Stadium Arena Banner
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                  onClick={() => handleChange("bannerUrl", "")}
                >
                  ⚪ Clean Minimalist (No Image)
                </Button>
              </div>
            </div>

            {form.bannerUrl && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-slate-400 block">Current Preview:</span>
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                  <Image
                    src={form.bannerUrl}
                    alt="Hero Background Preview"
                    fill
                    className="object-cover object-center"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                    <span className="text-[11px] font-mono text-cyan-300 bg-black/60 px-2.5 py-1 rounded">
                      Homepage Hero Background Preview
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Section 2: Important Dates & Server-Side Availability */}
        <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-400" />
              <span>Championship Dates & Registration Windows</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              These dates are enforced server-side. Once registration closes, new submissions will be rejected by the backend.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tournament Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              required
            />
            <Input
              label="Tournament End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Registration Opens"
              type="date"
              value={form.registrationOpen}
              onChange={(e) => handleChange("registrationOpen", e.target.value)}
              required
            />
            <Input
              label="Registration Closes"
              type="date"
              value={form.registrationClose}
              onChange={(e) => handleChange("registrationClose", e.target.value)}
              required
            />
            <Input
              label="Late Registration Deadline"
              type="date"
              value={form.lateRegistrationDeadline}
              onChange={(e) => handleChange("lateRegistrationDeadline", e.target.value)}
            />
          </div>
        </Card>

        {/* Section 3: Location & Venue */}
        <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>Venue & Location Information</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Venue Complex Name"
                value={form.venue}
                onChange={(e) => handleChange("venue", e.target.value)}
                required
              />
            </div>
            <Input
              label="City"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              required
            />
            <Input
              label="State / Province"
              value={form.state}
              onChange={(e) => handleChange("state", e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Section 4: Public Contact Information */}
        <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-400" />
              <span>Official Public Contact Coordinates</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Official Email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
              required
            />
            <Input
              label="Helpline Phone"
              value={form.contactPhone}
              onChange={(e) => handleChange("contactPhone", e.target.value)}
              required
            />
            <Input
              label="WhatsApp Support Number"
              value={form.contactWhatsapp || ""}
              onChange={(e) => handleChange("contactWhatsapp", e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Official Secretariat Address"
              value={form.contactAddress}
              onChange={(e) => handleChange("contactAddress", e.target.value)}
            />
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/content">
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </Link>
          <Button variant="gold" type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" />
            <span>{saving ? "Publishing Changes..." : "Publish Championship Updates"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
