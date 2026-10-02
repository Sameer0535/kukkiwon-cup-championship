// ==============================================================================
// FILE STORAGE ARCHITECTURE (Requirement 24)
// Logical bucket separation & private signed URL access control
// ==============================================================================

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export type StorageBucket =
  | "championship-assets"   // Public assets (posters, banners)
  | "participant-photos"     // Controlled access (badge photos)
  | "participant-documents"  // STRICTLY PRIVATE (Govt ID, Dan Certs)
  | "id-cards";              // Controlled access (generated PDF cards)

export interface StorageUploadResult {
  bucket: StorageBucket;
  filePath: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
}

export interface IStorageService {
  upload(
    bucket: StorageBucket,
    filename: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<StorageUploadResult>;
  getSignedUrl(
    bucket: StorageBucket,
    filePath: string,
    expiresInSeconds?: number
  ): Promise<string>;
  getPublicUrl(bucket: StorageBucket, filePath: string): string;
  delete(bucket: StorageBucket, filePath: string): Promise<boolean>;
}

/**
 * Local Filesystem Storage Implementation
 * Ideal for development and local testing before cloud storage deployment
 */
class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), "storage");
  }

  private async ensureBucketDir(bucket: StorageBucket): Promise<string> {
    const bucketDir = path.join(this.baseDir, bucket);
    await fs.mkdir(bucketDir, { recursive: true });
    return bucketDir;
  }

  async upload(
    bucket: StorageBucket,
    filename: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<StorageUploadResult> {
    const bucketDir = await this.ensureBucketDir(bucket);
    const sanitizedName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const destination = path.join(bucketDir, sanitizedName);

    await fs.writeFile(destination, buffer);

    return {
      bucket,
      filePath: `${bucket}/${sanitizedName}`,
      fileName: sanitizedName,
      sizeBytes: buffer.length,
      mimeType,
    };
  }

  /**
   * Generates a time-limited HMAC-signed URL for strictly private files
   */
  async getSignedUrl(
    bucket: StorageBucket,
    filePath: string,
    expiresInSeconds = 300
  ): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const secret = process.env.JWT_SECRET || "default-storage-secret";
    
    // HMAC-SHA256 signature
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${filePath}:${expiresAt}`)
      .digest("hex");

    return `${baseUrl}/api/storage/stream?file=${encodeURIComponent(filePath)}&expires=${expiresAt}&sig=${signature}`;
  }

  /**
   * Public URL for non-sensitive public assets
   */
  getPublicUrl(bucket: StorageBucket, filePath: string): string {
    if (bucket === "participant-documents") {
      throw new Error("SECURITY VIOLATION: Documents in 'participant-documents' bucket are strictly private and cannot have a public URL. Use getSignedUrl() instead.");
    }
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return `${baseUrl}/api/storage/public?file=${encodeURIComponent(filePath)}`;
  }

  async delete(bucket: StorageBucket, filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      await fs.unlink(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Storage Service Factory
 * Switches between local filesystem and Supabase Storage seamlessly
 */
export const storage: IStorageService = new LocalStorageService();
export default storage;
