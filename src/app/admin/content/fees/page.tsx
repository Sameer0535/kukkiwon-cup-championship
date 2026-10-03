// ==============================================================================
// ADMIN CMS FEE MANAGER (Phase 9 - Requirement 8 & 19)
// Authoritative fee rules, participant tiers, and late fee surcharges
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
  CreditCard,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Edit2,
  Coins,
} from "lucide-react";

export default function FeeManagerPage() {
  const [fees, setFees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingFee, setEditingFee] = React.useState<any | null>(null);
  const [msg, setMsg] = React.useState<{ type: "success" | "danger"; text: string } | null>(null);

  const [form, setForm] = React.useState({
    name: "",
    participantType: "ATHLETE",
    amountPaise: 150000,
    lateFeePaise: 50000,
    lateFeeFrom: "2026-11-01",
    effectiveFrom: "2026-09-01",
    effectiveUntil: "2026-11-15",
  });

  const loadFees = () => {
    fetch("/api/admin/cms/fees")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setFees(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    loadFees();
  }, []);

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFee ? `/api/admin/cms/fees/${editingFee.id}` : "/api/admin/cms/fees";
      const method = editingFee ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId: "champ-kukkiwon-2026",
          name: form.name,
          participantType: form.participantType,
          amountPaise: Number(form.amountPaise),
          lateFeePaise: Number(form.lateFeePaise),
          lateFeeFrom: form.lateFeeFrom ? new Date(form.lateFeeFrom).toISOString() : null,
          effectiveFrom: form.effectiveFrom ? new Date(form.effectiveFrom).toISOString() : null,
          effectiveUntil: form.effectiveUntil ? new Date(form.effectiveUntil).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save fee rule.");
      }

      setMsg({ type: "success", text: `Fee rule ${editingFee ? "updated" : "created"} successfully.` });
      setShowCreateModal(false);
      setEditingFee(null);
      loadFees();
    } catch (err: any) {
      setMsg({ type: "danger", text: err.message || "Failed to save fee." });
    }
  };

  const openEditModal = (fee: any) => {
    setEditingFee(fee);
    setForm({
      name: fee.name,
      participantType: fee.participantType,
      amountPaise: fee.baseFeePaise,
      lateFeePaise: fee.lateFeePaise,
      lateFeeFrom: fee.lateFeeFrom?.split("T")[0] || "",
      effectiveFrom: fee.effectiveFrom?.split("T")[0] || "",
      effectiveUntil: fee.effectiveUntil?.split("T")[0] || "",
    });
    setShowCreateModal(true);
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
              <CreditCard className="h-5 w-5 text-amber-400" />
              <span>Registration Fee Architecture</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Authoritative server-side fee calculation rules. Modifying fees does not alter existing paid or pending orders.
            </p>
          </div>
        </div>

        <Button
          variant="gold"
          size="sm"
          onClick={() => {
            setEditingFee(null);
            setForm({
              name: "",
              participantType: "ATHLETE",
              amountPaise: 150000,
              lateFeePaise: 50000,
              lateFeeFrom: "2026-11-01",
              effectiveFrom: "2026-09-01",
              effectiveUntil: "2026-11-15",
            });
            setShowCreateModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Fee Rule</span>
        </Button>
      </div>

      {msg && (
        <Alert variant={msg.type} title={msg.type === "success" ? "Success" : "Notice"}>
          {msg.text}
        </Alert>
      )}

      {/* Safety Notice Card (Requirement 9) */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-white uppercase tracking-wider">
            Immutable Fee Snapshot Architecture (Phase 5 Protection)
          </div>
          <p className="text-slate-400 leading-relaxed">
            Every payment order generates a cryptographically signed, immutable fee snapshot at order creation. 
            Modifications made here affect future registrations only and will never alter historical financial records or pending payment orders.
          </p>
        </div>
      </div>

      {/* Fees Table */}
      <Card className="border-slate-800 bg-slate-900/60 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule Name</TableHead>
              <TableHead>Participant Type</TableHead>
              <TableHead>Base Entry Fee</TableHead>
              <TableHead>Late Surcharge</TableHead>
              <TableHead>Late Fee Active From</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fees.map((f) => (
              <TableRow key={f.id}>
                <TableCell>
                  <div className="font-bold text-white text-xs">{f.name}</div>
                  <div className="text-[10px] text-slate-400">{f.currency} Standard Tier</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{f.participantType}</Badge>
                </TableCell>
                <TableCell>
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {f.baseFeeFormatted}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-rose-300 text-xs">
                    {f.lateFeePaise > 0 ? `+${f.lateFeeFormatted}` : "None"}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-300">
                  {f.lateFeeFrom ? new Date(f.lateFeeFrom).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={f.isActive ? "success" : "warning"}>
                    {f.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(f)}
                    className="text-xs text-slate-300 hover:text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    <span>Edit</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-400" />
                <span>{editingFee ? "Edit Fee Rule" : "Create Registration Fee Rule"}</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="space-y-4">
              <Input
                label="Rule Label (e.g. Standard Athlete Registration)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Participant Type
                  </label>
                  <select
                    value={form.participantType}
                    onChange={(e) => setForm({ ...form, participantType: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-white"
                  >
                    <option value="ATHLETE">Athlete</option>
                    <option value="COACH">Coach</option>
                    <option value="ACADEMY_TEAM">Academy Team</option>
                  </select>
                </div>

                <Input
                  label="Base Fee (Paise: 150000 = ₹1,500)"
                  type="number"
                  value={form.amountPaise}
                  onChange={(e) => setForm({ ...form, amountPaise: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Late Fee Surcharge (Paise)"
                  type="number"
                  value={form.lateFeePaise}
                  onChange={(e) => setForm({ ...form, lateFeePaise: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Late Fee Trigger Date"
                  type="date"
                  value={form.lateFeeFrom}
                  onChange={(e) => setForm({ ...form, lateFeeFrom: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit">
                  Save Fee Rule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
