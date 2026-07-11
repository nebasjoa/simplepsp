import { prisma } from "../../../utils/prisma";
import { chargeWallet } from "../../../utils/acquirer";
import { finalizeHostedPayment } from "../../../utils/hostedFlow";

interface FormBody {
  method: "paypal" | "google_pay";
}

const ENABLED_FIELD = {
  paypal: "paypalEnabled",
  google_pay: "googlePayEnabled",
} as const;

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");
  const payment = await prisma.payment.findUnique({ where: { hostedToken: token }, include: { merchant: true } });
  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: "Payment not found" });
  }
  if (payment.status !== "initiated") {
    throw createError({ statusCode: 409, statusMessage: `Payment already in status "${payment.status}"` });
  }

  const form = await readBody<FormBody>(event);
  const method = form.method;
  if (method !== "paypal" && method !== "google_pay") {
    throw createError({ statusCode: 400, statusMessage: "Unknown payment method" });
  }
  if (!payment.merchant[ENABLED_FIELD[method]]) {
    throw createError({ statusCode: 403, statusMessage: `${method} is not enabled for this merchant` });
  }

  const config = useRuntimeConfig(event);
  await chargeWallet(config.acquirerUrl, method, payment.amount, payment.currency, payment.id);

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { paymentMethod: method },
  });

  await finalizeHostedPayment(event, updated, payment.merchant, "approve");
});
