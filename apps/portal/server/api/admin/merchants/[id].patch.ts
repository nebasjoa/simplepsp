import { z } from "zod";
import { prisma } from "../../../utils/prisma";

const schema = z.object({ name: z.string().min(1).optional(), active: z.boolean().optional() });

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readValidatedBody(event, schema.parse);
  const merchant = await prisma.merchant.update({ where: { id }, data: body });
  return { id: merchant.id, name: merchant.name, active: merchant.active };
});
