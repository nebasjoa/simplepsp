import { z } from "zod";
import { verifyPassword } from "@simplepsp/shared/server";
import { prisma } from "../../utils/prisma";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse);

  const operator = await prisma.operator.findUnique({ where: { email: body.email } });
  if (!operator || !verifyPassword(body.password, operator.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });
  }

  await setUserSession(event, {
    user: { kind: "operator", id: operator.id, email: operator.email },
  });

  return { ok: true };
});
