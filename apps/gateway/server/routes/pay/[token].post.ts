import { prisma } from "../../utils/prisma";
import { chargeCard, eventForOutcome } from "../../utils/acquirer";
import { finalizeHostedPayment } from "../../utils/hostedFlow";

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

  const charge = await chargeCard(
    config.acquirerUrl,
    { number: form.cardNumber, amount: payment.amount, currency: payment.currency },
    payment.id,
  );

  // Record the card metadata as soon as we know it, regardless of whether a 3DS challenge follows.
  const withCard = await prisma.payment.update({
    where: { id: payment.id },
    data: { paymentMethod: "card", cardBrand: charge.brand, cardLast4: charge.last4 },
  });

  if (charge.outcome === "requires_3ds") {
    await sendRedirect(event, `/pay/${token}/3ds`, 302);
    return;
  }

  const merchant = await prisma.merchant.findUniqueOrThrow({ where: { id: payment.merchantId } });
  await finalizeHostedPayment(event, withCard, merchant, eventForOutcome(charge.outcome));
});
