import { test, expect } from "@playwright/test";

test("hosted checkout with 4242 test card is captured", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Checkout (hosted)" }).click();

  await page.waitForURL(/\/pay\//);
  await expect(page.getByRole("heading", { name: /^Pay/ })).toBeVisible();

  await page.getByRole("button", { name: "Pay" }).click();

  await page.waitForURL(/\/return\?/);
  await expect(page.getByText("captured")).toBeVisible();
});
