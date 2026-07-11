import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const merchantId = event.context.merchantId as string;

  const [recent, grouped] = await Promise.all([
    prisma.payment.findMany({ where: { merchantId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.payment.groupBy({ by: ["status"], where: { merchantId }, _count: { _all: true }, _sum: { amount: true } }),
  ]);

  return {
    recent,
    totals: grouped.map((g) => ({ status: g.status, count: g._count._all, amount: g._sum.amount ?? 0 })),
  };
});
