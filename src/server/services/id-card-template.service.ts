// ==============================================================================
// ID CARD TEMPLATE STORAGE SERVICE
// Stores and retrieves custom ID card background template (image/data URL)
// ==============================================================================

import fs from "fs/promises";
import path from "path";

interface TemplateRecord {
  templateUrl: string;
  updatedAt: string;
}

let inMemoryTemplate: string | null = null;
const TEMPLATE_FILE_PATH = path.join(process.cwd(), "storage", "id-card-template.json");

export class IdCardTemplateService {
  /**
   * Retrieves the current custom ID card template URL or data URI
   */
  static async getTemplate(): Promise<string | null> {
    if (inMemoryTemplate) return inMemoryTemplate;

    try {
      const fileData = await fs.readFile(TEMPLATE_FILE_PATH, "utf-8");
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
    try {
      const dir = path.dirname(TEMPLATE_FILE_PATH);
      await fs.mkdir(dir, { recursive: true });
      const record: TemplateRecord = {
        templateUrl,
        updatedAt: new Date().toISOString(),
      };
      await fs.writeFile(TEMPLATE_FILE_PATH, JSON.stringify(record, null, 2), "utf-8");
    } catch (err) {
      console.warn("[IdCardTemplateService.saveTemplate] Could not persist to disk, stored in memory:", err);
    }
    return templateUrl;
  }

  /**
   * Deletes the custom template, reverting to the standard badge design
   */
  static async deleteTemplate(): Promise<void> {
    inMemoryTemplate = null;
    try {
      await fs.unlink(TEMPLATE_FILE_PATH);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}
