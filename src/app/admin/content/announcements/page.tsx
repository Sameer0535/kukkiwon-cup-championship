// ==============================================================================
// ADMIN CMS ANNOUNCEMENTS MANAGER (Phase 9 - Requirement 11 & 20)
// Official alerts, referee guidelines, equipment notices, and publishing control
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
  Bell,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Trash2,
  Edit3,
  CheckCircle,
} from "lucide-react";

export default function AnnouncementsManagerPage() {
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingAnn, setEditingAnn] = React.useState<any | null>(null);
  const [msg, setMsg] = React.useState<{ type: "success" | "danger"; text: string } | null>(null);

  const [form, setForm] = React.useState({
    title: "",
    shortDescription: "",
    content: "",
    publishDate: "",
    expiryDate: "",
    status: "PUBLISHED",
  });

  const loadAnnouncements = () => {
    fetch("/api/admin/cms/announcements")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setAnnouncements(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAnn ? `/api/admin/cms/announcements/${editingAnn.id}` : "/api/admin/cms/announcements";
      const method = editingAnn ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId: "champ-kukkiwon-2026",
          ...form,
          publishDate: form.publishDate ? new Date(form.publishDate).toISOString() : new Date().toISOString(),
          expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save announcement.");
      }

      setMsg({ type: "success", text: `Announcement ${editingAnn ? "updated" : "published"} successfully.` });
      setShowCreateModal(false);
      setEditingAnn(null);
      loadAnnouncements();
    } catch (err: any) {
      setMsg({ type: "danger", text: err.message || "Failed to save announcement." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await fetch(`/api/admin/cms/announcements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg({ type: "success", text: "Announcement deleted successfully." });
        loadAnnouncements();
      }
    } catch {
      setMsg({ type: "danger", text: "Failed to delete announcement." });
    }
  };

  const openEditModal = (ann: any) => {
    setEditingAnn(ann);
    setForm({
      title: ann.title,
      shortDescription: ann.shortDescription,
      content: ann.content,
      publishDate: ann.publishDate ? ann.publishDate.split("T")[0] : "",
      expiryDate: ann.expiryDate ? ann.expiryDate.split("T")[0] : "",
      status: ann.status,
    });
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/content"
            className="h-9 w-9 rounded-lg border border-slate-200 bg-white shadow-xs flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <span>Official Announcements</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Broadcast official tournament notices. Only published announcements appear on public pages.
            </p>
          </div>
        </div>

        <Button
          variant="gold"
          size="sm"
          onClick={() => {
            setEditingAnn(null);
            setForm({
              title: "",
              shortDescription: "",
              content: "",
              publishDate: new Date().toISOString().split("T")[0],
              expiryDate: "",
              status: "PUBLISHED",
            });
            setShowCreateModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>New Notice</span>
        </Button>
      </div>

      {msg && (
        <Alert variant={msg.type} title={msg.type === "success" ? "Success" : "Notice"}>
          {msg.text}
        </Alert>
      )}

      {/* Announcements Table */}
      <Card className="border-slate-200 bg-white shadow-xs p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title / Summary</TableHead>
              <TableHead>Publish Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="font-bold text-slate-900 text-xs">{a.title}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md">
                    {a.shortDescription}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-700">
                  {new Date(a.publishDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {a.expiryDate ? new Date(a.expiryDate).toLocaleDateString() : "Never"}
                </TableCell>
                <TableCell>
                  <Badge variant={a.status === "PUBLISHED" ? "success" : "warning"}>
                    {a.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(a)}
                      className="text-xs text-slate-700 hover:text-slate-900"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(a.id)}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {announcements.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">
                  No announcements published yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" />
                <span>{editingAnn ? "Edit Notice" : "Create Official Announcement"}</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-900 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Headline Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <Input
                label="Short Summary"
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Announcement Content
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Publish Date"
                  type="date"
                  value={form.publishDate}
                  onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
                />
                <Input
                  label="Expiry Date (Optional)"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Publishing State
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900"
                >
                  <option value="PUBLISHED">PUBLISHED (Live on Website)</option>
                  <option value="DRAFT">DRAFT (Hidden)</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit">
                  Save Announcement
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
