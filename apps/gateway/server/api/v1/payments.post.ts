import { randomBytes, createHash } from "node:crypto";
import type { Merchant, Payment } from "@prisma/client";
import { createPaymentSchema, transition, type PaymentStatus } from "@simplepsp/shared";
import { prisma } from "../../utils/prisma";
import { sendWebhook } from "../../utils/webhook";
import { chargeCard, eventForOutcome } from "../../utils/acquirer";

function toResponse(payment: Payment, config: ReturnType<typeof useRuntimeConfig>) {
  if (payment.hostedToken) {
    return {
      id: payment.id,
      status: payment.status,
      redirectUrl: `${config.public.gatewayUrl}/pay/${payment.hostedToken}`,
    };
  }
  return {
    id: payment.id,
    status: payment.status,
    cardBrand: payment.cardBrand,
    cardLast4: payment.cardLast4,
  };
}

export default defineEventHandler(async (event) => {
  const merchant = event.context.merchant as Merchant;
  const rawBody = event.context.rawBody as string;

  const parsed = createPaymentSchema.safeParse(JSON.parse(rawBody));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid request body", data: parsed.error.flatten() });
  }
  const body = parsed.data;
  const config = useRuntimeConfig(event);

  const idempotencyKey = getHeader(event, "idempotency-key");
  const bodyHash = createHash("sha256").update(rawBody).digest("hex");

  if (idempotencyKey) {
    const existing = await prisma.payment.findUnique({
      where: { merchantId_idempotencyKey: { merchantId: merchant.id, idempotencyKey } },
    });
    if (existing) {
      if (existing.idempotencyBodyHash !== bodyHash) {
        throw createError({
          statusCode: 409,
          statusMessage: "Idempotency-Key was already used with a different request body",
        });
      }
      setResponseStatus(event, 201);
      return toResponse(existing, config);
    }
  }

  if (body.card) {
    const payment = await prisma.payment.create({
      data: {
        merchantId: merchant.id,
        amount: body.amount,
        currency: body.currency,
        reference: body.reference,
        status: "initiated",
        captureNow: body.captureNow,
        returnUrl: body.returnUrl,
        webhookUrl: body.webhookUrl,
        idempotencyKey: idempotencyKey ?? undefined,
        idempotencyBodyHash: idempotencyKey ? bodyHash : undefined,
      },
    });

    const charge = await chargeCard(config.acquirerUrl, {
      number: body.card.number,
      amount: body.amount,
      currency: body.currency,
    });

    const nextStatus = transition(
      { status: payment.status as PaymentStatus, captureNow: payment.captureNow },
      eventForOutcome(charge.outcome),
    );

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: nextStatus, cardBrand: charge.brand, cardLast4: charge.last4 },
    });

    await sendWebhook(merchant, updated);

    setResponseStatus(event, 201);
    return {
      ...toResponse(updated, config),
      ...(charge.outcome === "approved" ? {} : { reason: charge.reason }),
    };
  }

  const hostedToken = randomBytes(16).toString("hex");
  const payment = await prisma.payment.create({
    data: {
      merchantId: merchant.id,
      amount: body.amount,
      currency: body.currency,
      reference: body.reference,
      status: "initiated",
      captureNow: body.captureNow,
      returnUrl: body.returnUrl,
      webhookUrl: body.webhookUrl,
      hostedToken,
      idempotencyKey: idempotencyKey ?? undefined,
      idempotencyBodyHash: idempotencyKey ? bodyHash : undefined,
    },
  });

  setResponseStatus(event, 201);
  return toResponse(payment, config);
});
