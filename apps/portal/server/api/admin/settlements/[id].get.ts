import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  const batch = await prisma.settlementBatch.findUnique({
    where: { id },
    include: { payments: { include: { merchant: true }, orderBy: { updatedAt: "desc" } } },
  });
  if (!batch) {
    throw createError({ statusCode: 404, statusMessage: "Settlement batch not found" });
  }

  const byMerchant = new Map<string, { merchantId: string; merchantName: string; currency: string; count: number; totalAmount: number }>();
  for (const payment of batch.payments) {
    const key = `${payment.merchantId}:${payment.currency}`;
    const entry = byMerchant.get(key) ?? {
      merchantId: payment.merchantId,
      merchantName: payment.merchant.name,
      currency: payment.currency,
      count: 0,
      totalAmount: 0,
    };
    entry.count += 1;
    entry.totalAmount += payment.settledAmount ?? 0;
    byMerchant.set(key, entry);
  }

  return {
    id: batch.id,
    status: batch.status,
    paymentCount: batch.paymentCount,
    settledCount: batch.settledCount,
    failedCount: batch.failedCount,
    createdAt: batch.createdAt,
    merchants: [...byMerchant.values()],
    payments: batch.payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      merchantName: p.merchant.name,
      currency: p.currency,
      amount: p.amount,
      settledAmount: p.settledAmount,
      settlementOutcome: p.settlementOutcome,
      settlementReason: p.settlementReason,
    })),
  };
});
