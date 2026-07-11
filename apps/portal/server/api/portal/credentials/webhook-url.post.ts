import { z } from "zod";
import { prisma } from "../../../utils/prisma";

const schema = z.object({ webhookUrl: z.string().url() });

export default defineEventHandler(async (event) => {
  const merchantId = event.context.merchantId as string;
  const body = await readValidatedBody(event, schema.parse);
  await prisma.merchant.update({ where: { id: merchantId }, data: { webhookUrl: body.webhookUrl } });
  return { ok: true };
});
