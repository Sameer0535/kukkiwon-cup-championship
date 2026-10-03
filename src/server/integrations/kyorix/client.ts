// ==============================================================================
// KYORIX INTEGRATION CLIENT (Phase 10)
// Server-side HTTP client with authentication, timeout handling, retries,
// error normalization, and an isolated mock adapter for testing environments
// ==============================================================================

import crypto from "crypto";
import { getKyorixConfig, KyorixConfig } from "./config";
import {
  KyorixAthleteDTO,
  KyorixRegistrationDTO,
  KyorixChampionshipDTO,
  KyorixConnectionTestResult,
} from "./types";

export class KyorixIntegrationError extends Error {
  statusCode: number;
  isRetryable: boolean;
  code: string;

  constructor(message: string, statusCode = 500, isRetryable = false, code = "KYORIX_ERROR") {
    super(message);
    this.name = "KyorixIntegrationError";
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    this.code = code;
  }
}

export interface IKyorixClient {
  testConnection(): Promise<KyorixConnectionTestResult>;
  syncAthlete(dto: KyorixAthleteDTO, idempotencyKey: string): Promise<{ kyorixAthleteId: string }>;
  syncRegistration(
    dto: KyorixRegistrationDTO,
    idempotencyKey: string
  ): Promise<{ kyorixRegistrationId: string; kyorixAthleteId: string }>;
  getEvent(kyorixChampionshipId: string): Promise<KyorixChampionshipDTO | null>;
}

// ------------------------------------------------------------------------------
// 1. PRODUCTION HTTP CLIENT
// ------------------------------------------------------------------------------

export class KyorixHttpClient implements IKyorixClient {
  private config: KyorixConfig;

  constructor(configOverride?: KyorixConfig) {
    this.config = configOverride || getKyorixConfig();
  }

  private buildHeaders(idempotencyKey?: string, bodyString?: string): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "KukkiwonCup-Integration/1.0",
    };

    if (this.config.apiKey) {
      headers["X-Kyorix-API-Key"] = this.config.apiKey;
    }

    if (this.config.apiSecret && bodyString) {
      const hmac = crypto
        .createHmac("sha256", this.config.apiSecret)
        .update(bodyString)
        .digest("hex");
      headers["X-Kyorix-Signature"] = hmac;
    }

    if (idempotencyKey) {
      headers["X-Idempotency-Key"] = idempotencyKey;
    }

    return headers;
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: {
      method: "GET" | "POST" | "PUT" | "PATCH";
      body?: unknown;
      idempotencyKey?: string;
    },
    maxRetries = 2
  ): Promise<T> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    const bodyString = options.body ? JSON.stringify(options.body) : undefined;
    const headers = this.buildHeaders(options.idempotencyKey, bodyString);

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetch(url, {
          method: options.method,
          headers,
          body: bodyString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return (await response.json()) as T;
        }

        const status = response.status;
        let errorMessage = `Kyorix request failed with HTTP ${status}`;
        try {
          const errorJson = (await response.json()) as { message?: string; error?: string };
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          // If response body is not JSON, use default status text
        }

        // Determine if error is transient / retryable (429, 502, 503, 504)
        const isRetryable = status === 429 || (status >= 502 && status <= 504);

        if (isRetryable && attempt < maxRetries) {
          attempt++;
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 4000);
          await new Promise((res) => setTimeout(res, backoffMs));
          continue;
        }

        throw new KyorixIntegrationError(
          errorMessage,
          status,
          isRetryable,
          `HTTP_${status}`
        );
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        const error = err as { name?: string; message?: string };
        const isTimeout = error.name === "AbortError";
        const isNetworkError =
          isTimeout ||
          error.message?.includes("fetch failed") ||
          error.message?.includes("ECONNREFUSED");

        if (isNetworkError && attempt < maxRetries) {
          attempt++;
          const backoffMs = 500 * attempt;
          await new Promise((res) => setTimeout(res, backoffMs));
          continue;
        }

        lastError = isTimeout
          ? new KyorixIntegrationError(
              `Kyorix connection timed out after ${this.config.timeoutMs}ms`,
              504,
              true,
              "TIMEOUT"
            )
          : err instanceof KyorixIntegrationError
          ? err
          : new KyorixIntegrationError(
              "Unable to reach Kyorix API server. Connection refused or network unavailable.",
              503,
              true,
              "NETWORK_ERROR"
            );

        throw lastError;
      }
    }

    throw lastError || new KyorixIntegrationError("Kyorix request failed after retries.", 500);
  }

  async testConnection(): Promise<KyorixConnectionTestResult> {
    const startTime = Date.now();
    try {
      const result = await this.requestWithRetry<{ status: string; version?: string }>(
        "/api/v1/health",
        { method: "GET" },
        0
      );

      return {
        success: true,
        latencyMs: Date.now() - startTime,
        message: "Successfully connected to Kyorix API service.",
        version: result.version || "1.0",
        authenticated: true,
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        message: error.message || "Failed to establish connection to Kyorix service.",
        authenticated: false,
      };
    }
  }

  async syncAthlete(
    dto: KyorixAthleteDTO,
    idempotencyKey: string
  ): Promise<{ kyorixAthleteId: string }> {
    return this.requestWithRetry<{ kyorixAthleteId: string }>(
      "/api/v1/athletes/sync",
      {
        method: "POST",
        body: dto,
        idempotencyKey,
      }
    );
  }

  async syncRegistration(
    dto: KyorixRegistrationDTO,
    idempotencyKey: string
  ): Promise<{ kyorixRegistrationId: string; kyorixAthleteId: string }> {
    return this.requestWithRetry<{ kyorixRegistrationId: string; kyorixAthleteId: string }>(
      "/api/v1/registrations/sync",
      {
        method: "POST",
        body: dto,
        idempotencyKey,
      }
    );
  }

  async getEvent(kyorixChampionshipId: string): Promise<KyorixChampionshipDTO | null> {
    try {
      return await this.requestWithRetry<KyorixChampionshipDTO>(
        `/api/v1/events/${encodeURIComponent(kyorixChampionshipId)}`,
        { method: "GET" }
      );
    } catch (err: unknown) {
      const error = err as { statusCode?: number };
      if (error.statusCode === 404) return null;
      throw err;
    }
  }
}

