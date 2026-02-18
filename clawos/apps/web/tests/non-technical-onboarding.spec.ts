import { expect, test } from "@playwright/test";

test("non-technical user completes first-run flow without advanced settings", async ({ page }) => {
  await page.goto("/onboarding");

  await expect(page.getByText("Bienvenido a ClawOS")).toBeVisible();

  await page.getByRole("button", { name: "Conectar cerebro local" }).click();
  await expect(page.getByText("Paso 2 de 3")).toBeVisible();

  await page.getByRole("button", { name: "Crear mi primer agente" }).click();
  await expect(page.getByText("Paso 3 de 3")).toBeVisible();

  await page.getByRole("button", { name: "Enviar primer comando" }).click();
  await expect(page.getByText("Onboarding completado")).toBeVisible();

  await expect(page.getByText("Configuracion avanzada")).toHaveCount(0);
});
