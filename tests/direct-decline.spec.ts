import { test, expect } from "@playwright/test";

test("direct checkout with a declined test card shows declined status", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByLabel("Test card").selectOption({ label: "Visa - declined (generic)" });
  await page.getByRole("button", { name: "Checkout (direct)" }).click();

  await page.waitForURL(/\/return\?/);
  await expect(page.getByText("declined")).toBeVisible();
});
