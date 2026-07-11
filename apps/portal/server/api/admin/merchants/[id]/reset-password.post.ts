import { randomBytes } from "node:crypto";
import { hashPassword } from "@simplepsp/shared/server";
import { prisma } from "../../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const password = randomBytes(9).toString("base64url");
  await prisma.merchant.update({ where: { id }, data: { passwordHash: hashPassword(password) } });
  return { password };
});
