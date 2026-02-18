import { expect, test } from "@playwright/test";

test("projects page renders simple knowledge map clusters", async ({ page }) => {
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
        nodes: [
          { id: "agent:lince", label: "Lince", type: "agent" },
          { id: "agent:sastre", label: "Sastre", type: "agent" },
          { id: "finding:1", label: "API Stripe /v2", type: "finding" },
          { id: "finding:2", label: "Validar scopes OAuth", type: "finding" }
        ],
        edges: [
          { from: "agent:lince", to: "finding:1", relation: "hands_off" },
          { from: "finding:1", to: "agent:sastre", relation: "received_by" },
          { from: "agent:sastre", to: "finding:2", relation: "hands_off" },
          { from: "finding:2", to: "agent:lince", relation: "received_by" }
        ]
      })
    });
  });

  await page.goto("/projects");

  await expect(page.getByRole("heading", { name: "Mapa de Conocimiento" })).toBeVisible();
  await expect(page.getByText("Agentes en el mapa: 2")).toBeVisible();
  await expect(page.getByText("Hallazgos conectados: 2")).toBeVisible();
  await expect(page.getByText("Lince: 1 hallazgos compartidos")).toBeVisible();
  await expect(page.getByText("Sastre: 1 hallazgos compartidos")).toBeVisible();
});
