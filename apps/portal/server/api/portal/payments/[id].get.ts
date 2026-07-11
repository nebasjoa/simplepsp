import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const merchantId = event.context.merchantId as string;
  const id = getRouterParam(event, "id");

  const payment = await prisma.payment.findFirst({
    where: { id, merchantId },
    include: { refunds: { orderBy: { createdAt: "asc" } } },
  });
  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: "Payment not found" });
  }

  const webhookDeliveries = await prisma.webhookDelivery.findMany({
    where: { paymentId: payment.id },
    orderBy: { createdAt: "asc" },
  });

  return { ...payment, webhookDeliveries };
});
