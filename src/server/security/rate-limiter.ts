// ==============================================================================
// RATE LIMITING SECURITY UTILITY (Phase 7 Requirement 8)
// Lightweight, sliding-window rate limiter protecting public accreditation endpoints
// against automated enumeration, scraping, and denial-of-service
// ==============================================================================

import crypto from "crypto";

export interface RateLimitOptions {
  /** Maximum number of allowed requests within the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs?: number;
  /** Window duration in seconds (optional alternative) */
  windowSeconds?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
  retryAfterSeconds: number;
  headers: Record<string, string>;
}

interface ClientRecord {
  timestamps: number[];
  lastCleaned: number;
}

// In-memory token bucket / sliding-window storage per hashed client identifier
const IP_RATE_LIMIT_STORE: Map<string, ClientRecord> = new Map();

// Periodic cleanup every 5 minutes to prevent memory unbounded growth
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastGlobalCleanup = Date.now();

function performGlobalCleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastGlobalCleanup < CLEANUP_INTERVAL_MS) return;
  lastGlobalCleanup = now;

  for (const [key, record] of IP_RATE_LIMIT_STORE.entries()) {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (validTimestamps.length === 0) {
      IP_RATE_LIMIT_STORE.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}

/**
 * Extracts and cryptographically hashes the client IP for privacy preservation
 */
export function getAnonymizedClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");

  const rawIp =
    cfConnectingIp?.trim() ||
    realIp?.trim() ||
    forwarded?.split(",")[0].trim() ||
    "127.0.0.1";

  // One-way SHA-256 hash for privacy (never store raw visitor IPs in memory)
  return crypto.createHash("sha256").update(`kukkiwon:ratelimit:${rawIp}`).digest("hex").slice(0, 32);
}

/**
 * Generates standard rate limiting headers
 */
export function getRateLimitHeaders(result: Omit<RateLimitResult, "headers">): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(result.resetTime),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

/**
 * Evaluates whether a client request is allowed under the rate limiting policy
 */
export function checkRateLimit(
  clientOrRequest: string | Request,
  options: RateLimitOptions = { maxRequests: 60, windowMs: 60 * 1000 }
): RateLimitResult {
  const windowMs = options.windowMs ?? (options.windowSeconds ? options.windowSeconds * 1000 : 60 * 1000);
  const maxRequests = options.maxRequests || 60;

  performGlobalCleanup(windowMs);

  const clientId =
    typeof clientOrRequest === "string"
      ? clientOrRequest
      : getAnonymizedClientIdentifier(clientOrRequest);

  const now = Date.now();
  const cutoff = now - windowMs;

  let record = IP_RATE_LIMIT_STORE.get(clientId);
  if (!record) {
    record = { timestamps: [], lastCleaned: now };
    IP_RATE_LIMIT_STORE.set(clientId, record);
  }

  // Filter timestamps to current sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  const currentCount = record.timestamps.length;
  const resetTime = Math.ceil((now + windowMs) / 1000);

  if (currentCount >= maxRequests) {
    const oldestInWindow = record.timestamps[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestInWindow + windowMs - now) / 1000));

    const baseResult = {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetTime,
      retryAfterSeconds,
    };

    return {
      ...baseResult,
      headers: getRateLimitHeaders(baseResult),
    };
  }

  // Record this request
  record.timestamps.push(now);

  const baseResult = {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - record.timestamps.length,
    resetTime,
    retryAfterSeconds: 0,
  };

  return {
    ...baseResult,
    headers: getRateLimitHeaders(baseResult),
  };
}

/**
 * Resets the in-memory rate limiter (used primarily in automated testing suites)
 */
export function resetRateLimits(): void {
  IP_RATE_LIMIT_STORE.clear();
}
