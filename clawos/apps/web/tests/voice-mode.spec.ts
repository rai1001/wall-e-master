import { expect, test } from "@playwright/test";

test("voice mode shows clear states and allows cancel", async ({ page }) => {
  await page.route("**/api/voice/process", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        transcript: "resume project status for today",
        agent_response: "Estado consolidado listo para revisar",
        tts_audio_url: "/api/voice/output/voice_test.mp3",
        openclaw_routed: true
      })
    });
  });

  await page.route("**/api/voice/output/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "audio/mpeg",
      body: "mock-audio"
    });
  });

  await page.goto("/");

  await page.getByRole("button", { name: "Iniciar modo voz" }).click();
  await expect(page.getByText("Estado de voz: escuchando")).toBeVisible();

  await expect(page.getByText("Estado de voz: procesando")).toBeVisible({ timeout: 6000 });
  await expect(page.getByText("Estado de voz: hablando")).toBeVisible({ timeout: 6000 });
  await expect(page.getByText("Estado consolidado listo para revisar")).toBeVisible({ timeout: 6000 });

  await page.getByRole("button", { name: "Cancelar modo voz" }).click();
  await expect(page.getByText("Estado de voz: en espera")).toBeVisible();
});
