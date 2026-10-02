// ==============================================================================
// SERVER AUTHENTICATION HELPER
// Secure server-side session extraction and authorization
// ==============================================================================

import { cookies } from "next/headers";
import { verifyUserToken, REGISTRANT_COOKIE_NAME, UserSession } from "@/lib/auth";

/**
 * Extracts and verifies the current registrant session from request cookies
 */
export async function getRegistrantSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(REGISTRANT_COOKIE_NAME)?.value;
    if (!token) return null;

    return await verifyUserToken(token);
  } catch {
    return null;
  }
}
