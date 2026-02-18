import { expect, test } from "@playwright/test";

test("chat can pin a memory chunk from search results", async ({ page }) => {
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

  await page.route("**/api/memory/pin", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        memory_id: "mem_1",
        priority_score: 12,
        pinned: true
      })
    });
  });

  await page.goto("/");

  await page.getByLabel("Comando").fill("stripe");
  await page.getByRole("button", { name: "Buscar contexto" }).click();
  await page.getByRole("button", { name: "Fijar en memoria global mem_1" }).click();

  await expect(page.getByText("Memoria fijada en contexto global.")).toBeVisible();
});
