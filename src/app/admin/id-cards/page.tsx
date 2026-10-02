// ==============================================================================
// ADMIN ID CARDS & QR ACCREDITATION (Requirements 13 & 14)
// Digital ID badge generation, revocation, and cryptographic QR token manager
// ==============================================================================

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { IdCard, QrCode, ExternalLink, RefreshCw, Ban } from "lucide-react";

export default function AdminIdCardsPage() {
  const cards = [
    {
      id: "card-1",
      cardNumber: "CARD-KC26-DEMO01",
      participant: "Master Rahul Sharma",
      publicId: "KUKKI-2026-X8F9Q",
      designation: "Athlete",
      status: "GENERATED",
      qrToken: "demo-token",
      generatedAt: "02 Oct 2026, 12:00 PM",
    },
    {
      id: "card-2",
      cardNumber: "CARD-KC26-88192",
      participant: "Coach Arvind Rana",
      publicId: "KUKKI-2026-B3J7M",
      designation: "Coach",
      status: "GENERATED",
      qrToken: "sec_token_9831a_random",
      generatedAt: "02 Oct 2026, 12:30 PM",
    },
    {
      id: "card-3",
      cardNumber: "CARD-KC26-44129",
      participant: "Suspended Competitor",
      publicId: "KUKKI-2026-S991X",
      designation: "Athlete",
      status: "REVOKED",
      qrToken: "sec_token_revoked_99",
      generatedAt: "01 Oct 2026, 09:15 AM",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
            <IdCard className="h-5 w-5 text-cyan-400" />
            <span>Digital ID Cards & QR Accreditation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate and manage tournament badges. QR codes point to secure validation domain without embedding sensitive PII.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="cyan" size="sm">
            <QrCode className="h-4 w-4 mr-1.5" />
            <span>Batch Generate Badges</span>
          </Button>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900/60 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Card Number</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Card Status</TableHead>
              <TableHead>QR Token Binding</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead className="text-right">Verification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    {c.cardNumber}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-white text-xs">{c.participant}</div>
                  <div className="text-[10px] font-mono text-slate-400">{c.publicId}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="gold">{c.designation}</Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell>
                  <code className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {c.qrToken}
                  </code>
                </TableCell>
                <TableCell className="text-xs text-slate-400">
                  {c.generatedAt}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Link
                    href={`/verify/${c.qrToken}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
                  >
                    <span>Test QR</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  {c.status === "GENERATED" && (
                    <Button variant="danger" size="sm" className="text-xs">
                      <Ban className="h-3 w-3 mr-1" />
                      <span>Revoke</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
