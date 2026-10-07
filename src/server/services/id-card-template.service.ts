// ==============================================================================
// ID CARD TEMPLATE STORAGE SERVICE
// Authoritative persistence and retrieval for custom accreditation badge background templates
// Supports static public assets, .data store, filesystem, and global dev cache
// ==============================================================================

import fs from "fs";
import path from "path";
import os from "os";

interface TemplateRecord {
  templateUrl: string;
  updatedAt: string;
}

declare global {
  var __kukkiwonTemplateStore: string | null | undefined;
}

const TMP_TEMPLATE_PATH = path.join(os.tmpdir(), "kukkiwon_championship_data", "id-card-template.json");
const DATA_TEMPLATE_PATH = path.join(process.cwd(), ".data", "id-card-template.json");
const STORAGE_TEMPLATE_PATH = path.join(process.cwd(), "storage", "id-card-template.json");
const PUBLIC_BRANDING_DIR = path.join(process.cwd(), "public", "branding");

export class IdCardTemplateService {
  /**
   * Retrieves the current custom ID card template URL or data URI
   */
  static async getTemplate(): Promise<string | null> {
    // 1. Check global cache first
    if (global.__kukkiwonTemplateStore !== undefined && global.__kukkiwonTemplateStore !== null) {
      return global.__kukkiwonTemplateStore;
    }

    // 2. Check persistent .data storage first (guaranteed data URI or saved URL)
    try {
      if (fs.existsSync(DATA_TEMPLATE_PATH)) {
        const raw = fs.readFileSync(DATA_TEMPLATE_PATH, "utf-8");
        const parsed: TemplateRecord = JSON.parse(raw);
        if (parsed.templateUrl) {
          global.__kukkiwonTemplateStore = parsed.templateUrl;
          return parsed.templateUrl;
        }
      }
    } catch {}

    // 3. Check temp storage
    try {
      if (fs.existsSync(TMP_TEMPLATE_PATH)) {
        const raw = fs.readFileSync(TMP_TEMPLATE_PATH, "utf-8");
        const parsed: TemplateRecord = JSON.parse(raw);
        if (parsed.templateUrl) {
          global.__kukkiwonTemplateStore = parsed.templateUrl;
          return parsed.templateUrl;
        }
      }
    } catch {}

    // 4. Check storage/ fallback
    try {
      if (fs.existsSync(STORAGE_TEMPLATE_PATH)) {
        const raw = fs.readFileSync(STORAGE_TEMPLATE_PATH, "utf-8");
        const parsed: TemplateRecord = JSON.parse(raw);
        if (parsed.templateUrl) {
          global.__kukkiwonTemplateStore = parsed.templateUrl;
          return parsed.templateUrl;
        }
      }
    } catch {}

    // 5. Check static file in public/branding/
    try {
      const publicFiles = ["id-card-template.png", "id-card-template.jpg", "id-card-template.webp"];
      for (const f of publicFiles) {
        const fullPath = path.join(PUBLIC_BRANDING_DIR, f);
        if (fs.existsSync(fullPath)) {
          const url = `/branding/${f}?v=${fs.statSync(fullPath).mtimeMs}`;
          global.__kukkiwonTemplateStore = url;
          return url;
        }
      }
    } catch {}

    global.__kukkiwonTemplateStore = null;
    return null;
  }

  /**
   * Synchronous getter for use in server templates
   */
  static getTemplateSync(): string | null {
    if (global.__kukkiwonTemplateStore !== undefined && global.__kukkiwonTemplateStore !== null) {
      return global.__kukkiwonTemplateStore;
    }
    try {
      if (fs.existsSync(DATA_TEMPLATE_PATH)) {
        const raw = fs.readFileSync(DATA_TEMPLATE_PATH, "utf-8");
        const parsed: TemplateRecord = JSON.parse(raw);
        if (parsed.templateUrl) {
          global.__kukkiwonTemplateStore = parsed.templateUrl;
          return parsed.templateUrl;
        }
      }
    } catch {}
    try {
      const publicFiles = ["id-card-template.png", "id-card-template.jpg", "id-card-template.webp"];
      for (const f of publicFiles) {
        const fullPath = path.join(PUBLIC_BRANDING_DIR, f);
        if (fs.existsSync(fullPath)) {
          const url = `/branding/${f}`;
          global.__kukkiwonTemplateStore = url;
          return url;
        }
      }
    } catch {}
    return null;
  }

  /**
   * Saves a new custom ID card template (image buffer or URL/data URI)
   */
  static async saveTemplate(templateUrl: string): Promise<string> {
    global.__kukkiwonTemplateStore = templateUrl;
    const record: TemplateRecord = {
      templateUrl,
      updatedAt: new Date().toISOString(),
    };
    const content = JSON.stringify(record, null, 2);

    // Ensure directories exist
    try {
      const dataDir = path.dirname(DATA_TEMPLATE_PATH);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(DATA_TEMPLATE_PATH, content, "utf-8");
    } catch {}

    try {
      const tmpDir = path.dirname(TMP_TEMPLATE_PATH);
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(TMP_TEMPLATE_PATH, content, "utf-8");
    } catch {}

    try {
      const storageDir = path.dirname(STORAGE_TEMPLATE_PATH);
      if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
      fs.writeFileSync(STORAGE_TEMPLATE_PATH, content, "utf-8");
    } catch {}

    return templateUrl;
  }

  /**
   * Saves binary file buffer directly to base64 Data URI and public fallback
   */
  static async saveTemplateFile(buffer: Buffer, mimeType: string): Promise<string> {
    const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
    const filename = `id-card-template.${ext}`;
    const base64 = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // Write file to public/branding as backup
    try {
      if (!fs.existsSync(PUBLIC_BRANDING_DIR)) {
        fs.mkdirSync(PUBLIC_BRANDING_DIR, { recursive: true });
      }
      const destPath = path.join(PUBLIC_BRANDING_DIR, filename);
      fs.writeFileSync(destPath, buffer);
    } catch {}

    // Persist base64 data URI to .data/id-card-template.json so it never 404s or disappears on reload
    await this.saveTemplate(base64);
    return base64;
  }

  /**
   * Deletes the custom template, reverting to the standard badge design
   */
  static async deleteTemplate(): Promise<void> {
    global.__kukkiwonTemplateStore = null;

    try {
      const publicFiles = ["id-card-template.png", "id-card-template.jpg", "id-card-template.webp"];
      for (const f of publicFiles) {
        const fullPath = path.join(PUBLIC_BRANDING_DIR, f);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
    } catch {}

    try {
      if (fs.existsSync(DATA_TEMPLATE_PATH)) fs.unlinkSync(DATA_TEMPLATE_PATH);
    } catch {}
    try {
      if (fs.existsSync(TMP_TEMPLATE_PATH)) fs.unlinkSync(TMP_TEMPLATE_PATH);
    } catch {}
    try {
      if (fs.existsSync(STORAGE_TEMPLATE_PATH)) fs.unlinkSync(STORAGE_TEMPLATE_PATH);
    } catch {}
  }
}
