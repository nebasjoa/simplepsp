import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const merchantId = event.context.merchantId as string;
  const merchant = await prisma.merchant.findUniqueOrThrow({ where: { id: merchantId } });
  return { apiKey: merchant.apiKey, webhookUrl: merchant.webhookUrl };
});
