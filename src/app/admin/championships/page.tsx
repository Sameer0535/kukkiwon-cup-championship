// ==============================================================================
// ADMIN CHAMPIONSHIPS MANAGER (Requirements 6 & 22)
// Scalable multi-tournament configuration
// ==============================================================================

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Trophy, Plus, Calendar, MapPin, ExternalLink } from "lucide-react";

export default function AdminChampionshipsPage() {
  const championships = [
    {
      id: "champ-001",
      slug: "kukkiwon-cup-2026",
      name: "Kukkiwon Cup Championship 2026",
      edition: "2026",
      status: "REGISTRATION_OPEN",
      dates: "20 Nov - 23 Nov 2026",
      venue: "Indira Gandhi Indoor Stadium, New Delhi",
      athleteFee: "₹2,500",
      coachFee: "₹1,500",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <span>Championship Editions</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Multi-championship management. System allows unlimited editions with independent rules and venues.
          </p>
        </div>

        <Button variant="gold" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          <span>New Championship</span>
        </Button>
      </div>

      {/* Championships Table */}
      <Card className="border-slate-800 bg-slate-900/60 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Edition / Name</TableHead>
              <TableHead>URL Slug</TableHead>
              <TableHead>Dates & Venue</TableHead>
              <TableHead>Entry Fees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {championships.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-bold text-white text-xs">{c.name}</div>
                  <div className="text-[10px] text-slate-400">Edition {c.edition}</div>
                </TableCell>
                <TableCell>
                  <code className="text-xs text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    /{c.slug}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-slate-300">{c.dates}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.venue}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-white">Athlete: {c.athleteFee}</div>
                  <div className="text-[10px] text-slate-400">Coach: {c.coachFee}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="success">Registration Open</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/championship/${c.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
                  >
                    <span>Public View</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
