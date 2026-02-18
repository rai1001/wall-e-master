import { WebSocketServer } from "ws";
import { describe, expect, it } from "vitest";

import { OpenClawBridge } from "../services/openclaw-bridge";

describe("openclaw bridge", () => {
  it("connects to a real websocket server and recovers after disconnect", async () => {
    const wss = new WebSocketServer({ port: 0 });
    const address = wss.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve test websocket port");
    }

    const bridge = new OpenClawBridge({
      url: `ws://127.0.0.1:${address.port}`,
      reconnectAttempts: 3
    });

    try {
      const initial = await bridge.ensureConnected();
      expect(initial).toBe(true);

      const state = await bridge.simulateDisconnectAndRecover();
      expect(state.recovered).toBe(true);
      expect(state.attempts).toBeGreaterThan(0);
    } finally {
      bridge.disconnect();
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    }
  });

  it("forwards usage telemetry messages to callback subscribers", async () => {
    const wss = new WebSocketServer({ port: 0 });
    const address = wss.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve test websocket port");
    }

    let serverSocket: import("ws").WebSocket | null = null;
    wss.on("connection", (socket) => {
      serverSocket = socket;
    });

    const usageMessage = {
      type: "usage_telemetry",
      project_id: "proj_bridge_001",
      agent_id: "lince",
      agent_name: "Lince",
      tokens_in: 900,
      tokens_out: 450,
      cost_usd: 0.33
    };

    const usagePromise = new Promise<{
      project_id: string;
      agent_id: string;
      tokens_in: number;
      tokens_out: number;
      cost_usd: number;
    }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timed out waiting for usage telemetry callback"));
      }, 1_000);

      const bridge = new OpenClawBridge({
        url: `ws://127.0.0.1:${address.port}`,
        reconnectAttempts: 1,
        onUsageTelemetry: (event) => {
          clearTimeout(timeout);
          bridge.disconnect();
          resolve(event);
        }
      });

      bridge.ensureConnected().then((connected) => {
        if (!connected) {
          clearTimeout(timeout);
          reject(new Error("Bridge failed to connect"));
          return;
        }

        serverSocket?.send(JSON.stringify(usageMessage));
      });
    });

    try {
      const usage = await usagePromise;
      expect(usage.project_id).toBe("proj_bridge_001");
      expect(usage.agent_id).toBe("lince");
      expect(usage.tokens_in).toBe(900);
      expect(usage.tokens_out).toBe(450);
      expect(usage.cost_usd).toBe(0.33);
    } finally {
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    }
  });
});
