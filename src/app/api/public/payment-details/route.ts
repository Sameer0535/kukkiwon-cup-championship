// ==============================================================================
// PUBLIC PAYMENT DETAILS API (GET /api/public/payment-details)
// Returns tournament bank details, UPI ID, and official QR Code for participants
// Dynamically synchronized with Championship CMS entry fee
// ==============================================================================

import { NextResponse } from "next/server";
import { PaymentSettingsService } from "@/server/services/payment-settings.service";
import { CmsService } from "@/server/services/cms.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await PaymentSettingsService.getSettings();
    let effectiveFee = settings.feeAmountInr || 2500;

    // Check if active championship has a configured entry fee
    try {
      const activeChamp = await CmsService.getChampionship("champ-kukkiwon-2026", true);
      if (activeChamp && typeof activeChamp.entryFeeAthlete === "number" && activeChamp.entryFeeAthlete > 0) {
        if (!settings.feeAmountInr || settings.feeAmountInr === 2500 || activeChamp.entryFeeAthlete !== 2500) {
          effectiveFee = activeChamp.entryFeeAthlete;
        }
      }
    } catch {}

    const response = NextResponse.json({
      success: true,
      settings: {
        upiId: settings.upiId,
        accountHolderName: settings.accountHolderName,
        accountNumber: settings.accountNumber,
        bankName: settings.bankName,
        ifscCode: settings.ifscCode,
        branchName: settings.branchName,
        qrImageUrl: settings.qrImageUrl,
        feeAmountInr: effectiveFee,
        instructions: settings.instructions,
      },
    });

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve payment details." },
      { status: 500 }
    );
  }
}
