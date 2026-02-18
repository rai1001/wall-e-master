import { expect, test } from "@playwright/test";

test("agents management view can sleep and wake an agent", async ({ page }) => {
  const statusByAgent: Record<string, "idle" | "sleeping" | "busy"> = {
    a1: "idle",
    a2: "sleeping"
  };

  await page.route("**/api/agents", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        agents: [
          {
            id: "a1",
            name: "Lince",
            role: "Investigador",
            personality_path: "/souls/lince.md",
            voice_id: "voice_1",
            skills: ["browser"],
            memory_access: "private",
            status: statusByAgent.a1
          },
          {
            id: "a2",
            name: "Sastre",
            role: "Programador",
            personality_path: "/souls/sastre.md",
            voice_id: "voice_2",
            skills: ["terminal"],
            memory_access: "global",
            status: statusByAgent.a2
          }
        ]
      })
    });
  });

  await page.route("**/api/agents/*/status", async (route) => {
    const agentId = route.request().url().split("/").at(-2) ?? "";
    const body = route.request().postDataJSON() as { status?: "idle" | "sleeping" | "busy" };
    const nextStatus = body.status ?? "idle";
    statusByAgent[agentId] = nextStatus;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        agent: {
          id: agentId,
          name: agentId === "a1" ? "Lince" : "Sastre",
          role: agentId === "a1" ? "Investigador" : "Programador",
          personality_path: "/souls/test.md",
          voice_id: "voice_test",
          skills: ["browser"],
          memory_access: "private",
          status: nextStatus
        }
      })
    });
  });

  await page.goto("/agents");

  await expect(page.getByText("Lince: idle")).toBeVisible();
  await page.getByRole("button", { name: "Dormir Lince" }).click();
  await expect(page.getByText("Lince: sleeping")).toBeVisible();

  await page.getByRole("button", { name: "Despertar Lince" }).click();
  await expect(page.getByText("Lince: idle")).toBeVisible();
});
