import { signedHeaders } from "../utils/gatewayClient";

interface CheckoutBody {
  mode: "hosted" | "direct";
  cardNumber?: string;
}

interface CheckoutResponse {
  id: string;
  status?: string;
  redirectUrl?: string;
  cardBrand?: string | null;
  cardLast4?: string | null;
  reason?: string;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { mode, cardNumber } = await readBody<CheckoutBody>(event);
  const reference = `order_${Date.now()}`;

  const payload: Record<string, unknown> = {
    amount: 1099,
    currency: "EUR",
    reference,
    captureNow: true,
    returnUrl: `${config.public.shopUrl}/return`,
    webhookUrl: `${config.public.shopUrl}/api/webhooks/gateway`,
  };

  if (mode === "direct") {
    if (!cardNumber) {
      throw createError({ statusCode: 400, statusMessage: "cardNumber is required for the direct flow" });
    }
    // Collecting the PAN here puts the shop in SAQ D scope -- fine for a demo, but the hosted
    // flow (where the gateway's page collects it) is what real integrations should use instead.
    payload.card = { number: cardNumber, expMonth: 12, expYear: 2030, cvc: "123" };
  }

  const rawBody = JSON.stringify(payload);

  return await $fetch<CheckoutResponse>(`${config.public.gatewayUrl}/api/v1/payments`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...signedHeaders(config.gatewayApiKey, config.gatewayApiSecret, rawBody),
    },
    body: rawBody,
  });
});
