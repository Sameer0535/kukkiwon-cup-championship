// ==============================================================================
// PUBLIC STORAGE STREAMING ENDPOINT
// Serves public assets (banners, posters) while blocking private documents
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get("file");

  if (!filePath) {
    return new NextResponse("File parameter required", { status: 400 });
  }

  // Strictly block attempts to access private documents via public endpoint
  if (filePath.startsWith("participant-documents") || filePath.includes("participant-documents")) {
    return new NextResponse("Forbidden: Access to private documents is not permitted via public endpoint", {
      status: 403,
    });
  }

  try {
    const fullPath = path.join(process.cwd(), "storage", filePath);
    const fileBuffer = await fs.readFile(fullPath);
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Asset not found", { status: 404 });
  }
}
