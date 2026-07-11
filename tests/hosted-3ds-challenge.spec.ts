import { test, expect } from "@playwright/test";

test("hosted checkout with a 3DS test card challenges before capturing", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Checkout (hosted)" }).click();

  await page.waitForURL(/\/pay\//);
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Card number").fill("4000 0000 0000 3220");
  await page.getByRole("button", { name: "Pay" }).click();

  await page.waitForURL(/\/pay\/.+\/3ds$/);
  await expect(page.getByText("Verify this payment")).toBeVisible();

  await page.getByRole("button", { name: "Approve" }).click();

  await page.waitForURL(/\/return\?/);
  await expect(page.getByText("captured")).toBeVisible();
});

test("declining the 3DS challenge declines the payment", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Checkout (hosted)" }).click();

  await page.waitForURL(/\/pay\//);
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Card number").fill("4000 0000 0000 3220");
  await page.getByRole("button", { name: "Pay" }).click();

  await page.waitForURL(/\/pay\/.+\/3ds$/);
  await page.getByRole("button", { name: "Decline" }).click();

  await page.waitForURL(/\/return\?/);
  await expect(page.getByText("declined")).toBeVisible();
});
