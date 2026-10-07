// ==============================================================================
// ADMIN CMS BANNER UPLOAD API (POST /api/admin/cms/banner-upload)
// Allows direct upload of championship banner images with instant preview
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req, ["SUPER_ADMIN", "EVENT_ADMIN", "CONTENT_ADMIN"]);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided for banner upload." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images (PNG, JPG, WEBP) are supported." },
        { status: 400 }
      );
    }

    // Maximum file size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image file is too large. Maximum supported size is 10MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split("/")[1] || "jpg";
    const filename = `banner-${Date.now()}.${ext.replace("jpeg", "jpg")}`;

    // Attempt to persist to public/branding folder
    let publicUrl = "";
    try {
      const publicDir = path.join(process.cwd(), "public", "branding");
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      const filePath = path.join(publicDir, filename);
      fs.writeFileSync(filePath, buffer);
      publicUrl = `/branding/${filename}`;
    } catch {
      // In serverless / read-only environment, fallback to base64 data URL
      const base64 = buffer.toString("base64");
      publicUrl = `data:${file.type};base64,${base64}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to upload banner image." },
      { status: 500 }
    );
  }
}
