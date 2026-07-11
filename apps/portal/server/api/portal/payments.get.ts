import { z } from "zod";
import { prisma } from "../../utils/prisma";

const querySchema = z.object({
  status: z.string().optional(),
  reference: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export default defineEventHandler(async (event) => {
  const merchantId = event.context.merchantId as string;
  const query = await getValidatedQuery(event, querySchema.parse);

  const where = {
    merchantId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.reference ? { reference: { contains: query.reference } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.payment.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
});
