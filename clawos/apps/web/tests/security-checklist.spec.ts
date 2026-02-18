import { expect, test } from "@playwright/test";

test("security page shows automated checklist and tunnel helpers", async ({ page }) => {
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
        checks: [
          {
            id: "auth_token_not_default",
            status: "warn",
            message: "Se esta usando token por defecto.",
            recovery_action: "Define API_BEARER_TOKEN fuerte."
          },
          {
            id: "openclaw_local_only",
            status: "pass",
            message: "OpenClaw esta en localhost.",
            recovery_action: "Mantener localhost."
          }
        ],
        helper_commands: {
          tailscale: ["tailscale up", "tailscale funnel 3000"],
          cloudflare: ["cloudflared tunnel --url http://127.0.0.1:3000"]
        }
      })
    });
  });

  await page.goto("/security");

  await expect(page.getByRole("heading", { name: "Checklist de Seguridad Remota" })).toBeVisible();
  await expect(page.getByText("Proveedor remoto activo: tailscale")).toBeVisible();
  await expect(page.getByText("https://clawos.usuario.ts.net")).toBeVisible();
  await expect(page.getByText("warn")).toBeVisible();
  await expect(page.getByText("tailscale funnel 3000")).toBeVisible();
});
