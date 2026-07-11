import { randomBytes } from "node:crypto";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@simplepsp/shared/server";

const prisma = new PrismaClient();
const PORTAL_URL = "http://localhost:4103";

test("admin runs a settlement batch and a captured payment becomes settled", async ({ page }) => {
  const operatorEmail = `qa-operator-${Date.now()}@demo.test`;
  const operatorPassword = "qa-operator-password";
  await prisma.operator.create({ data: { email: operatorEmail, passwordHash: hashPassword(operatorPassword) } });

  const merchantEmail = `qa-merchant-${Date.now()}@demo.test`;
  const merchantPassword = "qa-merchant-password";
  await prisma.merchant.create({
    data: {
      name: "QA Settlement Merchant",
      email: merchantEmail,
      passwordHash: hashPassword(merchantPassword),
      active: true,
      apiKey: `pk_qa_${randomBytes(8).toString("hex")}`,
      secret: `sk_qa_${randomBytes(16).toString("hex")}`,
    },
  });

  await page.goto(`${PORTAL_URL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(merchantEmail);
  await page.getByLabel("Password").fill(merchantPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/portal$/);

  await page.goto(`${PORTAL_URL}/portal/test`, { waitUntil: "networkidle" });
  await page.getByLabel("Direct (server-to-server)").check();
  await page.getByRole("button", { name: "Send test payment" }).click();
  await expect(page.getByText(/"status": "captured"/)).toBeVisible();

  const resultText = (await page.locator("pre").first().textContent())!;
  const paymentId = (JSON.parse(resultText) as { id: string }).id;
  const { reference } = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });

  await page.goto(`${PORTAL_URL}/admin/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(operatorEmail);
  await page.getByLabel("Password").fill(operatorPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin\/merchants$/);

  await page.goto(`${PORTAL_URL}/admin/settlements`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Run settlement batch" }).click();
  await expect(page.getByText(/settled, \d+ failed/)).toBeVisible();

  await page.getByRole("link", { name: "Details" }).first().click();
  await page.waitForURL(/\/admin\/settlements\//);
  await expect(page.getByRole("row", { name: new RegExp(reference) })).toContainText("settled");
});
