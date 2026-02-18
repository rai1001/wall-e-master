import { expect, test } from "@playwright/test";

test("agent wizard creates an agent with preset and skills", async ({ page }) => {
  let capturedBody: Record<string, unknown> | null = null;

  await page.route("**/api/agents/spawn", async (route) => {
    capturedBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        agent: {
          id: "agent_001",
          name: "Lince",
          status: "idle"
        },
        files_created: ["/souls/lince.md"]
      })
    });
  });

  await page.goto("/agents/new");

  await page.getByLabel("Nombre del agente").fill("Lince");
  await page.getByLabel("Plantilla").selectOption("investigador");
  await page.getByLabel("Habilitar Browser").check();
  await page.getByRole("button", { name: "Crear agente" }).click();

  await expect(page.getByText("Agente creado: Lince")).toBeVisible();
  await expect(page.getByText("Listo para usar en tus proyectos.")).toBeVisible();

  expect(capturedBody).not.toBeNull();
  expect(capturedBody?.name).toBe("Lince");
  expect(capturedBody?.memory_access).toBe("private");
  expect(capturedBody?.skills).toEqual(["browser"]);
  expect(capturedBody?.voice_id).toBe("voice_researcher");
});
