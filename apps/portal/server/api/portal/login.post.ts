import { z } from "zod";
import { verifyPassword } from "@simplepsp/shared/server";
import { prisma } from "../../utils/prisma";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse);

  const merchant = await prisma.merchant.findUnique({ where: { email: body.email } });
  if (!merchant || !merchant.active || !verifyPassword(body.password, merchant.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });
  }

  await setUserSession(event, {
    user: { kind: "merchant", id: merchant.id, email: merchant.email, name: merchant.name },
  });

  return { ok: true };
});
