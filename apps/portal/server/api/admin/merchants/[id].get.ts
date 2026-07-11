import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: { _count: { select: { payments: true } } },
  });
  if (!merchant) {
    throw createError({ statusCode: 404, statusMessage: "Merchant not found" });
  }

  return {
    id: merchant.id,
    name: merchant.name,
    email: merchant.email,
    active: merchant.active,
    apiKey: merchant.apiKey,
    webhookUrl: merchant.webhookUrl,
    createdAt: merchant.createdAt,
    paymentCount: merchant._count.payments,
    cardEnabled: merchant.cardEnabled,
    paypalEnabled: merchant.paypalEnabled,
    googlePayEnabled: merchant.googlePayEnabled,
  };
});
