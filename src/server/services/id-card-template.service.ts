// ==============================================================================
// ID CARD TEMPLATE STORAGE SERVICE
// Stores and retrieves custom ID card background template (image/data URL)
// ==============================================================================

import fs from "fs/promises";
import path from "path";
import os from "os";

interface TemplateRecord {
  templateUrl: string;
  updatedAt: string;
}

let inMemoryTemplate: string | null = null;
const TMP_TEMPLATE_PATH = path.join(os.tmpdir(), "kukkiwon_championship_data", "id-card-template.json");
const LOCAL_TEMPLATE_PATH = path.join(process.cwd(), "storage", "id-card-template.json");

export class IdCardTemplateService {
  /**
   * Retrieves the current custom ID card template URL or data URI
   */
  static async getTemplate(): Promise<string | null> {
    if (inMemoryTemplate) return inMemoryTemplate;

    // Check temp storage first (serverless safe)
    try {
      const tmpData = await fs.readFile(TMP_TEMPLATE_PATH, "utf-8");
      const parsed: TemplateRecord = JSON.parse(tmpData);
      if (parsed.templateUrl) {
        inMemoryTemplate = parsed.templateUrl;
        return inMemoryTemplate;
      }
    } catch {}

    // Check local storage fallback
    try {
      const fileData = await fs.readFile(LOCAL_TEMPLATE_PATH, "utf-8");
      const parsed: TemplateRecord = JSON.parse(fileData);
      inMemoryTemplate = parsed.templateUrl || null;
      return inMemoryTemplate;
    } catch {
      return inMemoryTemplate;
    }
  }

  /**
   * Saves a new custom ID card template
   */
  static async saveTemplate(templateUrl: string): Promise<string> {
    inMemoryTemplate = templateUrl;
    const record: TemplateRecord = {
      templateUrl,
      updatedAt: new Date().toISOString(),
    };
    const content = JSON.stringify(record, null, 2);

    // Save to temp directory first
    try {
      await fs.mkdir(path.dirname(TMP_TEMPLATE_PATH), { recursive: true });
      await fs.writeFile(TMP_TEMPLATE_PATH, content, "utf-8");
    } catch {}

    // Save to local storage if filesystem permits
    try {
      await fs.mkdir(path.dirname(LOCAL_TEMPLATE_PATH), { recursive: true });
      await fs.writeFile(LOCAL_TEMPLATE_PATH, content, "utf-8");
    } catch (err) {
      console.warn("[IdCardTemplateService.saveTemplate] Local storage note (handled in memory/temp):", err);
    }
    return templateUrl;
  }

  /**
   * Deletes the custom template, reverting to the standard badge design
   */
  static async deleteTemplate(): Promise<void> {
    inMemoryTemplate = null;
    try {
      await fs.unlink(TMP_TEMPLATE_PATH);
    } catch {}
    try {
      await fs.unlink(LOCAL_TEMPLATE_PATH);
    } catch {}
  }
}