// ------------------------------------------------------------------------------
// 2. ISOLATED MOCK / TESTING CLIENT (Strictly for unit and regression testing)
// ------------------------------------------------------------------------------

export class MockKyorixClient implements IKyorixClient {
  public simulatedMode: "SUCCESS" | "TIMEOUT" | "SERVER_ERROR" | "VALIDATION_ERROR" = "SUCCESS";
  public syncedAthletes: Map<string, { kyorixAthleteId: string; data: KyorixAthleteDTO }> = new Map();
  public syncedRegistrations: Map<
    string,
    { kyorixRegistrationId: string; kyorixAthleteId: string; data: KyorixRegistrationDTO }
  > = new Map();

  async testConnection(): Promise<KyorixConnectionTestResult> {
    if (this.simulatedMode === "TIMEOUT") {
      return {
        success: false,
        latencyMs: 10000,
        message: "Kyorix connection timed out after 10000ms",
        authenticated: false,
      };
    }

    if (this.simulatedMode === "SERVER_ERROR") {
      return {
        success: false,
        latencyMs: 120,
        message: "Kyorix service unavailable (HTTP 503)",
        authenticated: false,
      };
    }

    return {
      success: true,
      latencyMs: 45,
      message: "Connected to Kyorix Sandbox Environment",
      version: "2.4.0-mock",
      authenticated: true,
    };
  }

  async syncAthlete(
    dto: KyorixAthleteDTO,
    _idempotencyKey: string
  ): Promise<{ kyorixAthleteId: string }> {
    if (this.simulatedMode === "TIMEOUT") {
      throw new KyorixIntegrationError("Connection timed out", 504, true, "TIMEOUT");
    }
    if (this.simulatedMode === "SERVER_ERROR") {
      throw new KyorixIntegrationError("Internal service error", 500, true, "HTTP_500");
    }
    if (this.simulatedMode === "VALIDATION_ERROR") {
      throw new KyorixIntegrationError("Athlete validation failed", 400, false, "HTTP_400");
    }

    // Idempotent lookup by localAthleteId
    const existing = this.syncedAthletes.get(dto.localAthleteId);
    if (existing) {
      existing.data = dto;
      return { kyorixAthleteId: existing.kyorixAthleteId };
    }

    const kyorixAthleteId = `KYX-ATH-${Math.floor(100000 + Math.random() * 900000)}`;
    this.syncedAthletes.set(dto.localAthleteId, { kyorixAthleteId, data: dto });
    return { kyorixAthleteId };
  }

  async syncRegistration(
    dto: KyorixRegistrationDTO,
    _idempotencyKey: string
  ): Promise<{ kyorixRegistrationId: string; kyorixAthleteId: string }> {
    if (this.simulatedMode === "TIMEOUT") {
      throw new KyorixIntegrationError("Connection timed out", 504, true, "TIMEOUT");
    }
    if (this.simulatedMode === "SERVER_ERROR") {
      throw new KyorixIntegrationError("Temporary service error", 503, true, "HTTP_503");
    }
    if (this.simulatedMode === "VALIDATION_ERROR") {
      throw new KyorixIntegrationError("Invalid registration payload", 422, false, "HTTP_422");
    }

    // Ensure athlete is synced first (idempotent)
    const athleteRes = await this.syncAthlete(dto.athlete, _idempotencyKey);

    const existing = this.syncedRegistrations.get(dto.localRegistrationId);
    if (existing) {
      existing.data = dto;
      return {
        kyorixRegistrationId: existing.kyorixRegistrationId,
        kyorixAthleteId: athleteRes.kyorixAthleteId,
      };
    }

    const kyorixRegistrationId = `KYX-REG-${Math.floor(200000 + Math.random() * 800000)}`;
    this.syncedRegistrations.set(dto.localRegistrationId, {
      kyorixRegistrationId,
      kyorixAthleteId: athleteRes.kyorixAthleteId,
      data: dto,
    });

    return {
      kyorixRegistrationId,
      kyorixAthleteId: athleteRes.kyorixAthleteId,
    };
  }

  async getEvent(kyorixChampionshipId: string): Promise<KyorixChampionshipDTO | null> {
    return {
      id: kyorixChampionshipId,
      name: "Kukkiwon Cup India National Championship",
      startDate: "2026-11-20",
      endDate: "2026-11-22",
      venue: "KD Jadhav Indoor Stadium",
      city: "New Delhi",
      status: "ACTIVE",
    };
  }
}

// ------------------------------------------------------------------------------
// 3. CLIENT FACTORY & DEPENDENCY INJECTION
// ------------------------------------------------------------------------------

let activeClient: IKyorixClient | null = null;

export function getKyorixClient(): IKyorixClient {
  if (activeClient) {
    return activeClient;
  }

  const config = getKyorixConfig();
  if (config.useMock || !config.apiBaseUrl) {
    activeClient = new MockKyorixClient();
    return activeClient;
  }

  activeClient = new KyorixHttpClient(config);
  return activeClient;
}

export function setKyorixClient(client: IKyorixClient | null): void {
  activeClient = client;
}
