import { expect, test } from "@playwright/test";

test("thought terminal shows live thinking and action events", async ({ page }) => {
  await page.route("**/api/projects/events?project_id=proj_001*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        project_id: "proj_001",
        events: [
          {
            id: "evt_1",
            kind: "thought",
            content: "Analizando cambios del proveedor de pagos",
            timestamp: "2026-02-18T12:00:00Z",
            agent_id: "lince",
            agent_name: "Lince"
          },
          {
            id: "evt_2",
            kind: "action",
            content: "Actualice la configuracion del conector",
            timestamp: "2026-02-18T12:01:00Z",
            agent_id: "sastre",
            agent_name: "Sastre"
          }
        ]
      })
    });
  });

  await page.goto("/");

  await expect(page.getByText("Analizando cambios del proveedor de pagos")).toBeVisible();
  await expect(page.getByText("Actualice la configuracion del conector")).toBeVisible();
});
