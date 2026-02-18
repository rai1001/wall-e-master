import { expect, test } from "@playwright/test";

test("projects page renders live status payload", async ({ page }) => {
  await page.route("**/api/projects/status?project_id=proj_001", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        project_id: "proj_001",
        overall_status: "in_progress",
        agents: [
          { id: "a1", name: "Lince", status: "busy" },
          { id: "a2", name: "Sastre", status: "idle" }
        ],
        tasks: {
          todo: 3,
          doing: 1,
          done: 7
        },
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
        spent_usd: 12.4,
        budget_usd: 20,
        remaining_usd: 7.6,
        status: "within_budget",
        control_actions: ["Revisar agentes con mayor gasto"],
        agents: [
          {
            agent_id: "lince",
            name: "Lince",
            tokens_in: 11200,
            tokens_out: 6400,
            estimated_usd: 8.35,
            last_activity: "2026-02-18T11:00:00Z"
          }
        ],
        updated_at: "2026-02-18T11:00:00Z"
      })
    });
  });

  await page.goto("/projects");

  await expect(page.getByText("Por hacer: 3")).toBeVisible();
  await expect(page.getByText("En progreso: 1")).toBeVisible();
  await expect(page.getByText("Completado: 7")).toBeVisible();
  await expect(page.getByText("Lince: busy")).toBeVisible();
  await expect(page.getByText("Sastre: idle")).toBeVisible();
  await expect(page.getByText("Gasto estimado: $12.40")).toBeVisible();
});
