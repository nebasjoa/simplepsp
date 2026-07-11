import { transition, type PaymentStatus } from "@simplepsp/shared";
import { prisma } from "../../utils/prisma";
import { sendWebhook } from "../../utils/webhook";
import { chargeCard, eventForOutcome } from "../../utils/acquirer";

interface FormBody {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
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

  const form = await readBody<FormBody>(event);
  const config = useRuntimeConfig(event);

  const charge = await chargeCard(config.acquirerUrl, {
    number: form.cardNumber,
    amount: payment.amount,
    currency: payment.currency,
  });

  const nextStatus = transition(
    { status: payment.status as PaymentStatus, captureNow: payment.captureNow },
    eventForOutcome(charge.outcome),
  );

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: nextStatus,
      cardBrand: charge.brand,
      cardLast4: charge.last4,
    },
  });

  const merchant = await prisma.merchant.findUniqueOrThrow({ where: { id: payment.merchantId } });
  await sendWebhook(merchant, updated);

  const redirectUrl = new URL(payment.returnUrl);
  redirectUrl.searchParams.set("paymentId", payment.id);
  await sendRedirect(event, redirectUrl.toString(), 302);
});
