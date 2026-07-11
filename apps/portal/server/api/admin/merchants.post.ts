import { randomBytes } from "node:crypto";
import { z } from "zod";
import { hashPassword } from "@simplepsp/shared/server";
import { prisma } from "../../utils/prisma";

const schema = z.object({ name: z.string().min(1), email: z.string().email() });

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse);

  const apiKey = `pk_live_${randomBytes(12).toString("hex")}`;
  const secret = `sk_live_${randomBytes(24).toString("hex")}`;
  const initialPassword = randomBytes(9).toString("base64url");

  try {
    const merchant = await prisma.merchant.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash: hashPassword(initialPassword),
        active: true,
        apiKey,
        secret,
      },
    });

    return { id: merchant.id, apiKey, secret, initialPassword };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw createError({ statusCode: 409, statusMessage: "A merchant with that email already exists" });
    }
    throw err;
  }
});
