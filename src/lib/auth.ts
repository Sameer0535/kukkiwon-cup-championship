// ==============================================================================
// AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) FOUNDATION
// Server-side authentication, password verification, and session management
// ==============================================================================

import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { AdminRole, AdminSession } from "@/types";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "kukkiwon-cup-default-secret-change-in-production";
const JWT_KEY = new TextEncoder().encode(JWT_SECRET_STRING);
const SESSION_COOKIE_NAME = "kukkiwon_admin_token";

/**
 * Role hierarchy definition
 */
const ROLE_HIERARCHY: Record<AdminRole, number> = {
  SUPER_ADMIN: 100,
  EVENT_ADMIN: 80,
  FINANCE_ADMIN: 60,
  REGISTRATION_ADMIN: 50,
  DOCUMENT_ADMIN: 40,
  CONTENT_ADMIN: 30,
  VIEWER: 10,
};

/**
 * Checks if a given user role satisfies the required roles
 */
export function hasRolePermission(userRole: AdminRole, allowedRoles: AdminRole[]): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  return allowedRoles.includes(userRole);
}

/**
 * Cryptographically hashes a password using PBKDF2 with random salt
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Verifies a plaintext password against a stored PBKDF2 hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return resolve(false);

    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) return resolve(false);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

/**
 * Creates a signed JWT session token for authenticated admin users
 */
export async function createAdminToken(session: Omit<AdminSession, "expires_at">): Promise<string> {
  return new SignJWT({
    userId: session.user_id,
    email: session.email,
    fullName: session.full_name,
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_KEY);
}

/**
 * Verifies and decodes an admin session token
 */
export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_KEY);
    return {
      user_id: payload.userId as string,
      email: payload.email as string,
      full_name: payload.fullName as string,
      role: payload.role as AdminRole,
      expires_at: (payload.exp as number) * 1000,
    };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
