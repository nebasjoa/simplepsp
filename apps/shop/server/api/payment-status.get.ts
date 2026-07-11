import type { PaymentStatus } from "@simplepsp/shared";
import { signedHeaders } from "../utils/gatewayClient";
import { getOrder, recordOrderUpdate } from "../utils/orderStore";

export interface PaymentStatusResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  reference: string;
  cardBrand: string | null;
  cardLast4: string | null;
  createdAt: string;
  updatedAt: string;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const paymentId = query.paymentId as string;
  const config = useRuntimeConfig(event);

  // Prefer the locally reconciled order (populated by the signed webhook) over asking the
  // gateway again — the webhook, not the browser redirect, is the source of truth.
  const cached = getOrder(paymentId);
  if (cached) return cached;

  const payment = await $fetch<PaymentStatusResponse>(`${config.public.gatewayUrl}/api/v1/payments/${paymentId}`, {
    headers: signedHeaders(config.gatewayApiKey, config.gatewayApiSecret, ""),
  });

  recordOrderUpdate({ ...payment, updatedAt: new Date().toISOString() });
  return payment;
});
