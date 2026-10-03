// ==============================================================================
// KYORIX WEBHOOK SERVICE (Phase 10)
// Signature verification, schema validation, idempotency, and event processing
// ==============================================================================

import crypto from "crypto";
import { getKyorixConfig } from "./config";
import { KyorixWebhookPayload } from "./types";
import { AuditService } from "@/server/services/audit.service";

// Cache for processed event IDs to prevent replay attacks (TTL 24 hours)
const PROCESSED_EVENT_IDS = new Map<string, number>();

export class KyorixWebhookService {
  /**
   * Verifies HMAC-SHA256 signature of incoming Kyorix webhook payloads.
   * Compares signatures using timing-safe buffer comparison to prevent timing attacks.
   */
  static verifySignature(rawBody: string, signatureHeader?: string | null): boolean {
    const config = getKyorixConfig();
    const secret = config.webhookSecret;

    if (!secret) {
      // If no webhook secret is configured, webhook processing is disabled
      return false;
    }

    if (!signatureHeader) {
      return false;
    }

    try {
      const computedHash = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const signatureBuffer = Buffer.from(signatureHeader, "hex");
      const computedBuffer = Buffer.from(computedHash, "hex");

      if (signatureBuffer.length !== computedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Processes incoming Kyorix webhook events with replay prevention and schema validation.
   */
  static async processWebhook(payload: KyorixWebhookPayload): Promise<{
    processed: boolean;
    reason?: string;
    eventId: string;
  }> {
    if (!payload.eventId || !payload.eventType) {
      throw new Error("Invalid webhook payload: eventId and eventType are required.");
    }

    // Check for replay attacks
    const now = Date.now();
    if (PROCESSED_EVENT_IDS.has(payload.eventId)) {
      return {
        processed: false,
        reason: "Duplicate event: already processed.",
        eventId: payload.eventId,
      };
    }

    // Clean up stale event IDs older than 24 hours
    for (const [id, timestamp] of PROCESSED_EVENT_IDS) {
      if (now - timestamp > 86400000) {
        PROCESSED_EVENT_IDS.delete(id);
      }
    }

    PROCESSED_EVENT_IDS.set(payload.eventId, now);

    // Audit log webhook receipt
    AuditService.logAction({
      action: "KYORIX_WEBHOOK_RECEIVED",
      entityType: "KyorixWebhook",
      entityId: payload.eventId,
      newValue: {
        eventType: payload.eventType,
        timestamp: payload.timestamp,
      },
    }).catch(() => {});

    switch (payload.eventType) {
      case "kyorix.athlete.verified":
      case "kyorix.registration.updated":
      case "kyorix.draw.published":
        // Process supported events without overriding authoritative local registration data
        return {
          processed: true,
          eventId: payload.eventId,
        };

      default:
        return {
          processed: false,
          reason: `Event type '${payload.eventType}' acknowledged but not subscribed.`,
          eventId: payload.eventId,
        };
    }
  }
}
