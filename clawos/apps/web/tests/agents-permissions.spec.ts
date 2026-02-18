import { expect, test } from "@playwright/test";

test("agents view updates permissions and reflects new values", async ({ page }) => {
  let currentSkills = ["browser"];
  let currentMemoryAccess: "private" | "global" = "private";

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
            skills: currentSkills,
            memory_access: currentMemoryAccess,
            status: "idle"
          }
        ]
      })
    });
  });

  await page.route("**/api/agents/a1/permissions", async (route) => {
    const body = route.request().postDataJSON() as {
      skills: string[];
      memory_access: "private" | "global";
    };

    currentSkills = body.skills;
    currentMemoryAccess = body.memory_access;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        agent: {
          id: "a1",
          name: "Lince",
          role: "Investigador",
          personality_path: "/souls/lince.md",
          voice_id: "voice_1",
          skills: currentSkills,
          memory_access: currentMemoryAccess,
          status: "idle"
        }
      })
    });
  });

  await page.goto("/agents");

  await page.getByRole("button", { name: "Editar permisos Lince" }).click();
  await page.getByLabel("Permisos Lince Browser").uncheck();
  await page.getByLabel("Permisos Lince Python").check();
  await page.getByLabel("Memoria Lince").selectOption("global");
  await page.getByRole("button", { name: "Guardar permisos Lince" }).click();

  await expect(page.getByText("Investigador | memoria global | skills: python")).toBeVisible();
  await expect(page.getByText("skills: python")).toBeVisible();
});
