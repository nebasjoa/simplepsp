import type { H3Event } from "h3";
import type { Merchant, Payment } from "@prisma/client";
import { transition, type PaymentEvent, type PaymentStatus } from "@simplepsp/shared";
import { prisma } from "./prisma";
import { sendWebhook } from "./webhook";

/**
 * Applies a status transition, persists it, fires the webhook, then 302s back to returnUrl -- the
 * common tail of every hosted-flow outcome, whether it came straight from the acquirer or from a
 * resolved 3DS challenge.
 */
export async function finalizeHostedPayment(
  event: H3Event,
  payment: Payment,
  merchant: Pick<Merchant, "secret">,
  paymentEvent: PaymentEvent,
) {
  const nextStatus = transition({ status: payment.status as PaymentStatus, captureNow: payment.captureNow }, paymentEvent);
  const updated = await prisma.payment.update({ where: { id: payment.id }, data: { status: nextStatus } });
  await sendWebhook(merchant, updated);

  const redirectUrl = new URL(payment.returnUrl);
  redirectUrl.searchParams.set("paymentId", payment.id);
  await sendRedirect(event, redirectUrl.toString(), 302);
}
