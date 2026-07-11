import type { Merchant } from "@prisma/client";
import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const merchant = event.context.merchant as Merchant;
  const id = getRouterParam(event, "id");

  const payment = await prisma.payment.findFirst({ where: { id, merchantId: merchant.id } });
  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: "Payment not found" });
  }

  return {
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    reference: payment.reference,
    cardBrand: payment.cardBrand,
    cardLast4: payment.cardLast4,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
});
