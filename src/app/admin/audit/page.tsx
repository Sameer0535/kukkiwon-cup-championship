// ==============================================================================
// ADMIN AUDIT LOGS (Requirement 16)
// Immutable traceability of administrative actions
// ==============================================================================

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ShieldAlert, Filter, Lock } from "lucide-react";

export default function AdminAuditLogsPage() {
  const auditLogs = [
    {
      id: "log-1",
      admin: "superadmin@kukkiwoncup.org",
      action: "CHAMPIONSHIP_INITIALIZED",
      entity: "Championship: kukkiwon-cup-2026",
      timestamp: "02 Oct 2026, 12:45 PM",
      ip: "127.0.0.1",
    },
    {
      id: "log-2",
      admin: "docadmin@kukkiwoncup.org",
      action: "DOCUMENT_VERIFIED",
      entity: "Document: doc-1 (Kukkiwon Dan Cert)",
      timestamp: "02 Oct 2026, 12:50 PM",
      ip: "127.0.0.1",
    },
    {
      id: "log-3",
      admin: "regadmin@kukkiwoncup.org",
      action: "REGISTRATION_CONFIRMED",
      entity: "Registration: REG-KC26-A1001",
      timestamp: "02 Oct 2026, 01:10 PM",
      ip: "127.0.0.1",
    },
    {
      id: "log-4",
      admin: "system",
      action: "ID_CARD_GENERATED",
      entity: "IdCard: CARD-KC26-DEMO01",
      timestamp: "02 Oct 2026, 01:12 PM",
      ip: "internal",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-purple-400" />
            <span>Immutable Administrative Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracks participant edits, document verifications, status approvals, card re-issues, and settings changes.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-xs text-purple-300 font-semibold">
          <Lock className="h-3.5 w-3.5" />
          <span>SUPER_ADMIN Access Only</span>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900/60 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Administrator</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target Entity</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Network IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="font-semibold text-slate-200 text-xs">{log.admin}</div>
                </TableCell>
                <TableCell>
                  <code className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
                    {log.action}
                  </code>
                </TableCell>
                <TableCell className="text-xs text-slate-300">
                  {log.entity}
                </TableCell>
                <TableCell className="text-xs text-slate-400">
                  {log.timestamp}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-[11px] text-slate-500">
                    {log.ip}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
