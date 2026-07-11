import type { Merchant } from "@prisma/client";
import { transition, type PaymentStatus } from "@simplepsp/shared";
import { prisma } from "../../../../utils/prisma";
import { sendWebhook } from "../../../../utils/webhook";

export default defineEventHandler(async (event) => {
  const merchant = event.context.merchant as Merchant;
  const id = getRouterParam(event, "id");

  const payment = await prisma.payment.findFirst({ where: { id, merchantId: merchant.id } });
  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: "Payment not found" });
  }

  let nextStatus: PaymentStatus;
  try {
    nextStatus = transition({ status: payment.status as PaymentStatus, captureNow: payment.captureNow }, "void");
  } catch (err) {
    throw createError({ statusCode: 409, statusMessage: (err as Error).message });
  }

  const updated = await prisma.payment.update({ where: { id: payment.id }, data: { status: nextStatus } });
  await sendWebhook(merchant, updated);

  return { id: updated.id, status: updated.status };
});
