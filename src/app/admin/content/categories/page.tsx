// ==============================================================================
// ADMIN CMS CATEGORY MANAGER (Phase 9 - Requirement 7 & 18)
// Real-time management of competition categories, weight classes,
// divisions, and active/inactive registration availability
// ==============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import {
  Tag,
  Plus,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Shield,
  Filter,
} from "lucide-react";

export default function CategoryManagerPage() {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [disciplineFilter, setDisciplineFilter] = React.useState("ALL");
  const [msg, setMsg] = React.useState<{ type: "success" | "danger"; text: string } | null>(null);

  const [newCat, setNewCat] = React.useState({
    code: "",
    name: "",
    discipline: "KYORUGI",
    division: "SENIOR",
    gender: "MALE",
    minAge: "",
    maxAge: "",
    maxWeight: "",
    beltRequirement: "BLACK_BELT",
    registrationFee: 1500,
  });

  const loadCategories = () => {
    fetch("/api/admin/cms/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setCategories(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    loadCategories();
  }, []);

  const handleToggleActive = async (cat: any) => {
    try {
      const res = await fetch(`/api/admin/cms/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (res.ok) {
        setMsg({
          type: "success",
          text: `Category '${cat.code}' ${!cat.isActive ? "activated" : "deactivated"} successfully.`,
        });
        loadCategories();
      }
    } catch {
      setMsg({ type: "danger", text: "Failed to update category state." });
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/cms/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId: "champ-kukkiwon-2026",
          ...newCat,
          minAge: newCat.minAge ? parseInt(newCat.minAge) : null,
          maxAge: newCat.maxAge ? parseInt(newCat.maxAge) : null,
          maxWeight: newCat.maxWeight ? parseFloat(newCat.maxWeight) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create category");
      }

      setMsg({ type: "success", text: "New competition category created successfully." });
      setShowCreateModal(false);
      setNewCat({
        code: "",
        name: "",
        discipline: "KYORUGI",
        division: "SENIOR",
        gender: "MALE",
        minAge: "",
        maxAge: "",
        maxWeight: "",
        beltRequirement: "BLACK_BELT",
        registrationFee: 1500,
      });
      loadCategories();
    } catch (err: any) {
      setMsg({ type: "danger", text: err.message || "Failed to create category." });
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (disciplineFilter === "ALL") return true;
    return c.discipline.toUpperCase() === disciplineFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl">
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
              <Tag className="h-5 w-5 text-amber-400" />
              <span>Category Management</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage eligible competition categories. Inactive categories cannot be selected by new registrants.
            </p>
          </div>
        </div>

        <Button variant="gold" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Category</span>
        </Button>
      </div>

      {msg && (
        <Alert variant={msg.type} title={msg.type === "success" ? "Success" : "Error"}>
          {msg.text}
        </Alert>
      )}

      {/* Filter Strip */}
      <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-slate-400 uppercase font-semibold text-[11px]">Discipline:</span>
          {["ALL", "KYORUGI", "POOMSAE", "DEMO"].map((d) => (
            <button
              key={d}
              onClick={() => setDisciplineFilter(d)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-wider transition-colors ${
                disciplineFilter === d
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <span className="text-slate-400 font-medium">
          Showing {filteredCategories.length} categories
        </span>
      </div>

      {/* Categories Table */}
      <Card className="border-slate-800 bg-slate-900/60 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Code</TableHead>
              <TableHead>Name / Division</TableHead>
              <TableHead>Discipline</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Age / Weight</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <code className="text-xs font-mono font-bold text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {c.code}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-white text-xs">{c.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{c.division}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{c.discipline}</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-300">{c.gender}</TableCell>
                <TableCell className="text-xs text-slate-300">
                  {c.minAge || c.maxAge ? `${c.minAge || 0}-${c.maxAge || "∞"} yrs` : "Any age"}
                  {c.maxWeight ? ` / ≤${c.maxWeight} kg` : ""}
                </TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? "success" : "warning"}>
                    {c.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(c)}
                    className="text-xs text-slate-300 hover:text-white"
                  >
                    {c.isActive ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <ToggleRight className="h-4 w-4" /> Deactivate
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ToggleLeft className="h-4 w-4" /> Activate
                      </span>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredCategories.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">
                  No categories found matching filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-amber-400" />
                <span>Add Competition Category</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Category Code (e.g. KY-CAD-M-U33)"
                  value={newCat.code}
                  onChange={(e) => setNewCat({ ...newCat, code: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Discipline
                  </label>
                  <select
                    value={newCat.discipline}
                    onChange={(e) => setNewCat({ ...newCat, discipline: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-white"
                  >
                    <option value="KYORUGI">KYORUGI (Sparring)</option>
                    <option value="POOMSAE">POOMSAE (Forms)</option>
                    <option value="DEMO">DEMO (Breaking)</option>
                  </select>
                </div>
              </div>

              <Input
                label="Full Category Name"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Division
                  </label>
                  <select
                    value={newCat.division}
                    onChange={(e) => setNewCat({ ...newCat, division: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-white"
                  >
                    <option value="SENIOR">SENIOR (18+)</option>
                    <option value="JUNIOR">JUNIOR (15-17)</option>
                    <option value="CADET">CADET (12-14)</option>
                    <option value="SUB_JUNIOR">SUB_JUNIOR (Under 12)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Gender
                  </label>
                  <select
                    value={newCat.gender}
                    onChange={(e) => setNewCat({ ...newCat, gender: e.target.value as any })}
                    className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Mixed / Open</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Min Age"
                  type="number"
                  value={newCat.minAge}
                  onChange={(e) => setNewCat({ ...newCat, minAge: e.target.value })}
                />
                <Input
                  label="Max Age"
                  type="number"
                  value={newCat.maxAge}
                  onChange={(e) => setNewCat({ ...newCat, maxAge: e.target.value })}
                />
                <Input
                  label="Max Weight (kg)"
                  type="number"
                  step="0.1"
                  value={newCat.maxWeight}
                  onChange={(e) => setNewCat({ ...newCat, maxWeight: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit">
                  Save Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
