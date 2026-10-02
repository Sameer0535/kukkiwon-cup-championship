// ==============================================================================
// REGISTRATION INVOICE & RECEIPT API
// GET /api/registrations/[registrationId]/invoice
// Delivers official receipt data (JSON) or print-ready institutional receipt (HTML/PDF)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getRegistrantSession } from "@/lib/server-auth";
import { PaymentService } from "@/server/services/payment.service";

interface RouteContext {
  params: Promise<{ registrationId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getRegistrantSession(request);
    const { registrationId } = await context.params;

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required." },
        { status: 400 }
      );
    }

    // Check admin secret or session
    const adminSecret = request.headers.get("x-admin-secret");
    const isAdmin = adminSecret && adminSecret === process.env.ADMIN_BOOTSTRAP_SECRET;

    if (!session && !isAdmin) {
      return NextResponse.json(
        { error: "Authentication required to view invoice." },
        { status: 401 }
      );
    }

    const invoice = await PaymentService.getInvoiceByRegistrationId(
      registrationId,
      isAdmin ? undefined : session?.userId
    );

    if (!invoice) {
      return NextResponse.json(
        { error: "No official invoice found for this registration. Payment may not be completed yet." },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    if (format === "html") {
      const htmlReceipt = generatePrintableReceiptHtml(invoice);
      return new NextResponse(htmlReceipt, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error: any) {
    console.error("[GET /api/registrations/[registrationId]/invoice] Error:", error);
    const isForbidden =
      error.message?.includes("Unauthorized") ||
      error.message?.includes("permission") ||
      error.message?.includes("Authentication");

    return NextResponse.json(
      { error: error.message || "Failed to retrieve invoice." },
      { status: isForbidden ? 403 : 500 }
    );
  }
}

/**
 * Generates an institutional print-ready HTML document adhering to Kukkiwon Cup identity
 */
function generatePrintableReceiptHtml(inv: any): string {
  const breakdown = inv.feeBreakdown;
  const items = breakdown.items || [];
  const paymentDate = new Date(inv.paymentDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rows = items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
        <strong>${item.label}</strong>
        ${item.isLateFee ? '<span style="display:inline-block; margin-left:8px; font-size:11px; color:#B45309; background:#FEF3C7; padding:2px 8px; border-radius:12px; font-weight:600;">LATE SURCHARGE</span>' : ""}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; text-align: right; font-size: 14px; font-weight: 600; color: #0F172A;">
        ₹${(item.amountPaise / 100).toLocaleString("en-IN")}
      </td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Payment Receipt - ${inv.invoiceNumber}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #F8FAFC;
      color: #0F172A;
    }
    .receipt-card {
      max-width: 800px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      background: #0A192F;
      color: #FFFFFF;
      padding: 32px;
      border-bottom: 3px solid #D4AF37;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .badge-paid {
      background: #10B981;
      color: #FFFFFF;
    }
    .content { padding: 32px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .meta-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; }
    .meta-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748B; margin-bottom: 4px; }
    .meta-val { font-size: 15px; font-weight: 600; color: #0F172A; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #F1F5F9; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; }
    .total-box {
      background: #F8FAFC;
      border-top: 2px solid #D4AF37;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      border-radius: 0 0 6px 6px;
    }
    .footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 20px;
      font-size: 12px;
      color: #64748B;
      text-align: center;
      line-height: 1.6;
    }
    .actions {
      max-width: 800px;
      margin: 16px auto;
      text-align: right;
    }
    .btn-print {
      background: #0A192F;
      color: #D4AF37;
      border: 1px solid #D4AF37;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-print:hover { background: #0F2A4A; }
    @media print {
      body { background: #FFFFFF; padding: 0; }
      .receipt-card { box-shadow: none; border: none; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="receipt-card">
    <div class="header">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #D4AF37; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px;">
            KUKKIWON NORTH INDIA × KYORIX SPORTS TECHNOLOGY
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
            ${inv.championshipName}
          </h1>
          <div style="color: #94A3B8; font-size: 14px; margin-top: 4px;">
            Official Championship Registration Receipt
          </div>
        </div>
        <div style="text-align: right;">
          <span class="badge badge-paid">PAID & VERIFIED</span>
          <div style="color: #F1F5F9; font-size: 14px; font-weight: 700; margin-top: 8px;">
            ${inv.invoiceNumber}
          </div>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="grid">
        <div class="meta-box">
          <div class="meta-label">Participant Details</div>
          <div class="meta-val">${inv.participantName}</div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">
            Registration Ref: <strong>${inv.registrationNumber}</strong>
          </div>
          ${inv.categoryName ? `<div style="font-size: 13px; color: #475569;">Category: ${inv.categoryName}</div>` : ""}
          ${inv.academyName ? `<div style="font-size: 13px; color: #475569;">Academy: ${inv.academyName}</div>` : ""}
        </div>

        <div class="meta-box">
          <div class="meta-label">Payment Information</div>
          <div class="meta-val">Date: ${paymentDate}</div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">
            Gateway Provider: <strong>${inv.provider}</strong>
          </div>
          <div style="font-size: 13px; color: #475569;">
            Transaction ID: <code>${inv.providerPaymentId || "Verified"}</code>
          </div>
          <div style="font-size: 13px; color: #10B981; font-weight: 600; margin-top: 4px;">
            Status: Confirmed & Reconciled
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Fee Description</th>
            <th style="text-align: right;">Amount (${inv.currency})</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="total-box">
        <div>
          <span style="font-size: 13px; color: #64748B; text-transform: uppercase; font-weight: 600;">Payment Status:</span>
          <span style="font-size: 14px; font-weight: 700; color: #10B981; margin-left: 6px;">COMPLETED</span>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: 600;">Total Amount Paid</div>
          <div style="font-size: 26px; font-weight: 800; color: #0A192F;">
            ${inv.totalAmountFormatted}
          </div>
        </div>
      </div>

      <div class="footer">
        This is an official system-generated registration receipt issued by the Kukkiwon Cup Championship Organizing Committee.<br/>
        Valid for official athlete/coach accreditation, document verification, and ID card issuance.<br/>
        For inquiries, contact the championship administration office.
      </div>
    </div>
  </div>
</body>
</html>`;
}
