import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@simplepsp/shared/server";

const prisma = new PrismaClient();

async function main() {
  const operatorPassword = randomBytes(9).toString("base64url");
  const operator = await prisma.operator.upsert({
    where: { email: "admin@demo.test" },
    update: {},
    create: {
      email: "admin@demo.test",
      passwordHash: hashPassword(operatorPassword),
    },
  });

  const merchant = await prisma.merchant.upsert({
    where: { email: "merchant@demo.test" },
    update: {},
    create: {
      name: "Demo Merchant",
      email: "merchant@demo.test",
      passwordHash: hashPassword("demo_password"),
      active: true,
      apiKey: "pk_demo",
      secret: "sk_demo_secret",
    },
  });

  console.log("Seeded operator + demo merchant:");
  console.log(`  Operator login:  admin@demo.test / ${operatorPassword}`);
  console.log(`  Merchant login:  merchant@demo.test / demo_password`);
  console.log(`  Merchant apiKey: ${merchant.apiKey}`);
  console.log(`  Merchant secret: ${merchant.secret}`);
  console.log(`  Operator id:     ${operator.id}`);
  console.log(`  Merchant id:     ${merchant.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
