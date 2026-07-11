import { randomBytes } from "node:crypto";
import { prisma } from "../../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const secret = `sk_live_${randomBytes(24).toString("hex")}`;
  await prisma.merchant.update({ where: { id }, data: { secret } });
  return { secret };
});
