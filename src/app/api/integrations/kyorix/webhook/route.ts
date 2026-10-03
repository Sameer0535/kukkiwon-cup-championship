// ==============================================================================
// KYORIX INBOUND WEBHOOK ROUTE (Phase 10)
// POST /api/integrations/kyorix/webhook
// Secure signature verification, anti-replay, and idempotent processing
// ==============================================================================

import { NextResponse } from "next/server";
import { KyorixWebhookService } from "@/server/integrations/kyorix/webhook.service";
import { KyorixWebhookPayload } from "@/server/integrations/kyorix/types";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-kyorix-signature");

    // 1. Strict HMAC-SHA256 signature verification
    const isValid = KyorixWebhookService.verifySignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing webhook signature." },
        { status: 401 }
      );
    }

    // 2. Parse payload schema
    let payload: KyorixWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Bad Request: Malformed JSON payload." },
        { status: 400 }
      );
    }

    // 3. Process event idempotently
    const result = await KyorixWebhookService.processWebhook(payload);

    return NextResponse.json({
      received: true,
      ...result,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Webhook processing error." },
      { status: 500 }
    );
  }
}
