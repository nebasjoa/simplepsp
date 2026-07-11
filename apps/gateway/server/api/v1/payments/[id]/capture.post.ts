import type { Merchant } from "@prisma/client";
import { amountOverrideSchema, transition, type PaymentStatus } from "@simplepsp/shared";
import { prisma } from "../../../../utils/prisma";
import { sendWebhook } from "../../../../utils/webhook";

export default defineEventHandler(async (event) => {
  const merchant = event.context.merchant as Merchant;
  const rawBody = event.context.rawBody as string;
  const id = getRouterParam(event, "id");

  const payment = await prisma.payment.findFirst({ where: { id, merchantId: merchant.id } });
  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: "Payment not found" });
  }

  const parsed = amountOverrideSchema.safeParse(rawBody ? JSON.parse(rawBody) : {});
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid request body", data: parsed.error.flatten() });
  }
  if (parsed.data.amount !== undefined && parsed.data.amount !== payment.amount) {
    throw createError({
      statusCode: 400,
      statusMessage: "Partial capture is not supported yet; omit amount or pass the full authorized amount",
    });
  }

  let nextStatus: PaymentStatus;
  try {
    nextStatus = transition({ status: payment.status as PaymentStatus, captureNow: payment.captureNow }, "capture");
  } catch (err) {
    throw createError({ statusCode: 409, statusMessage: (err as Error).message });
  }

  const updated = await prisma.payment.update({ where: { id: payment.id }, data: { status: nextStatus } });
  await sendWebhook(merchant, updated);

  return { id: updated.id, status: updated.status };
});
