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
  var __kukkiwonPaymentSettingsMtime: number | undefined;
}

const TMP_PATH = path.join(os.tmpdir(), "kukkiwon_championship_data", "payment_settings.json");
const DATA_PATH = path.join(process.cwd(), ".data", "payment_settings.json");

export class PaymentSettingsService {
  /**
   * Retrieves active payment settings with reactive disk reload
   */
  static async getSettings(): Promise<TournamentPaymentSettings> {
    let diskMtime = 0;
    let chosenPath: string | null = null;

    try {
      if (fs.existsSync(DATA_PATH)) {
        const stat = fs.statSync(DATA_PATH);
        diskMtime = stat.mtimeMs;
        chosenPath = DATA_PATH;
      }
      if (fs.existsSync(TMP_PATH)) {
        const stat = fs.statSync(TMP_PATH);
        if (stat.mtimeMs > diskMtime) {
          diskMtime = stat.mtimeMs;
          chosenPath = TMP_PATH;
        }
      }
    } catch {}

    if (
      global.__kukkiwonPaymentSettings &&
      global.__kukkiwonPaymentSettingsMtime &&
      diskMtime <= global.__kukkiwonPaymentSettingsMtime
    ) {
      return global.__kukkiwonPaymentSettings;
    }

    if (chosenPath) {
      try {
        const raw = fs.readFileSync(chosenPath, "utf-8");
        const parsed = JSON.parse(raw);
        const merged: TournamentPaymentSettings = { ...DEFAULT_SETTINGS, ...parsed };
        global.__kukkiwonPaymentSettings = merged;
        global.__kukkiwonPaymentSettingsMtime = diskMtime;
        return merged;
      } catch {}
    }

    if (!global.__kukkiwonPaymentSettings) {
      global.__kukkiwonPaymentSettings = { ...DEFAULT_SETTINGS };
      global.__kukkiwonPaymentSettingsMtime = Date.now();
    }
    return global.__kukkiwonPaymentSettings;
  }

  /**
   * Updates tournament payment details and syncs to disk and CMS
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

    const now = Date.now();
    global.__kukkiwonPaymentSettings = updated;
    global.__kukkiwonPaymentSettingsMtime = now;
    const content = JSON.stringify(updated, null, 2);

    try {
      const dir = path.dirname(DATA_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_PATH, content, "utf-8");
      try {
        const stat = fs.statSync(DATA_PATH);
        global.__kukkiwonPaymentSettingsMtime = stat.mtimeMs;
      } catch {}
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
