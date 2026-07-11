import { z } from "zod";
import { prisma } from "../../../utils/prisma";

const schema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
  cardEnabled: z.boolean().optional(),
  paypalEnabled: z.boolean().optional(),
  googlePayEnabled: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readValidatedBody(event, schema.parse);

  const isMethodUpdate = "cardEnabled" in body || "paypalEnabled" in body || "googlePayEnabled" in body;
  if (isMethodUpdate) {
    const current = await prisma.merchant.findUniqueOrThrow({ where: { id } });
    const cardEnabled = body.cardEnabled ?? current.cardEnabled;
    const paypalEnabled = body.paypalEnabled ?? current.paypalEnabled;
    const googlePayEnabled = body.googlePayEnabled ?? current.googlePayEnabled;
    if (!cardEnabled && !paypalEnabled && !googlePayEnabled) {
      throw createError({ statusCode: 400, statusMessage: "At least one payment method must stay enabled" });
    }
  }

  const merchant = await prisma.merchant.update({ where: { id }, data: body });
  return {
    id: merchant.id,
    name: merchant.name,
    active: merchant.active,
    cardEnabled: merchant.cardEnabled,
    paypalEnabled: merchant.paypalEnabled,
    googlePayEnabled: merchant.googlePayEnabled,
  };
});
