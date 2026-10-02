// ==============================================================================
// ADMIN PARTICIPANTS MANAGER (Requirement 7)
// Master participant directory with decoupled public IDs
// ==============================================================================

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, Search, ShieldCheck } from "lucide-react";

export default function AdminParticipantsPage() {
  const participants = [
    {
      publicId: "KUKKI-2026-X8F9Q",
      fullName: "Master Rahul Sharma",
      gender: "Male",
      nationality: "India",
      flag: "🇮🇳",
      designation: "Athlete",
      academy: "Delhi Taekwondo Academy",
      kukkiwonId: "KUKKI-DAN-092817",
      status: "ACTIVE",
    },
    {
      publicId: "KUKKI-2026-B3J7M",
      fullName: "Coach Arvind Rana",
      gender: "Male",
      nationality: "India",
      flag: "🇮🇳",
      designation: "Coach",
      academy: "Northern Combat Arts",
      kukkiwonId: "KUKKI-DAN-048123",
      status: "ACTIVE",
    },
    {
      publicId: "KUKKI-2026-N1K4V",
      fullName: "Kim Min-Jun",
      gender: "Male",
      nationality: "South Korea",
      flag: "🇰🇷",
      designation: "Technical Official",
      academy: "Kukkiwon Delegation",
      kukkiwonId: "KUKKI-DAN-011045",
      status: "ACTIVE",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-400" />
            <span>Master Participants Directory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Participant profiles strictly decoupled from internal database UUIDs. Secured public identifiers used externally.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Search className="h-4 w-4 mr-1.5" />
            <span>Search</span>
          </Button>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900/60 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Public ID</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Academy / Club</TableHead>
              <TableHead>Kukkiwon Dan ID</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((p) => (
              <TableRow key={p.publicId}>
                <TableCell>
                  <code className="text-xs font-mono font-bold text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {p.publicId}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-white text-xs">{p.fullName}</div>
                  <div className="text-[10px] text-slate-400">{p.gender}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-slate-200">
                    <span>{p.flag}</span>
                    <span>{p.nationality}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="gold">{p.designation}</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-300">
                  {p.academy}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-emerald-400">
                    {p.kukkiwonId}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-xs text-sky-400">
                    View Record
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
