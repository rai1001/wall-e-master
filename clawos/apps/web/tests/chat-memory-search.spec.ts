import { expect, test } from "@playwright/test";

test("chat searches memory and shows retrieved context", async ({ page }) => {
  await page.route("**/api/memory/search?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        query: "stripe",
        results: [
          {
            id: "mem_1",
            content: "Stripe subscriptions endpoint changed to /v2",
            metadata: {
              agent_id: "lince",
              source: "web"
            }
          }
        ]
      })
    });
  });

  await page.goto("/");

  await page.getByLabel("Comando").fill("stripe");
  await page.getByRole("button", { name: "Buscar contexto" }).click();

  await expect(page.getByText("Contexto listo para el agente activo.")).toBeVisible();
  await expect(page.getByText("Stripe subscriptions endpoint changed to /v2 (lince / web)")).toBeVisible();
});
