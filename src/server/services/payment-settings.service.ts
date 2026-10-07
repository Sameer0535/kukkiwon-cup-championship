// ==============================================================================
// PAYMENT SETTINGS STORAGE SERVICE
// Tournament Payment Gateway & Bank Account Configuration
// Persists Admin-configured UPI ID, Account Details, and Payment QR Code
// ==============================================================================

import fs from "fs";
import path from "path";
import os from "os";

export interface TournamentPaymentSettings {
  upiId: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  qrImageUrl: string | null;
  feeAmountInr: number;
  instructions: string;
  updatedAt: string;
}

const DEFAULT_SETTINGS: TournamentPaymentSettings = {
  upiId: "kukkiwoncup@icici",
  accountHolderName: "KUKKIWON CUP ORGANIZING COMMITTEE",
  accountNumber: "50200088991122",
  bankName: "HDFC Bank",
  ifscCode: "HDFC0001234",
  branchName: "Connaught Place, New Delhi",
  qrImageUrl: null,
  feeAmountInr: 2500,
  instructions: "Scan the official tournament QR code or transfer the entry fee using UPI / NetBanking. Enter the 12-digit UTR reference number below to complete your registration.",
  updatedAt: new Date().toISOString(),
};

declare global {
  var __kukkiwonPaymentSettings: TournamentPaymentSettings | undefined;
}

const TMP_PATH = path.join(os.tmpdir(), "kukkiwon_championship_data", "payment_settings.json");
const DATA_PATH = path.join(process.cwd(), ".data", "payment_settings.json");

export class PaymentSettingsService {
  /**
   * Retrieves active payment settings
   */
  static async getSettings(): Promise<TournamentPaymentSettings> {
    if (global.__kukkiwonPaymentSettings) {
      return global.__kukkiwonPaymentSettings;
    }

    // Try reading from .data/payment_settings.json
    try {
      if (fs.existsSync(DATA_PATH)) {
        const raw = fs.readFileSync(DATA_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        global.__kukkiwonPaymentSettings = merged;
        return merged;
      }
    } catch {}

    // Try reading from tmp path
    try {
      if (fs.existsSync(TMP_PATH)) {
        const raw = fs.readFileSync(TMP_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        global.__kukkiwonPaymentSettings = merged;
        return merged;
      }
    } catch {}

    global.__kukkiwonPaymentSettings = DEFAULT_SETTINGS;
    return DEFAULT_SETTINGS;
  }

  /**
   * Updates tournament payment details
   */
  static async saveSettings(
    patch: Partial<TournamentPaymentSettings>
  ): Promise<TournamentPaymentSettings> {
    const current = await this.getSettings();
    const updated: TournamentPaymentSettings = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    global.__kukkiwonPaymentSettings = updated;
    const content = JSON.stringify(updated, null, 2);

    try {
      const dir = path.dirname(DATA_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_PATH, content, "utf-8");
    } catch {}

    try {
      const dir = path.dirname(TMP_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(TMP_PATH, content, "utf-8");
    } catch {}

    return updated;
  }

  /**
   * Saves uploaded QR code image buffer as Base64 Data URI
   */
  static async saveQrImage(buffer: Buffer, mimeType: string): Promise<string> {
    const base64Data = `data:${mimeType};base64,${buffer.toString("base64")}`;
    await this.saveSettings({ qrImageUrl: base64Data });
    return base64Data;
  }

  /**
   * Removes custom QR code
   */
  static async removeQrImage(): Promise<void> {
    await this.saveSettings({ qrImageUrl: null });
  }
}
