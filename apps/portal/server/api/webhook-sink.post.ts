import { verify } from "@simplepsp/shared/server";
import { prisma } from "../utils/prisma";

/**
 * Default webhook target for /portal/test payments when the merchant hasn't configured one.
 * Not under /api/portal/* on purpose -- the gateway calls this server-to-server, not a logged-in
 * merchant, so it must sit outside the session-auth middleware. Signature is verified against the
 * secret of the merchant that owns the referenced payment.
 */
export default defineEventHandler(async (event) => {
  const rawBody = (await readRawBody(event)) ?? "";
  const timestamp = Number(getHeader(event, "x-timestamp"));
  const signature = getHeader(event, "x-signature");
  const payload = JSON.parse(rawBody) as { paymentId: string };

  const payment = await prisma.payment.findUnique({ where: { id: payload.paymentId }, include: { merchant: true } });
  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: "Unknown payment" });
  }
  if (!signature || !Number.isFinite(timestamp) || !verify(payment.merchant.secret, timestamp, rawBody, signature)) {
    throw createError({ statusCode: 401, statusMessage: "Invalid webhook signature" });
  }

  return { received: true };
});
