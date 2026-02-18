import { expect, test } from "@playwright/test";

test("security page shows operational connections and allows test action", async ({ page }) => {
  await page.route("**/api/security/checklist", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        overall_status: "review_required",
        remote_access: {
          provider: "tailscale",
          public_url: "https://clawos.usuario.ts.net"
        },
        checks: [],
        helper_commands: {
          tailscale: ["tailscale up"],
          cloudflare: ["cloudflared tunnel --url http://127.0.0.1:3000"]
        }
      })
    });
  });

  await page.route("**/api/observability/summary?window_minutes=60", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        generated_at: "2026-02-18T12:00:00Z",
        window_minutes: 60,
        total_security_events: 1,
        total_errors: 0,
        security_event_counters: [{ key: "auth_denied", count: 1 }],
        error_taxonomy_counters: [],
        alert_status: "nominal",
        alerts: []
      })
    });
  });

  await page.route("**/api/integrations/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        integrations: [
          {
            id: "whatsapp_gateway",
            label: "WhatsApp gateway",
            status: "connected",
            mock_ready: false,
            last_checked_at: "2026-02-18T12:00:00Z",
            message: "Conexion validada."
          },
          {
            id: "email",
            label: "Email",
            status: "review",
            mock_ready: true,
            last_checked_at: "2026-02-18T12:00:00Z",
            message: "Modo mock-ready."
          },
          {
            id: "make",
            label: "Make",
            status: "disconnected",
            mock_ready: true,
            last_checked_at: "2026-02-18T12:00:00Z",
            message: "Falta configurar webhook."
          },
          {
            id: "chefos",
            label: "ChefOs",
            status: "connected",
            mock_ready: false,
            last_checked_at: "2026-02-18T12:00:00Z",
            message: "Conexion lista."
          }
        ]
      })
    });
  });

  await page.route("**/api/integrations/test", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        integration: {
          id: "whatsapp_gateway",
          status: "connected",
          checked_at: "2026-02-18T12:10:00Z",
          result: "Prueba correcta. Listo para operacion."
        }
      })
    });
  });

  await page.goto("/security");

  await expect(page.getByRole("heading", { name: "Conexiones operativas" })).toBeVisible();
  await expect(page.getByText("WhatsApp gateway")).toBeVisible();
  await expect(page.getByText("Email", { exact: true })).toBeVisible();
  await expect(page.getByText("Make", { exact: true })).toBeVisible();
  await expect(page.getByText("ChefOs", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Probar" }).first().click();
  await expect(page.getByText("Prueba correcta. Listo para operacion.")).toBeVisible();
});
