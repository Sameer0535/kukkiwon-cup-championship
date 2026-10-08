// ==============================================================================
// ADMIN CREDENTIALS MANAGEMENT API (POST /api/admin/auth/change-credentials)
// Securely update Administrator ID / Email and Password with disk persistence
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { AdminService } from "@/server/services/admin.service";

export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireAdmin(req);
    const body = await req.json();
    const { currentPassword, newAdminId, newPassword, newFullName } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required to authorize credentials change." },
        { status: 400 }
      );
    }

    if (!newAdminId && !newPassword) {
      return NextResponse.json(
        { error: "Please provide either a new Admin ID or a new Password to update." },
        { status: 400 }
      );
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const result = await AdminService.changeCredentials({
      currentAdminSession: adminSession,
      currentPassword,
      newAdminId: newAdminId?.trim(),
      newPassword: newPassword?.trim(),
      newFullName: newFullName?.trim(),
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (err: any) {
    const status = err.statusCode || (err.message?.includes("incorrect") ? 400 : 500);
    return NextResponse.json(
      { error: err.message || "Failed to update administrator credentials." },
      { status }
    );
  }
}
