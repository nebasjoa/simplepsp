import { prisma } from "../../../utils/prisma";
import { finalizeHostedPayment } from "../../../utils/hostedFlow";

interface DecisionBody {
  decision: "approve" | "decline";
}

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");
  const payment = await prisma.payment.findUnique({ where: { hostedToken: token } });
  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: "Payment not found" });
  }
  if (payment.status !== "initiated") {
    throw createError({ statusCode: 409, statusMessage: `Payment already in status "${payment.status}"` });
  }

  const form = await readBody<DecisionBody>(event);
  const merchant = await prisma.merchant.findUniqueOrThrow({ where: { id: payment.merchantId } });

  await finalizeHostedPayment(event, payment, merchant, form.decision === "approve" ? "approve" : "decline");
});
