import { expect, test } from "@playwright/test";

test("projects page shows cost summary and updates project budget", async ({ page }) => {
  let budgetUsd = 20;

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

  await page.route("**/api/costs/summary*", async (route) => {
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON() as { budget_usd: number; project_id: string };
      budgetUsd = body.budget_usd;
    }

    const spent = 12.4;
    const remaining = Number((budgetUsd - spent).toFixed(2));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        project_id: "proj_001",
        spent_usd: spent,
        budget_usd: budgetUsd,
        remaining_usd: remaining,
        status: spent > budgetUsd ? "over_budget" : "within_budget",
        control_actions: ["Revisar agentes con mayor gasto"],
        agents: [
          {
            agent_id: "lince",
            name: "Lince",
            tokens_in: 11200,
            tokens_out: 6400,
            estimated_usd: 8.35,
            last_activity: "2026-02-18T11:00:00Z"
          },
          {
            agent_id: "sastre",
            name: "Sastre",
            tokens_in: 6400,
            tokens_out: 3100,
            estimated_usd: 4.05,
            last_activity: "2026-02-18T10:40:00Z"
          }
        ],
        updated_at: "2026-02-18T11:00:00Z"
      })
    });
  });

  await page.goto("/projects");

  await expect(page.getByRole("heading", { name: "Control de Costos" })).toBeVisible();
  await expect(page.getByText("Gasto estimado: $12.40")).toBeVisible();
  await expect(page.getByText("Presupuesto: $20.00")).toBeVisible();

  await page.getByLabel("Presupuesto del proyecto (USD)").fill("25");
  await page.getByRole("button", { name: "Actualizar presupuesto" }).click();

  await expect(page.getByText("Presupuesto: $25.00")).toBeVisible();
  await expect(page.getByText("Lince: $8.35")).toBeVisible();
});
