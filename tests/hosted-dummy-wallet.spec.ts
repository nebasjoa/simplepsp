import { randomBytes } from "node:crypto";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@simplepsp/shared/server";

const prisma = new PrismaClient();
const PORTAL_URL = "http://localhost:4103";

test("admin enables dummy PayPal for a merchant and a hosted checkout completes via the dummy wallet button", async ({
  page,
}) => {
  const operatorEmail = `qa-operator-${Date.now()}@demo.test`;
  const operatorPassword = "qa-operator-password";
  await prisma.operator.create({ data: { email: operatorEmail, passwordHash: hashPassword(operatorPassword) } });

  const merchantEmail = `qa-merchant-${Date.now()}@demo.test`;
  const merchantPassword = "qa-merchant-password";
  const merchant = await prisma.merchant.create({
    data: {
      name: "QA Wallet Merchant",
      email: merchantEmail,
      passwordHash: hashPassword(merchantPassword),
      active: true,
      apiKey: `pk_qa_${randomBytes(8).toString("hex")}`,
      secret: `sk_qa_${randomBytes(16).toString("hex")}`,
    },
  });

  await page.goto(`${PORTAL_URL}/admin/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(operatorEmail);
  await page.getByLabel("Password").fill(operatorPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin\/merchants$/);

  await page.goto(`${PORTAL_URL}/admin/merchants/${merchant.id}`, { waitUntil: "networkidle" });
  await page.getByLabel(/PayPal/).check();
  await expect(page.getByLabel(/PayPal/)).toBeChecked();

  await page.goto(`${PORTAL_URL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(merchantEmail);
  await page.getByLabel("Password").fill(merchantPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/portal$/);

  await page.goto(`${PORTAL_URL}/portal/test`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Send test payment" }).click();

  await page.waitForURL(/\/pay\//);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "PayPal" }).click();
  await page.getByRole("button", { name: /with PayPal/ }).click();

  await page.waitForURL(/\/portal\/test\?paymentId=/);
  await expect(page.getByText(/"status": "captured"/)).toBeVisible();
  await expect(page.getByText(/"paymentMethod": "paypal"/)).toBeVisible();
});
