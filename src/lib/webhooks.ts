import { WebhookEvent } from "@prisma/client";
import { prisma } from "./prisma";
import crypto from "crypto";

export async function dispatchWebhook(event: WebhookEvent, payload: Record<string, unknown>) {
  const webhooks = await prisma.webhook.findMany({
    where: { isActive: true, events: { has: event } },
  });

  for (const wh of webhooks) {
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const signature = wh.secret
      ? crypto.createHmac("sha256", wh.secret).update(body).digest("hex")
      : undefined;

    let statusCode: number | undefined;
    let response: string | undefined;
    let success = false;

    try {
      const res = await fetch(wh.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(signature ? { "X-Kroma-Signature": signature } : {}),
        },
        body,
        signal: AbortSignal.timeout(10000),
      });
      statusCode = res.status;
      response = await res.text();
      success = res.ok;
    } catch (err) {
      response = err instanceof Error ? err.message : "Unknown error";
    }

    await prisma.webhookDelivery.create({
      data: { webhookId: wh.id, event, payload: payload as object, statusCode, response, success },
    });
  }
}
