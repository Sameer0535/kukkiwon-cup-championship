// ==============================================================================
// KYORIX INTEGRATION CONFIGURATION (Phase 10)
// Server-side environment configuration, credential security, and validation
// ==============================================================================

export interface KyorixConfig {
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
  isEnabled: boolean;
  timeoutMs: number;
  useMock: boolean;
}

export interface SanitizedKyorixConfig {
  isEnabled: boolean;
  isConfigured: boolean;
  apiBaseUrl: string;
  timeoutMs: number;
  useMock: boolean;
}

/**
 * Returns full Kyorix configuration (SERVER-ONLY).
 * Never expose this object to the client bundle or public APIs.
 */
export function getKyorixConfig(): KyorixConfig {
  const isEnabled = process.env.KYORIX_INTEGRATION_ENABLED === "true";
  const apiBaseUrl = (process.env.KYORIX_API_BASE_URL || "").trim().replace(/\/+$/, "");
  const apiKey = (process.env.KYORIX_API_KEY || "").trim();
  const apiSecret = (process.env.KYORIX_API_SECRET || "").trim();
  const webhookSecret = (process.env.KYORIX_WEBHOOK_SECRET || "").trim();
  const timeoutMs = parseInt(process.env.KYORIX_REQUEST_TIMEOUT_MS || "10000", 10);
  const useMock = process.env.KYORIX_USE_MOCK === "true" || process.env.NODE_ENV === "test";

  return {
    apiBaseUrl,
    apiKey,
    apiSecret,
    webhookSecret,
    isEnabled,
    timeoutMs: isNaN(timeoutMs) || timeoutMs <= 0 ? 10000 : timeoutMs,
    useMock,
  };
}

/**
 * Returns sanitized, non-secret configuration safe for admin dashboards and client consumption.
 * Strictly redacts API keys, secrets, and credential fragments.
 */
export function getSanitizedKyorixConfig(): SanitizedKyorixConfig {
  const config = getKyorixConfig();
  const isConfigured = Boolean(
    config.apiBaseUrl && (config.apiKey || config.apiSecret || config.useMock)
  );

  let redactedUrl = "";
  if (config.apiBaseUrl) {
    try {
      const url = new URL(config.apiBaseUrl);
      redactedUrl = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`;
    } catch {
      redactedUrl = "https://[configured-host]";
    }
  }

  return {
    isEnabled: config.isEnabled,
    isConfigured,
    apiBaseUrl: redactedUrl,
    timeoutMs: config.timeoutMs,
    useMock: config.useMock,
  };
}

/**
 * Validates configuration integrity.
 * In production, enforces HTTPS and mandatory credentials if integration is enabled.
 */
export function validateKyorixConfig(config: KyorixConfig): { isValid: boolean; error?: string } {
  if (!config.isEnabled) {
    return { isValid: true };
  }

  if (config.useMock) {
    return { isValid: true };
  }

  if (!config.apiBaseUrl) {
    return { isValid: false, error: "KYORIX_API_BASE_URL is required when Kyorix integration is enabled." };
  }

  try {
    const parsed = new URL(config.apiBaseUrl);
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      return { isValid: false, error: "KYORIX_API_BASE_URL must use secure HTTPS in production." };
    }
  } catch {
    return { isValid: false, error: "KYORIX_API_BASE_URL is not a valid URL." };
  }

  if (!config.apiKey && !config.apiSecret) {
    return { isValid: false, error: "Either KYORIX_API_KEY or KYORIX_API_SECRET must be configured." };
  }

  return { isValid: true };
}
