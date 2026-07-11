import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");
  const payment = await prisma.payment.findUnique({ where: { hostedToken: token } });
  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: "Payment not found" });
  }

  return {
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    reference: payment.reference,
  };
});
