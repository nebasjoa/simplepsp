import { randomBytes } from "node:crypto";
import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const merchantId = event.context.merchantId as string;
  const secret = `sk_${randomBytes(24).toString("hex")}`;
  await prisma.merchant.update({ where: { id: merchantId }, data: { secret } });
  return { secret };
});
