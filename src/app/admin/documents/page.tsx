// ==============================================================================
// ADMIN DOCUMENT VERIFICATION QUEUE (Requirement 11)
// Review private identity and Dan certificates with time-limited signed URLs
// ==============================================================================

import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileCheck, Shield, Lock, Eye, Check, X } from "lucide-react";

export default function AdminDocumentsPage() {
  const documents = [
    {
      id: "doc-1",
      participant: "Master Rahul Sharma",
      publicId: "KUKKI-2026-X8F9Q",
      documentType: "KUKKIWON_DAN_CERTIFICATE",
      fileName: "kukkiwon_4th_dan_cert.pdf",
      fileSize: "2.4 MB",
      status: "VERIFIED",
      uploadedAt: "02 Oct 2026, 10:15 AM",
    },
    {
      id: "doc-2",
      participant: "Coach Arvind Rana",
      publicId: "KUKKI-2026-B3J7M",
      documentType: "GOVT_PHOTO_ID_PASSPORT",
      fileName: "passport_scan_arvind.pdf",
      fileSize: "1.8 MB",
      status: "UPLOADED",
      uploadedAt: "02 Oct 2026, 11:45 AM",
    },
    {
      id: "doc-3",
      participant: "Priya Chauhan",
      publicId: "KUKKI-2026-K9P2W",
      documentType: "MEDICAL_FITNESS_CERTIFICATE",
      fileName: "medical_fitness_priya.pdf",
      fileSize: "980 KB",
      status: "PENDING",
      uploadedAt: "01 Oct 2026, 02:20 PM",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-amber-400" />
            <span>Document Verification Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Private storage security: Participant documents are never public. Reviewers access documents exclusively via time-limited signed URLs.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-amber-400">
          <Lock className="h-3.5 w-3.5" />
          <span>Private Storage Enforced</span>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900/60 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participant</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>File Name & Size</TableHead>
              <TableHead>Verification Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Verification Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <div className="font-bold text-white text-xs">{d.participant}</div>
                  <div className="text-[10px] font-mono text-slate-400">{d.publicId}</div>
                </TableCell>
                <TableCell>
                  <code className="text-xs text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
                    {d.documentType}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-slate-200">{d.fileName}</div>
                  <div className="text-[10px] text-slate-500">{d.fileSize}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={d.status} />
                </TableCell>
                <TableCell className="text-xs text-slate-400">
                  {d.uploadedAt}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="sm" className="text-xs text-sky-400">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    <span>Review</span>
                  </Button>
                  {d.status === "UPLOADED" && (
                    <>
                      <Button variant="secondary" size="sm" className="text-xs text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="danger" size="sm" className="text-xs text-red-400">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
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
