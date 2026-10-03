// ==============================================================================
// PRIVATE STORAGE STREAMING ENDPOINT (Requirement 24)
// Enforces time-limited HMAC-signed URLs for strictly private documents
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get("file");
  const expiresAt = searchParams.get("expires");
  const signature = searchParams.get("sig");

  if (!filePath || !expiresAt || !signature) {
    return new NextResponse("Forbidden: Missing signature parameters", { status: 403 });
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (parseInt(expiresAt, 10) < now) {
    return new NextResponse("Forbidden: Signed URL has expired", { status: 403 });
  }

  // Validate HMAC signature
  const secret = process.env.JWT_SECRET || "default-storage-secret";
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${filePath}:${expiresAt}`)
    .digest("hex");

  let isSigValid = false;
  try {
    const sigBuffer = Buffer.from(signature, "utf8");
    const expectedSigBuffer = Buffer.from(expectedSig, "utf8");
    if (sigBuffer.length === expectedSigBuffer.length) {
      isSigValid = crypto.timingSafeEqual(sigBuffer, expectedSigBuffer);
    }
  } catch {
    isSigValid = false;
  }

  if (!isSigValid) {
    return new NextResponse("Forbidden: Invalid signature", { status: 403 });
  }

  try {
    const basePath = path.resolve(process.cwd(), "storage");
    const fullPath = path.resolve(basePath, filePath);

    // Prevent path traversal attacks
    if (!fullPath.startsWith(basePath)) {
      return new NextResponse("Forbidden: Invalid path", { status: 403 });
    }

    const fileBuffer = await fs.readFile(fullPath);
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Document not found", { status: 404 });
  }
}
