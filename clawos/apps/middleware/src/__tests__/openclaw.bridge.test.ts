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

  it("sends an agent request and resolves streamed response by request id", async () => {
    const wss = new WebSocketServer({ port: 0 });
    const address = wss.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve test websocket port");
    }

    const bridge = new OpenClawBridge({
      url: `ws://127.0.0.1:${address.port}`,
      reconnectAttempts: 1
    });

    wss.on("connection", (socket) => {
      socket.on("message", (raw) => {
        const payload = JSON.parse(Buffer.from(raw).toString("utf8")) as {
          type?: string;
          request_id?: string;
          agent_id?: string;
        };

        if (payload.type !== "agent_request" || !payload.request_id) {
          return;
        }

        expect(payload.agent_id).toBe("lince");
        socket.send(
          JSON.stringify({
            type: "agent_response",
            request_id: payload.request_id,
            message: "Respuesta final de OpenClaw"
          })
        );
      });
    });

    try {
      const response = await bridge.requestAgentResponse({
        agentId: "lince",
        agentName: "Lince",
        projectId: "proj_001",
        allowedTools: ["browser"],
        memoryScope: "project",
        userMessage: "Resume el estado del proyecto",
        timeoutMs: 1_000
      });

      expect(response.delivered).toBe(true);
      expect(response.response).toBe("Respuesta final de OpenClaw");
    } finally {
      bridge.disconnect();
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    }
  });

  it("publishes thought and action events to subscribers", async () => {
    const wss = new WebSocketServer({ port: 0 });
    const address = wss.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve test websocket port");
    }

    const events = new Promise<Array<{ kind: string; content: string }>>((resolve, reject) => {
      const captured: Array<{ kind: string; content: string }> = [];
      const timeout = setTimeout(() => reject(new Error("Timed out waiting for events")), 1_500);

      const bridge = new OpenClawBridge({
        url: `ws://127.0.0.1:${address.port}`,
        reconnectAttempts: 1,
        onAgentEvent: (event) => {
          captured.push({ kind: event.kind, content: event.content });
          if (captured.length === 2) {
            clearTimeout(timeout);
            bridge.disconnect();
            resolve(captured);
          }
        }
      });

      bridge.ensureConnected().then((connected) => {
        if (!connected) {
          clearTimeout(timeout);
          reject(new Error("Bridge failed to connect for event test"));
        }
      });
    });

    wss.on("connection", (socket) => {
      socket.send(
        JSON.stringify({
          type: "agent_thought",
          project_id: "proj_001",
          agent_id: "lince",
          content: "Analizando hallazgos recientes"
        })
      );
      socket.send(
        JSON.stringify({
          type: "agent_action",
          project_id: "proj_001",
          agent_id: "lince",
          content: "Actualizando backlog"
        })
      );
    });

    try {
      const captured = await events;
      expect(captured).toEqual([
        { kind: "thought", content: "Analizando hallazgos recientes" },
        { kind: "action", content: "Actualizando backlog" }
      ]);
    } finally {
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    }
  });
});
