import type { Merchant } from "@prisma/client";
import { amountOverrideSchema, transition, type PaymentEvent, type PaymentStatus } from "@simplepsp/shared";
import { prisma } from "../../../../utils/prisma";
import { sendWebhook } from "../../../../utils/webhook";

export default defineEventHandler(async (event) => {
  const merchant = event.context.merchant as Merchant;
  const rawBody = event.context.rawBody as string;
  const id = getRouterParam(event, "id");

  const payment = await prisma.payment.findFirst({
    where: { id, merchantId: merchant.id },
    include: { refunds: true },
  });
  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: "Payment not found" });
  }

  const parsed = amountOverrideSchema.safeParse(rawBody ? JSON.parse(rawBody) : {});
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid request body", data: parsed.error.flatten() });
  }

  const alreadyRefunded = payment.refunds
    .filter((r) => r.status === "refunded")
    .reduce((sum, r) => sum + r.amount, 0);
  const remaining = payment.amount - alreadyRefunded;
  const requested = parsed.data.amount ?? remaining;

  if (requested <= 0 || requested > remaining) {
    throw createError({ statusCode: 400, statusMessage: `Refund amount must be between 1 and ${remaining}` });
  }

  const refundEvent: PaymentEvent = requested === remaining ? "refund" : "partial_refund";

  let nextStatus: PaymentStatus;
  try {
    nextStatus = transition({ status: payment.status as PaymentStatus, captureNow: payment.captureNow }, refundEvent);
  } catch (err) {
    throw createError({ statusCode: 409, statusMessage: (err as Error).message });
  }

  const [, updated] = await prisma.$transaction([
    prisma.refund.create({ data: { paymentId: payment.id, amount: requested, status: "refunded" } }),
    prisma.payment.update({ where: { id: payment.id }, data: { status: nextStatus } }),
  ]);

  await sendWebhook(merchant, updated);

  return { id: updated.id, status: updated.status, refunded: alreadyRefunded + requested };
});
