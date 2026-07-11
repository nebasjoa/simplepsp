import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@simplepsp/shared/server";

const prisma = new PrismaClient();
const PORTAL_URL = "http://localhost:4103";

test("admin creates a merchant, and that merchant logs into the portal and sees a payment", async ({ page }) => {
  const operatorEmail = `qa-operator-${Date.now()}@demo.test`;
  const operatorPassword = "qa-operator-password";
  await prisma.operator.create({ data: { email: operatorEmail, passwordHash: hashPassword(operatorPassword) } });

  await page.goto(`${PORTAL_URL}/admin/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(operatorEmail);
  await page.getByLabel("Password").fill(operatorPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin\/merchants$/);

  await page.getByRole("link", { name: "+ New merchant" }).click();
  await page.waitForURL(/\/admin\/merchants\/new$/);

  const merchantEmail = `qa-merchant-${Date.now()}@demo.test`;
  await page.getByLabel("Name").fill("QA Merchant");
  await page.getByLabel("Email").fill(merchantEmail);
  await page.getByRole("button", { name: "Create merchant" }).click();

  await expect(page.getByText("Merchant created.")).toBeVisible();
  const initialPassword = (await page.getByTestId("new-merchant-initial-password").textContent())?.trim();
  expect(initialPassword).toBeTruthy();

  // A fresh browser-like session: log into the merchant portal with the just-issued credentials.
  await page.goto(`${PORTAL_URL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(merchantEmail);
  await page.getByLabel("Password").fill(initialPassword!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/portal$/);

  // Fire a real test payment against the gateway using this merchant's own issued credentials.
  await page.goto(`${PORTAL_URL}/portal/test`, { waitUntil: "networkidle" });
  await page.getByLabel("Direct (server-to-server)").check();
  await page.getByRole("button", { name: "Send test payment" }).click();
  await expect(page.getByText(/"status": "captured"/)).toBeVisible();

  await page.goto(`${PORTAL_URL}/portal/payments`, { waitUntil: "networkidle" });
  await expect(page.getByText(/portal_test_/)).toBeVisible();
});
