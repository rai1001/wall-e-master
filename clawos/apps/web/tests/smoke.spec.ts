import { expect, test } from "@playwright/test";

test("renders primary navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("ClawOS")).toBeVisible();
});
