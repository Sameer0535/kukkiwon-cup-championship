// ==============================================================================
// ADMIN PAYMENTS LIST API (Phase 5 & 11 Hardened)
// GET /api/admin/payments
// List and filter payment orders for administrative finance management
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server-auth";
import { AdminService } from "@/server/services/admin.service";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, [
      "SUPER_ADMIN",
      "EVENT_ADMIN",
      "FINANCE_ADMIN",
      "REGISTRAR",
      "VIEWER",
    ]);

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || undefined;
    const q = url.searchParams.get("q") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "25", 10);

    const result = await AdminService.getPayments(
      {
        status,
        q,
        page,
        pageSize,
      },
      admin
    );

    return NextResponse.json({
      success: true,
      items: result.items,
      orders: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to load payments." },
      { status: 500 }
    );
  }
}
