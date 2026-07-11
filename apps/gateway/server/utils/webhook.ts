import { sign } from "@simplepsp/shared/server";
import type { Merchant, Payment } from "@prisma/client";
import { prisma } from "./prisma";
import { logLine } from "./logger";

export async function sendWebhook(merchant: Pick<Merchant, "secret">, payment: Payment) {
  const payload = {
    event: `payment.${payment.status}`,
    paymentId: payment.id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    reference: payment.reference,
  };
  const rawBody = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign(merchant.secret, timestamp, rawBody);

  const delivery = await prisma.webhookDelivery.create({
    data: { paymentId: payment.id, eventType: payload.event, status: "pending", attempts: 1 },
  });

  const startedAt = Date.now();
  await logLine(`WEBHOOK  OUT       ${payload.event} -> ${payment.webhookUrl} body=${rawBody}`);

  try {
    await $fetch(payment.webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-timestamp": String(timestamp),
        "x-signature": signature,
      },
      body: rawBody,
    });
    await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { status: "delivered" } });
    await logLine(`WEBHOOK  DELIVERED ${payload.event} -> ${payment.webhookUrl} ${Date.now() - startedAt}ms`);
  } catch (err) {
    await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { status: "failed" } });
    const reason = err instanceof Error ? err.message : String(err);
    await logLine(
      `WEBHOOK  FAILED    ${payload.event} -> ${payment.webhookUrl} ${Date.now() - startedAt}ms error=${reason}`,
    );
  }
}
