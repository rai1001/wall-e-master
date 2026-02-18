import request from "supertest";
import { WebSocketServer } from "ws";
import { afterEach, describe, expect, it, vi } from "vitest";

const originalWsUrl = process.env.OPENCLAW_WS_URL;
const originalSttProvider = process.env.STT_PROVIDER;
const originalTtsProvider = process.env.TTS_PROVIDER;
const originalAgentRegistryPath = process.env.CLAWOS_AGENT_REGISTRY_PATH;

afterEach(() => {
  if (originalWsUrl === undefined) {
    delete process.env.OPENCLAW_WS_URL;
  } else {
    process.env.OPENCLAW_WS_URL = originalWsUrl;
  }

  if (originalSttProvider === undefined) {
    delete process.env.STT_PROVIDER;
  } else {
    process.env.STT_PROVIDER = originalSttProvider;
  }

  if (originalTtsProvider === undefined) {
    delete process.env.TTS_PROVIDER;
  } else {
    process.env.TTS_PROVIDER = originalTtsProvider;
  }

  if (originalAgentRegistryPath === undefined) {
    delete process.env.CLAWOS_AGENT_REGISTRY_PATH;
  } else {
    process.env.CLAWOS_AGENT_REGISTRY_PATH = originalAgentRegistryPath;
  }

  vi.resetModules();
});

describe("voice process bridge routing", () => {
  it("routes transcript to OpenClaw bridge and returns daemon response", async () => {
    const wss = new WebSocketServer({ port: 0 });
    const address = wss.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve websocket test port");
    }

    process.env.OPENCLAW_WS_URL = `ws://127.0.0.1:${address.port}`;
    process.env.STT_PROVIDER = "mock";
    process.env.TTS_PROVIDER = "mock";
    vi.resetModules();

    const { app } = await import("../app");

    const messageReceived = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timed out waiting for bridge message")), 1_500);
      wss.on("connection", (socket) => {
        socket.on("message", (raw) => {
          const payload = JSON.parse(Buffer.from(raw).toString("utf8")) as {
            type?: string;
            request_id?: string;
            message?: string;
            agent_id?: string;
          };

          if (payload.type !== "agent_request" || !payload.request_id) {
            return;
          }

          expect(payload.agent_id).toBe("lince");
          expect(payload.message).toBe("resume project status for today");
          socket.send(
            JSON.stringify({
              type: "agent_response",
              request_id: payload.request_id,
              content: "Estado actualizado desde OpenClaw"
            })
          );
          clearTimeout(timeout);
          resolve();
        });
      });
    });

    try {
      const audioBase64 = Buffer.from("voice payload").toString("base64");
      const response = await request(app)
        .post("/api/voice/process")
        .set("Authorization", "Bearer dev-token")
        .send({
          agent_id: "lince",
          project_id: "proj_001",
          audio_base64: audioBase64
        });

      await messageReceived;
      expect(response.status).toBe(200);
      expect(response.body.agent_response).toBe("Estado actualizado desde OpenClaw");
      expect(response.body.openclaw_routed).toBe(true);
    } finally {
      for (const client of wss.clients) {
        client.terminate();
      }
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    }
  });
});
