// ==============================================================================
// ADMIN CHAMPIONSHIPS MANAGER
// Multi-tournament configuration & live editable championship settings
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Trophy,
  Plus,
  Calendar,
  MapPin,
  ExternalLink,
  Edit,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  DollarSign,
  ShieldCheck,
} from "lucide-react";

interface ChampionshipItem {
  id: string;
  slug: string;
  name: string;
  short_name?: string;
  edition?: string;
  subtitle?: string;
  status: string;
  start_date: string;
  end_date: string;
  registration_open?: string;
  registration_close?: string;
  venue: string;
  city: string;
  state?: string;
  country?: string;
  entry_fee_athlete?: number | string;
  entry_fee_coach?: number | string;
}

export default function AdminChampionshipsPage() {
  const [championships, setChampionships] = React.useState<ChampionshipItem[]>([
    {
      id: "champ-kukkiwon-2026",
      slug: "kukkiwon-cup-2026",
      name: "Kukkiwon Cup Championship 2026",
      short_name: "Kukkiwon Cup 2026",
      edition: "2026",
      subtitle: "Official 2026 National Taekwondo Tournament",
      status: "REGISTRATION_OPEN",
      start_date: "2026-11-20",
      end_date: "2026-11-23",
      registration_open: "2026-09-01",
      registration_close: "2026-11-10",
      venue: "Indira Gandhi Indoor Stadium Complex",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      entry_fee_athlete: 2500,
      entry_fee_coach: 0,
    },
  ]);

  const [loading, setLoading] = React.useState(true);
  const [editingItem, setEditingItem] = React.useState<ChampionshipItem | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);
  const [errorBanner, setErrorBanner] = React.useState<string | null>(null);

  // Form edit fields
  const [formData, setFormData] = React.useState({
    name: "",
    short_name: "",
    edition: "",
    subtitle: "",
    venue: "",
    city: "",
    state: "",
    country: "India",
    start_date: "",
    end_date: "",
    registration_open: "",
    registration_close: "",
    status: "REGISTRATION_OPEN",
    entry_fee_athlete: 2500,
    entry_fee_coach: 0,
  });

  const getAdminHeaders = React.useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const bearer =
      typeof window !== "undefined"
        ? sessionStorage.getItem("kukkiwon_admin_bearer") || localStorage.getItem("kukkiwon_admin_bearer")
        : null;
    if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
    headers["x-admin-secret"] = "kukkiwon-bootstrap-admin-secret-2026";
    return headers;
  }, []);

  const loadChampionships = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms/championship", {
        headers: getAdminHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const item: ChampionshipItem = {
            id: json.data.id || "champ-kukkiwon-2026",
            slug: json.data.slug || "kukkiwon-cup-2026",
            name: json.data.name || "Kukkiwon Cup Championship 2026",
            short_name: json.data.shortName || "Kukkiwon Cup 2026",
            edition: json.data.edition || "2026",
            subtitle: json.data.subtitle || "",
            status: json.data.status || "REGISTRATION_OPEN",
            start_date: json.data.startDate ? json.data.startDate.split("T")[0] : "2026-11-20",
            end_date: json.data.endDate ? json.data.endDate.split("T")[0] : "2026-11-23",
            registration_open: json.data.registrationOpen ? json.data.registrationOpen.split("T")[0] : "2026-09-01",
            registration_close: json.data.registrationClose ? json.data.registrationClose.split("T")[0] : "2026-11-10",
            venue: json.data.venue || "Indira Gandhi Indoor Stadium Complex",
            city: json.data.city || "New Delhi",
            state: json.data.state || "Delhi",
            country: json.data.country || "India",
            entry_fee_athlete: json.data.entryFeeAthlete ?? 2500,
            entry_fee_coach: 0,
          };
          setChampionships([item]);
        }
      }
    } catch {
      // Keep initial defaults
    } finally {
      setLoading(false);
    }
  }, [getAdminHeaders]);

  React.useEffect(() => {
    loadChampionships();
  }, [loadChampionships]);

  const handleOpenEdit = (c: ChampionshipItem) => {
    setEditingItem(c);
    setFormData({
      name: c.name,
      short_name: c.short_name || c.name,
      edition: c.edition || "2026",
      subtitle: c.subtitle || "",
      venue: c.venue,
      city: c.city,
      state: c.state || "Delhi",
      country: c.country || "India",
      start_date: c.start_date,
      end_date: c.end_date,
      registration_open: c.registration_open || "",
      registration_close: c.registration_close || "",
      status: c.status,
      entry_fee_athlete: Number(c.entry_fee_athlete) || 2500,
      entry_fee_coach: 0,
    });
    setErrorBanner(null);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSaving(true);
    setErrorBanner(null);

    try {
      const res = await fetch("/api/admin/cms/championship", {
        method: "PUT",
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({
          championshipId: editingItem.id,
          name: formData.name,
          shortName: formData.short_name,
          edition: formData.edition,
          subtitle: formData.subtitle,
          venue: formData.venue,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          startDate: formData.start_date,
          endDate: formData.end_date,
          registrationOpen: formData.registration_open,
          registrationClose: formData.registration_close,
          status: formData.status as any,
          entryFeeAthlete: Number(formData.entry_fee_athlete) || 2500,
          entryFeeCoach: 0,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update championship.");
      }

      setSuccessBanner(`✓ Championship "${formData.name}" updated successfully.`);
      setEditModalOpen(false);
      loadChampionships();
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <span>Championship Editions</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tournament configuration & live venue, date, and fee controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadChampionships}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="gold"
            size="sm"
            onClick={() => {
              if (championships[0]) handleOpenEdit(championships[0]);
            }}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            <span>Edit Active Championship</span>
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Championships Table */}
      <Card className="border-slate-800 bg-slate-900/60 p-0 overflow-hidden shadow-2xl">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-800 bg-slate-950/80">
              <TableHead className="text-slate-400 uppercase text-[11px] font-bold">Edition / Name</TableHead>
              <TableHead className="text-slate-400 uppercase text-[11px] font-bold">URL Slug</TableHead>
              <TableHead className="text-slate-400 uppercase text-[11px] font-bold">Dates & Venue</TableHead>
              <TableHead className="text-slate-400 uppercase text-[11px] font-bold">Entry Fees</TableHead>
              <TableHead className="text-slate-400 uppercase text-[11px] font-bold">Status</TableHead>
              <TableHead className="text-right text-slate-400 uppercase text-[11px] font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {championships.map((c) => (
              <TableRow key={c.id} className="hover:bg-slate-800/40 border-b border-slate-800/60 transition-colors">
                <TableCell>
                  <div className="font-bold text-white text-xs">{c.name}</div>
                  <div className="text-[10px] text-slate-400">
                    Edition {c.edition || "2026"} • {c.short_name || c.name}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    /{c.slug}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-slate-300 font-medium">
                    {c.start_date} to {c.end_date}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                    <span>{c.venue}, {c.city}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-semibold text-emerald-400">
                    Athlete: ₹{Number(c.entry_fee_athlete || 2500).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-sky-400 font-bold flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Coach: ₹0 (Free)</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.status === "REGISTRATION_OPEN"
                        ? "success"
                        : c.status === "COMPLETED"
                        ? "default"
                        : "warning"
                    }
                  >
                    {c.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(c)}
                      className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      <span>Edit</span>
                    </Button>

                    <Link
                      href={`/championship/${c.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 hover:underline px-2 py-1 rounded bg-slate-800/60"
                    >
                      <span>Public</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Championship Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Championship Details"
        description="Update official tournament identity, schedules, venue details, and rules."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          {errorBanner && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorBanner}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Championship Name */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                Championship Official Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Short Name */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                Short Name / Badge Label *
              </label>
              <input
                type="text"
                required
                value={formData.short_name}
                onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Edition */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                Edition (Year) *
              </label>
              <input
                type="text"
                required
                value={formData.edition}
                onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                Championship Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="REGISTRATION_OPEN">REGISTRATION_OPEN (Enrollment Active)</option>
                <option value="UPCOMING">UPCOMING (Announced, Not Yet Open)</option>
                <option value="REGISTRATION_CLOSED">REGISTRATION_CLOSED (Registration Finished)</option>
                <option value="ONGOING">ONGOING (Tournament in Session)</option>
                <option value="COMPLETED">COMPLETED (Concluded)</option>
                <option value="DRAFT">DRAFT (Hidden from Public)</option>
              </select>
            </div>

            {/* Subtitle */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                Subtitle / Championship Headline
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                placeholder="The Pinnacle of Taekwondo Excellence"
              />
            </div>

            {/* Venue Name */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                Venue Name / Complex *
              </label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* City */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* State */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                State *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                Tournament Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                Tournament End Date *
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Registration Open */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                Registration Opens Date
              </label>
              <input
                type="date"
                value={formData.registration_open}
                onChange={(e) => setFormData({ ...formData, registration_open: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Registration Close */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                Registration Closes Date
              </label>
              <input
                type="date"
                value={formData.registration_close}
                onChange={(e) => setFormData({ ...formData, registration_close: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Entry Fee Athlete */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                Athlete Entry Fee (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.entry_fee_athlete}
                  onChange={(e) => setFormData({ ...formData, entry_fee_athlete: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Entry Fee Coach */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-300 block">
                Coach Entry Fee (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  disabled
                  value={0}
                  className="w-full pl-7 pr-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-sky-400 mt-1">
                ✓ Coach registration is 100% Free (₹0) across all editions.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="gold"
              size="sm"
              disabled={isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
