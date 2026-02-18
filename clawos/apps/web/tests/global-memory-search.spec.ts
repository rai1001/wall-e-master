import { expect, test } from "@playwright/test";

test("global search opens with Ctrl+K and queries shared memory", async ({ page }) => {
  let requestedProjectId: string | null = "not-called";

  await page.route("**/api/memory/search?*", async (route) => {
    const requestUrl = new URL(route.request().url());
    requestedProjectId = requestUrl.searchParams.get("project_id");

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        query: "stripe",
        results: [
          {
            id: "mem_global_1",
            content: "Stripe endpoint changed to /v2 for subscriptions",
            metadata: {
              agent_id: "lince",
              project_id: "proj_002",
              source: "web",
              timestamp: "2026-02-18T10:00:00Z",
              tags: ["stripe", "billing"]
            }
          }
        ]
      })
    });
  });

  await page.goto("/");

  await page.keyboard.press("Control+K");
  await expect(page.getByRole("heading", { name: "Buscador Global" })).toBeVisible();

  await page.getByLabel("Buscar en memoria global").fill("stripe");
  await page.getByRole("button", { name: "Buscar en toda la memoria" }).click();

  await expect(page.getByText("Contexto encontrado en memoria compartida.")).toBeVisible();
  await expect(page.getByText("Stripe endpoint changed to /v2 for subscriptions")).toBeVisible();
  await expect(page.getByText("lince · proj_002 · web")).toBeVisible();
  expect(requestedProjectId).toBeNull();
});
