// ==============================================================================
// ADMIN REGISTRATIONS MANAGER (Requirement 8)
// Registration review, status state machine, and terms tracking
// ==============================================================================

import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Filter, Download } from "lucide-react";

export default function AdminRegistrationsPage() {
  const registrations = [
    {
      id: "reg-01",
      regNumber: "REG-KC26-A1001",
      participant: "Master Rahul Sharma",
      publicId: "KUKKI-2026-X8F9Q",
      designation: "Athlete",
      championship: "Kukkiwon Cup 2026",
      status: "CONFIRMED",
      termsVersion: "v1.0",
      registeredAt: "02 Oct 2026",
    },
    {
      id: "reg-02",
      regNumber: "REG-KC26-C2044",
      participant: "Coach Arvind Rana",
      publicId: "KUKKI-2026-B3J7M",
      designation: "Coach",
      championship: "Kukkiwon Cup 2026",
      status: "UNDER_REVIEW",
      termsVersion: "v1.0",
      registeredAt: "02 Oct 2026",
    },
    {
      id: "reg-03",
      regNumber: "REG-KC26-A1099",
      participant: "Priya Chauhan",
      publicId: "KUKKI-2026-K9P2W",
      designation: "Athlete",
      championship: "Kukkiwon Cup 2026",
      status: "PENDING_PAYMENT",
      termsVersion: "v1.0",
      registeredAt: "01 Oct 2026",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-sky-400" />
            <span>Registration Intake & Status</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track participant entries through the 8-stage state machine (Draft, Pending Payment, Paid, Under Review, Confirmed, Rejected).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Filter className="h-4 w-4 mr-1.5" />
            <span>Filter</span>
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900/60 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reg Number</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Terms Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <span className="font-mono text-xs font-bold text-sky-400">
                    {r.regNumber}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-white text-xs">{r.participant}</div>
                  <div className="text-[10px] font-mono text-slate-400">{r.publicId}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="gold">{r.designation}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {r.termsVersion}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="text-xs text-slate-400">
                  {r.registeredAt}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-xs text-sky-400">
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
