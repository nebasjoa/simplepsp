import type { WebhookPayload } from "@simplepsp/shared";
import { verify } from "@simplepsp/shared/server";
import { recordOrderUpdate } from "../../utils/orderStore";

export default defineEventHandler(async (event) => {
  const rawBody = (await readRawBody(event)) ?? "";
  const timestamp = Number(getHeader(event, "x-timestamp"));
  const signature = getHeader(event, "x-signature");
  const config = useRuntimeConfig(event);

  if (!signature || !Number.isFinite(timestamp) || !verify(config.gatewayApiSecret, timestamp, rawBody, signature)) {
    throw createError({ statusCode: 401, statusMessage: "Invalid webhook signature" });
  }

  const payload = JSON.parse(rawBody) as WebhookPayload;

  // The browser redirect can be lost (closed tab, network drop) — this signed webhook is the
  // source of truth the shop reconciles its local order against, not the query-string redirect.
  recordOrderUpdate({
    id: payload.paymentId,
    status: payload.status,
    amount: payload.amount,
    currency: payload.currency,
    reference: payload.reference,
    updatedAt: new Date().toISOString(),
  });

  return { received: true };
});
