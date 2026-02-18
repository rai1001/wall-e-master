import { expect, test } from "@playwright/test";

test("projects page shows global discovery feed entries", async ({ page }) => {
  await page.route("**/api/projects/status?project_id=proj_001", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        project_id: "proj_001",
        overall_status: "in_progress",
        agents: [{ id: "a1", name: "Lince", status: "busy" }],
        tasks: { todo: 2, doing: 1, done: 5 },
        updated_at: "2026-02-18T11:00:00Z"
      })
    });
  });

  await page.route("**/api/costs/summary?project_id=proj_001", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        project_id: "proj_001",
        spent_usd: 1.2,
        budget_usd: 10,
        remaining_usd: 8.8,
        status: "within_budget",
        control_actions: [],
        agents: [],
        updated_at: "2026-02-18T11:00:00Z"
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
        entries: [
          {
            id: "entry_1",
            agent_id: "lince",
            message: "Detecte cambio en endpoint de suscripciones.",
            timestamp: "2026-02-18T11:30:00Z"
          }
        ]
      })
    });
  });

  await page.goto("/projects");

  await expect(page.getByText("Feed Global de Hallazgos")).toBeVisible();
  await expect(page.getByText("Detecte cambio en endpoint de suscripciones.")).toBeVisible();
});
