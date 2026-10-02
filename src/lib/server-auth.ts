// ==============================================================================
// SERVER AUTHENTICATION HELPER
// Secure server-side session extraction and authorization
// ==============================================================================

import { cookies, headers } from "next/headers";
import { verifyUserToken, REGISTRANT_COOKIE_NAME, UserSession } from "@/lib/auth";

/**
 * Extracts and verifies the current registrant session from cookies or Authorization header
 */
export async function getRegistrantSession(req?: Request): Promise<UserSession | null> {
  try {
    // 1. Check Authorization header (from request or headers() context)
    let authHeader: string | null = null;
    if (req) {
      authHeader = req.headers.get("authorization");
    } else {
      try {
        const headerList = await headers();
        authHeader = headerList.get("authorization");
      } catch {
        // headers() might not be available in non-standard contexts
      }
    }

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const session = await verifyUserToken(token);
      if (session) return session;
    }

    // 2. Check Cookie
    const cookieStore = await cookies();
    const token = cookieStore.get(REGISTRANT_COOKIE_NAME)?.value;
    if (!token) return null;

    return await verifyUserToken(token);
  } catch {
    return null;
  }
}
