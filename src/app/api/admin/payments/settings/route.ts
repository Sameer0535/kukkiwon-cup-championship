// ==============================================================================
// ADMIN PAYMENT SETTINGS API (GET & POST)
// Allows tournament administrators to configure bank details, UPI ID, and QR codes
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { PaymentSettingsService } from "@/server/services/payment-settings.service";
import { AuditService } from "@/server/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN", "FINANCE_ADMIN"]);
    const settings = await PaymentSettingsService.getSettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load payment settings." },
      { status: err.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN", "FINANCE_ADMIN"]);
    const contentType = req.headers.get("content-type") || "";

    // 1. Multipart Form Upload (QR Image + Form Fields)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const qrFile = formData.get("qrFile") as File | null;
      const upiId = formData.get("upiId") as string | null;
      const accountHolderName = formData.get("accountHolderName") as string | null;
      const accountNumber = formData.get("accountNumber") as string | null;
      const bankName = formData.get("bankName") as string | null;
      const ifscCode = formData.get("ifscCode") as string | null;
      const branchName = formData.get("branchName") as string | null;
      const instructions = formData.get("instructions") as string | null;
      const feeAmountInr = formData.get("feeAmountInr") as string | null;

      const patch: Record<string, any> = {};
      if (upiId) patch.upiId = upiId.trim();
      if (accountHolderName) patch.accountHolderName = accountHolderName.trim();
      if (accountNumber) patch.accountNumber = accountNumber.trim();
      if (bankName) patch.bankName = bankName.trim();
      if (ifscCode) patch.ifscCode = ifscCode.trim().toUpperCase();
      if (branchName) patch.branchName = branchName.trim();
      if (instructions) patch.instructions = instructions.trim();
      if (feeAmountInr && !isNaN(Number(feeAmountInr))) patch.feeAmountInr = Number(feeAmountInr);

      if (qrFile && qrFile.size > 0) {
        if (!qrFile.type.startsWith("image/")) {
          return NextResponse.json(
            { error: "Only image files (PNG, JPG, WEBP) are supported for QR codes." },
            { status: 400 }
          );
        }
        const buffer = Buffer.from(await qrFile.arrayBuffer());
        const base64 = `data:${qrFile.type};base64,${buffer.toString("base64")}`;
        patch.qrImageUrl = base64;
      }

      const updated = await PaymentSettingsService.saveSettings(patch);

      await AuditService.logAction({
        adminUserId: admin.user_id,
        action: "PAYMENT_SETTINGS_UPDATED",
        entityType: "PaymentSettings",
        entityId: "default",
        newValue: { upiId: updated.upiId, bankName: updated.bankName, hasQr: !!updated.qrImageUrl },
      });

      return NextResponse.json({
        success: true,
        message: "Payment settings saved successfully.",
        settings: updated,
      });
    }

    // 2. JSON Body
    const body = await req.json();
    const updated = await PaymentSettingsService.saveSettings(body);

    await AuditService.logAction({
      adminUserId: admin.user_id,
      action: "PAYMENT_SETTINGS_UPDATED",
      entityType: "PaymentSettings",
      entityId: "default",
      newValue: { upiId: updated.upiId, bankName: updated.bankName, hasQr: !!updated.qrImageUrl },
    });

    return NextResponse.json({
      success: true,
      message: "Payment settings saved successfully.",
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save payment settings." },
      { status: err.statusCode || 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN", "FINANCE_ADMIN"]);
    await PaymentSettingsService.removeQrImage();
    const settings = await PaymentSettingsService.getSettings();
    return NextResponse.json({
      success: true,
      message: "Payment QR code removed successfully.",
      settings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to remove QR code." },
      { status: err.statusCode || 500 }
    );
  }
}
