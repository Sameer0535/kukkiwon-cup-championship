// ==============================================================================
// PUBLIC PAYMENT DETAILS API
// Returns tournament bank details, UPI ID, and official QR Code for participants
// ==============================================================================

import { NextResponse } from "next/server";
import { PaymentSettingsService } from "@/server/services/payment-settings.service";

export async function GET() {
  try {
    const settings = await PaymentSettingsService.getSettings();
    return NextResponse.json({
      success: true,
      settings: {
        upiId: settings.upiId,
        accountHolderName: settings.accountHolderName,
        accountNumber: settings.accountNumber,
        bankName: settings.bankName,
        ifscCode: settings.ifscCode,
        branchName: settings.branchName,
        qrImageUrl: settings.qrImageUrl,
        feeAmountInr: settings.feeAmountInr,
        instructions: settings.instructions,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve payment details." },
      { status: 500 }
    );
  }
}
