import { z } from "zod";
import { sign } from "@simplepsp/shared/server";
import { prisma } from "../../utils/prisma";

const schema = z.object({
  mode: z.enum(["hosted", "direct"]),
  cardNumber: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const merchantId = event.context.merchantId as string;
  const merchant = await prisma.merchant.findUniqueOrThrow({ where: { id: merchantId } });
  const body = await readValidatedBody(event, schema.parse);
  const config = useRuntimeConfig(event);

  const payload: Record<string, unknown> = {
    amount: 500,
    currency: "EUR",
    reference: `portal_test_${Date.now()}`,
    captureNow: true,
    returnUrl: `${config.public.portalUrl}/portal/test`,
    webhookUrl: merchant.webhookUrl ?? `${config.public.portalUrl}/api/webhook-sink`,
  };

  if (body.mode === "direct") {
    if (!body.cardNumber) {
      throw createError({ statusCode: 400, statusMessage: "cardNumber is required for the direct flow" });
    }
    payload.card = { number: body.cardNumber, expMonth: 12, expYear: 2030, cvc: "123" };
  }

  const rawBody = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign(merchant.secret, timestamp, rawBody);

  return await $fetch<{
    id: string;
    status?: string;
    redirectUrl?: string;
    cardBrand?: string | null;
    cardLast4?: string | null;
    reason?: string;
  }>(`${config.public.gatewayUrl}/api/v1/payments`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": merchant.apiKey,
      "x-timestamp": String(timestamp),
      "x-signature": signature,
    },
    body: rawBody,
  });
});
