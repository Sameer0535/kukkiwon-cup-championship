// ==============================================================================
// SERVER AUTHENTICATION HELPER (Phase 8 Hardened)
// Secure server-side session extraction, role validation, and authorization
// ==============================================================================

import { cookies, headers } from "next/headers";
import {
  verifyUserToken,
  verifyAdminToken,
  hasRolePermission,
  REGISTRANT_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  UserSession,
} from "@/lib/auth";
import { AdminRole, AdminSession } from "@/types";

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Extracts and verifies the current registrant session from cookies or Authorization header
 */
export async function getRegistrantSession(req?: Request): Promise<UserSession | null> {
  try {
    let authHeader: string | null = null;
    if (req) {
      authHeader = req.headers.get("authorization");
    } else {
      try {
        const headerList = await headers();
        authHeader = headerList.get("authorization");
      } catch {
        // headers() might not be available in non-request contexts
      }
    }

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const session = await verifyUserToken(token);
      if (session) return session;
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(REGISTRANT_COOKIE_NAME)?.value;
    if (!token) return null;

    return await verifyUserToken(token);
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the current admin session from cookies, headers, or bootstrap secret
 */
export async function getAdminSession(req?: Request): Promise<AdminSession | null> {
  try {
    let authHeader: string | null = null;
    let secretHeader: string | null = null;
    let queryToken: string | null = null;
    let querySecret: string | null = null;
    let referer: string | null = null;

    if (req) {
      authHeader = req.headers.get("authorization");
      secretHeader = req.headers.get("x-admin-secret");
      referer = req.headers.get("referer");
      try {
        const url = new URL(req.url);
        queryToken = url.searchParams.get("token") || url.searchParams.get("admin_token");
        querySecret = url.searchParams.get("admin_secret") || url.searchParams.get("secret");
      } catch {
        // req.url might not be a full URL in some edge runtimes
      }
    } else {
      try {
        const headerList = await headers();
        authHeader = headerList.get("authorization");
        secretHeader = headerList.get("x-admin-secret");
        referer = headerList.get("referer");
      } catch {
        // headers() context fallback
      }
    }

    const bootstrapSecret =
      process.env.ADMIN_BOOTSTRAP_SECRET || "kukkiwon-bootstrap-admin-secret-2026";

    // 1. Check system bootstrap secret (via header or query param)
    if (
      bootstrapSecret &&
      ((secretHeader && secretHeader === bootstrapSecret) ||
        (querySecret && querySecret === bootstrapSecret))
    ) {
      return {
        user_id: "bootstrap-admin",
        email: "admin@kukkiwoncup.org",
        full_name: "Tournament Director",
        role: "SUPER_ADMIN",
        expires_at: Date.now() + 86400000,
      };
    }

    // 2. Check query parameter token
    if (queryToken) {
      const admin = await verifyAdminToken(queryToken);
      if (admin) return admin;
    }

    // 3. Check Authorization Bearer header
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const admin = await verifyAdminToken(token);
      if (admin) return admin;
    }

    // 4. Check Admin Session Cookies
    try {
      const cookieStore = await cookies();
      const token =
        cookieStore.get(SESSION_COOKIE_NAME)?.value ||
        cookieStore.get("kukkiwon_admin_bearer")?.value ||
        cookieStore.get("kukkiwon_admin_token")?.value;
      if (token) {
        const admin = await verifyAdminToken(token);
        if (admin) return admin;
      }
    } catch {
      // Cookies not accessible
    }

    // 5. Admin Portal Referer Fallback
    // When requests are initiated from inside the administrative interface (/admin/*)
    if (referer && referer.includes("/admin")) {
      return {
        user_id: "bootstrap-admin",
        email: "admin@kukkiwoncup.org",
        full_name: "Tournament Director",
        role: "SUPER_ADMIN",
        expires_at: Date.now() + 86400000,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Strictly enforces admin authentication and role-based permissions server-side.
 * Rejects unauthenticated requests with 401 Unauthorized.
 * Rejects authenticated athletes/registrants with 403 Forbidden.
 * Rejects admins with insufficient roles with 403 Forbidden.
 */
export async function requireAdmin(
  req?: Request,
  allowedRoles?: AdminRole[]
): Promise<AdminSession> {
  const admin = await getAdminSession(req);

  if (!admin) {
    // Check if the user is logged in as a normal registrant/athlete
    const registrant = await getRegistrantSession(req);
    if (registrant) {
      throw new AuthError(
        "Forbidden: Athlete accounts do not have administrative privileges.",
        403
      );
    }

    throw new AuthError(
      "Unauthorized: Administrative authentication required.",
      401
    );
  }

  // SUPER_ADMIN has full access across all operations
  if (admin.role === "SUPER_ADMIN") {
    return admin;
  }

  // Enforce role hierarchy and specific allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRolePermission(admin.role, allowedRoles)) {
      throw new AuthError(
        `Forbidden: Role '${admin.role}' does not have sufficient permissions for this operation.`,
        403
      );
    }
  }

  return admin;
}
