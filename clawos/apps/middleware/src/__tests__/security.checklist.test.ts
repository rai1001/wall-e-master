import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { app } from "../app";

const originalApiToken = process.env.API_BEARER_TOKEN;
const originalOpenClawWsUrl = process.env.OPENCLAW_WS_URL;
const originalRemoteProvider = process.env.REMOTE_ACCESS_PROVIDER;
const originalTailscaleUrl = process.env.TAILSCALE_FUNNEL_URL;
const originalCloudflareUrl = process.env.CLOUDFLARE_TUNNEL_URL;

function restoreEnvironment(): void {
  if (originalApiToken === undefined) {
    delete process.env.API_BEARER_TOKEN;
  } else {
    process.env.API_BEARER_TOKEN = originalApiToken;
  }

  if (originalOpenClawWsUrl === undefined) {
    delete process.env.OPENCLAW_WS_URL;
  } else {
    process.env.OPENCLAW_WS_URL = originalOpenClawWsUrl;
  }

  if (originalRemoteProvider === undefined) {
    delete process.env.REMOTE_ACCESS_PROVIDER;
  } else {
    process.env.REMOTE_ACCESS_PROVIDER = originalRemoteProvider;
  }

  if (originalTailscaleUrl === undefined) {
    delete process.env.TAILSCALE_FUNNEL_URL;
  } else {
    process.env.TAILSCALE_FUNNEL_URL = originalTailscaleUrl;
  }

  if (originalCloudflareUrl === undefined) {
    delete process.env.CLOUDFLARE_TUNNEL_URL;
  } else {
    process.env.CLOUDFLARE_TUNNEL_URL = originalCloudflareUrl;
  }
}

afterEach(() => {
  restoreEnvironment();
});

describe("security checklist route", () => {
  it("returns warning checklist when remote provider is not configured", async () => {
    delete process.env.REMOTE_ACCESS_PROVIDER;
    delete process.env.TAILSCALE_FUNNEL_URL;
    delete process.env.CLOUDFLARE_TUNNEL_URL;
    process.env.OPENCLAW_WS_URL = "ws://127.0.0.1:18789";
    process.env.API_BEARER_TOKEN = "dev-token";

    const response = await request(app).get("/api/security/checklist").set("Authorization", "Bearer dev-token");

    expect(response.status).toBe(200);
    expect(response.body.remote_access.provider).toBe("none");
    expect(response.body.checks.some((item: { id: string; status: string }) => item.id === "openclaw_local_only")).toBe(
      true
    );
    expect(
      response.body.checks.some(
        (item: { id: string; status: string }) => item.id === "remote_provider_configured" && item.status === "warn"
      )
    ).toBe(true);
    expect(Array.isArray(response.body.helper_commands.tailscale)).toBe(true);
  });

  it("reports pass when tailscale funnel url and secure token are configured", async () => {
    process.env.API_BEARER_TOKEN = "clawos-secure-token";
    process.env.REMOTE_ACCESS_PROVIDER = "tailscale";
    process.env.TAILSCALE_FUNNEL_URL = "https://clawos.usuario.ts.net";
    process.env.OPENCLAW_WS_URL = "ws://localhost:18789";

    const response = await request(app)
      .get("/api/security/checklist")
      .set("Authorization", `Bearer ${process.env.API_BEARER_TOKEN}`);

    expect(response.status).toBe(200);
    expect(response.body.remote_access.provider).toBe("tailscale");
    expect(response.body.remote_access.public_url).toBe("https://clawos.usuario.ts.net");
    expect(
      response.body.checks.some(
        (item: { id: string; status: string }) => item.id === "remote_provider_configured" && item.status === "pass"
      )
    ).toBe(true);
    expect(
      response.body.checks.some(
        (item: { id: string; status: string }) => item.id === "auth_token_not_default" && item.status === "pass"
      )
    ).toBe(true);
    expect(
      response.body.checks.some(
        (item: { id: string; status: string }) => item.id === "remote_url_secure" && item.status === "pass"
      )
    ).toBe(true);
  });
});
