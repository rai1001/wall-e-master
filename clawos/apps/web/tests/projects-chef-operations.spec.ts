import { expect, test } from "@playwright/test";

test("projects page includes daily chef operations block and canvas fallback", async ({ page }) => {
  await page.route("**/api/projects/status?project_id=proj_001", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        project_id: "proj_001",
        overall_status: "in_progress",
        agents: [{ id: "a1", name: "Lince", status: "busy" }],
        tasks: { todo: 2, doing: 1, done: 4 },
        updated_at: "2026-02-18T12:00:00Z"
      })
    });
  });

  await page.route("**/api/costs/summary?project_id=proj_001", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        project_id: "proj_001",
        spent_usd: 3.4,
        budget_usd: 10,
        remaining_usd: 6.6,
        status: "within_budget",
        control_actions: [],
        agents: [],
        updated_at: "2026-02-18T12:00:00Z"
      })
    });
  });

  await page.route("**/api/knowledge/graph?project_id=proj_001", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        project_id: "proj_001",
        nodes: [],
        edges: []
      })
    });
  });

  await page.route("**/api/knowledge/feed?project_id=proj_001", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        project_id: "proj_001",
        entries: []
      })
    });
  });

  await page.route("**/api/canvas/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        available: false,
        message: "Canvas no disponible en este entorno."
      })
    });
  });

  await page.goto("/projects");

  await expect(page.getByRole("heading", { name: "Operacion diaria Chef" })).toBeVisible();
  await expect(page.getByText("Manana: revision breve")).toBeVisible();
  await expect(page.getByText("Tarde previa: preparar turnos")).toBeVisible();
  await expect(page.getByText("Incidencias: registrar + reintentar envios")).toBeVisible();

  await page.getByRole("button", { name: "Abrir vista Canvas" }).click();
  await expect(page.getByText("Canvas no disponible en este entorno.")).toBeVisible();
});
