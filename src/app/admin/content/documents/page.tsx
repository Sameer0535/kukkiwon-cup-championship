// ==============================================================================
// ADMIN CMS PUBLIC DOCUMENTS MANAGER (Phase 9 - Requirement 12)
// Official tournament prospectus, rules guidelines, and terms downloads
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
  FileDown,
  Plus,
  ArrowLeft,
  Download,
  Trash2,
  ExternalLink,
  FileText,
} from "lucide-react";

export default function PublicDocumentsManagerPage() {
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [msg, setMsg] = React.useState<{ type: "success" | "danger"; text: string } | null>(null);

  const [form, setForm] = React.useState({
    title: "",
    documentType: "PROSPECTUS",
    description: "",
    fileUrl: "",
    fileName: "",
    fileSizeFormatted: "1.5 MB",
    status: "PUBLISHED",
  });

  const loadDocuments = () => {
    fetch("/api/admin/cms/documents")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setDocuments(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    loadDocuments();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/cms/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId: "champ-kukkiwon-2026",
          ...form,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to publish document.");
      }

      setMsg({ type: "success", text: "Public document published successfully." });
      setShowCreateModal(false);
      setForm({
        title: "",
        documentType: "PROSPECTUS",
        description: "",
        fileUrl: "",
        fileName: "",
        fileSizeFormatted: "1.5 MB",
        status: "PUBLISHED",
      });
      loadDocuments();
    } catch (err: any) {
      setMsg({ type: "danger", text: err.message || "Failed to save document." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to unpublish this document?")) return;
    try {
      const res = await fetch(`/api/admin/cms/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg({ type: "success", text: "Document unpublished successfully." });
        loadDocuments();
      }
    } catch {
      setMsg({ type: "danger", text: "Failed to delete document." });
    }
  };

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
              <FileDown className="h-5 w-5 text-amber-400" />
              <span>Public Documents Repository</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Publish official downloadable PDFs for athletes, coaches, and academies.
            </p>
          </div>
        </div>

        <Button
          variant="gold"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Publish Document</span>
        </Button>
      </div>

      {msg && (
        <Alert variant={msg.type} title={msg.type === "success" ? "Success" : "Notice"}>
          {msg.text}
        </Alert>
      )}

      {/* Documents Table */}
      <Card className="border-slate-800 bg-slate-900/60 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>File Name / Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <div className="font-bold text-white text-xs">{d.title}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 max-w-md">
                    {d.description}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{d.documentType}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-slate-300 font-mono">{d.fileName}</div>
                  <div className="text-[10px] text-slate-400">{d.fileSizeFormatted}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={d.status === "PUBLISHED" ? "success" : "warning"}>
                    {d.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded text-slate-400 hover:text-white transition-colors"
                      title="Preview Document"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(d.id)}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {documents.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">
                  No public documents published yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Publish Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <FileDown className="h-4 w-4 text-amber-400" />
                <span>Publish Official Document</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Document Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Document Type
                  </label>
                  <select
                    value={form.documentType}
                    onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-white"
                  >
                    <option value="PROSPECTUS">Prospectus / Handbook</option>
                    <option value="REQUIREMENTS">Athlete Guidelines</option>
                    <option value="TERMS">Terms & Conditions</option>
                    <option value="SCHEDULE">Championship Outline</option>
                  </select>
                </div>

                <Input
                  label="File Size (e.g. 2.4 MB)"
                  value={form.fileSizeFormatted}
                  onChange={(e) => setForm({ ...form, fileSizeFormatted: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="File Name"
                  value={form.fileName}
                  onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                  placeholder="prospectus.pdf"
                  required
                />
                <Input
                  label="Document URL / Storage Key"
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  placeholder="/documents/prospectus.pdf"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Brief Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Publication State
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-white"
                >
                  <option value="PUBLISHED">PUBLISHED (Available to Public)</option>
                  <option value="DRAFT">DRAFT (Hidden)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit">
                  Publish Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
