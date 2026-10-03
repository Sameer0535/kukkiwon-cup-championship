// ==============================================================================
// KYORIX INBOUND WEBHOOK ROUTE (Phase 10 & 11 Hardened)
// POST /api/integrations/kyorix/webhook
// Secure signature verification, anti-replay, rate limiting, and idempotent processing
// ==============================================================================

import { NextResponse } from "next/server";
import { KyorixWebhookService } from "@/server/integrations/kyorix/webhook.service";
import { KyorixWebhookPayload } from "@/server/integrations/kyorix/types";
import { checkRateLimit, getRateLimitHeaders } from "@/server/security/rate-limiter";

export async function POST(req: Request) {
  // 1. Rate Limiting: 60 webhook requests / minute per client
  const rateLimit = checkRateLimit(req, { maxRequests: 60, windowSeconds: 60 });
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many webhook requests. Rate limit exceeded." },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-kyorix-signature");

    // 2. Strict HMAC-SHA256 signature verification
    const isValid = KyorixWebhookService.verifySignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing webhook signature." },
        { status: 401, headers: rateLimitHeaders }
      );
    }

    // 3. Parse payload schema
    let payload: KyorixWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Bad Request: Malformed JSON payload." },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    // 4. Process event idempotently
    const result = await KyorixWebhookService.processWebhook(payload);

    return NextResponse.json(
      {
        received: true,
        ...result,
      },
      { headers: rateLimitHeaders }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Webhook processing error." },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
