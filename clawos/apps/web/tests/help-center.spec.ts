import { expect, test } from "@playwright/test";

test("help center is reachable from home quick action and navbar", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Ayuda rapida" }).click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(page.getByRole("heading", { name: "Centro de Ayuda" })).toBeVisible();

  await page.getByRole("link", { name: "Inicio" }).click();
  await page.getByRole("link", { name: "Ayuda" }).click();
  await expect(page).toHaveURL(/\/help$/);
});

test("help center lists and opens non-technical guides", async ({ page }) => {
  await page.goto("/help");

  await expect(page.getByText("README no tecnico")).toBeVisible();
  await expect(page.getByText("Links rapidos")).toBeVisible();
  await expect(page.getByText("Empezar en 5 min")).toBeVisible();
  await expect(page.getByText("Conexiones WA + Email + Make + ChefOs")).toBeVisible();
  await expect(page.getByText("Operacion diaria Chef")).toBeVisible();
  await expect(page.getByText("Solucion de problemas")).toBeVisible();
  await expect(page.getByText("Checklist MVP Produccion")).toBeVisible();

  await page.getByRole("link", { name: "Operacion diaria Chef" }).click();
  await expect(page).toHaveURL(/\/help\/03-operacion-diaria-chef$/);
  await expect(page.getByText("Regla de oro")).toBeVisible();
});
