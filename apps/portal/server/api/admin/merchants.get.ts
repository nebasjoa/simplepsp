import { prisma } from "../../utils/prisma";

export default defineEventHandler(async () => {
  const merchants = await prisma.merchant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { payments: true } } },
  });

  return merchants.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    active: m.active,
    apiKey: m.apiKey,
    createdAt: m.createdAt,
    paymentCount: m._count.payments,
  }));
});
