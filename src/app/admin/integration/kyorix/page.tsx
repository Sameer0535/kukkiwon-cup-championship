"use client";

// ==============================================================================
// KYORIX INTEGRATION DASHBOARD (Phase 10)
// Administration of Kyorix ecosystem connection, championship mapping,
// synchronization statistics, manual sync triggers, and retry management
// ==============================================================================

import * as React from "react";
import Link from "next/link";
import {
  Network,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Shield,
  Layers,
  Zap,
  ArrowRight,
  Search,
  RotateCcw,
  Sliders,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  KyorixIntegrationStatusResponse,
  KyorixSyncRecordDTO,
} from "@/server/integrations/kyorix/types";

export default function KyorixIntegrationPage() {
  const [loading, setLoading] = React.useState(true);
  const [statusData, setStatusData] = React.useState<KyorixIntegrationStatusResponse | null>(null);
  const [records, setRecords] = React.useState<KyorixSyncRecordDTO[]>([]);
  const [recordsLoading, setRecordsLoading] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Action states
  const [testingConnection, setTestingConnection] = React.useState(false);
  const [togglingIntegration, setTogglingIntegration] = React.useState(false);
  const [savingMapping, setSavingMapping] = React.useState(false);
  const [syncingBulk, setSyncingBulk] = React.useState(false);
  const [syncingId, setSyncingId] = React.useState<string | null>(null);

  // Form states for mapping
  const [kyorixChampionshipId, setKyorixChampionshipId] = React.useState("KYX-EVT-2026-KKC");
  const [kyorixChampionshipName, setKyorixChampionshipName] = React.useState("Kukkiwon Cup India 2026");
  const [syncMode, setSyncMode] = React.useState<"MANUAL" | "AUTOMATIC">("MANUAL");

  // Notifications
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStatus = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/integration/kyorix?championshipId=champ-kukkiwon-2026");
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        if (data.mapping) {
          setKyorixChampionshipId(data.mapping.kyorixChampionshipId || "");
          setKyorixChampionshipName(data.mapping.kyorixChampionshipName || "");
          setSyncMode(data.mapping.syncMode || "MANUAL");
        }
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load integration status." });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecords = React.useCallback(async () => {
    try {
      setRecordsLoading(true);
      const url = new URL("/api/admin/integration/kyorix/records", window.location.origin);
      url.searchParams.set("championshipId", "champ-kukkiwon-2026");
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setRecords(data.items || []);
      }
    } catch {
      // Ignore
    } finally {
      setRecordsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  React.useEffect(() => {
    fetchStatus();
    fetchRecords();
  }, [fetchStatus, fetchRecords]);

  // Actions
  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      setMessage(null);
      const res = await fetch("/api/admin/integration/kyorix/test", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Connection successful (${data.latencyMs}ms): ${data.message}` });
      } else {
        setMessage({ type: "error", text: data.message || data.error || "Connection failed." });
      }
      fetchStatus();
    } catch {
      setMessage({ type: "error", text: "Failed to test connection." });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleToggleIntegration = async () => {
    const isCurrentlyEnabled = statusData?.mapping?.isEnabled ?? false;
    const endpoint = isCurrentlyEnabled
      ? "/api/admin/integration/kyorix/disable"
      : "/api/admin/integration/kyorix/enable";

    try {
      setTogglingIntegration(true);
      setMessage(null);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ championshipId: "champ-kukkiwon-2026" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Integration status updated." });
        fetchStatus();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update integration state." });
      }
    } catch {
      setMessage({ type: "error", text: "Operation failed." });
    } finally {
      setTogglingIntegration(false);
    }
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingMapping(true);
      setMessage(null);
      const res = await fetch("/api/admin/integration/kyorix/championship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId: "champ-kukkiwon-2026",
          kyorixChampionshipId,
          kyorixChampionshipName,
          syncMode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Championship mapping successfully updated." });
        fetchStatus();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save championship mapping." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save mapping." });
    } finally {
      setSavingMapping(false);
    }
  };

  const handleBulkSync = async () => {
    if (!confirm("Start synchronization of all eligible approved and paid registrations to Kyorix?")) return;

    try {
      setSyncingBulk(true);
      setMessage(null);
      const res = await fetch("/api/admin/integration/kyorix/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ championshipId: "champ-kukkiwon-2026" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: `Synchronization complete: ${data.syncedCount} synced, ${data.failedCount} failed.`,
        });
        fetchStatus();
        fetchRecords();
      } else {
        setMessage({ type: "error", text: data.error || "Bulk sync failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Bulk sync operation failed." });
    } finally {
      setSyncingBulk(false);
    }
  };

  const handleSyncAthlete = async (registrationId: string) => {
    try {
      setSyncingId(registrationId);
      setMessage(null);
      const res = await fetch(`/api/admin/integration/kyorix/athletes/${registrationId}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Athlete synced: Kyorix ID ${data.kyorixAthleteId}` });
        fetchStatus();
        fetchRecords();
      } else {
        setMessage({ type: "error", text: data.error || data.message || "Sync failed." });
        fetchRecords();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to synchronize athlete." });
    } finally {
      setSyncingId(null);
    }
  };

  const handleRetrySync = async (registrationId: string) => {
    try {
      setSyncingId(registrationId);
      setMessage(null);
      const res = await fetch(`/api/admin/integration/kyorix/athletes/${registrationId}/retry`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Retry successful: Kyorix ID ${data.kyorixAthleteId}` });
        fetchStatus();
        fetchRecords();
      } else {
        setMessage({ type: "error", text: data.error || data.message || "Retry failed." });
        fetchRecords();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to retry sync." });
    } finally {
      setSyncingId(null);
    }
  };

  const isEnabled = statusData?.mapping?.isEnabled ?? false;
  const connectionStatus = statusData?.connection?.status || "DISABLED";

  return (
    <div className="min-h-screen bg-[#060D17] text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#D4AF37] uppercase mb-1">
            <Network className="w-4 h-4 text-[#D4AF37]" />
            External Ecosystem Integration
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Kyorix Integration
            <Badge
              variant="outline"
              className={
                connectionStatus === "CONNECTED"
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                  : isEnabled
                  ? "bg-amber-950/60 text-amber-400 border-amber-500/30"
                  : "bg-slate-900 text-slate-400 border-slate-800"
              }
            >
              {connectionStatus === "CONNECTED" ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  CONNECTED
                </span>
              ) : isEnabled ? (
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-amber-400" />
                  DISCONNECTED
                </span>
              ) : (
                "DISABLED"
              )}
            </Badge>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Controlled, server-side data exchange with the Kyorix platform. Kukkiwon Cup remains the authoritative
            source of truth for registrations, payments, athlete IDs, and QR accreditations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${testingConnection ? "animate-spin" : ""}`} />
            Test Connection
          </Button>

          <Button
            variant={isEnabled ? "danger" : "primary"}
            size="sm"
            onClick={handleToggleIntegration}
            disabled={togglingIntegration}
            className="font-bold"
          >
            {isEnabled ? "Disable Integration" : "Enable Integration"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between gap-3 text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-200"
              : "bg-red-950/50 border-red-500/30 text-red-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Grid: Connection Status & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Connection Status */}
        <Card className="bg-[#0A192F]/80 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-slate-400">
              Connection Health
            </CardDescription>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              {connectionStatus === "CONNECTED" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Live Connected
                </>
              ) : connectionStatus === "CONNECTION_ERROR" ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Service Degraded
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-slate-400" />
                  Standby / Off
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-400 space-y-1">
            <p className="line-clamp-2">{statusData?.connection?.message || "Integration is offline."}</p>
            <div className="text-[11px] text-slate-500 pt-1">
              Mode: {statusData?.config?.useMock ? "Sandbox / Mock Adapter" : "Direct HTTPS"}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Eligible */}
        <Card className="bg-[#0A192F]/80 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-slate-400">
              Eligible Registrations
            </CardDescription>
            <CardTitle className="text-2xl font-black text-white">
              {statusData?.stats?.totalEligible ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-400">
            Approved or paid registrations eligible for Kyorix exchange.
          </CardContent>
        </Card>

        {/* Card 3: Synced */}
        <Card className="bg-[#0A192F]/80 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-emerald-400">
              Synchronized
            </CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-400">
              {statusData?.stats?.synced ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-400">
            {statusData?.stats?.lastSyncTime
              ? `Last sync: ${new Date(statusData.stats.lastSyncTime).toLocaleTimeString()}`
              : "No syncs performed yet."}
          </CardContent>
        </Card>

        {/* Card 4: Failed / Action */}
        <Card className="bg-[#0A192F]/80 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-rose-400">
              Failed Attempts
            </CardDescription>
            <CardTitle className="text-2xl font-black text-rose-400 flex items-center justify-between">
              <span>{statusData?.stats?.failed ?? 0}</span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkSync}
                disabled={syncingBulk || !isEnabled}
                className="text-xs bg-[#D4AF37] hover:bg-[#b5952f] text-slate-950 font-bold"
              >
                <Zap className={`w-3.5 h-3.5 mr-1 ${syncingBulk ? "animate-spin" : ""}`} />
                Sync All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-400">
            Pending sync: {statusData?.stats?.notSynced ?? 0} records.
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Championship Mapping Configuration */}
      <Card className="bg-[#0A192F]/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D4AF37]" />
                Championship Mapping & Sync Control
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Link this standalone Kukkiwon Cup tournament with a corresponding event on Kyorix.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs border-slate-700 text-slate-300">
              Local: champ-kukkiwon-2026
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveMapping} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                label="Kyorix Championship / Event ID"
                value={kyorixChampionshipId}
                onChange={(e) => setKyorixChampionshipId(e.target.value)}
                placeholder="KYX-EVT-2026-KKC"
                required
              />
            </div>
            <div>
              <Input
                label="Kyorix Event Name"
                value={kyorixChampionshipName}
                onChange={(e) => setKyorixChampionshipName(e.target.value)}
                placeholder="Kukkiwon Cup India National Championship"
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="block text-xs font-semibold tracking-wide uppercase text-slate-300">
                  Sync Mode
                </label>
                <select
                  value={syncMode}
                  onChange={(e) => setSyncMode(e.target.value as "MANUAL" | "AUTOMATIC")}
                  className="w-full h-10 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="MANUAL">MANUAL (Admin Triggered)</option>
                  <option value="AUTOMATIC">AUTOMATIC (On Approval)</option>
                </select>
              </div>
              <Button
                type="submit"
                variant="secondary"
                disabled={savingMapping}
                className="h-10 px-5 text-xs font-bold"
              >
                Save Mapping
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bottom Table: Synchronization Records & Failure Recovery */}
      <Card className="bg-[#0A192F]/90 border-slate-800">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                Synchronization Records
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Audit history of records exchanged with Kyorix. Failure here does not invalidate athlete registrations.
              </CardDescription>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative w-48 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search athlete or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="SYNCED">SYNCED</option>
                <option value="FAILED">FAILED</option>
                <option value="PENDING">PENDING</option>
                <option value="NOT_SYNCED">NOT_SYNCED</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-800 text-xs text-slate-400">
                  <TableHead className="py-3 px-4">Local Athlete</TableHead>
                  <TableHead className="py-3 px-4">Category & Academy</TableHead>
                  <TableHead className="py-3 px-4">Kyorix Identifiers</TableHead>
                  <TableHead className="py-3 px-4">Sync Status</TableHead>
                  <TableHead className="py-3 px-4">Last Sync / Attempt</TableHead>
                  <TableHead className="py-3 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      Loading synchronization records...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No synchronization records found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((rec) => (
                    <TableRow key={rec.id} className="border-b border-slate-800/60 hover:bg-slate-900/50">
                      <TableCell className="py-3 px-4">
                        <div className="font-semibold text-white text-xs">{rec.athleteName}</div>
                        <div className="font-mono text-[11px] text-[#D4AF37]">{rec.athleteId}</div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs text-slate-300">
                        <div>{rec.categoryName || "General Division"}</div>
                        <div className="text-[11px] text-slate-400">{rec.academyName || "Direct Entry"}</div>
                      </TableCell>
                      <TableCell className="py-3 px-4 font-mono text-xs">
                        {rec.kyorixAthleteId ? (
                          <div className="text-emerald-400">{rec.kyorixAthleteId}</div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                        {rec.kyorixRegistrationId && (
                          <div className="text-[10px] text-slate-400">{rec.kyorixRegistrationId}</div>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={
                            rec.syncStatus === "SYNCED"
                              ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                              : rec.syncStatus === "FAILED"
                              ? "bg-rose-950/60 text-rose-400 border-rose-500/30"
                              : rec.syncStatus === "PENDING"
                              ? "bg-amber-950/60 text-amber-400 border-amber-500/30"
                              : "bg-slate-900 text-slate-400 border-slate-800"
                          }
                        >
                          {rec.syncStatus}
                        </Badge>
                        {rec.lastError && (
                          <div className="text-[10px] text-rose-300 max-w-[200px] truncate mt-1" title={rec.lastError}>
                            {rec.lastError}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs text-slate-400">
                        {rec.lastSyncedAt
                          ? new Date(rec.lastSyncedAt).toLocaleString()
                          : rec.lastSyncAttemptAt
                          ? `Attempted: ${new Date(rec.lastSyncAttemptAt).toLocaleTimeString()}`
                          : "Never"}
                        <div className="text-[10px] text-slate-500">v{rec.syncVersion} ({rec.attempts} attempts)</div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        {rec.syncStatus === "FAILED" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRetrySync(rec.registrationId)}
                            disabled={syncingId === rec.registrationId || !isEnabled}
                            className="text-xs h-8 flex items-center gap-1.5"
                          >
                            <RotateCcw
                              className={`w-3.5 h-3.5 ${syncingId === rec.registrationId ? "animate-spin" : ""}`}
                            />
                            Retry
                          </Button>
                        ) : rec.syncStatus === "SYNCED" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncAthlete(rec.registrationId)}
                            disabled={syncingId === rec.registrationId || !isEnabled}
                            className="text-xs h-8 text-slate-400 hover:text-white"
                          >
                            Resync
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSyncAthlete(rec.registrationId)}
                            disabled={syncingId === rec.registrationId || !isEnabled}
                            className="text-xs h-8"
                          >
                            Sync
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
