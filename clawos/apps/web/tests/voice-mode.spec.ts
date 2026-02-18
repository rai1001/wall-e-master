import { expect, test } from "@playwright/test";

test("voice mode shows clear states and allows cancel", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Iniciar modo voz" }).click();
  await expect(page.getByText("Estado de voz: escuchando")).toBeVisible();

  await expect(page.getByText("Estado de voz: procesando")).toBeVisible({ timeout: 4000 });

  await page.getByRole("button", { name: "Cancelar modo voz" }).click();
  await expect(page.getByText("Estado de voz: en espera")).toBeVisible();
});
