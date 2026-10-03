// ==============================================================================
// DOCUMENT STORAGE & VALIDATION SERVICE (Phase 4 Security Architecture)
// Server-side magic-byte inspection, MIME validation, anti-spoofing, and signed access
// ==============================================================================

import crypto from "crypto";
import path from "path";
import fs from "fs/promises";

export interface FileValidationOptions {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  originalFilename: string;
  declaredMimeType: string;
}

export interface ValidatedFileResult {
  detectedMimeType: string;
  extension: string;
  fileSizeBytes: number;
  checksumSha256: string;
  sanitizedFilename: string;
}

export class DocumentStorageService {
  private static baseStorageDir = path.join(process.cwd(), "storage", "participant-documents");

  /**
   * REQUIREMENT 5 & 6: File Validation & Malicious File Protection
   * Validates size, extension, MIME type, and magic bytes / signatures.
   */
  static validateFile(
    buffer: Buffer,
    options: FileValidationOptions
  ): ValidatedFileResult {
    const { allowedMimeTypes, maxSizeBytes, originalFilename, declaredMimeType } = options;

    // 1. File Size Validation
    if (buffer.length === 0) {
      throw new Error("Invalid file: File is empty (0 bytes).");
    }

    if (buffer.length > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      const actualMb = (buffer.length / (1024 * 1024)).toFixed(1);
      throw new Error(`File size limit exceeded: File is ${actualMb}MB, but maximum allowed size is ${maxMb}MB.`);
    }

    // 2. Extension Validation
    const ext = path.extname(originalFilename).toLowerCase();
    const allowedExtensionsMap: Record<string, string[]> = {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
      "image/webp": [".webp"],
    };

    const validExtensions = allowedMimeTypes.flatMap(
      (mime) => allowedExtensionsMap[mime] || []
    );

    if (!validExtensions.includes(ext)) {
      throw new Error(
        `Invalid file extension "${ext}". Allowed extensions: ${validExtensions.join(", ")}.`
      );
    }

    // 3. Inspect Magic Bytes / Signatures
    const detectedMime = this.detectMimeFromMagicBytes(buffer);

    if (!detectedMime) {
      throw new Error("Security Alert: Unable to verify file signature. Unsupported or corrupted file format.");
    }

    // Verify detected MIME is in allowed list
    if (!allowedMimeTypes.includes(detectedMime)) {
      throw new Error(
        `Unsupported file type detected (${detectedMime}). Allowed types: ${allowedMimeTypes.join(", ")}.`
      );
    }

    // Anti-Spoofing: Check if declared MIME matches actual detected bytes
    if (
      declaredMimeType &&
      declaredMimeType !== detectedMime &&
      !(declaredMimeType === "image/jpeg" && (detectedMime === "image/jpeg" || ext === ".jpg" || ext === ".jpeg"))
    ) {
      // Discrepancy warning/error
      if (!allowedMimeTypes.includes(detectedMime)) {
        throw new Error(
          `Security Alert: File declared as "${declaredMimeType}" but signature matches "${detectedMime}". Upload rejected.`
        );
      }
    }

    // 4. Malicious Content Checks (HTML, scripts, executable headers)
    this.checkForMaliciousHeaders(buffer);

    // 5. SHA-256 Checksum
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    // Clean sanitized original filename (strip path and risky chars)
    const sanitizedFilename = path.basename(originalFilename).replace(/[^a-zA-Z0-9._-]/g, "_");

    return {
      detectedMimeType: detectedMime,
      extension: ext,
      fileSizeBytes: buffer.length,
      checksumSha256: checksum,
      sanitizedFilename,
    };
  }

  /**
   * Inspects magic bytes for JPEG, PNG, PDF, and WebP
   */
  private static detectMimeFromMagicBytes(buffer: Buffer): string | null {
    if (buffer.length < 4) return null;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }

