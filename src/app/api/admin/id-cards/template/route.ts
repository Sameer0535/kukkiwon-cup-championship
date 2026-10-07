// ==============================================================================
// ADMIN ID CARD TEMPLATE API (GET/POST/DELETE)
// Manage custom tournament accreditation badge background template
// Supports multipart/form-data image upload (up to 10MB) & JSON base64/URL
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { IdCardTemplateService } from "@/server/services/id-card-template.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "DOCUMENT_ADMIN",
      "CONTENT_ADMIN",
      "FINANCE_ADMIN",
      "REGISTRAR",
      "VIEWER",
    ]);
    const templateUrl = await IdCardTemplateService.getTemplate();
    return NextResponse.json({
      success: true,
      hasCustomTemplate: Boolean(templateUrl),
      templateUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to get template." },
      { status: err.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "DOCUMENT_ADMIN",
      "CONTENT_ADMIN",
      "FINANCE_ADMIN",
      "REGISTRAR",
    ]);

    const contentType = req.headers.get("content-type") || "";

    // 1. Multipart Form Data Upload (File Upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No image file provided in template upload." },
          { status: 400 }
        );
      }

      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Invalid file type. Only PNG, JPG, or WEBP images are supported." },
          { status: 400 }
        );
      }

      if (file.size > 15 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Template image file is too large. Maximum size is 15MB." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const savedUrl = await IdCardTemplateService.saveTemplateFile(buffer, file.type);

      return NextResponse.json({
        success: true,
        message: "ID card template uploaded and saved successfully.",
        templateUrl: savedUrl,
      });
    }

    // 2. JSON Payload ({ templateUrl })
    const body = await req.json();
    const { templateUrl } = body;

    if (!templateUrl || typeof templateUrl !== "string") {
      return NextResponse.json(
        { error: "Valid template image URL or data URI is required." },
        { status: 400 }
      );
    }

    const saved = await IdCardTemplateService.saveTemplate(templateUrl);

    return NextResponse.json({
      success: true,
      message: "ID card template uploaded and saved successfully.",
      templateUrl: saved,
    });
  } catch (err: any) {
    if (err instanceof AuthError || err.name === "AuthError") {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to save template." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "DOCUMENT_ADMIN",
      "CONTENT_ADMIN",
      "FINANCE_ADMIN",
      "REGISTRAR",
    ]);
    await IdCardTemplateService.deleteTemplate();

    return NextResponse.json({
      success: true,
      message: "Custom ID card template removed. Default institutional design restored.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete template." },
      { status: err.statusCode || 500 }
    );
  }
}
