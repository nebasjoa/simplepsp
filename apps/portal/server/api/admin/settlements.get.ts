import { prisma } from "../../utils/prisma";

export default defineEventHandler(async () => {
  const batches = await prisma.settlementBatch.findMany({ orderBy: { createdAt: "desc" } });

  const pending = await prisma.payment.groupBy({
    by: ["currency"],
    where: { status: { in: ["captured", "partially_refunded"] }, settlementBatchId: null },
    _count: { _all: true },
    _sum: { amount: true },
  });

  return {
    batches,
    pending: pending.map((p) => ({
      currency: p.currency,
      count: p._count._all,
      totalAmount: p._sum.amount ?? 0,
    })),
  };
});