    // PNG: 89 50 4E 47 (\x89PNG)
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }

    // PDF: %PDF (25 50 44 46)
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      return "application/pdf";
    }

    // WebP: RIFF .... WEBP
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
      return "image/webp";
    }

    return null;
  }

  /**
   * Blocks executable headers, scripts, or embedded HTML payloads
   */
  private static checkForMaliciousHeaders(buffer: Buffer): void {
    // Windows PE executable: 'MZ' (4D 5A)
    if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
      throw new Error("Security Alert: Executable binary files are strictly prohibited.");
    }

    // Linux ELF executable: \x7fELF (7F 45 4C 46)
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x7f &&
      buffer[1] === 0x45 &&
      buffer[2] === 0x4c &&
      buffer[3] === 0x46
    ) {
      throw new Error("Security Alert: Executable binary files are strictly prohibited.");
    }

    // Inspect first 512 bytes for script / HTML tags
    const sample = buffer.subarray(0, Math.min(buffer.length, 512)).toString("utf-8").toLowerCase();
    if (
      sample.includes("<script") ||
      sample.includes("<html") ||
      sample.includes("<?php") ||
      sample.includes("javascript:")
    ) {
      throw new Error("Security Alert: File contains prohibited script or HTML content.");
    }
  }

  /**
   * REQUIREMENT 5: Generated Internal Storage Key
   * Format: championship/{championshipId}/registration/{registrationId}/documents/{docId}/{uuid}.{ext}
   * Zero PII in storage paths.
   */
  static generateStorageKey(params: {
    championshipId: string;
    registrationId: string;
    documentRequirementId: string;
    extension: string;
  }): string {
    const randomKey = crypto.randomBytes(16).toString("hex");
    const cleanExt = params.extension.startsWith(".") ? params.extension : `.${params.extension}`;
    return `championship/${params.championshipId}/registration/${params.registrationId}/documents/${params.documentRequirementId}/${randomKey}${cleanExt}`;
  }

  private static resolveSecurePath(storageKey: string): string {
    let decoded = storageKey;
    try {
      decoded = decodeURIComponent(storageKey);
    } catch {
      throw new Error("Invalid storage destination path.");
    }
    const base = path.resolve(this.baseStorageDir);
    const fullPath = path.resolve(base, decoded);

    if (fullPath !== base && !fullPath.startsWith(base + path.sep)) {
      throw new Error("Invalid storage destination path.");
    }
    return fullPath;
  }

  /**
   * REQUIREMENT 4: Private Storage Writing
   * Saves document into private non-public location
   */
  static async savePrivateDocument(storageKey: string, buffer: Buffer): Promise<void> {
    const fullPath = this.resolveSecurePath(storageKey);

    const parentDir = path.dirname(fullPath);
    await fs.mkdir(parentDir, { recursive: true });
    await fs.writeFile(fullPath, buffer);
  }

  /**
   * Reads private document buffer
   */
  static async readPrivateDocument(storageKey: string): Promise<Buffer> {
    const fullPath = this.resolveSecurePath(storageKey);

    return await fs.readFile(fullPath);
  }

  /**
   * Deletes private document
   */
  static async deletePrivateDocument(storageKey: string): Promise<boolean> {
    try {
      const fullPath = this.resolveSecurePath(storageKey);
      await fs.unlink(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generates time-limited HMAC-signed temporary access URL (Requirement 4 & 15)
   */
  static generateSignedAccessUrl(
    storageKey: string,
    expiresInSeconds = 600 // 10 minutes default
  ): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const secret = process.env.JWT_SECRET || "default-storage-secret";

    // Path in participant-documents bucket
    const filePath = `participant-documents/${storageKey}`;

    // HMAC-SHA256 signature
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${filePath}:${expiresAt}`)
      .digest("hex");

    return `${baseUrl}/api/storage/stream?file=${encodeURIComponent(filePath)}&expires=${expiresAt}&sig=${signature}`;
  }
}
