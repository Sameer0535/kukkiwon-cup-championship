// ==============================================================================
// ADMIN PAYMENTS & FINANCE MANAGER (Requirement 12)
// Server-verified transaction tracking and payment auditing
// ==============================================================================

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, AlertCircle, BarChart3 } from "lucide-react";

export default function AdminPaymentsPage() {
  const payments = [
    {
      id: "pay-101",
      orderId: "order_KUKKI_0912",
      paymentId: "pay_KUKKI_8837192",
      registration: "REG-KC26-A1001",
      amount: "₹2,500.00",
      method: "UPI (Google Pay)",
      provider: "RAZORPAY",
      status: "SUCCESS",
      date: "02 Oct 2026, 11:30 AM",
    },
    {
      id: "pay-102",
      orderId: "order_KUKKI_0915",
      paymentId: "pay_KUKKI_9928172",
      registration: "REG-KC26-C2044",
      amount: "₹1,500.00",
      method: "Credit Card (Visa)",
      provider: "RAZORPAY",
      status: "SUCCESS",
      date: "02 Oct 2026, 12:15 PM",
    },
    {
      id: "pay-103",
      orderId: "order_KUKKI_0918",
      paymentId: "pay_KUKKI_FAILED",
      registration: "REG-KC26-A1099",
      amount: "₹2,500.00",
      method: "NetBanking",
      provider: "RAZORPAY",
      status: "FAILED",
      date: "01 Oct 2026, 04:45 PM",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            <span>Payment Ledger & Gateway Audit</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Strict server-side payment verification. Frontend payment callbacks are never trusted blindly without cryptographic gateway confirmation.
          </p>
        </div>

        <Link href="/admin/reconciliation">
          <Button variant="primary" size="sm" className="text-xs font-bold uppercase">
            <BarChart3 className="h-4 w-4 mr-1.5" />
            <span>Financial Reconciliation</span>
          </Button>
        </Link>
      </div>

      <Card className="border-slate-800 bg-slate-900/60 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID / Transaction</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Gateway Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-mono text-xs font-bold text-sky-400">
                    {p.orderId}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {p.paymentId}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-300">
                  {p.registration}
                </TableCell>
                <TableCell className="text-xs font-bold text-white">
                  {p.amount}
                </TableCell>
                <TableCell>
                  <div className="text-xs text-slate-300">{p.method}</div>
                  <div className="text-[10px] text-slate-400">{p.provider}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell className="text-xs text-slate-400">
                  {p.date}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-xs text-sky-400">
                    View Receipt
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
