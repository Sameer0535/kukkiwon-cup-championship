// ==============================================================================
// ADMIN REGISTRATIONS API (GET /api/admin/registrations)
// Requirement 5: Registration management table with search, filters, pagination
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { AdminService } from "@/server/services/admin.service";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "REGISTRATION_ADMIN",
      "VIEWER",
    ]);

    const url = new URL(req.url);
    const championshipId = url.searchParams.get("championshipId") || undefined;
    const q = url.searchParams.get("q") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const paymentStatus = url.searchParams.get("paymentStatus") || undefined;
    const documentStatus = url.searchParams.get("documentStatus") || undefined;
    const idCardStatus = url.searchParams.get("idCardStatus") || undefined;
    const category = url.searchParams.get("category") || undefined;
    const country = url.searchParams.get("country") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "25", 10);
    const sortBy = url.searchParams.get("sortBy") || "registeredAt";
    const sortOrder = (url.searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    const result = await AdminService.getRegistrations(
      {
        championshipId,
        q,
        status,
        paymentStatus,
        documentStatus,
        idCardStatus,
        category,
        country,
        page,
        pageSize,
        sortBy,
        sortOrder,
      },
      admin
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load registrations." },
      { status }
    );
  }
}
