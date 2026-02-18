import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import request from "supertest";
import { WebSocketServer, type WebSocket } from "ws";
import { afterEach, describe, expect, it, vi } from "vitest";

const previousWsUrl = process.env.OPENCLAW_WS_URL;
const previousCostsPath = process.env.CLAWOS_COSTS_PATH;

afterEach(() => {
  if (previousWsUrl === undefined) {
    delete process.env.OPENCLAW_WS_URL;
  } else {
    process.env.OPENCLAW_WS_URL = previousWsUrl;
  }

  if (previousCostsPath === undefined) {
    delete process.env.CLAWOS_COSTS_PATH;
  } else {
    process.env.CLAWOS_COSTS_PATH = previousCostsPath;
  }

  vi.resetModules();
});

describe("bridge cost telemetry ingestion", () => {
  it("records websocket usage telemetry into shared cost summary", async () => {
    const projectId = `proj_bridge_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const workingDir = mkdtempSync(join(tmpdir(), "clawos-bridge-cost-"));
    const costsPath = join(workingDir, "cost-store.json");
    const wss = new WebSocketServer({ port: 0 });
    const address = wss.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve websocket test port");
    }

    const serverSocketPromise = new Promise<WebSocket>((resolve) => {
      wss.once("connection", (socket) => resolve(socket));
    });

    process.env.OPENCLAW_WS_URL = `ws://127.0.0.1:${address.port}`;
    process.env.CLAWOS_COSTS_PATH = costsPath;
    vi.resetModules();
    const { app } = await import("../app");

    try {
      const probe = await request(app)
        .get(`/api/projects/status?project_id=${encodeURIComponent(projectId)}&probe=true`)
        .set("Authorization", "Bearer dev-token");
      expect(probe.status).toBe(200);

      const serverSocket = await serverSocketPromise;
      serverSocket.send(
        JSON.stringify({
          type: "usage_telemetry",
          project_id: projectId,
          agent_id: "lince",
          agent_name: "Lince",
          tokens_in: 1500,
          tokens_out: 700,
          cost_usd: 0.77
        })
      );

      let summarySpent = -1;
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const summary = await request(app)
          .get(`/api/costs/summary?project_id=${encodeURIComponent(projectId)}`)
          .set("Authorization", "Bearer dev-token");

        expect(summary.status).toBe(200);
        summarySpent = Number(summary.body.spent_usd ?? 0);
        if (summarySpent === 0.77) {
          const agent = summary.body.agents.find((row: { agent_id: string }) => row.agent_id === "lince");
          expect(agent).toBeDefined();
          expect(agent.tokens_in).toBe(1500);
          expect(agent.tokens_out).toBe(700);
          expect(agent.estimated_usd).toBe(0.77);
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      expect(summarySpent).toBe(0.77);
    } finally {
      for (const client of wss.clients) {
        client.terminate();
      }
      await new Promise<void>((resolve) => wss.close(() => resolve()));
      rmSync(workingDir, { recursive: true, force: true });
    }
  });
});
