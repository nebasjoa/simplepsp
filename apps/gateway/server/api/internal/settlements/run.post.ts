import { transition, type PaymentStatus } from "@simplepsp/shared";
import { prisma } from "../../../utils/prisma";
import { sendWebhook } from "../../../utils/webhook";
import { settleBatch, type SettleItem } from "../../../utils/acquirer";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const eligible = await prisma.payment.findMany({
    where: { status: { in: ["captured", "partially_refunded"] }, settlementBatchId: null },
    include: { merchant: true, refunds: true },
  });

  const batch = await prisma.settlementBatch.create({
    data: { status: "completed", paymentCount: eligible.length },
  });

  if (eligible.length === 0) {
    return { batchId: batch.id, paymentCount: 0, settledCount: 0, failedCount: 0 };
  }

  const items: SettleItem[] = eligible.map((payment) => {
    const refunded = payment.refunds
      .filter((r) => r.status === "refunded")
      .reduce((sum, r) => sum + r.amount, 0);
    return { paymentId: payment.id, amount: payment.amount - refunded, currency: payment.currency };
  });

  const results = await settleBatch(config.acquirerUrl, items);
  const resultByPaymentId = new Map(results.map((r) => [r.paymentId, r]));

  let settledCount = 0;
  let failedCount = 0;

  for (const payment of eligible) {
    const result = resultByPaymentId.get(payment.id);
    if (!result) continue;

    if (result.outcome === "settled") {
      const settledAmount = items.find((i) => i.paymentId === payment.id)!.amount;
      const nextStatus: PaymentStatus = transition(
        { status: payment.status as PaymentStatus, captureNow: payment.captureNow },
        "settle",
      );
      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: nextStatus,
          settlementBatchId: batch.id,
          settledAmount,
          settlementOutcome: "settled",
          settlementReason: null,
        },
      });
      await sendWebhook(payment.merchant, updated);
      settledCount += 1;
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { settlementOutcome: "failed", settlementReason: result.reason },
      });
      failedCount += 1;
    }
  }

  await prisma.settlementBatch.update({
    where: { id: batch.id },
    data: { settledCount, failedCount },
  });

  return { batchId: batch.id, paymentCount: eligible.length, settledCount, failedCount };
});
