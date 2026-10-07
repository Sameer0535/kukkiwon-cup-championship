// ==============================================================================
// ADMIN ID CARD TEMPLATE API (GET/POST/DELETE)
// Manage custom tournament accreditation badge background template
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
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
    return NextResponse.json(
      { error: err.message || "Failed to save template." },
      { status: err.statusCode || 500 }
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
